// ==================== Constants & State ====================
const API_BASE_URL = window.location.origin;

let currentVideoData = null;

// ==================== DOM Elements ====================
const videoForm = document.getElementById("videoForm");
const generateBtn = document.getElementById("generateBtn");
const loadingSection = document.getElementById("loadingSection");
const resultSection = document.getElementById("resultSection");
const errorSection = document.getElementById("errorSection");
const inputSection = document.getElementById("inputSection");

const videoPlayer = document.getElementById("videoPlayer");
const videoSource = document.getElementById("videoSource");
const videoInfo = document.getElementById("videoInfo");
const downloadBtn = document.getElementById("downloadBtn");

const newVideoBtn = document.getElementById("newVideoBtn");
const retryBtn = document.getElementById("retryBtn");

const toast = document.getElementById("toast");
const toastMessage = document.getElementById("toastMessage");
const errorMessage = document.getElementById("errorMessage");

// ==================== Toast Notification ====================
function showToast(message, duration = 3000) {
  toastMessage.textContent = message;
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, duration);
}

// ==================== Section Management ====================
function showSection(section) {
  // Hide all sections
  inputSection.classList.add("section-hidden");
  loadingSection.classList.add("section-hidden");
  resultSection.classList.add("section-hidden");
  errorSection.classList.add("section-hidden");

  // Show requested section
  if (section) {
    section.classList.remove("section-hidden");
    section.scrollIntoView({ behavior: "smooth", block: "center" });
  }
}

// ==================== Form Submission ====================
videoForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const formData = new FormData(videoForm);
  const model = formData.get("model") || "veo-3-fast";
  const prompt = formData.get("prompt").trim();
  const duration = formData.get("duration") || "8";
  const ratio = formData.get("ratio") || "16:9";
  const audio = "true"; // Default audio enabled

  if (!prompt) {
    showToast("Please enter a video description");
    return;
  }

  try {
    // Show loading state
    generateBtn.classList.add("loading");
    showSection(loadingSection);

    showToast("⏳ Starting video generation...");

    // Make API request
    const response = await fetch(`${API_BASE_URL}/api/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        prompt,
        duration,
        ratio,
        audio,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      // Handle token requirement error specially
      if (data.needsToken) {
        const errorMsg = `${data.error}\n\nGet free token from: ${data.tokenUrl}`;
        throw new Error(errorMsg);
      }
      throw new Error(data.error || "Failed to generate video");
    }

    if (data.success && data.data) {
      currentVideoData = data.data;
      displayVideo(data.data);
      showToast("✅ Video ready!");
    } else {
      throw new Error("Invalid response from server");
    }
  } catch (error) {
    console.error("Error:", error);
    showError(error.message);
  } finally {
    generateBtn.classList.remove("loading");
  }
});

// ==================== Display Video ====================
function displayVideo(data) {
  // Set video source
  const videoUrl = data.videoUrl || data.video_url || data.url;

  if (!videoUrl) {
    showError("Video URL not found in response");
    return;
  }

  videoSource.src = videoUrl;
  videoPlayer.load();

  // Set download link
  downloadBtn.href = videoUrl;
  downloadBtn.download = `yinyang-video-${Date.now()}.mp4`;

  // Display video info
  let infoHTML = '<div style="display: grid; gap: 10px;">';

  if (data.model) {
    let provider = " (Nekolabs)";
    if (data.provider === "huggingface-veo31") {
      provider = " (Hugging Face - VEO-3.1)";
    } else if (data.provider === "huggingface-sora2") {
      provider = " (Hugging Face - Sora-2)";
    } else if (data.provider === "huggingface") {
      provider = " (Hugging Face)";
    }
    infoHTML += `<div><strong>Model:</strong> ${escapeHtml(data.model)}${provider}</div>`;
  }

  if (data.prompt) {
    infoHTML += `<div><strong>Prompt:</strong> ${escapeHtml(data.prompt)}</div>`;
  }

  if (data.duration) {
    infoHTML += `<div><strong>Duration:</strong> ${data.duration}s</div>`;
  }

  if (data.ratio) {
    infoHTML += `<div><strong>Aspect Ratio:</strong> ${data.ratio}</div>`;
  }

  if (data.provider) {
    let providerName = "Nekolabs";
    if (data.provider === "huggingface-veo31") {
      providerName = "Hugging Face (fal-ai) - VEO-3.1";
    } else if (data.provider === "huggingface-sora2") {
      providerName = "Hugging Face (fal-ai) - Sora-2";
    } else if (data.provider === "huggingface") {
      providerName = "Hugging Face (fal-ai)";
    }
    infoHTML += `<div><strong>Provider:</strong> ${providerName}</div>`;
  }

  if (data.audio) {
    infoHTML += `<div><strong>Audio:</strong> ${data.audio === "true" ? "Enabled" : "Disabled"}</div>`;
  }

  if (data.status) {
    infoHTML += `<div><strong>Status:</strong> ${data.status}</div>`;
  }

  if (data.id) {
    infoHTML += `<div><strong>Task ID:</strong> ${data.id}</div>`;
  }

  infoHTML += "</div>";
  videoInfo.innerHTML = infoHTML;

  // Show result section
  showSection(resultSection);
}

// ==================== Show Error ====================
// ==================== Error Handling ====================
function showError(message) {
  errorMessage.textContent = message;
  showSection(errorSection);
  showToast("Error: " + message.substring(0, 50) + "...", 5000);
}

// ==================== New Video Button ====================
newVideoBtn.addEventListener("click", () => {
  videoForm.reset();
  currentVideoData = null;
  videoSource.src = "";
  videoInfo.innerHTML = "";
  showSection(inputSection);
  window.scrollTo({ top: 0, behavior: "smooth" });
});

// ==================== Retry Button ====================
retryBtn.addEventListener("click", () => {
  showSection(inputSection);
  window.scrollTo({ top: 0, behavior: "smooth" });
});

// ==================== Helper Functions ====================
function escapeHtml(text) {
  const map = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

// ==================== Video Player Events ====================
videoPlayer.addEventListener("loadstart", () => {
  console.log("Video loading started...");
});

videoPlayer.addEventListener("canplay", () => {
  console.log("Video can play");
});

videoPlayer.addEventListener("error", (e) => {
  console.error("Video error:", e);
  showToast("⚠️ Error loading video. Please try downloading instead.", 5000);
});

// ==================== Download Button Enhancement ====================
downloadBtn.addEventListener("click", async (e) => {
  e.preventDefault();

  const videoUrl = downloadBtn.href;
  if (!videoUrl) {
    showToast("No video to download");
    return;
  }

  try {
    showToast("Starting download...");

    // Fetch the video
    const response = await fetch(videoUrl);
    if (!response.ok) throw new Error("Download failed");

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);

    // Create temporary link and trigger download
    const a = document.createElement("a");
    a.href = url;
    a.download = `video-${Date.now()}.mp4`;
    document.body.appendChild(a);
    a.click();

    // Cleanup
    setTimeout(() => {
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }, 100);

    showToast("Download complete!");
  } catch (error) {
    console.error("Download error:", error);
    // Fallback to direct link
    window.open(videoUrl, "_blank");
    showToast("Opening video in new tab...");
  }
});

// ==================== Keyboard Shortcuts ====================
document.addEventListener("keydown", (e) => {
  // Escape key to go back to input
  if (e.key === "Escape" && resultSection.style.display === "block") {
    newVideoBtn.click();
  }

  // Ctrl/Cmd + Enter to submit form
  if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
    if (inputSection.style.display !== "none") {
      videoForm.dispatchEvent(new Event("submit"));
    }
  }
});

// ==================== Auto-resize Textarea ====================
const promptTextarea = document.getElementById("prompt");
promptTextarea.addEventListener("input", function () {
  this.style.height = "auto";
  this.style.height = this.scrollHeight + "px";
});

// ==================== Form Validation ====================
promptTextarea.addEventListener("blur", function () {
  if (this.value.trim().length > 0 && this.value.trim().length < 10) {
    showToast("Tip: Be more descriptive for better results", 3000);
  }
});

// ==================== Smooth Scroll for Cards ====================
function addScrollAnimation() {
  const cards = document.querySelectorAll(".card");

  const observerOptions = {
    threshold: 0.1,
    rootMargin: "0px 0px -50px 0px",
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = "1";
        entry.target.style.transform = "translateY(0)";
      }
    });
  }, observerOptions);

  cards.forEach((card) => {
    card.style.opacity = "0";
    card.style.transform = "translateY(20px)";
    card.style.transition = "opacity 0.6s ease, transform 0.6s ease";
    observer.observe(card);
  });
}

// ==================== Loading Progress Animation ====================
function animateProgress() {
  const progressFill = document.querySelector(".progress-fill");
  if (progressFill) {
    progressFill.style.animation = "none";
    setTimeout(() => {
      progressFill.style.animation = "progress 2s ease-in-out infinite";
    }, 10);
  }
}

// ==================== Check Server Health ====================
async function checkServerHealth() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/health`);
    const data = await response.json();

    if (data.status === "ok") {
      console.log("Server is healthy");
      return true;
    }
  } catch (error) {
    console.error("Server health check failed:", error);
    showToast("Server connection issue. Please refresh the page.", 5000);
    return false;
  }
}

// ==================== Example Prompts ====================
const examplePrompts = [
  "a serene sunset over mountains with birds flying",
  "a woman relaxing on the beach",
  "a futuristic city with flying cars at night",
  "a peaceful forest with sunlight streaming through trees",
  "ocean waves crashing on a rocky shore",
  "a cat playing with a ball of yarn",
  "northern lights dancing in the night sky",
  "a busy street in Tokyo with neon lights",
];

// Add click-to-use example prompt feature
promptTextarea.addEventListener(
  "focus",
  function () {
    if (this.value.trim() === "") {
      const randomPrompt =
        examplePrompts[Math.floor(Math.random() * examplePrompts.length)];
      this.placeholder = `Example: ${randomPrompt}`;
    }
  },
  { once: true },
);

// ==================== Copy Video URL Feature ====================
function addCopyUrlButton() {
  if (!currentVideoData) return;

  const videoUrl =
    currentVideoData.videoUrl ||
    currentVideoData.video_url ||
    currentVideoData.url;
  if (!videoUrl) return;

  const copyBtn = document.createElement("button");
  copyBtn.className = "btn-secondary";
  copyBtn.style.flex = "0 1 auto";
  copyBtn.innerHTML = '<span class="btn-icon">📋</span> Copy URL';

  copyBtn.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(videoUrl);
      showToast("Video URL copied!");
      copyBtn.textContent = "Copied!";
      setTimeout(() => {
        copyBtn.textContent = "Copy URL";
      }, 2000);
    } catch (error) {
      console.error("Copy failed:", error);
      showToast("Failed to copy URL");
    }
  });

  const actionButtons = document.querySelector(".action-buttons");
  if (actionButtons && !document.querySelector(".btn-secondary[data-copy]")) {
    copyBtn.setAttribute("data-copy", "true");
    actionButtons.appendChild(copyBtn);
  }
}

// ==================== Initialize ====================
function init() {
  console.log("Video Generator initialized");

  // Add scroll animations
  addScrollAnimation();

  // Check server health
  checkServerHealth();

  // Show input section by default
  showSection(inputSection);

  // Focus on textarea
  setTimeout(() => {
    promptTextarea.focus();
  }, 500);
}

// ==================== Start Application ====================
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}

// ==================== Service Worker Registration (Optional) ====================
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    // Uncomment to enable service worker for offline support
    // navigator.serviceWorker.register('/sw.js')
    //     .then(reg => console.log('Service Worker registered'))
    //     .catch(err => console.log('Service Worker registration failed'));
  });
}

// ==================== Handle Visibility Change ====================
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    // Pause video when tab is hidden
    if (videoPlayer && !videoPlayer.paused) {
      videoPlayer.pause();
    }
  }
});

// ==================== Prevent Context Menu on Video ====================
videoPlayer.addEventListener("contextmenu", (e) => {
  // Allow default context menu for video controls
  // Uncomment to prevent right-click
  // e.preventDefault();
});

// ==================== Network Status Indicator ====================
window.addEventListener("online", () => {
  showToast("Connection restored", 2000);
});

window.addEventListener("offline", () => {
  showToast("No internet connection", 3000);
});

// ==================== Console Art ====================
console.log(`
╔═══════════════════════════════════════╗
║   AI Video Generator v1.0             ║
║   Modern • Fast • Simple              ║
╚═══════════════════════════════════════╝
`);
