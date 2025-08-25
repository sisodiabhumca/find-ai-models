# 🔄 Auto-Update System for Static Demo

## ✅ **How It Works**

The system automatically keeps your GitHub Pages static demo updated with the latest AI models discovered by the system. Here's how it works:

### **1. Daily Discovery Process**
- **Discovery Workflow**: Runs daily at 5 PM PST (1 AM UTC)
- **Sources**: Scans 5 major AI model repositories
- **Database**: Updates `data/db.json` with new models
- **Current Count**: 90+ models and growing

### **2. Auto-Update Process**
- **Update Workflow**: Runs daily at 6 PM PST (2 AM UTC) - after discovery
- **Selection**: Picks the 12 most recent models (mix of types)
- **Update**: Modifies `public/static-demo.html` with new data
- **Deploy**: Triggers GitHub Pages deployment automatically

### **3. Model Selection Strategy**
The system ensures a good mix of model types:
- **6 LLM Models**: Latest language models
- **2 Vision Models**: Computer vision models
- **2 Speech Models**: Audio/speech models
- **2 Other Models**: Embeddings, recommendations, etc.

## 🚀 **Workflows**

### **Discovery Workflow** (`.github/workflows/discovery-only.yml`)
```yaml
Schedule: Daily at 5 PM PST
Purpose: Find new AI models
Action: Updates data/db.json
```

### **Update Workflow** (`.github/workflows/update-static-demo.yml`)
```yaml
Schedule: Daily at 6 PM PST
Purpose: Update static demo
Action: Updates public/static-demo.html
```

### **Deploy Workflow** (`.github/workflows/simple-deploy.yml`)
```yaml
Trigger: On push to main
Purpose: Deploy to GitHub Pages
Action: Deploys to https://sisodiabhumca.github.io/find-ai-models/
```

## 🛠️ **Manual Updates**

### **Update Demo Manually**
```bash
# Run discovery first
npm run discover

# Then update the demo
npm run update-demo
```

### **Check Current Status**
```bash
# View current models in database
cat data/db.json | jq '.models | length'

# View demo models
grep -A 20 "const models = " public/static-demo.html
```

## 📊 **Current System Status**

### **Database Stats**
- **Total Models**: 90
- **LLM Models**: 57
- **Vision Models**: 6
- **Speech Models**: 12
- **Providers**: 15

### **Demo Stats**
- **Demo Models**: 12 (most recent)
- **Auto-Update**: Daily at 6 PM PST
- **Live URL**: https://sisodiabhumca.github.io/find-ai-models/

## 🔧 **How the Update Script Works**

### **1. Read Database**
```javascript
const db = JSON.parse(fs.readFileSync('./data/db.json', 'utf8'));
const models = db.models || [];
```

### **2. Select Models**
```javascript
// Sort by last_updated and take most recent
const recentModels = models
  .sort((a, b) => new Date(b.last_updated || 0) - new Date(a.last_updated || 0))
  .slice(0, 12);
```

### **3. Update HTML**
```javascript
// Replace the models array in the HTML file
const modelsRegex = /const models = \[[\s\S]*?\];/;
const newModelsArray = 'const models = ' + JSON.stringify(modelsArray, null, 2) + ';';
demoContent = demoContent.replace(modelsRegex, newModelsArray);
```

### **4. Update Stats**
```javascript
// Update the statistics in the HTML
demoContent = demoContent.replace(
  /<div><strong>Total Models:<\/strong> <span id="total_models">.*?<\/span><\/div>/,
  `<div><strong>Total Models:</strong> <span id="total_models">${models.length}</span></div>`
);
```

## 🎯 **Benefits**

### **✅ Automatic Updates**
- No manual intervention needed
- Demo stays current with latest models
- GitHub Pages automatically deploys changes

### **✅ Smart Selection**
- Ensures diverse model types
- Prioritizes recent models
- Maintains good user experience

### **✅ Reliable Process**
- Runs after discovery completes
- Handles errors gracefully
- Logs all activities

## 📈 **Monitoring**

### **GitHub Actions**
1. Go to: https://github.com/sisodiabhumca/find-ai-models/actions
2. Check "Update Static Demo with New Models" workflow
3. View logs for update details

### **Manual Monitoring**
```bash
# Check when demo was last updated
git log --oneline -10 public/static-demo.html

# Check discovery status
npm run discover
npm run update-demo
```

## 🎉 **Result**

Your GitHub Pages demo at https://sisodiabhumca.github.io/find-ai-models/ will:
- ✅ **Automatically update** with new models daily
- ✅ **Show current statistics** from the full database
- ✅ **Display diverse model types** for better user experience
- ✅ **Stay synchronized** with your discovery system

The static demo now provides a living, breathing preview of your AI model discovery system! 🚀
