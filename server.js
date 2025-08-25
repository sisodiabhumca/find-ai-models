 import express from 'express';
 import cors from 'cors';
 import path from 'path';
 import { fileURLToPath } from 'url';
 import { initDb, getDb } from './src/db.js';
import { v4 as uuidv4 } from 'uuid';
import PDFDocument from 'pdfkit';
import { Parser as Json2CsvParser } from 'json2csv';
import { runDiscovery, discoverNewModels, addNewModels } from './scripts/model-discovery.js';
import { startScheduler, triggerDiscovery, getDiscoveryStatus } from './scripts/scheduler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Initialize DB
await initDb();

// Start discovery scheduler if enabled
if (process.env.AUTO_DISCOVERY !== 'false') {
  startScheduler();
}

// Helper: basic scoring based on keyword overlap and filters
function scoreModel({ query, model, filters }) {
  const text = `${model.name} ${model.provider} ${model.description || ''} ${model.use_cases || ''} ${model.industry?.join(' ') || ''} ${model.type}`.toLowerCase();
  const terms = (query || '').toLowerCase().split(/[^a-z0-9+#.]+/).filter(Boolean);
  let score = 0;
  for (const t of terms) {
    if (text.includes(t)) score += 2;
  }
  // Weight for matching model type
  if (filters?.type && model.type.toLowerCase() === filters.type.toLowerCase()) score += 3;
  // Weight for industry intersection
  if (filters?.industry && model.industry?.map(i => i.toLowerCase()).includes(filters.industry.toLowerCase())) score += 2;
  // Priority preferences
  if (filters?.priority) {
    if (filters.priority === 'cost' && model.cost_tier === 'low') score += 2;
    if (filters.priority === 'accuracy' && (model.benchmarks?.overall || 0) >= 0.7) score += 2;
    if (filters.priority === 'speed' && model.latency_tier === 'low') score += 2;
  }
  // Intent-based boosts (keyword -> preferred types)
  const intentMap = [
    { kws: ['transcribe','speech','audio','voice','caption'], types: ['speech'] },
    { kws: ['image','vision','detect','object','yolo','classification','camera'], types: ['vision'] },
    { kws: ['recommend','personalize','ranking','ctr','als','retention'], types: ['recommendation'] },
    { kws: ['chat','summarize','q&a','qa','rag','code','assistant','generate','draft'], types: ['llm'] },
  ];
  const q = (query || '').toLowerCase();
  for (const entry of intentMap) {
    if (entry.kws.some(k => q.includes(k))) {
      if (entry.types.includes(String(model.type).toLowerCase())) score += 4;
    }
  }
  return score;
}

// --- Lightweight TF-IDF utilities ---
function tokenize(str) {
  return (str || '')
    .toLowerCase()
    .split(/[^a-z0-9+#.]+/)
    .filter(Boolean);
}

function termFreq(tokens) {
  const tf = new Map();
  for (const t of tokens) tf.set(t, (tf.get(t) || 0) + 1);
  const len = tokens.length || 1;
  for (const [k, v] of tf.entries()) tf.set(k, v / len);
  return tf;
}

function inverseDocFreq(docsTokens) {
  const df = new Map();
  const N = docsTokens.length || 1;
  for (const tokens of docsTokens) {
    const seen = new Set(tokens);
    for (const t of seen) df.set(t, (df.get(t) || 0) + 1);
  }
  const idf = new Map();
  for (const [t, d] of df.entries()) {
    idf.set(t, Math.log((N + 1) / (d + 1)) + 1); // smoothed IDF
  }
  return idf;
}

function tfidfVector(tfMap, idfMap) {
  const vec = new Map();
  for (const [t, tf] of tfMap.entries()) {
    const idf = idfMap.get(t) || 0;
    vec.set(t, tf * idf);
  }
  return vec;
}

function cosineSim(vecA, vecB) {
  let dot = 0, normA = 0, normB = 0;
  for (const v of vecA.values()) normA += v * v;
  for (const v of vecB.values()) normB += v * v;
  const smaller = vecA.size < vecB.size ? vecA : vecB;
  const other = smaller === vecA ? vecB : vecA;
  for (const [k, v] of smaller.entries()) {
    const u = other.get(k) || 0;
    dot += v * u;
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / Math.sqrt(normA * normB);
}

// API: Recommend models
app.post('/api/recommend', (req, res) => {
  const db = getDb();
  const { query, industry, type, priority, page = 1, pageSize = 12 } = req.body || {};
  const filters = { industry, type, priority };
  const models = db.data.models || [];

  let filtered = models.filter(m => {
    const okIndustry = !industry || (m.industry || []).map(i => i.toLowerCase()).includes(industry.toLowerCase());
    const okType = !type || m.type.toLowerCase() === type.toLowerCase();
    return okIndustry && okType;
  });

  // Build TF-IDF vectors for semantic similarity
  const docs = filtered.map(m => `${m.name} ${m.provider} ${m.type} ${m.description || ''} ${m.use_cases || ''} ${(m.industry||[]).join(' ')}`);
  const docsTokens = docs.map(tokenize);
  const idf = inverseDocFreq(docsTokens);
  const queryVec = tfidfVector(termFreq(tokenize(query || '')), idf);

  const rankedAll = filtered
    .map((m, i) => {
      const heuristic = scoreModel({ query, model: m, filters });
      const mVec = tfidfVector(termFreq(docsTokens[i]), idf);
      const sim = cosineSim(queryVec, mVec); // 0..1
      const score = heuristic + sim * 10; // blend, scale similarity
      return { model: m, score };
    })
    .sort((a, b) => b.score - a.score)
    .map(({ model, score }) => ({ ...model, score }));

  const total = rankedAll.length;
  const p = Math.max(1, parseInt(page, 10) || 1);
  const ps = Math.min(50, Math.max(1, parseInt(pageSize, 10) || 12));
  const start = (p - 1) * ps;
  const end = start + ps;
  const results = rankedAll.slice(start, end);

  res.json({ results, total, page: p, pageSize: ps });
});

// API: List models (with basic filters)
app.get('/api/models', (req, res) => {
  const db = getDb();
  const { industry, type } = req.query;
  const models = db.data.models || [];
  const filtered = models.filter(m => {
    const okIndustry = !industry || (m.industry || []).map(i => i.toLowerCase()).includes(String(industry).toLowerCase());
    const okType = !type || m.type.toLowerCase() === String(type).toLowerCase();
    return okIndustry && okType;
  });
  res.json({ models: filtered });
});

// API: Bookmarks
app.get('/api/bookmarks', (req, res) => {
  const db = getDb();
  const items = (db.data.bookmarks || []).slice().sort((a,b) => String(b.created_at).localeCompare(String(a.created_at)));
  res.json({ bookmarks: items });
});

app.post('/api/bookmarks', async (req, res) => {
  const db = getDb();
  const { model_id, note } = req.body || {};
  if (!model_id) return res.status(400).json({ error: 'model_id required' });
  const id = uuidv4();
  const item = { id, model_id, note: note || '', created_at: new Date().toISOString() };
  db.data.bookmarks.push(item);
  await db.write();
  res.json(item);
});

app.delete('/api/bookmarks/:id', async (req, res) => {
  const db = getDb();
  const { id } = req.params;
  db.data.bookmarks = (db.data.bookmarks || []).filter(b => b.id !== id);
  await db.write();
  res.json({ ok: true });
});

// API: Export recommendations
app.post('/api/export', (req, res) => {
  const { results, format = 'csv' } = req.body || {};
  if (!Array.isArray(results)) return res.status(400).json({ error: 'results array required' });
  if (format === 'csv') {
    const flat = results.map(r => ({
      id: r.id,
      name: r.name,
      provider: r.provider,
      type: r.type,
      score: r.score,
      cost_tier: r.cost_tier,
      latency_tier: r.latency_tier,
      cost_per_1k_tokens: r.cost_per_1k_tokens,
      url: r.url
    }));
    const parser = new Json2CsvParser();
    const csv = parser.parse(flat);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="recommendations.csv"');
    return res.send(csv);
  } else if (format === 'pdf') {
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="recommendations.pdf"');
    const doc = new PDFDocument({ margin: 40 });
    doc.pipe(res);
    doc.fontSize(18).text('AI Model Recommendations', { underline: true });
    doc.moveDown();
    results.forEach((r, idx) => {
      doc.fontSize(14).text(`${idx + 1}. ${r.name} (${r.provider}) - ${r.type}`);
      doc.fontSize(10).text(`Score: ${r.score} | Cost: ${r.cost_tier} | Latency: ${r.latency_tier}`);
      if (r.description) doc.text(r.description);
      if (Array.isArray(r.pros) && r.pros.length) doc.text(`Pros: ${r.pros.join(', ')}`);
      if (Array.isArray(r.cons) && r.cons.length) doc.text(`Cons: ${r.cons.join(', ')}`);
      if (r.url) doc.text(`URL: ${r.url}`);
      doc.moveDown();
    });
    doc.end();
  } else {
    res.status(400).json({ error: 'unsupported format' });
  }
});

// Admin: manage models
app.post('/api/admin/models', async (req, res) => {
  const db = getDb();
  const m = req.body || {};
  if (!m.name || !m.provider || !m.type) return res.status(400).json({ error: 'name, provider, type required' });
  const id = uuidv4();
  const model = {
    id,
    name: m.name,
    provider: m.provider,
    type: m.type,
    cost_per_1k_tokens: m.cost_per_1k_tokens ?? null,
    cost_tier: m.cost_tier || null,
    latency_tier: m.latency_tier || null,
    description: m.description || null,
    use_cases: m.use_cases || null,
    industry: Array.isArray(m.industry) ? m.industry : (m.industry ? [m.industry] : []),
    benchmarks: m.benchmarks || {},
    pros: m.pros || [],
    cons: m.cons || [],
    url: m.url || null,
  };
  db.data.models.push(model);
  await db.write();
  res.json({ id });
});

app.put('/api/admin/models/:id', async (req, res) => {
  const db = getDb();
  const { id } = req.params;
  const m = req.body || {};
  const idx = (db.data.models || []).findIndex(x => x.id === id);
  if (idx === -1) return res.status(404).json({ error: 'not found' });
  const existing = db.data.models[idx];
  const updated = {
    ...existing,
    name: m.name ?? existing.name,
    provider: m.provider ?? existing.provider,
    type: m.type ?? existing.type,
    cost_per_1k_tokens: m.cost_per_1k_tokens ?? existing.cost_per_1k_tokens,
    cost_tier: m.cost_tier ?? existing.cost_tier,
    latency_tier: m.latency_tier ?? existing.latency_tier,
    description: m.description ?? existing.description,
    use_cases: m.use_cases ?? existing.use_cases,
    industry: m.industry ?? existing.industry,
    benchmarks: m.benchmarks ?? existing.benchmarks,
    pros: m.pros ?? existing.pros,
    cons: m.cons ?? existing.cons,
    url: m.url ?? existing.url,
  };
  db.data.models[idx] = updated;
  await db.write();
  res.json({ ok: true });
});

app.delete('/api/admin/models/:id', async (req, res) => {
  const db = getDb();
  const { id } = req.params;
  db.data.models = (db.data.models || []).filter(m => m.id !== id);
  await db.write();
  res.json({ ok: true });
});

// Discovery API endpoints
app.post('/api/discovery/trigger', async (req, res) => {
  try {
    console.log('Manual discovery triggered via API');
    await triggerDiscovery();
    res.json({ success: true, message: 'Discovery completed successfully' });
  } catch (error) {
    console.error('Discovery error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/discovery/status', (req, res) => {
  try {
    const status = getDiscoveryStatus();
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/discovery/models', async (req, res) => {
  try {
    const { source } = req.body;
    console.log(`Manual discovery from source: ${source}`);
    
    if (source && source !== 'all') {
      // Discover from specific source
      const newModels = await discoverNewModels();
      const filteredModels = newModels.filter(m => m.source === source);
      await addNewModels(filteredModels);
      res.json({ 
        success: true, 
        message: `Discovery from ${source} completed`,
        newModels: filteredModels.length 
      });
    } else {
      // Discover from all sources
      await triggerDiscovery();
      res.json({ 
        success: true, 
        message: 'Discovery from all sources completed' 
      });
    }
  } catch (error) {
    console.error('Discovery error:', error);
    res.status(500).json({ error: error.message });
  }
});

// API: Get model statistics
app.get('/api/stats', (req, res) => {
  const db = getDb();
  const models = db.data.models || [];
  
  const stats = {
    total: models.length,
    byProvider: {},
    byType: {},
    byCostTier: {},
    byLatencyTier: {},
    recentUpdates: models
      .filter(m => m.last_updated)
      .sort((a, b) => new Date(b.last_updated) - new Date(a.last_updated))
      .slice(0, 10)
      .map(m => ({
        name: m.name,
        provider: m.provider,
        last_updated: m.last_updated
      }))
  };
  
  models.forEach(model => {
    // Provider stats
    stats.byProvider[model.provider] = (stats.byProvider[model.provider] || 0) + 1;
    
    // Type stats
    stats.byType[model.type] = (stats.byType[model.type] || 0) + 1;
    
    // Cost tier stats
    if (model.cost_tier) {
      stats.byCostTier[model.cost_tier] = (stats.byCostTier[model.cost_tier] || 0) + 1;
    }
    
    // Latency tier stats
    if (model.latency_tier) {
      stats.byLatencyTier[model.latency_tier] = (stats.byLatencyTier[model.latency_tier] || 0) + 1;
    }
  });
  
  res.json(stats);
});

// Fallback to index.html - must be last
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`Discovery system enabled: ${process.env.AUTO_DISCOVERY !== 'false'}`);
});
