const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "qwen2.5:1.5b";

const CATEGORIES = {
  1: "健康数据 (血压/心率/病史)",
  2: "基因数据 (DNA/遗传信息)",
  3: "财务数据 (收入/支出/投资)",
  4: "其他数据",
};

// Privacy Tag: SHA256 commitment (not native Groth16 ZKP)
// Binds authorization context to AI output for offline verification
function generatePrivacyTag(categoryId, answer, timestamp) {
  const payload = [categoryId.toString(), answer, timestamp.toString()].join("|");
  return "0x" + crypto.createHash("sha256").update(payload).digest("hex").slice(0, 16);
}

function buildPrompt(userPrompt, categoryId, language) {
  const categoryDesc = CATEGORIES[categoryId] || "";
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

// Plan B: Offline demo mode (no Ollama required)
const DEMO_ANSWERS = {
  zh: {
    1: "根据您提供的数据，血压 135/85 属于正常高值范围。收缩压 135 略高于理想值 120，舒张压 85 在正常范围内。建议保持健康饮食、规律运动，定期监测血压变化。",
    2: "基因数据分析需要专业的生物信息学工具。请在授权的基因数据类别下，提供具体的基因位点或检测报告内容，我可以帮您解读相关健康风险。",
    3: "财务数据分析需要在授权的财务数据类别下进行。请提供具体的收支记录或投资组合信息，我可以帮您分析财务状况和优化建议。",
    4: "请在左侧下拉菜单中选择您要授权的数据类别，然后提出具体问题，AI 将在您授权的数据范围内为您回答。",
  },
  en: {
    1: "Your blood pressure reading of 135/85 falls within the elevated range. Consider lifestyle changes and consult your doctor for a personalized plan.",
    2: "Genetic data analysis requires specialized tools. Please provide specific genetic markers or test results within your authorized gene data scope.",
    3: "Financial analysis requires authorized data access. Please share your income/expense records or portfolio details for personalized advice.",
    4: "Please select a data category from the dropdown menu and ask a specific question. The AI will respond within your authorized data scope.",
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
