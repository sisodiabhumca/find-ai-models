 import { initDb, getDb } from '../src/db.js';
 import { v4 as uuidv4 } from 'uuid';

 await initDb();
 const db = getDb();

 function upsertModel(m) {
   const idx = (db.data.models || []).findIndex(x => x.name === m.name && x.provider === m.provider);
   if (idx !== -1) {
     const existing = db.data.models[idx];
     db.data.models[idx] = {
       ...existing,
       type: m.type,
       cost_per_1k_tokens: m.cost_per_1k_tokens ?? null,
       cost_tier: m.cost_tier ?? null,
       latency_tier: m.latency_tier ?? null,
       description: m.description ?? null,
       use_cases: m.use_cases ?? null,
       industry: m.industry ?? [],
       benchmarks: m.benchmarks ?? {},
       pros: m.pros ?? [],
       cons: m.cons ?? [],
       url: m.url ?? null,
     };
     return existing.id;
   }
   const id = uuidv4();
   db.data.models.push({
     id,
     name: m.name,
     provider: m.provider,
     type: m.type,
     cost_per_1k_tokens: m.cost_per_1k_tokens ?? null,
     cost_tier: m.cost_tier ?? null,
     latency_tier: m.latency_tier ?? null,
     description: m.description ?? null,
     use_cases: m.use_cases ?? null,
     industry: m.industry ?? [],
     benchmarks: m.benchmarks ?? {},
     pros: m.pros ?? [],
     cons: m.cons ?? [],
     url: m.url ?? null,
   });
   return id;
 }

const models = [
  {
    name: 'GPT-4o mini',
    provider: 'OpenAI',
    type: 'LLM',
    cost_per_1k_tokens: 0.15,
    cost_tier: 'medium',
    latency_tier: 'low',
    description: 'Lightweight multimodal model suitable for chat, reasoning, and tool-use with good speed/cost balance.',
    use_cases: 'Customer support, content drafting, code assistance, lightweight RAG.',
    industry: ['general'],
    benchmarks: { overall: 0.78 },
    pros: ['Fast', 'Good reasoning', 'Broad ecosystem'],
    cons: ['Paid API', 'Data privacy considerations'],
    url: 'https://platform.openai.com/'
  },
  {
    name: 'Claude 3.5 Sonnet',
    provider: 'Anthropic',
    type: 'LLM',
    cost_per_1k_tokens: 3.0,
    cost_tier: 'high',
    latency_tier: 'medium',
    description: 'High capability LLM focused on safety and reasoning quality.',
    use_cases: 'Analysis, drafting, support with focus on safety.',
    industry: ['general', 'healthcare', 'finance'],
    benchmarks: { overall: 0.82 },
    pros: ['Strong safety', 'Great reasoning'],
    cons: ['Higher cost'],
    url: 'https://www.anthropic.com'
  },
  {
    name: 'Llama 3.1 70B Instruct',
    provider: 'Meta',
    type: 'LLM',
    cost_tier: 'low',
    latency_tier: 'medium',
    description: 'Open-source instruction-tuned model good for on-prem or private deployments.',
    use_cases: 'Private chat, internal automation, RAG.',
    industry: ['general'],
    benchmarks: { overall: 0.75 },
    pros: ['Open source', 'Self-hostable'],
    cons: ['Infra/ops overhead'],
    url: 'https://ai.meta.com/llama/'
  },
  {
    name: 'Whisper Large-v3',
    provider: 'OpenAI',
    type: 'Speech',
    cost_tier: 'medium',
    latency_tier: 'medium',
    description: 'State-of-the-art speech recognition and translation model.',
    use_cases: 'Transcription, voice analytics, captions.',
    industry: ['media', 'healthcare'],
    benchmarks: { overall: 0.85 },
    pros: ['Accurate', 'Multilingual'],
    cons: ['GPU costs for self-hosting'],
    url: 'https://github.com/openai/whisper'
  },
  {
    name: 'YOLOv8',
    provider: 'Ultralytics',
    type: 'Vision',
    cost_tier: 'low',
    latency_tier: 'low',
    description: 'Real-time object detection model family.',
    use_cases: 'Retail analytics, inspection, security.',
    industry: ['retail', 'manufacturing'],
    benchmarks: { overall: 0.7 },
    pros: ['Fast', 'Edge-friendly'],
    cons: ['Requires dataset-specific fine-tuning'],
    url: 'https://docs.ultralytics.com'
  },
  {
    name: 'CLIP',
    provider: 'OpenAI',
    type: 'Vision',
    cost_tier: 'low',
    latency_tier: 'medium',
    description: 'Connects text and images for zero-shot classification and retrieval.',
    use_cases: 'Search, tagging, moderation.',
    industry: ['media', 'ecommerce'],
    benchmarks: { overall: 0.68 },
    pros: ['Zero-shot', 'Open weights'],
    cons: ['Not for detection/segmentation'],
    url: 'https://openai.com/research/clip'
  },
  {
    name: 'LightFM',
    provider: 'Open-source',
    type: 'Recommendation',
    cost_tier: 'low',
    latency_tier: 'low',
    description: 'Hybrid recommendation algorithm (content + collaborative).',
    use_cases: 'Personalization, product recommendation.',
    industry: ['ecommerce', 'media'],
    benchmarks: { overall: 0.6 },
    pros: ['Simple', 'Efficient'],
    cons: ['Limited deep personalization'],
    url: 'https://github.com/lyst/lightfm'
  },
  {
    name: 'Implicit ALS',
    provider: 'Ben Frederickson',
    type: 'Recommendation',
    cost_tier: 'low',
    latency_tier: 'low',
    description: 'Alternating least squares for implicit feedback data.',
    use_cases: 'Large-scale recommendation with implicit feedback.',
    industry: ['ecommerce', 'media'],
    benchmarks: { overall: 0.58 },
    pros: ['Scales well'],
    cons: ['Needs tuning', 'Cold-start issues'],
    url: 'https://github.com/benfred/implicit'
  }
];

 for (const m of models) upsertModel(m);
 await db.write();
 const count = (db.data.models || []).length;
 console.log(`Seeded models. Total models: ${count}`);
