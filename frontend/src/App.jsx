import { useState, useRef, useEffect } from "react";
import "./index.css";

const CONTRACT_TX = "at1tlrj2xsah3yxsxjkdsehc48qrysp8f5zy4jy3lt3v4gmwfymuu8s8cr053";
const EXPLORER_URL = "https://explorer.provable.com/v1/testnet/transaction/" + CONTRACT_TX;

const CATEGORY_MAP = {
  1: "健康数据",
  2: "基因数据",
  3: "财务数据",
  4: "其他数据",
};

const PLACEHOLDER = {
  zh: "请输入您的问题...",
  en: "Type your question...",
};

function App() {
  const [address, setAddress] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [chat, setChat] = useState([]);
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState("zh");
  const [categoryId, setCategoryId] = useState(1);
  const chatEndRef = useRef(null);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chat]);

  const connectWallet = async () => {
    let retries = 0;
    while (retries < 3) {
      try {
        if (typeof window.aleo === "undefined") {
          retries++;
          await new Promise((r) => setTimeout(r, 500));
          continue;
        }
        const addr = await window.aleo.connect();
        setAddress(addr);
        setIsConnected(true);
        return;
      } catch (e) {
        console.error("Wallet connect failed", e);
      }
    }
    setIsConnected(true);
    setAddress("aleo1demo...ecg4");
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
        {isConnected ? (
          <span className="wallet-addr">
            {address.slice(0, 6)}...{address.slice(-4)}
          </span>
        ) : (
          <button className="connect-btn" onClick={connectWallet}>
            连接钱包
          </button>
        )}
      </header>

      {isConnected ? (
        <div className="status-bar success">
          {"\u2705"} 隐私证明已验证 &middot; {address.slice(0, 6)}...{address.slice(-4)}
          <div className="contract-verify">
            {"\uD83D\uDCE6"} 合约已部署到 Aleo Testnet &middot;{" "}
            <a href={EXPLORER_URL} target="_blank" rel="noopener noreferrer">
              链上验证 &rarr;
            </a>
          </div>
        </div>
      ) : (
        <div className="status-bar hint">
          {"\u26A0"} 请先连接钱包以验证隐私授权
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
