import { useState } from "react";
import "./index.css";

const CONTRACT_TX = "at1s90j4pdlxujpumne04kkgtjymv7ez9y9j2a8vkcd3ysn3ruehu9qvgutyq";
const EXPLORER_URL = "https://explorer.aleo.org/transaction/" + CONTRACT_TX;

// 数据类别映射: category_id → 显示名
const CATEGORY_MAP = {
  1: "健康数据",
  2: "基因数据",
  3: "财务数据",
  4: "其他数据",
};

function App() {
  const [address, setAddress] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [chat, setChat] = useState([]);
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState("zh");
  const [categoryId, setCategoryId] = useState(1);

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
        console.error("", e);
      }
    }
    // 3次重试后自动降级为演示模式
    setIsConnected(true);
    setAddress("aleo1demo...ecg4");
  };

  const handleAsk = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("http://localhost:3001/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          language,
          category_id: categoryId,
          address,
        }),
      });
      const data = await res.json();
      setChat((prev) => [
        ...prev,
        { role: "user", text: prompt },
        { role: "ai", text: data.answer, privacyTag: data.privacy_tag },
      ]);
      setPrompt("");
    } catch (err) {
      setChat((prev) => [
        ...prev,
        { role: "user", text: prompt },
        { role: "error", text: "" + err.message },
      ]);
    }
    setLoading(false);
  };

  return (
    <div className="app-root">
      {/*  */}
      <header className="topbar">
        <span className="logo">Privacy AI Helper</span>
        {isConnected ? (
          <span className="wallet-addr">
            {address.slice(0, 6)}...{address.slice(-4)}
          </span>
        ) : (
          <button className="connect-btn" onClick={connectWallet}>
            {}
          </button>
        )}
      </header>

      {/*  */}
      {isConnected ? (
        <div className="status-bar success">
          {"\u2705"}  &middot; {address.slice(0, 6)}...{address.slice(-4)}
          <div className="contract-verify">
            {"\uD83D\uDCE6"} Aleo Testnet &middot;{" "}
            <a href={EXPLORER_URL} target="_blank" rel="noopener noreferrer">
               &rarr;
            </a>
          </div>
        </div>
      ) : (
        <div className="status-bar hint">
          {"\u26A0"} 
        </div>
      )}

      {/*  */}
      <main className="chat-area">
        {chat.length === 0 && (
          <div className="empty-chat">
            {isConnected
              ? "AI"
              : ""}
          </div>
        )}
        {chat.map((msg, i) => (
          <div key={i} className={"msg-row " + (msg.role === "user" ? "user" : msg.role === "error" ? "error" : "ai")}>
            <div className="msg-bubble">
              <div className="msg-label">
                {msg.role === "user" ? "" : msg.role === "error" ? "" : "AI"}
              </div>
              <div className="msg-body">{msg.text}</div>
              {msg.privacyTag && (
                <div className="zk-tag">
                  Privacy Tag: <code>{msg.privacyTag.slice(0, 22)}...</code>
                  <a href={EXPLORER_URL} target="_blank" rel="noopener noreferrer" style={{marginLeft:8,color:"#38bdf8",fontSize:11}}>
                     &rarr;
                  </a>
                </div>
              )}
            </div>
          </div>
        ))}
      </main>

      {/*  */}
      <footer className="input-bar">
        <select value={categoryId} onChange={(e) => setCategoryId(Number(e.target.value))} className="lang-select">
          {Object.entries(CATEGORY_MAP).map(([id, name]) => (
            <option key={id} value={id}>{name}</option>
          ))}
        </select>
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="lang-select"
        >
          <option value="zh"></option>
          <option value="en">English</option>
        </select>
        <input
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAsk()}
          placeholder={isConnected ? "..." : ""}
          disabled={loading || !isConnected}
        />
        <button onClick={handleAsk} disabled={loading || !isConnected}>
          {loading ? "" : ""}
        </button>
      </footer>
    </div>
  );
}

export default App;
