# AI Model Recommender with Automated Discovery

A comprehensive AI model recommendation system that automatically discovers and catalogs new AI models from various sources, helping you choose the right model for your specific use case.

## 🚀 Features

### Core Functionality
- **Smart Model Recommendations**: Advanced search and filtering based on your specific requirements
- **Comprehensive Model Database**: 50+ pre-loaded models from major providers
- **Automated Discovery**: Continuously scans for new models and adds them automatically
- **Real-time Updates**: Models are discovered and added in real-time
- **Export Capabilities**: Export recommendations as CSV or PDF

### Discovery System
- **Multi-Source Discovery**: Scans Hugging Face, OpenAI, Anthropic, Google, and more
- **Scheduled Updates**: Runs discovery automatically every 6 hours
- **Smart Filtering**: Only adds high-quality, relevant models
- **Duplicate Prevention**: Automatically avoids adding duplicate models
- **Database Management**: Automatically cleans up old models to maintain performance

### Model Categories
- **LLM**: Large Language Models (GPT, Claude, Gemini, etc.)
- **Vision**: Computer Vision models (YOLO, CLIP, SAM, etc.)
- **Speech**: Speech recognition and synthesis (Whisper, Wav2Vec, etc.)
- **Image Generation**: Text-to-image models (DALL-E, etc.)
- **Code**: Code generation models (Code Llama, etc.)
- **Embedding**: Text embedding models
- **Recommendation**: Recommendation system models
- **Multimodal**: Models that handle multiple modalities

## 🛠️ Quick Start

### 1. Installation
```bash
git clone <repository-url>
cd ai-model-recommender
npm install
```

### 2. Configuration
Create a `.env` file in the root directory:
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

### 3. Initialize Database
```bash
# Load comprehensive model database
npm run seed-comprehensive
```

### 4. Start the Server
```bash
# Start with automatic discovery enabled
npm run dev
```

The application will be available at `http://localhost:3000`

## 📊 Available Scripts

- `npm run dev` - Start server with automatic discovery
- `npm run seed-comprehensive` - Load comprehensive model database
- `npm run discover` - Run manual discovery once
- `npm run scheduler` - Start discovery scheduler only

## 🔍 How to Use

### Web Interface
1. **Search for Models**: Enter your use case description (e.g., "Summarize customer tickets")
2. **Filter Results**: Use industry, type, and priority filters
3. **Review Recommendations**: See detailed model information with pros/cons
4. **Bookmark Models**: Save interesting models for later reference
5. **Export Results**: Download recommendations as CSV or PDF

### Discovery Management
- **Monitor Status**: View discovery statistics and recent activity
- **Manual Trigger**: Run discovery on-demand
- **View Statistics**: See model distribution by provider, type, and cost

## 🔌 API Endpoints

### Model Recommendations
- `POST /api/recommend` - Get model recommendations
- `GET /api/models` - List all models
- `GET /api/stats` - Get comprehensive statistics

### Discovery Management
- `POST /api/discovery/trigger` - Manually trigger discovery
- `GET /api/discovery/status` - Get discovery status and statistics
- `POST /api/discovery/models` - Discover from specific source

### Bookmarks
- `GET /api/bookmarks` - Get bookmarked models
- `POST /api/bookmarks` - Add model to bookmarks
- `DELETE /api/bookmarks/:id` - Remove bookmark

### Export
- `POST /api/export` - Export recommendations (CSV/PDF)

### Admin
- `POST /api/admin/models` - Add new model
- `PUT /api/admin/models/:id` - Update model
- `DELETE /api/admin/models/:id` - Delete model

## 🔄 Discovery Sources

The system automatically discovers models from:

1. **Hugging Face Model Hub** - Open source models
2. **OpenAI API** - GPT, Whisper, DALL-E models
3. **Anthropic API** - Claude models
4. **Google AI** - Gemini, PaLM models
5. **ModelScope** - Alibaba's model repository

## 📈 Monitoring & Statistics

The system provides comprehensive monitoring:

- **Discovery History**: Track all discovery runs
- **Model Statistics**: Distribution by provider, type, cost tier
- **Recent Updates**: Latest models added to the database
- **Error Tracking**: Monitor discovery failures
- **Performance Metrics**: Response times and success rates

## 🛡️ Security & Performance

### Security Features
- API keys stored in environment variables
- No sensitive data logged
- Input validation and sanitization
- Rate limiting on API endpoints

### Performance Optimizations
- Background discovery processing
- Automatic database cleanup
- Efficient search algorithms
- Caching for frequently accessed data

## 🔧 Customization

### Adding New Discovery Sources
Edit `scripts/model-discovery.js`:
1. Add source to `DISCOVERY_SOURCES`
2. Create parser function
3. Add authentication if required

### Modifying Discovery Logic
- Adjust filtering criteria in parser functions
- Change model quality thresholds
- Modify discovery intervals

### Database Management
- Models automatically cleaned up when exceeding limits
- Oldest models removed first, but one per provider kept
- All changes logged with timestamps

## 🐛 Troubleshooting

### Discovery Not Running
1. Check `AUTO_DISCOVERY=true` in `.env`
2. Verify scheduler is started with server
3. Check console logs for errors

### API Errors
1. Verify API keys in `.env`
2. Check network connectivity
3. Review error logs

### Database Issues
1. Ensure write permissions to `./data/db.json`
2. Check disk space
3. Verify JSON file integrity

## 📝 Example Usage

### Finding a Model for Customer Support
```bash
curl -X POST http://localhost:3000/api/recommend \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Customer support chatbot that can understand context",
    "industry": "general",
    "type": "LLM",
    "priority": "cost"
  }'
```

### Triggering Manual Discovery
```bash
curl -X POST http://localhost:3000/api/discovery/trigger
```

### Getting Statistics
```bash
curl http://localhost:3000/api/stats
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Hugging Face for the model hub
- OpenAI, Anthropic, Google for their APIs
- The open source AI community

---

**Choose wisely. Iterate quickly.**
