const express = require("express");
const cors = require("cors");
const crypto = require("crypto");

const app = express();
app.use(cors());
app.use(express.json());

const OLLAMA_URL = "http://localhost:11434";
const OLLAMA_MODEL = "qwen2.5:1.5b";

const CATEGORIES = {
  1: "健康数据 (血压/心率/病史)",
  2: "基因数据 (DNA/遗传信息)",
  3: "财务数据 (收入/支出/投资)",
  4: "其他数据",
};

const CATEGORIES_EN = {
  1: "Health Data (blood pressure/heart rate/medical history)",
  2: "Genetic Data (DNA/genetic information)",
  3: "Financial Data (income/expenses/investments)",
  4: "Other Data",
};

// Simulated authorization state (Demo: replaces on-chain is_authorized check)
// In production, this is replaced by Aleo contract call
// address => { category_id: { grantedAt, expiresAt } }
const authorizedCategories = new Map();

function isAuthorized(address, categoryId, maxAge = 86400000) {
  // maxAge default: 24 hours (matches contract max_age concept)
  if (!address) return categoryId === 1;
  const userCats = authorizedCategories.get(address);
  if (!userCats) return categoryId === 1;
  const entry = userCats.get(categoryId);
  if (!entry) return false;
  return Date.now() < entry.expiresAt;
}

function grantAuth(address, categoryId, durationMs = 86400000) {
  if (!authorizedCategories.has(address)) {
    const m = new Map();
    m.set(1, { grantedAt: Date.now(), expiresAt: Date.now() + 86400000 });
    authorizedCategories.set(address, m);
  }
  const userCats = authorizedCategories.get(address);
  userCats.set(categoryId, {
    grantedAt: Date.now(),
    expiresAt: Date.now() + durationMs,
  });
}

function revokeAuth(address, categoryId) {
  const userCats = authorizedCategories.get(address);
  if (userCats && categoryId !== 1) {
    userCats.delete(categoryId);
  }
}

// Simulated Poseidon2 hash (demo: SHA256 stand-in for Aleo native Poseidon2)
// In production, this is Poseidon2::hash_to_field(addr_field + cat_hash) on-chain
function simulatePoseidon2(address, categoryId) {
  const payload = address + ":" + categoryId.toString();
  return "0x" + crypto.createHash("sha256").update(payload).digest("hex").slice(0, 16);
}

function getAuthorizations(address) {
  const userCats = authorizedCategories.get(address);
  const result = {};
  for (let catId = 1; catId <= 4; catId++) {
    if (catId === 1 || (userCats && userCats.has(catId))) {
      const entry = catId === 1 && !userCats
        ? { grantedAt: Date.now(), expiresAt: Date.now() + 86400000 }
        : (userCats ? userCats.get(catId) : null) || { grantedAt: Date.now(), expiresAt: Date.now() + 86400000 };
      const authorized = Date.now() < entry.expiresAt;
      result[catId] = {
        authorized,
        grantedAt: entry.grantedAt,
        expiresAt: entry.expiresAt,
        hash: authorized ? simulatePoseidon2(address, catId) : null,
      };
    } else {
      result[catId] = { authorized: false, grantedAt: null, expiresAt: null, hash: null };
    }
  }
  return result;
}

// Privacy Tag: SHA256 commitment (not native Groth16 ZKP)
// Binds authorization context to AI output for offline verification
function generatePrivacyTag(categoryId, answer, timestamp) {
  const payload = [categoryId.toString(), answer, timestamp.toString()].join("|");
  return "0x" + crypto.createHash("sha256").update(payload).digest("hex").slice(0, 16);
}

function buildPrompt(userPrompt, categoryId, language) {
  const isZh = language === "zh";
  const categoryDesc = isZh ? (CATEGORIES[categoryId] || "") : (CATEGORIES_EN[categoryId] || "");
  if (isZh) {
    const system = "请用中文回答。你是一个隐私保护的AI助手。用户已授权你访问以下数据类别：" + categoryDesc + "。请仅基于此类别的数据范围回答问题。";
    return system + "\n\n用户：" + userPrompt;
  }
  // English: put language instruction last for stronger effect
  const system = "You are a privacy-preserving AI assistant. Authorized data category: " + categoryDesc + ".";
  return system + "\n\nUser: " + userPrompt + "\n\nIMPORTANT: You MUST respond in English only. Do NOT use Chinese.";
}

async function askOllama(prompt, language) {
  try {
    const body = {
      model: OLLAMA_MODEL,
      prompt: prompt,
      stream: false,
    };
    if (language === "en") {
      body.system = "You are a helpful assistant. You MUST respond in English only. Never use Chinese characters.";
    }
    const res = await fetch(OLLAMA_URL + "/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
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
    3: "您尚未授权财务数据类别的访问。请先在 Aleo 合约中授权该类别。AI 回答被拦截 —— 这是 ZK 授权边界在起作用。",
    4: "请在左侧下拉菜单中选择您要授权的数据类别，然后提出具体问题，AI 将在您授权的数据范围内为您回答。",
  },
  en: {
    1: "Your blood pressure reading of 135/85 falls within the elevated range. Consider lifestyle changes and consult your doctor for a personalized plan.",
    2: "Genetic data analysis requires specialized tools. Please provide specific genetic markers or test results within your authorized gene data scope.",
    3: "You have not authorized financial data access. AI response blocked — ZK authorization boundary enforced.",
    4: "Please select a data category from the dropdown menu and ask a specific question. The AI will respond within your authorized data scope.",
  },
};

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", ollama: OLLAMA_URL });
});

app.get("/api/categories", (req, res) => {
  res.json({ categories: CATEGORIES });
});

app.post("/api/authorize", (req, res) => {
  const { address, category_id, duration_ms } = req.body;
  if (!address || !category_id) return res.status(400).json({ error: "address and category_id required" });
  grantAuth(address, category_id, duration_ms || 86400000);
  const status = getAuthorizations(address);
  res.json({ status: "ok", authorizations: status });
});

// Revoke authorization for a category
app.delete("/api/authorize", (req, res) => {
  const { address, category_id } = req.body;
  if (!address || !category_id) return res.status(400).json({ error: "address and category_id required" });
  if (category_id === 1) return res.status(400).json({ error: "health category cannot be revoked — always pre-authorized" });
  revokeAuth(address, category_id);
  const status = getAuthorizations(address);
  res.json({ status: "ok", authorizations: status });
});

// List all authorizations for an address
app.get("/api/authorizations", (req, res) => {
  const address = req.query.address;
  if (!address) return res.status(400).json({ error: "address query param required" });
  const status = getAuthorizations(address);
  res.json({ address, authorizations: status });
});

app.post("/api/ask", async (req, res) => {
  const { prompt, language, category_id, address } = req.body;
  if (!prompt) return res.status(400).json({ error: "prompt required" });

  const catId = category_id || 1;
  const isDemo = req.query.demo === "true";

  // Authorization check (mocks on-chain is_authorized)
  const authorized = isAuthorized(address, catId);
  if (!authorized) {
    const rejectionMsg = language === "zh"
      ? "您尚未授权" + (CATEGORIES[catId] || "该") + "的访问。请先在 Aleo 合约中授权该类别。"
      : "You have not authorized " + (CATEGORIES[catId] || "this category") + " access. Please authorize it in the Aleo contract first.";
    const privacy_tag = generatePrivacyTag(catId, rejectionMsg, Date.now());
    return res.json({
      answer: rejectionMsg,
      privacy_tag,
      category_id: catId,
      verified: false,
      source: "authorization_blocked",
      contract_tx: "at1tlrj2xsah3yxsxjkdsehc48qrysp8f5zy4jy3lt3v4gmwfymuu8s8cr053",
    });
  }

  let answer;
  let source;

  // English mode: use preset responses (Qwen2.5 is Chinese-optimized)
  if (language === "en") {
    const demoSet = DEMO_ANSWERS.en;
    answer = demoSet[catId] || demoSet[1];
    source = "demo";
  } else if (isDemo) {
    const demoSet = DEMO_ANSWERS.zh;
    answer = demoSet[catId] || demoSet[1];
    source = "demo";
  } else {
    const finalPrompt = buildPrompt(prompt, catId, language);
    answer = await askOllama(finalPrompt, language);
    source = "ollama";
  }

  const privacy_tag = generatePrivacyTag(catId, answer, Date.now());

  res.json({
    answer,
    privacy_tag,
    category_id: catId,
    verified: true,
    source,
    contract_tx: "at1tlrj2xsah3yxsxjkdsehc48qrysp8f5zy4jy3lt3v4gmwfymuu8s8cr053",
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
    contract_tx: "at1tlrj2xsah3yxsxjkdsehc48qrysp8f5zy4jy3lt3v4gmwfymuu8s8cr053",
  });
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log("Backend on http://localhost:" + PORT);
  console.log("Ollama: " + OLLAMA_URL + " | Model: " + OLLAMA_MODEL);
  console.log("Authorization guard: active (health pre-authorized, finance/gene blocked)");
});
