import { runDiscovery } from './model-discovery.js';
import { initDb, getDb } from '../src/db.js';

await initDb();
const db = getDb();

// Scheduler configuration
const SCHEDULE_CONFIG = {
  // Run discovery every 6 hours by default
  interval: process.env.DISCOVERY_INTERVAL || 6 * 60 * 60 * 1000, // 6 hours in milliseconds
  // Maximum models to keep in database
  maxModels: process.env.MAX_MODELS || 1000,
  // Enable/disable automatic discovery
  enabled: process.env.AUTO_DISCOVERY !== 'false'
};

// Discovery history tracking
const DISCOVERY_HISTORY = {
  lastRun: null,
  totalRuns: 0,
  totalNewModels: 0,
  errors: []
};

// Main scheduler function
async function startScheduler() {
  if (!SCHEDULE_CONFIG.enabled) {
    console.log('Automatic discovery is disabled. Set AUTO_DISCOVERY=true to enable.');
    return;
  }

  console.log(`Starting model discovery scheduler...`);
  console.log(`Discovery interval: ${SCHEDULE_CONFIG.interval / (1000 * 60 * 60)} hours`);
  console.log(`Max models: ${SCHEDULE_CONFIG.maxModels}`);

  // Run initial discovery
  await runScheduledDiscovery();

  // Set up recurring discovery
  setInterval(async () => {
    await runScheduledDiscovery();
  }, SCHEDULE_CONFIG.interval);

  console.log('Scheduler started successfully.');
}

// Run discovery with error handling and logging
async function runScheduledDiscovery() {
  const startTime = new Date();
  console.log(`\n[${startTime.toISOString()}] Starting scheduled model discovery...`);

  try {
    const beforeCount = db.data.models.length;
    await runDiscovery();
    const afterCount = db.data.models.length;
    const newModelsCount = afterCount - beforeCount;

    // Update discovery history
    DISCOVERY_HISTORY.lastRun = startTime;
    DISCOVERY_HISTORY.totalRuns++;
    DISCOVERY_HISTORY.totalNewModels += newModelsCount;

    console.log(`[${new Date().toISOString()}] Discovery completed successfully.`);
    console.log(`New models found: ${newModelsCount}`);
    console.log(`Total models in database: ${afterCount}`);

    // Clean up old models if we exceed the limit
    if (afterCount > SCHEDULE_CONFIG.maxModels) {
      await cleanupOldModels();
    }

    // Log discovery statistics
    logDiscoveryStats();

  } catch (error) {
    console.error(`[${new Date().toISOString()}] Discovery failed:`, error.message);
    DISCOVERY_HISTORY.errors.push({
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
}

// Clean up old models to stay within limits
async function cleanupOldModels() {
  console.log('Cleaning up old models...');
  
  const models = db.data.models;
  const currentCount = models.length;
  const targetCount = SCHEDULE_CONFIG.maxModels;
  const modelsToRemove = currentCount - targetCount;

  if (modelsToRemove <= 0) return;

  // Sort models by last_updated (oldest first) and remove the oldest ones
  models.sort((a, b) => {
    const dateA = new Date(a.last_updated || '1970-01-01');
    const dateB = new Date(b.last_updated || '1970-01-01');
    return dateA - dateB;
  });

  // Remove oldest models, but keep at least one model per provider
  const providers = new Set();
  const modelsToKeep = [];
  const modelsToDelete = [];

  // First pass: keep the most recent model from each provider
  for (let i = models.length - 1; i >= 0; i--) {
    const model = models[i];
    if (!providers.has(model.provider)) {
      providers.add(model.provider);
      modelsToKeep.push(model);
    } else {
      modelsToDelete.push(model);
    }
  }

  // Second pass: add more recent models until we reach the target
  for (let i = models.length - 1; i >= 0; i--) {
    const model = models[i];
    if (modelsToKeep.length < targetCount && !modelsToKeep.includes(model)) {
      modelsToKeep.push(model);
    }
  }

  // Update database with kept models
  db.data.models = modelsToKeep;
  await db.write();

  console.log(`Cleaned up ${modelsToDelete.length} old models.`);
  console.log(`Remaining models: ${modelsToKeep.length}`);
}

// Log discovery statistics
function logDiscoveryStats() {
  console.log('\n=== Discovery Statistics ===');
  console.log(`Total discovery runs: ${DISCOVERY_HISTORY.totalRuns}`);
  console.log(`Total new models found: ${DISCOVERY_HISTORY.totalNewModels}`);
  console.log(`Last run: ${DISCOVERY_HISTORY.lastRun?.toISOString() || 'Never'}`);
  
  if (DISCOVERY_HISTORY.errors.length > 0) {
    console.log(`Recent errors: ${DISCOVERY_HISTORY.errors.slice(-3).length}`);
  }

  // Provider statistics
  const providerStats = {};
  db.data.models.forEach(model => {
    providerStats[model.provider] = (providerStats[model.provider] || 0) + 1;
  });

  console.log('\nModels by provider:');
  Object.entries(providerStats)
    .sort(([,a], [,b]) => b - a)
    .forEach(([provider, count]) => {
      console.log(`  ${provider}: ${count}`);
    });

  console.log('===========================\n');
}

// Manual trigger function
async function triggerDiscovery() {
  console.log('Manually triggering discovery...');
  await runScheduledDiscovery();
}

// Get discovery status
function getDiscoveryStatus() {
  return {
    enabled: SCHEDULE_CONFIG.enabled,
    interval: SCHEDULE_CONFIG.interval,
    maxModels: SCHEDULE_CONFIG.maxModels,
    lastRun: DISCOVERY_HISTORY.lastRun,
    totalRuns: DISCOVERY_HISTORY.totalRuns,
    totalNewModels: DISCOVERY_HISTORY.totalNewModels,
    currentModels: db.data.models.length,
    recentErrors: DISCOVERY_HISTORY.errors.slice(-5)
  };
}

// Export functions for use in other modules
export { 
  startScheduler, 
  runScheduledDiscovery, 
  triggerDiscovery, 
  getDiscoveryStatus,
  cleanupOldModels 
};

// Start scheduler if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  startScheduler();
}
