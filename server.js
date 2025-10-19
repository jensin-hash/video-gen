require("dotenv").config();
const express = require("express");
const { HfInference } = require("@huggingface/inference");
const axios = require("axios");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const https = require("https");

const app = express();
const PORT = process.env.PORT || 3000;

// Create axios instance with SSL certificate bypass for nekolabs
const axiosInstance = axios.create({
  httpsAgent: new https.Agent({
    rejectUnauthorized: false,
  }),
});

// Initialize Hugging Face Inference Clients (one for each model)
let hfVeo31 = null;
let hfSora2 = null;

// Check and initialize VEO-3.1 client
if (
  process.env.HF_TOKEN_Veo3_1 &&
  process.env.HF_TOKEN_Veo3_1 !== "your_veo3.1_token_here"
) {
  hfVeo31 = new HfInference(process.env.HF_TOKEN_Veo3_1);
}

// Check and initialize Sora-2 client
if (
  process.env.HF_TOKEN_Sora_2 &&
  process.env.HF_TOKEN_Sora_2 !== "your_sora2_token_here"
) {
  hfSora2 = new HfInference(process.env.HF_TOKEN_Sora_2);
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// Check token status
const hasVeo31Token =
  process.env.HF_TOKEN_Veo3_1 &&
  process.env.HF_TOKEN_Veo3_1 !== "your_veo3.1_token_here";

const hasSora2Token =
  process.env.HF_TOKEN_Sora_2 &&
  process.env.HF_TOKEN_Sora_2 !== "your_sora2_token_here";

// VEO-3-FAST Function - Using nekolabs API (no token needed)
async function generateVideoNekolabs(prompt, duration = "8", ratio = "16:9") {
  try {
    console.log("[🔵 NEKOLABS API] Using nekolabs for veo-3-fast");

    // Step 1: Create video task
    const createUrl = `https://api.nekolabs.my.id/ai/veo-3-fast/create?prompt=${encodeURIComponent(prompt)}&ratio=${encodeURIComponent(ratio)}&duration=${encodeURIComponent(duration)}&audio=true`;

    const { data: createResponse } = await axiosInstance.get(createUrl);

    if (
      !createResponse.success ||
      !createResponse.result ||
      !createResponse.result.id
    ) {
      throw new Error("Failed to create video task");
    }

    const taskId = createResponse.result.id;
    console.log(`[✅] Task created - ID: ${taskId}`);
    console.log(`[2️⃣] Polling for completion...`);

    // Step 2: Poll for completion
    let attempts = 0;
    const maxAttempts = 180; // 3 minutes

    while (attempts < maxAttempts) {
      await new Promise((res) => setTimeout(res, 2000)); // Wait 2 seconds

      const getUrl = `https://api.nekolabs.my.id/ai/veo-3-fast/get?id=${taskId}`;

      try {
        const { data: statusResponse } = await axiosInstance.get(getUrl, {
          timeout: 10000,
        });

        if (statusResponse.success && statusResponse.result) {
          const status = statusResponse.result.status;
          const result = statusResponse.result;

          // Check for succeeded status
          if (status === "succeeded" || status === "completed") {
            const videoUrl =
              result.output ||
              result.videoUrl ||
              result.url ||
              result.video ||
              result.outputUrl;

            if (videoUrl) {
              console.log("[✅] Video generation succeeded!");
              console.log(`[📹] Video URL: ${videoUrl}`);
              return {
                success: true,
                videoUrl: videoUrl,
                model: "veo-3-fast",
                prompt: prompt,
                duration: duration,
                ratio: ratio,
                provider: "nekolabs",
              };
            } else {
              if (attempts > 30) {
                throw new Error(
                  "Video succeeded but no output URL after 60 seconds",
                );
              }
            }
          } else if (status === "failed" || status === "error") {
            const errorMsg = result.error || "Video generation failed";
            throw new Error(errorMsg);
          }

          // Still processing
          if (attempts % 5 === 0 && attempts > 0) {
            console.log(
              `[⏳] Still processing... (${attempts * 2}s) - Status: ${status}`,
            );
          }
        }
      } catch (error) {
        // Handle 500 errors with retry
        if (error.response && error.response.status === 500) {
          console.log(`[⚠️] API error 500, retrying...`);
        } else if (error.code === "ECONNABORTED") {
          console.log(`[⚠️] Request timeout, retrying...`);
        } else if (error.response) {
          throw new Error(`API error: ${error.response.status}`);
        } else if (!error.message.includes("succeeded but no output")) {
          throw error;
        }
      }

      attempts++;
    }

    throw new Error("Video generation timeout (3 minutes)");
  } catch (error) {
    console.error("[❌ NEKOLABS] Error:", error.message);
    throw error;
  }
}

// VEO-3.1-FAST Function - Using Hugging Face API (token required)
async function generateVideoVeo31(prompt, duration = "8", ratio = "16:9") {
  try {
    if (!hfVeo31) {
      throw new Error(
        "veo-3.1-fast requires Hugging Face token. Please add HF_TOKEN_Veo3_1 to environment variables. Get token from: https://huggingface.co/settings/tokens",
      );
    }

    console.log("[🟢 HUGGING FACE API] Using Hugging Face for veo-3.1-fast");

    const modelId = "akhaliq/veo3.1-fast";

    console.log("[2️⃣] Calling Hugging Face API...");
    console.log(`[📝] Prompt: ${prompt.substring(0, 50)}...`);

    // Call text-to-video endpoint with error handling
    let response;
    try {
      response = await hfVeo31.textToVideo({
        model: modelId,
        inputs: prompt,
        parameters: {
          duration: parseInt(duration),
          aspect_ratio: ratio,
        },
        provider: "fal-ai",
      });
    } catch (apiError) {
      console.error("[❌ API CALL ERROR]:", apiError);

      // Check if it's a JSON parse error
      if (apiError.message && apiError.message.includes("not valid JSON")) {
        throw new Error(
          "veo-3.1-fast model is currently unavailable or not accessible. Please use veo-3-fast instead, or try again later.",
        );
      }

      // Check for model not found
      if (
        apiError.message &&
        (apiError.message.includes("404") ||
          apiError.message.includes("not found"))
      ) {
        throw new Error(
          "veo-3.1-fast model not found on Hugging Face. Please use veo-3-fast which is always available.",
        );
      }

      throw apiError;
    }

    console.log("[✅] Video generation completed!");

    if (response) {
      // Convert blob to buffer
      const videoBuffer = Buffer.from(await response.arrayBuffer());
      const filename = `veo31_${Date.now()}.mp4`;

      // Save video to public/videos directory
      const videosDir = path.join(__dirname, "public", "videos");
      const filepath = path.join(videosDir, filename);

      // Create videos directory if it doesn't exist
      if (!fs.existsSync(videosDir)) {
        fs.mkdirSync(videosDir, { recursive: true });
      }

      // Save video file
      fs.writeFileSync(filepath, videoBuffer);

      const videoUrl = `/videos/${filename}`;
      console.log(`[📹] Video saved: ${videoUrl}`);

      return {
        success: true,
        videoUrl: videoUrl,
        model: "veo-3.1-fast",
        prompt: prompt,
        duration: duration,
        ratio: ratio,
        filename: filename,
        provider: "huggingface-veo31",
      };
    }

    throw new Error("No video data received from Hugging Face API");
  } catch (error) {
    console.error("[❌ HUGGING FACE VEO-3.1] Error:", error.message);
    console.error("[❌ Full error:]", error);

    if (error.message.includes("HF_TOKEN") || error.message.includes("token")) {
      throw new Error(
        "veo-3.1-fast requires HF_TOKEN_Veo3_1. Please check environment variables in Vercel dashboard.",
      );
    }

    if (
      error.message.includes("401") ||
      error.message.includes("unauthorized")
    ) {
      throw new Error(
        "Invalid Hugging Face token. Please check HF_TOKEN_Veo3_1 is correct in Vercel environment variables.",
      );
    }

    if (error.message.includes("rate limit")) {
      throw new Error(
        "Hugging Face API rate limit exceeded. Please try veo-3-fast instead or wait a few minutes.",
      );
    }

    if (
      error.message.includes("unavailable") ||
      error.message.includes("not found")
    ) {
      throw error;
    }

    // Generic error with helpful message
    throw new Error(
      `veo-3.1-fast error: ${error.message}. Try using veo-3-fast which is always available.`,
    );
  }
}

// SORA-2 Function - Using Hugging Face API (token required)
async function generateVideoSora2(prompt, duration = "8", ratio = "16:9") {
  try {
    if (!hfSora2) {
      throw new Error(
        "sora-2 requires Hugging Face token. Please add HF_TOKEN_Sora_2 to environment variables. Get token from: https://huggingface.co/settings/tokens",
      );
    }

    console.log("[🟣 HUGGING FACE API] Using Hugging Face for sora-2");

    const modelId = "akhaliq/sora-2";

    console.log("[2️⃣] Calling Hugging Face API...");
    console.log(`[📝] Prompt: ${prompt.substring(0, 50)}...`);

    // Call text-to-video endpoint with error handling
    let response;
    try {
      response = await hfSora2.textToVideo({
        model: modelId,
        inputs: prompt,
        parameters: {
          duration: parseInt(duration),
          aspect_ratio: ratio,
        },
        provider: "fal-ai",
      });
    } catch (apiError) {
      console.error("[❌ API CALL ERROR]:", apiError);

      // Check if it's a JSON parse error
      if (apiError.message && apiError.message.includes("not valid JSON")) {
        throw new Error(
          "sora-2 model is currently unavailable or not accessible. Please use veo-3-fast instead, or try again later.",
        );
      }

      // Check for model not found
      if (
        apiError.message &&
        (apiError.message.includes("404") ||
          apiError.message.includes("not found"))
      ) {
        throw new Error(
          "sora-2 model not found on Hugging Face. Please use veo-3-fast which is always available.",
        );
      }

      throw apiError;
    }

    console.log("[✅] Video generation completed!");

    if (response) {
      // Convert blob to buffer
      const videoBuffer = Buffer.from(await response.arrayBuffer());
      const filename = `sora2_${Date.now()}.mp4`;

      // Save video to public/videos directory
      const videosDir = path.join(__dirname, "public", "videos");
      const filepath = path.join(videosDir, filename);

      // Create videos directory if it doesn't exist
      if (!fs.existsSync(videosDir)) {
        fs.mkdirSync(videosDir, { recursive: true });
      }

      // Save video file
      fs.writeFileSync(filepath, videoBuffer);

      const videoUrl = `/videos/${filename}`;
      console.log(`[📹] Video saved: ${videoUrl}`);

      return {
        success: true,
        videoUrl: videoUrl,
        model: "sora-2",
        prompt: prompt,
        duration: duration,
        ratio: ratio,
        filename: filename,
        provider: "huggingface-sora2",
      };
    }

    throw new Error("No video data received from Hugging Face API");
  } catch (error) {
    console.error("[❌ HUGGING FACE SORA-2] Error:", error.message);
    console.error("[❌ Full error:]", error);

    if (error.message.includes("HF_TOKEN") || error.message.includes("token")) {
      throw new Error(
        "sora-2 requires HF_TOKEN_Sora_2. Please check environment variables in Vercel dashboard.",
      );
    }

    if (
      error.message.includes("401") ||
      error.message.includes("unauthorized")
    ) {
      throw new Error(
        "Invalid Hugging Face token. Please check HF_TOKEN_Sora_2 is correct in Vercel environment variables.",
      );
    }

    if (error.message.includes("rate limit")) {
      throw new Error(
        "Hugging Face API rate limit exceeded. Please try veo-3-fast instead or wait a few minutes.",
      );
    }

    if (
      error.message.includes("unavailable") ||
      error.message.includes("not found")
    ) {
      throw error;
    }

    // Generic error with helpful message
    throw new Error(
      `sora-2 error: ${error.message}. Try using veo-3-fast which is always available.`,
    );
  }
}

// Main video generation function - routes to appropriate API
async function generateVideo(
  model = "veo-3-fast",
  prompt,
  duration = "8",
  ratio = "16:9",
) {
  if (!prompt) throw new Error("Prompt is required");

  console.log("[1️⃣] Creating video task...");
  console.log(`[🤖] Model: ${model}`);
  console.log(`[📝] Prompt: ${prompt}`);
  console.log(`[⏱️] Duration: ${duration}s`);
  console.log(`[📐] Ratio: ${ratio}`);

  // Route to appropriate API based on model
  if (model === "veo-3.1-fast") {
    return await generateVideoVeo31(prompt, duration, ratio);
  } else if (model === "sora-2") {
    return await generateVideoSora2(prompt, duration, ratio);
  } else {
    // Default to veo-3-fast using nekolabs
    return await generateVideoNekolabs(prompt, duration, ratio);
  }
}

// API endpoint untuk generate video
app.post("/api/generate", async (req, res) => {
  try {
    const {
      model = "veo-3-fast",
      prompt,
      duration = "8",
      ratio = "16:9",
    } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    // Check if model requires token but token not available
    if (model === "veo-3.1-fast" && !hasVeo31Token) {
      return res.status(400).json({
        error:
          "veo-3.1-fast requires Hugging Face API token. Please add HF_TOKEN_Veo3_1 to .env file or use veo-3-fast (no token needed).",
        needsToken: true,
        tokenUrl: "https://huggingface.co/settings/tokens",
      });
    }

    if (model === "sora-2" && !hasSora2Token) {
      return res.status(400).json({
        error:
          "sora-2 requires Hugging Face API token. Please add HF_TOKEN_Sora_2 to .env file or use veo-3-fast (no token needed).",
        needsToken: true,
        tokenUrl: "https://huggingface.co/settings/tokens",
      });
    }

    console.log(`\n${"=".repeat(60)}`);
    console.log(`[📝 NEW REQUEST]`);
    console.log(`Model: ${model}`);
    console.log(`Prompt: "${prompt}"`);
    console.log(`Duration: ${duration}s`);
    console.log(`Ratio: ${ratio}`);
    const providerName =
      model === "veo-3.1-fast"
        ? "Hugging Face (VEO-3.1)"
        : model === "sora-2"
          ? "Hugging Face (Sora-2)"
          : "Nekolabs";
    console.log(`Provider: ${providerName}`);
    console.log(`${"=".repeat(60)}\n`);

    // Generate video
    const result = await generateVideo(model, prompt, duration, ratio);

    console.log("\n[🎉 SUCCESS] Video generated!");
    console.log(`Provider: ${result.provider}`);
    console.log(`Video URL: ${result.videoUrl}\n`);

    res.json({ success: true, data: result });
  } catch (error) {
    console.error(
      "\n[❌ ERROR] Failed to generate video:",
      error.message,
      "\n",
    );
    res.status(500).json({
      error: error.message || "Failed to generate video",
      success: false,
    });
  }
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "Server is running",
    apis: {
      nekolabs: {
        status: "available",
        model: "veo-3-fast",
        requiresToken: false,
        endpoint: "https://api.nekolabs.my.id",
      },
      huggingface_veo31: {
        status: hasVeo31Token ? "available" : "token_required",
        model: "veo-3.1-fast",
        requiresToken: true,
        tokenConfigured: hasVeo31Token,
        tokenUrl: "https://huggingface.co/settings/tokens",
      },
      huggingface_sora2: {
        status: hasSora2Token ? "available" : "token_required",
        model: "sora-2",
        requiresToken: true,
        tokenConfigured: hasSora2Token,
        tokenUrl: "https://huggingface.co/settings/tokens",
      },
    },
    models: [
      {
        id: "veo-3-fast",
        provider: "nekolabs",
        requiresToken: false,
        status: "available",
      },
      {
        id: "veo-3.1-fast",
        provider: "huggingface",
        requiresToken: true,
        status: hasVeo31Token ? "available" : "needs_token",
      },
      {
        id: "sora-2",
        provider: "huggingface",
        requiresToken: true,
        status: hasSora2Token ? "available" : "needs_token",
      },
    ],
    version: "3.2.0",
  });
});

// Serve index.html
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Clean up old videos (only HF videos stored locally)
setInterval(
  () => {
    const videosDir = path.join(__dirname, "public", "videos");
    if (fs.existsSync(videosDir)) {
      const files = fs.readdirSync(videosDir);
      const now = Date.now();
      const oneHour = 60 * 60 * 1000;

      files.forEach((file) => {
        const filepath = path.join(videosDir, file);
        const stats = fs.statSync(filepath);
        if (now - stats.mtimeMs > oneHour) {
          fs.unlinkSync(filepath);
          console.log(`[🗑️] Cleaned up old video: ${file}`);
        }
      });
    }
  },
  60 * 60 * 1000,
); // Every hour

// Start server (Railway doesn't need conditional listening)
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════╗
║   🚀 AI Video Generator Server Started       ║
║                                               ║
║   Port: ${PORT}                                    ║
║   URL: http://localhost:${PORT}                   ║
║   Mode: Triple API (Multi Provider)          ║
║                                               ║
║   Status: ✅ Ready to generate videos!        ║
╚═══════════════════════════════════════════════╝

🎯 Available Models:

📦 veo-3-fast
   Provider: Nekolabs API
   Token: ❌ Not required (FREE!)
   Status: ✅ Ready
   Speed: ⚡ Fast (1-2 minutes)

📦 veo-3.1-fast
   Provider: Hugging Face API (fal-ai)
   Token: ${hasVeo31Token ? "✅ Configured (HF_TOKEN_Veo3_1)" : "⚠️  Required (HF_TOKEN_Veo3_1)"}
   Status: ${hasVeo31Token ? "✅ Ready" : "⚠️  Add token to .env"}
   Speed: 🚀 Fast (1-3 minutes)
   Quality: ⭐ Latest VEO model

📦 sora-2
   Provider: Hugging Face API (fal-ai)
   Token: ${hasSora2Token ? "✅ Configured (HF_TOKEN_Sora_2)" : "⚠️  Required (HF_TOKEN_Sora_2)"}
   Status: ${hasSora2Token ? "✅ Ready" : "⚠️  Add token to .env"}
   Speed: 🚀 Fast (1-3 minutes)
   Quality: ⭐⭐ OpenAI Sora-2

📖 How to use:
   1. Open http://localhost:${PORT} in your browser
   2. Select model:
      • veo-3-fast → No setup needed! ✅
      • veo-3.1-fast → ${hasVeo31Token ? "Ready! ✅" : "Needs HF_TOKEN_Veo3_1 ⚠️"}
      • sora-2 → ${hasSora2Token ? "Ready! ✅" : "Needs HF_TOKEN_Sora_2 ⚠️"}
   3. Enter your video prompt
   4. Select duration (5, 8, or 10 seconds)
   5. Select aspect ratio (16:9, 9:16, 1:1, 4:3)
   6. Click "Generate Video"
   7. Wait 1-3 minutes
   8. Download your video!

${
  !hasVeo31Token || !hasSora2Token
    ? `⚠️  Setup Instructions for Premium Models:
   1. Get free token: https://huggingface.co/settings/tokens
   2. Add to .env:
      ${!hasVeo31Token ? "HF_TOKEN_Veo3_1=hf_..." : ""}
      ${!hasSora2Token ? "HF_TOKEN_Sora_2=hf_..." : ""}
   3. Restart server
   4. Enjoy all 3 models!
`
    : ""
}
🔧 Settings:
   - Models: veo-3-fast (free) | veo-3.1-fast | sora-2
   - Duration: 5s, 8s, or 10s (default: 8s)
   - Ratio: 16:9, 9:16, 1:1, or 4:3
   - Providers: Nekolabs + Hugging Face (dual token)
   - Auto cleanup: Local videos deleted after 1 hour

💡 Quick Start:
   ✅ veo-3-fast: Ready now! (no setup)
   ${hasVeo31Token ? "✅" : "⏭️"} veo-3.1-fast: ${hasVeo31Token ? "Ready!" : "Add HF_TOKEN_Veo3_1"}
   ${hasSora2Token ? "✅" : "⏭️"} sora-2: ${hasSora2Token ? "Ready!" : "Add HF_TOKEN_Sora_2"}
`);
});

// Export app for compatibility
module.exports = app;
