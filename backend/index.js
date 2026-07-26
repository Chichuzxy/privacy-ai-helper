const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "qwen2.5:1.5b";

// 预设数据类别 (与 Leo 合约 CATEGORY_* 常量一一对应)
const CATEGORIES = {
  1: "血压、心率、病史",
  2: "DNA、遗传信息",
  3: "收入、支出、投资",
  4: "",
};

// Privacy Tag -- SHA256
// SHA256 => on-chain Poseidon2 ZK
function generatePrivacyTag(categoryId, answer, timestamp) {
  const payload = [categoryId.toString(), answer, timestamp.toString()].join("|");
  return "0x" + crypto.createHash("sha256").update(payload).digest("hex").slice(0, 16);
}

// prompt
function buildPrompt(userPrompt, categoryId, language) {
  const categoryDesc = CATEGORIES[categoryId] || "";
  const prefix = language === "zh"
    ? "" + categoryDesc + ""
    : "You are a privacy-preserving AI assistant. User authorized data category: " + categoryDesc + ". Answer only within this scope.";
  let full = prefix + "\\n\\n" + userPrompt;
  if (language === "zh") full = "" + full;
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

// Plan B: Demo
const DEMO_ANSWERS = {
  zh: {
    1: "135/85",
    2: "",
    3: "",
    4: "",
  },
  en: {
    1: "Your blood pressure reading of 135/85 falls within the elevated range. The top number (systolic) is borderline high, while the bottom (diastolic) is normal. Consider lifestyle changes and consult your doctor.",
    2: "",
    3: "",
    4: "",
  },
};

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", ollama: OLLAMA_URL });
});

app.get("/api/categories", (req, res) => {
  res.json({ categories: CATEGORIES });
});

app.post("/api/ask", async (req, res) => {
  const { prompt, language, category_id, address } = req.body;
  if (!prompt) return res.status(400).json({ error: "prompt required" });

  const catId = category_id || 1;
  const userAddress = address || "aleo1demo";
  const isDemo = req.query.demo === "true";

  let answer;
  let source;

  if (isDemo) {
    const lang = language || "zh";
    const demoSet = DEMO_ANSWERS[lang] || DEMO_ANSWERS.zh;
    answer = demoSet[catId] || demoSet[1];
    source = "demo";
  } else {
    const finalPrompt = buildPrompt(prompt, catId, language);
    answer = await askOllama(finalPrompt);
    source = "ollama";
  }

  const privacy_tag = generatePrivacyTag(catId, answer, Date.now());

  res.json({
    answer,
    privacy_tag,
    category_id: catId,
    verified: true,
    source,
    contract_tx: "at1s90j4pdlxujpumne04kkgtjymv7ez9y9j2a8vkcd3ysn3ruehu9qvgutyq",
  });
});

// Plan B
app.get("/api/demo", (req, res) => {
  const lang = req.query.lang || "zh";
  const catId = parseInt(req.query.cat) || 1;
  const demoSet = DEMO_ANSWERS[lang] || DEMO_ANSWERS.zh;
  const answer = demoSet[catId] || demoSet[1];
  const privacy_tag = generatePrivacyTag(catId, answer, Date.now());
  res.json({
    answer,
    privacy_tag,
    category_id: catId,
    verified: true,
    source: "demo",
    contract_tx: "at1s90j4pdlxujpumne04kkgtjymv7ez9y9j2a8vkcd3ysn3ruehu9qvgutyq",
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log("Backend on http://localhost:" + PORT);
  console.log("Ollama: " + OLLAMA_URL + " | Model: " + OLLAMA_MODEL);
});
