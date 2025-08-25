# AI Model Discovery System Setup

This system automatically discovers and adds new AI models from various sources to keep your database up-to-date.

## Features

- **Comprehensive Model Database**: 50+ pre-loaded AI models from major providers
- **Automated Discovery**: Scans multiple sources for new models
- **Scheduled Updates**: Runs discovery automatically every 6 hours
- **Smart Filtering**: Only adds relevant, high-quality models
- **API Integration**: RESTful APIs for manual discovery and status monitoring

## Quick Start

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Seed the database with comprehensive models**:
   ```bash
   npm run seed-comprehensive
   ```

3. **Start the server with automatic discovery**:
   ```bash
   npm run dev
   ```

## Configuration

Create a `.env` file in the root directory with the following options:

```env
# Enable/disable automatic discovery (default: true)
AUTO_DISCOVERY=true

# Discovery interval in milliseconds (default: 6 hours)
DISCOVERY_INTERVAL=21600000

# Maximum number of models to keep in database (default: 1000)
MAX_MODELS=1000

# API Keys for enhanced discovery (optional)
OPENAI_API_KEY=your_openai_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here
GOOGLE_API_KEY=your_google_api_key_here

# Server configuration
PORT=3000
```

## Available Scripts

- `npm run seed-comprehensive` - Load comprehensive model database
- `npm run discover` - Run manual discovery once
- `npm run scheduler` - Start discovery scheduler
- `npm run dev` - Start server with automatic discovery

## Discovery Sources

The system automatically discovers models from:

1. **Hugging Face Model Hub** - Open source models
2. **OpenAI API** - GPT, Whisper, DALL-E models
3. **Anthropic API** - Claude models
4. **Google AI** - Gemini, PaLM models
5. **ModelScope** - Alibaba's model repository

## API Endpoints

### Discovery Management

- `POST /api/discovery/trigger` - Manually trigger discovery
- `GET /api/discovery/status` - Get discovery status and statistics
- `POST /api/discovery/models` - Discover from specific source

### Model Statistics

- `GET /api/stats` - Get comprehensive model statistics

### Existing Endpoints

- `POST /api/recommend` - Get model recommendations
- `GET /api/models` - List all models
- `GET /api/bookmarks` - Get bookmarked models

## Model Categories

The system tracks models in these categories:

- **LLM** - Large Language Models (GPT, Claude, Gemini, etc.)
- **Vision** - Computer Vision models (YOLO, CLIP, SAM, etc.)
- **Speech** - Speech recognition and synthesis (Whisper, Wav2Vec, etc.)
- **Image Generation** - Text-to-image models (DALL-E, etc.)
- **Code** - Code generation models (Code Llama, etc.)
- **Embedding** - Text embedding models
- **Recommendation** - Recommendation system models
- **Multimodal** - Models that handle multiple modalities

## Monitoring

The system provides comprehensive monitoring:

- Discovery run history
- New models found per run
- Error tracking
- Provider statistics
- Model type distribution

## Customization

### Adding New Discovery Sources

To add a new discovery source, edit `scripts/model-discovery.js`:

1. Add the source to `DISCOVERY_SOURCES`
2. Create a parser function
3. Add any required authentication

### Modifying Discovery Logic

- Edit filtering criteria in the parser functions
- Adjust model quality thresholds
- Modify the discovery interval

### Database Management

- Models are automatically cleaned up when exceeding `MAX_MODELS`
- Oldest models are removed first, but at least one per provider is kept
- All changes are logged with timestamps

## Troubleshooting

### Discovery Not Running

1. Check if `AUTO_DISCOVERY=true` in your `.env` file
2. Verify the scheduler is started with the server
3. Check console logs for error messages

### API Errors

1. Verify API keys are correctly set in `.env`
2. Check network connectivity to discovery sources
3. Review error logs in the console

### Database Issues

1. Ensure write permissions to `./data/db.json`
2. Check disk space availability
3. Verify JSON file integrity

## Performance

- Discovery runs in the background without affecting API performance
- Database operations are optimized for large model collections
- Automatic cleanup prevents database bloat
- Caching reduces redundant API calls

## Security

- API keys are stored in environment variables
- No sensitive data is logged
- Discovery sources are validated before processing
- Rate limiting prevents API abuse
