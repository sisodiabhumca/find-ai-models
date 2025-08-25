import { initDb, getDb } from '../src/db.js';
import { v4 as uuidv4 } from 'uuid';
import fetch from 'node-fetch';

await initDb();
const db = getDb();

// Model discovery sources
const DISCOVERY_SOURCES = {
  // Hugging Face Model Hub
  huggingface: {
    url: 'https://huggingface.co/api/models',
    parser: parseHuggingFaceModels
  },
  // OpenAI API models
  openai: {
    url: 'https://api.openai.com/v1/models',
    parser: parseOpenAIModels,
    requiresAuth: true
  },
  // Anthropic API models
  anthropic: {
    url: 'https://api.anthropic.com/v1/models',
    parser: parseAnthropicModels,
    requiresAuth: true
  },
  // Google AI models
  google: {
    url: 'https://generativelanguage.googleapis.com/v1beta/models',
    parser: parseGoogleModels,
    requiresAuth: true
  },
  // ModelScope (Alibaba)
  modelscope: {
    url: 'https://modelscope.cn/api/v1/models',
    parser: parseModelScopeModels
  }
};

// Parse Hugging Face models
async function parseHuggingFaceModels(data) {
  const models = [];
  const popularModels = data.filter(model => 
    model.downloads > 1000 && 
    (model.tags.includes('text-generation') || 
     model.tags.includes('image-classification') ||
     model.tags.includes('object-detection') ||
     model.tags.includes('text-to-speech') ||
     model.tags.includes('automatic-speech-recognition'))
  );

  for (const model of popularModels.slice(0, 50)) { // Limit to top 50
    const modelInfo = {
      name: model.modelId,
      provider: model.author || 'Hugging Face',
      type: determineModelType(model.tags),
      cost_tier: 'low', // Open source
      latency_tier: 'medium',
      description: model.description || `Open source ${model.tags.join(', ')} model`,
      use_cases: generateUseCases(model.tags),
      industry: ['general'],
      benchmarks: { overall: 0.7 }, // Default benchmark
      pros: ['Open source', 'Free to use'],
      cons: ['Requires self-hosting', 'Technical expertise needed'],
      url: `https://huggingface.co/${model.modelId}`,
      source: 'huggingface'
    };
    models.push(modelInfo);
  }
  return models;
}

// Parse OpenAI models
async function parseOpenAIModels(data) {
  const models = [];
  for (const model of data.data) {
    if (model.id.includes('gpt') || model.id.includes('whisper') || model.id.includes('dall-e')) {
      const modelInfo = {
        name: model.id,
        provider: 'OpenAI',
        type: determineOpenAIType(model.id),
        cost_tier: determineCostTier(model.id),
        latency_tier: 'medium',
        description: `OpenAI ${model.id} model`,
        use_cases: generateOpenAIUseCases(model.id),
        industry: ['general'],
        benchmarks: { overall: 0.8 }, // Default benchmark
        pros: ['High quality', 'Easy to use', 'Well documented'],
        cons: ['Paid API', 'Data privacy concerns'],
        url: 'https://platform.openai.com/',
        source: 'openai'
      };
      models.push(modelInfo);
    }
  }
  return models;
}

// Parse Anthropic models
async function parseAnthropicModels(data) {
  const models = [];
  for (const model of data.models) {
    const modelInfo = {
      name: model.id,
      provider: 'Anthropic',
      type: 'LLM',
      cost_tier: determineAnthropicCostTier(model.id),
      latency_tier: 'medium',
      description: `Anthropic ${model.id} model`,
      use_cases: 'General language tasks, reasoning, analysis',
      industry: ['general', 'healthcare', 'finance'],
      benchmarks: { overall: 0.82 },
      pros: ['Safety focused', 'Good reasoning'],
      cons: ['Paid API'],
      url: 'https://www.anthropic.com',
      source: 'anthropic'
    };
    models.push(modelInfo);
  }
  return models;
}

// Parse Google models
async function parseGoogleModels(data) {
  const models = [];
  for (const model of data.models) {
    if (model.name.includes('gemini') || model.name.includes('palm')) {
      const modelInfo = {
        name: model.name.split('/').pop(),
        provider: 'Google',
        type: 'LLM',
        cost_tier: 'medium',
        latency_tier: 'medium',
        description: `Google ${model.name} model`,
        use_cases: 'General language tasks, reasoning',
        industry: ['general'],
        benchmarks: { overall: 0.8 },
        pros: ['Google ecosystem', 'Good performance'],
        cons: ['Google ecosystem lock-in'],
        url: 'https://ai.google.dev/',
        source: 'google'
      };
      models.push(modelInfo);
    }
  }
  return models;
}

// Parse ModelScope models
async function parseModelScopeModels(data) {
  const models = [];
  for (const model of data.models.slice(0, 30)) {
    const modelInfo = {
      name: model.model_name,
      provider: model.organization || 'ModelScope',
      type: determineModelType(model.tags || []),
      cost_tier: 'low',
      latency_tier: 'medium',
      description: model.description || `ModelScope ${model.model_name}`,
      use_cases: generateUseCases(model.tags || []),
      industry: ['general'],
      benchmarks: { overall: 0.7 },
      pros: ['Open source', 'Free'],
      cons: ['Limited documentation', 'Self-hosting required'],
      url: `https://modelscope.cn/models/${model.model_name}`,
      source: 'modelscope'
    };
    models.push(modelInfo);
  }
  return models;
}

// Helper functions
function determineModelType(tags) {
  if (tags.includes('text-generation') || tags.includes('llm')) return 'LLM';
  if (tags.includes('image-classification') || tags.includes('object-detection')) return 'Vision';
  if (tags.includes('text-to-speech') || tags.includes('automatic-speech-recognition')) return 'Speech';
  if (tags.includes('text-to-image') || tags.includes('image-generation')) return 'Image Generation';
  return 'LLM';
}

function determineOpenAIType(modelId) {
  if (modelId.includes('gpt')) return 'LLM';
  if (modelId.includes('whisper')) return 'Speech';
  if (modelId.includes('dall-e')) return 'Image Generation';
  return 'LLM';
}

function determineCostTier(modelId) {
  if (modelId.includes('gpt-4')) return 'high';
  if (modelId.includes('gpt-3.5')) return 'low';
  return 'medium';
}

function determineAnthropicCostTier(modelId) {
  if (modelId.includes('opus')) return 'high';
  if (modelId.includes('haiku')) return 'low';
  return 'medium';
}

function generateUseCases(tags) {
  const useCases = [];
  if (tags.includes('text-generation')) useCases.push('Text generation, Chat');
  if (tags.includes('image-classification')) useCases.push('Image classification');
  if (tags.includes('object-detection')) useCases.push('Object detection');
  if (tags.includes('text-to-speech')) useCases.push('Text-to-speech');
  if (tags.includes('automatic-speech-recognition')) useCases.push('Speech recognition');
  return useCases.join(', ') || 'General AI tasks';
}

function generateOpenAIUseCases(modelId) {
  if (modelId.includes('gpt-4')) return 'Advanced reasoning, Complex analysis';
  if (modelId.includes('gpt-3.5')) return 'Chat, Simple tasks';
  if (modelId.includes('whisper')) return 'Speech recognition, Transcription';
  if (modelId.includes('dall-e')) return 'Image generation, Creative content';
  return 'General AI tasks';
}

// Main discovery function
async function discoverNewModels() {
  console.log('Starting model discovery...');
  const newModels = [];
  
  for (const [sourceName, source] of Object.entries(DISCOVERY_SOURCES)) {
    try {
      console.log(`Discovering models from ${sourceName}...`);
      
      const response = await fetch(source.url, {
        headers: source.requiresAuth ? {
          'Authorization': `Bearer ${process.env[`${sourceName.toUpperCase()}_API_KEY`] || ''}`
        } : {}
      });
      
      if (!response.ok) {
        console.log(`Failed to fetch from ${sourceName}: ${response.status}`);
        continue;
      }
      
      const data = await response.json();
      const discoveredModels = await source.parser(data);
      
      // Check if models are new
      for (const model of discoveredModels) {
        const existing = db.data.models.find(m => 
          m.name === model.name && m.provider === model.provider
        );
        
        if (!existing) {
          model.id = uuidv4();
          model.last_updated = new Date().toISOString();
          newModels.push(model);
          console.log(`Found new model: ${model.name} by ${model.provider}`);
        }
      }
      
    } catch (error) {
      console.error(`Error discovering models from ${sourceName}:`, error.message);
    }
  }
  
  return newModels;
}

// Add new models to database
async function addNewModels(models) {
  if (models.length === 0) {
    console.log('No new models found.');
    return;
  }
  
  console.log(`Adding ${models.length} new models to database...`);
  
  for (const model of models) {
    db.data.models.push(model);
  }
  
  await db.write();
  console.log(`Successfully added ${models.length} new models.`);
}

// Manual discovery trigger
async function runDiscovery() {
  const newModels = await discoverNewModels();
  await addNewModels(newModels);
  console.log(`Discovery complete. Total models in database: ${db.data.models.length}`);
}

// Export for use in other modules
export { runDiscovery, discoverNewModels, addNewModels };

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runDiscovery();
}
