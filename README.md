# 🎬 AI Video Generator

Modern, clean, and minimalist web application untuk generate video menggunakan AI.

![Version](https://img.shields.io/badge/version-3.0.0-blue)
![Node](https://img.shields.io/badge/node-%3E%3D14.0.0-brightgreen)
![License](https://img.shields.io/badge/license-MIT-green)

**Powered by Triple API** - Nekolabs (veo-3-fast) + Hugging Face (veo-3.1-fast + sora-2) for best experience!

## ✨ Features

- 🎨 **Clean UI/UX** - Minimalist black & white design
- 🤖 **AI-Powered** - VEO-3, VEO-3.1 & Sora-2 technology
- 🔀 **Triple API** - Multi provider system for flexibility
- 🆓 **veo-3-fast** - FREE via Nekolabs, no token needed!
- ⭐ **veo-3.1-fast** - Latest VEO via Hugging Face (token required)
- 🌟 **sora-2** - OpenAI Sora-2 via Hugging Face (token required)
- ⚡ **Fast** - Generate videos in 1-3 minutes
- 📱 **Responsive** - Works perfectly on all devices
- ⬇️ **Download** - Save videos directly to your device
- ⏱️ **Duration Control** - Choose 5s, 8s, or 10s videos
- 📐 **Aspect Ratios** - Support 16:9, 9:16, 1:1, and 4:3

## 🚀 Quick Start

### Prerequisites

- Node.js 14+ installed
- npm (comes with Node.js)
- **Hugging Face Account** (optional - only for veo-3.1-fast & sora-2)

### Installation

1. **Navigate to project folder**
```bash
cd video-gen
```

2. **Install dependencies**
```bash
npm install
```

3. **Start the server**
```bash
npm start
```

4. **Open your browser**
```
http://localhost:3000
```

**🎉 That's it!** You can now use **veo-3-fast** (no token needed).

### Optional: Enable Premium Models (Better Quality)

If you want to use **veo-3.1-fast** or **sora-2** models:

1. **Get Hugging Face API Token**
   - Go to [https://huggingface.co/settings/tokens](https://huggingface.co/settings/tokens)
   - Click "New token"
   - Give it a name (e.g., "video-generator" or "video-veo31" / "video-sora2")
   - Select "Read" permission
   - Copy the token (you can use same token for both or create separate tokens)

2. **Configure Environment Variables**
```bash
# Copy the example file
cp .env.example .env

# Edit .env file and add your token
```

Your `.env` file should look like:
```env
# For veo-3.1-fast
HF_TOKEN_Veo3_1=hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# For sora-2
HF_TOKEN_Sora_2=hf_yyyyyyyyyyyyyyyyyyyyyyyyyyyyyy

# You can use the same token for both if you want
PORT=3000
```

3. **Restart the server**

Now all premium models are available!

---

## 🎮 Usage

1. **Select Model**
   - `veo-3-fast`: **FREE**, no setup needed (via Nekolabs API)
   - `veo-3.1-fast`: Latest VEO model, better quality (requires HF_TOKEN_Veo3_1)
   - `sora-2`: OpenAI Sora-2 model, excellent quality (requires HF_TOKEN_Sora_2)

2. **Enter Prompt**
   - Be specific and descriptive
   - Example: "A young man walking on the street at sunset"

3. **Choose Duration**
   - 5 seconds
   - 8 seconds (default)
   - 10 seconds

4. **Select Aspect Ratio**
   - 16:9 (landscape, default)
   - 9:16 (portrait, for mobile)
   - 1:1 (square, for social media)
   - 4:3 (classic)

5. **Generate**
   - Click "Generate Video"
   - Wait 1-3 minutes
   - Download your video!

## 📁 Project Structure

```
video-gen/
├── server.js           # Express server with HF API integration
├── package.json        # Dependencies
├── .env               # Environment variables (not in git)
├── .env.example       # Template for .env
├── public/
│   ├── index.html     # Main UI
│   ├── script.js      # Frontend logic
│   ├── style.css      # Styles
│   └── videos/        # Generated videos (temporary)
└── README.md          # This file
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `HF_TOKEN_Veo3_1` | Hugging Face token for veo-3.1-fast | ⚠️ Only for veo-3.1-fast | - |
| `HF_TOKEN_Sora_2` | Hugging Face token for sora-2 | ⚠️ Only for sora-2 | - |
| `PORT` | Server port | ❌ No | 3000 |

### API Providers

| Model | Provider | Token Required | Status |
|-------|----------|----------------|--------|
| **veo-3-fast** | Nekolabs API | ❌ No | ✅ Always available |
| **veo-3.1-fast** | Hugging Face (fal-ai) | ✅ Yes | ⚠️ Requires HF_TOKEN_Veo3_1 |
| **sora-2** | Hugging Face (fal-ai) | ✅ Yes | ⚠️ Requires HF_TOKEN_Sora_2 |

### Video Settings

- **Duration**: 5s, 8s, or 10s
- **Aspect Ratio**: 16:9, 9:16, 1:1, 4:3
- **Auto Cleanup**: Videos deleted after 1 hour (veo-3.1-fast only)

## 🛠️ API Endpoints

### `POST /api/generate`
Generate a new video

**Request Body:**
```json
{
  "model": "veo-3-fast",
  "prompt": "A woman walking on the beach",
  "duration": "8",
  "ratio": "16:9"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "videoUrl": "/videos/video_1234567890.mp4",
    "model": "veo-3-fast",
    "prompt": "A woman walking on the beach",
    "duration": "8",
    "ratio": "16:9"
  }
}
```

### `GET /api/health`
Check server status and available models

**Response:**
```json
{
  "status": "ok",
  "message": "Server is running",
  "apis": {
    "nekolabs": {
      "status": "available",
      "model": "veo-3-fast",
      "requiresToken": false
    },
    "huggingface": {
      "status": "available",
      "model": "veo-3.1-fast",
      "requiresToken": true,
      "tokenConfigured": true
    }
  },
  "models": [
    {
      "id": "veo-3-fast",
      "provider": "nekolabs",
      "requiresToken": false,
      "status": "available"
    },
    {
      "id": "veo-3.1-fast",
      "provider": "huggingface",
      "requiresToken": true,
      "status": "available"
    }
  ],
  "version": "3.1.0"
}
```

## 🐛 Troubleshooting

### "Model requires Hugging Face token" Error

**Problem**: Trying to use veo-3.1-fast or sora-2 without token

**Solution**:
1. Use **veo-3-fast** instead (no token needed!)
2. OR: Add required token to .env file:
   - Copy `.env.example` to `.env`
   - Get token from https://huggingface.co/settings/tokens
   - For veo-3.1-fast: Add `HF_TOKEN_Veo3_1=hf_...`
   - For sora-2: Add `HF_TOKEN_Sora_2=hf_...`
   - You can use same token for both or separate tokens
   - Restart the server

### "Invalid API token" Error

**Problem**: Token is incorrect or expired

**Solution**:
1. Go to [https://huggingface.co/settings/tokens](https://huggingface.co/settings/tokens)
2. Create a new token
3. Update `.env` file with the new token
4. Restart the server

### "Rate limit exceeded" Error

**Problem**: Too many requests to the API

**Solution**:
1. Wait a few minutes before trying again
2. Consider upgrading your Hugging Face plan for higher limits

### Video Generation Timeout

**Problem**: Video takes too long to generate

**Solution**:
1. Try a shorter duration (5s instead of 10s)
2. Simplify your prompt
3. Try again later when API is less busy

### Port Already in Use

**Problem**: Port 3000 is already being used

**Solution**:
1. Create `.env` file and add: `PORT=3001`
2. Or stop the other application using port 3000

### Which Model Should I Use?

**Use veo-3-fast if:**
- ✅ You want instant setup (no token needed)
- ✅ You want fast generation
- ✅ You're testing or learning

**Use veo-3.1-fast if:**
- ✅ You want the latest VEO model
- ✅ You want better quality
- ✅ You don't mind getting a free HF token

**Use sora-2 if:**
- ✅ You want OpenAI's Sora technology
- ✅ You want excellent quality
- ✅ You want different style from VEO models

## 📝 Example Prompts

### Good Prompts (Specific & Descriptive)
✅ "A young woman with long brown hair walking through a busy Tokyo street at night, neon lights reflecting on wet pavement"

✅ "An elderly man sitting on a park bench feeding pigeons on a sunny autumn day, golden leaves falling around him"

✅ "A surfer riding a massive wave at sunset, dramatic orange and purple sky in the background"

### Poor Prompts (Too Vague)
❌ "A person"
❌ "Something cool"
❌ "Video"

### Tips for Better Results
- Be specific about the subject, action, location, and time
- Include details about lighting and atmosphere
- Mention camera angles if needed (close-up, wide shot, etc.)
- Keep it under 200 characters for best results

## 🔐 Security Notes

- **Never commit `.env` file** - It may contain your API token
- **Keep your HF tokens private** - Don't share them publicly
- **Regenerate token if exposed** - Create a new one immediately
- **Use read-only tokens** - No need for write permissions
- **veo-3-fast is safe** - No authentication, no sensitive data
- **Separate tokens recommended** - Better rate limit management

## 🎯 Technology Stack

- **Backend**: Node.js + Express
- **Frontend**: Vanilla JavaScript + HTML5 + CSS3
- **AI APIs**: 
  - Nekolabs API (veo-3-fast)
  - Hugging Face Inference API (veo-3.1-fast, sora-2)
- **Providers**: 
  - Nekolabs (free, no token)
  - fal-ai via Hugging Face (token required)
- **Models**: Google VEO-3 & VEO-3.1, OpenAI Sora-2

## 📊 API Rate Limits

### Nekolabs (veo-3-fast)
- **Free**: No authentication required
- **Limits**: Shared service, may be slow during peak hours
- **Reliability**: Community-maintained

### Hugging Face (veo-3.1-fast)
- **Free Tier**: Rate limits apply
- **Requests**: Limited per hour
- **Compute**: Shared GPU resources

### For Production Use
- Use veo-3-fast for high-volume, cost-free generation
- Use veo-3.1-fast for quality-critical content
- Consider Hugging Face Pro for higher limits
- Implement queue system for both APIs

## 🚀 Deployment

### Local Development
```bash
npm start
```

### Production
```bash
# Set NODE_ENV to production
export NODE_ENV=production

# Start with PM2 (recommended)
npm install -g pm2
pm2 start server.js --name "video-generator"
```

### Environment Variables for Production
```env
# Optional - only if you want premium models
HF_TOKEN_Veo3_1=your_veo31_token
HF_TOKEN_Sora_2=your_sora2_token

PORT=3000
NODE_ENV=production
```

**Note**: veo-3-fast works without any environment variables!

## 📚 Documentation

- [Hugging Face Inference API](https://huggingface.co/docs/api-inference/index)
- [fal-ai Provider](https://fal.ai/)
- [VEO-3 Model](https://huggingface.co/akhaliq/veo3-fast)
- [VEO-3.1 Model](https://huggingface.co/akhaliq/veo3.1-fast)
- [Sora-2 Model](https://huggingface.co/akhaliq/sora-2)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License - feel free to use this project for personal or commercial purposes.

## 🙏 Credits

- **Google** - For VEO-3 & VEO-3.1 models
- **OpenAI** - For Sora-2 model
- **Nekolabs** - For free veo-3-fast API access
- **Hugging Face** - For Inference API and model hosting
- **fal-ai** - For premium model provider
- **Community** - For feedback and contributions

## 📞 Support

If you encounter any issues:
1. Check the [Troubleshooting](#-troubleshooting) section
2. Verify your `.env` configuration
3. Check Hugging Face API status
4. Review server logs for detailed errors

## 🔄 Updates

### Version 3.2.0 (Current)
- ✅ **Triple API System** - 3 models to choose from!
- ✅ Added Sora-2 support (OpenAI)
- ✅ Dual token system (HF_TOKEN_Veo3_1 + HF_TOKEN_Sora_2)
- ✅ Improved model routing and error handling
- ✅ Better provider information display
- ✅ Support for same or separate tokens

### Version 3.1.0
- Hybrid API System - Best of both worlds!
- veo-3-fast via Nekolabs (FREE, no token)
- veo-3.1-fast via Hugging Face (token required)
- Smart routing based on model selection
- Improved error handling with provider info
- Auto cleanup for local videos (HF only)
- No mandatory setup - works out of the box!

### Version 3.0.0
- Migrated to Hugging Face Inference API
- Added fal-ai provider support
- Support for veo-3.1-fast model

### Version 2.0.0
- Added model selection (veo-3-fast, veo-3.1-fast)
- Added duration options (5s, 8s, 10s)
- Added audio toggle

### Version 1.0.0
- Initial release with nekolabs API
- Basic video generation

---

Made with ❤️ for the AI community