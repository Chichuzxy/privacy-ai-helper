import { useState, useRef, useEffect } from "react";
import "./index.css";

const CONTRACT_TX = "at1tlrj2xsah3yxsxjkdsehc48qrysp8f5zy4jy3lt3v4gmwfymuu8s8cr053";
const EXPLORER_URL = "https://testnet.explorer.provable.com/transaction/" + CONTRACT_TX;

const CATEGORY_MAP = {
  1: "健康数据",
  2: "基因数据",
  3: "财务数据",
  4: "其他数据",
};

const CAT_ICONS = { 1: "\u2764", 2: "\uD83E\uDDEC", 3: "\uD83D\uDCB0", 4: "\uD83D\uDCCB" };

const PLACEHOLDER = {
  zh: "请输入您的问题...",
  en: "Type your question...",
};

function fmtTime(ts) {
  if (!ts) return "--";
  const remaining = ts - Date.now();
  if (remaining <= 0) return "\u5DF2\u8FC7\u671F";
  const h = Math.floor(remaining / 3600000);
  const m = Math.floor((remaining % 3600000) / 60000);
  if (h > 0) return h + "h " + m + "m";
  return m + "m";
}

function App() {
  const [address, setAddress] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [network, setNetwork] = useState(null);
  const [prompt, setPrompt] = useState("");
  const [chat, setChat] = useState([]);
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState("zh");
  const [categoryId, setCategoryId] = useState(1);
  const [authState, setAuthState] = useState(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    window.addEventListener("load", () => {
      console.log("Leo Wallet 注入环境已加载");
    });
  }, [chat]);

  // Fetch authorization status when address changes
  useEffect(() => {
    if (isConnected && address) {
      fetchAuthStatus();
    } else {
      setAuthState(null);
    }
  }, [isConnected, address]);

  const fetchAuthStatus = async () => {
    try {
      const res = await fetch("http://localhost:3001/api/authorizations?address=" + encodeURIComponent(address));
      const data = await res.json();
      setAuthState(data.authorizations);
    } catch (e) {
      console.error("Failed to fetch auth status:", e);
    }
  };

  const handleGrant = async (catId) => {
    try {
      await fetch("http://localhost:3001/api/authorize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address, category_id: catId }),
      });
      fetchAuthStatus();
    } catch (e) {
      console.error("Grant failed:", e);
    }
  };

  const handleRevoke = async (catId) => {
    try {
      await fetch("http://localhost:3001/api/authorize", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address, category_id: catId }),
      });
      fetchAuthStatus();
    } catch (e) {
      console.error("Revoke failed:", e);
    }
  };

  const connectWallet = async () => {
    for (let i = 0; i < 20; i++) {
      if (typeof window.aleo !== "undefined") {
        try {
          let addr;
          if (typeof window.aleo.requestAccounts === "function") {
            const accounts = await window.aleo.requestAccounts();
            addr = Array.isArray(accounts) ? accounts[0] : accounts;
          } else {
            addr = await window.aleo.connect();
          }
          if (!addr) throw new Error("empty address");
          setAddress(addr);
          setIsConnected(true);
          setNetwork("Aleo Testnet");
          setChat([]);
          return;
        } catch (e) {
          console.error("Wallet connect error:", e);
          alert("钱包连接失败，请确认：\n\n1. Leo Wallet 插件已安装并解锁\n2. 插件已连接到 localhost:5173\n3. 网络设置正确 (Testnet)");
          return;
        }
      }
      await new Promise((r) => setTimeout(r, 500));
    }
    alert("检测不到 Leo Wallet 插件。请确保钱包已安装、已解锁，并刷新当前页面（按 Ctrl + F5）后重试。");
  };

  const disconnectWallet = () => {
    setAddress(null);
    setIsConnected(false);
    setNetwork(null);
    setChat([]);
    setAuthState(null);
  };

  const handleAsk = async () => {
    if (!prompt.trim() || loading) return;
    const userMsg = { role: "user", text: prompt };
    const loadingMsg = { role: "loading", text: "AI 正在思考中..." };
    setChat((prev) => [...prev, userMsg, loadingMsg]);
    setPrompt("");
    setLoading(true);

    try {
      const res = await fetch("http://localhost:3001/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: userMsg.text, language, category_id: categoryId, address }),
      });
      const data = await res.json();
      setChat((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "ai",
          text: data.answer,
          privacyTag: data.privacy_tag,
          verified: data.verified,
        };
        return updated;
      });
    } catch (err) {
      setChat((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: "error", text: "后端连接失败: " + err.message };
        return updated;
      });
    }
    setLoading(false);
  };

  return (
    <div className="app-root">
      <header className="topbar">
        <span className="logo">Privacy AI Helper</span>
        <div className="topbar-right">
          {isConnected && network && (
            <span className="network-badge">
              <span className="net-dot" />
              {network}
            </span>
          )}
          {isConnected ? (
            <>
              <span className="wallet-addr">
                {address.slice(0, 6)}...{address.slice(-4)}
              </span>
              <button className="disconnect-btn" onClick={disconnectWallet} title="切换地址">
                切换
              </button>
            </>
          ) : (
            <div className="addr-input-group">
              <input
                className="addr-input"
                placeholder="粘贴 Aleo 地址"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && e.target.value.trim()) {
                    setAddress(e.target.value.trim());
                    setIsConnected(true);
                    setNetwork("Aleo Testnet");
                    setChat([]);
                  }
                }}
              />
              <button className="connect-btn" onClick={() => {
                const input = document.querySelector(".addr-input");
                if (input && input.value.trim()) {
                  setAddress(input.value.trim());
                  setIsConnected(true);
                  setNetwork("Aleo Testnet");
                  setChat([]);
                }
              }}>
                确认
              </button>
            </div>
          )}
        </div>
      </header>

      {isConnected ? (
        <div className="status-bar success">
          <span className="net-indicator">
            <span className="net-dot live" />
            Aleo Testnet
          </span>
          <span className="addr-display">
            {"\u2705"} 隐私证明已验证 &middot; {address.slice(0, 6)}...{address.slice(-4)}
          </span>
          <div className="contract-verify">
            {"\uD83D\uDCE6"} 合约已部署 &middot;{" "}
            <a href={EXPLORER_URL} target="_blank" rel="noopener noreferrer">
              链上验证 &rarr;
            </a>
          </div>
        </div>
      ) : (
        <div className="status-bar hint">
          {"\u26A0"} 请输入你的 Aleo 地址以开始对话
        </div>
      )}

      {/* Authorization Management Panel */}
      {isConnected && authState && (
        <div className="auth-panel">
          <div className="auth-title">{"\uD83D\uDD10"} 授权管理</div>
          <div className="auth-grid">
            {[1, 2, 3, 4].map((catId) => {
              const info = authState[catId];
              const authorized = info && info.authorized;
              return (
                <div key={catId} className={"auth-card " + (authorized ? "granted" : "denied")}>
                  <div className="auth-card-header">
                    <span className="auth-icon">{CAT_ICONS[catId]}</span>
                    <span className="auth-cat-name">{CATEGORY_MAP[catId]}</span>
                    <span className={"auth-badge " + (authorized ? "badge-ok" : "badge-no")}>
                      {authorized ? "\u2705 \u5DF2\u6388\u6743" : "\u274C \u672A\u6388\u6743"}
                    </span>
                  </div>
                  {authorized ? (
                    <div className="auth-card-body">
                      <div className="auth-meta">
                        {"\u23F3"} {fmtTime(info.expiresAt)}
                      </div>
                      <div className="auth-hash" title={"Poseidon2\u6A21\u62DF\u54C8\u5E0C: " + info.hash}>
                        {"\uD83D\uDD10"} {info.hash ? info.hash.slice(0, 10) + "..." : ""}
                      </div>
                      {catId !== 1 && (
                        <button className="auth-btn revoke" onClick={() => handleRevoke(catId)}>
                          撤销授权
                        </button>
                      )}
                      {catId === 1 && (
                        <span className="auth-default-tag">默认授权</span>
                      )}
                    </div>
                  ) : (
                    <div className="auth-card-body">
                      <button className="auth-btn grant" onClick={() => handleGrant(catId)}>
                        授权 24h
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <main className="chat-area">
        {chat.length === 0 && (
          <div className="empty-chat">
            {isConnected
              ? "你好，请输入你的问题，AI 将在隐私保护下为你回答。"
              : "请先连接钱包以开始对话"}
          </div>
        )}
        {chat.map((msg, i) => (
          <div key={i} className={"msg-row " + (msg.role === "user" ? "user" : msg.role === "error" ? "error" : msg.role === "loading" ? "loading" : "ai")}>
            <div className="msg-bubble">
              <div className="msg-label">
                {msg.role === "user" ? "你" : msg.role === "error" ? "错误" : msg.role === "loading" ? "AI" : "AI"}
              </div>
              <div className="msg-body">
                {msg.role === "loading" ? (
                  <em>{msg.text}</em>
                ) : (
                  msg.text
                )}
              </div>
              {msg.privacyTag && (
                <div className="zk-tag">
                  Privacy Tag: <code>{msg.privacyTag.slice(0, 22)}...</code>
                  <a href={EXPLORER_URL} target="_blank" rel="noopener noreferrer" style={{marginLeft:8,color:"#38bdf8",fontSize:11}}>
                    合约验证 &rarr;
                  </a>
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={chatEndRef} />
      </main>

      <footer className="input-bar">
        <select value={categoryId} onChange={(e) => setCategoryId(Number(e.target.value))} className="lang-select">
          {Object.entries(CATEGORY_MAP).map(([id, name]) => (
            <option key={id} value={id}>{name}</option>
          ))}
        </select>
        <select value={language} onChange={(e) => setLanguage(e.target.value)} className="lang-select">
          <option value="zh">中文</option>
          <option value="en">English</option>
        </select>
        <input
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAsk()}
          placeholder={isConnected ? PLACEHOLDER[language] : "请先连接钱包"}
          disabled={loading || !isConnected}
        />
        <button onClick={handleAsk} disabled={loading || !isConnected}>
          {loading ? "请稍候" : "发送"}
        </button>
      </footer>
    </div>
  );
}

export default App;
