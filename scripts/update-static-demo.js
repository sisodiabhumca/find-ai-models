import fs from 'fs';
import path from 'path';

const dbPath = './data/db.json';
const demoPath = './public/static-demo.html';

console.log('🔄 Updating static demo with latest models...');

if (!fs.existsSync(dbPath)) {
  console.log('❌ Database file not found, skipping update');
  process.exit(0);
}

try {
  const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
  const models = db.models || [];
  
  console.log(`📊 Found ${models.length} models in database`);
  
  // Take the most recent 12 models (mix of types)
  const recentModels = models
    .sort((a, b) => new Date(b.last_updated || 0) - new Date(a.last_updated || 0))
    .slice(0, 12);
  
  // Ensure we have a good mix of model types
  const llmModels = recentModels.filter(m => m.type === 'LLM').slice(0, 6);
  const visionModels = recentModels.filter(m => m.type === 'Vision').slice(0, 2);
  const speechModels = recentModels.filter(m => m.type === 'Speech').slice(0, 2);
  const otherModels = recentModels.filter(m => !['LLM', 'Vision', 'Speech'].includes(m.type)).slice(0, 2);
  
  const selectedModels = [...llmModels, ...visionModels, ...speechModels, ...otherModels];
  
  console.log(`🎯 Selected ${selectedModels.length} models for demo:`);
  selectedModels.forEach(m => console.log(`  - ${m.name} (${m.type})`));
  
  // Create the models array for the demo
  const modelsArray = selectedModels.map(model => ({
    id: model.id || model.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
    name: model.name,
    provider: model.provider,
    type: model.type,
    cost_per_1k_tokens: model.cost_per_1k_tokens,
    cost_tier: model.cost_tier,
    latency_tier: model.latency_tier,
    description: model.description,
    use_cases: model.use_cases,
    industry: model.industry || ['general'],
    benchmarks: model.benchmarks || { overall: 0.75 },
    pros: model.pros || [],
    cons: model.cons || [],
    url: model.url || '#'
  }));
  
  // Read the current demo file
  let demoContent = fs.readFileSync(demoPath, 'utf8');
  
  // Replace the models array
  const modelsRegex = /const models = \[[\s\S]*?\];/;
  const newModelsArray = 'const models = ' + JSON.stringify(modelsArray, null, 2) + ';';
  
  if (modelsRegex.test(demoContent)) {
    demoContent = demoContent.replace(modelsRegex, newModelsArray);
    
    // Update the demo stats
    const llmCount = models.filter(m => m.type === 'LLM').length;
    const visionCount = models.filter(m => m.type === 'Vision').length;
    const speechCount = models.filter(m => m.type === 'Speech').length;
    const providers = [...new Set(models.map(m => m.provider))];
    
    // Update the stats in the HTML
    demoContent = demoContent.replace(
      /<div><strong>Total Models:<\/strong> <span id="total_models">.*?<\/span><\/div>/,
      `<div><strong>Total Models:</strong> <span id="total_models">${models.length}</span></div>`
    );
    demoContent = demoContent.replace(
      /<div><strong>LLM Models:<\/strong> <span id="llm_count">.*?<\/span><\/div>/,
      `<div><strong>LLM Models:</strong> <span id="llm_count">${llmCount}</span></div>`
    );
    demoContent = demoContent.replace(
      /<div><strong>Vision Models:<\/strong> <span id="vision_count">.*?<\/span><\/div>/,
      `<div><strong>Vision Models:</strong> <span id="vision_count">${visionCount}</span></div>`
    );
    demoContent = demoContent.replace(
      /<div><strong>Speech Models:<\/strong> <span id="speech_count">.*?<\/span><\/div>/,
      `<div><strong>Speech Models:</strong> <span id="speech_count">${speechCount}</span></div>`
    );
    demoContent = demoContent.replace(
      /<div><strong>Providers:<\/strong> <span id="providers_count">.*?<\/span><\/div>/,
      `<div><strong>Providers:</strong> <span id="providers_count">${providers.length}</span></div>`
    );
    
    // Write the updated demo file
    fs.writeFileSync(demoPath, demoContent);
    
    console.log('✅ Static demo updated successfully!');
    console.log(`📈 Updated stats: ${models.length} total models, ${llmCount} LLM, ${visionCount} Vision, ${speechCount} Speech, ${providers.length} providers`);
    console.log(`🌐 Demo will be deployed to: https://sisodiabhumca.github.io/find-ai-models/`);
    
  } else {
    console.log('❌ Could not find models array in demo file');
    process.exit(1);
  }
  
} catch (error) {
  console.error('❌ Error updating static demo:', error.message);
  process.exit(1);
}
