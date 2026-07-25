const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "qwen2.5:1.5b";

// 支持的数据类别
const DATA_CATEGORIES = {
  health: "健康数据 (血压/心率/病史)",
  finance: "财务数据 (收入/支出/投资)",
  social: "社交数据 (通讯录/聊天记录)",
  genomic: "基因数据 (DNA/遗传信息)",
};

// ZK 证明生成（Demo 用 SHA256，生产环境对接 Leo 链上验证）
function generateZKProof(prompt, category, address) {
  const payload = [prompt, category, address, Date.now().toString()].join("|");
  return "0x" + crypto.createHash("sha256").update(payload).digest("hex");
}

// 构建隐私感知的 prompt
function buildPrompt(userPrompt, category, language) {
  const categoryDesc = DATA_CATEGORIES[category] || category;
  const prefix = language === "zh"
    ? "你是一个隐私保护的AI助手。用户已授权你访问以下数据类别：" + categoryDesc + "。请仅基于此类别的数据范围回答问题。"
    : "You are a privacy-preserving AI assistant. User authorized data category: " + categoryDesc + ". Answer only within this scope.";
  let full = prefix + "\\n\\n用户：" + userPrompt;
  if (language === "zh") full = "请用中文回答。" + full;
  return full;
}

async function askOllama(prompt) {
  try {
    const res = await fetch(OLLAMA_URL + "/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt: prompt,
        stream: false,
      }),
      signal: AbortSignal.timeout(120000),
    });
    const data = await res.json();
    return data.response || "[Ollama returned empty]";
  } catch (e) {
    return "[AI Fallback] " + e.message + " | Prompt: " + prompt;
  }
}

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", ollama: OLLAMA_URL });
});

app.get("/api/categories", (req, res) => {
  res.json({ categories: DATA_CATEGORIES });
});

app.post("/api/ask", async (req, res) => {
  const { prompt, language, category, address } = req.body;
  if (!prompt) return res.status(400).json({ error: "prompt required" });

  const dataCategory = category || "health";
  const userAddress = address || "aleo1demo";
  const finalPrompt = buildPrompt(prompt, dataCategory, language);
  const answer = await askOllama(finalPrompt);
  const zk_proof = generateZKProof(prompt, dataCategory, userAddress);

  res.json({
    answer,
    zk_proof,
    category: dataCategory,
    verified: true,
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log("Backend on http://localhost:" + PORT);
  console.log("Ollama: " + OLLAMA_URL + " | Model: " + OLLAMA_MODEL);
});
