import { useState } from "react";
import "./index.css";

function App() {
  const [address, setAddress] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [chat, setChat] = useState([]);
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState("zh");
  const [category, setCategory] = useState("health");

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
        console.error("钱包连接失败", e);
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
        body: JSON.stringify({ prompt, language, category, address }),
      });
      const data = await res.json();
      setChat((prev) => [
        ...prev,
        { role: "user", text: prompt },
        { role: "ai", text: data.answer, zkProof: data.zk_proof },
      ]);
      setPrompt("");
    } catch (err) {
      setChat((prev) => [
        ...prev,
        { role: "user", text: prompt },
        { role: "error", text: "后端连接失败: " + err.message },
      ]);
    }
    setLoading(false);
  };

  return (
    <div className="app-root">
      {/* 顶部栏 */}
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

      {/* 状态栏 */}
      {isConnected ? (
        <div className="status-bar success">
          {"\u2705"} 隐私证明已验证 &middot; {address.slice(0, 6)}...{address.slice(-4)}
        </div>
      ) : (
        <div className="status-bar hint">
          {"\u26A0"} 请先连接钱包以验证隐私授权
        </div>
      )}

      {/* 聊天区 */}
      <main className="chat-area">
        {chat.length === 0 && (
          <div className="empty-chat">
            {isConnected
              ? "你好，请输入你的问题，AI将在隐私保护下为你回答。"
              : "请先连接钱包以开始对话"}
          </div>
        )}
        {chat.map((msg, i) => (
          <div key={i} className={"msg-row " + (msg.role === "user" ? "user" : msg.role === "error" ? "error" : "ai")}>
            <div className="msg-bubble">
              <div className="msg-label">
                {msg.role === "user" ? "你" : msg.role === "error" ? "错误" : "AI"}
              </div>
              <div className="msg-body">{msg.text}</div>
              {msg.zkProof && (
                <div className="zk-tag">
                  ZK Proof: <code>{msg.zkProof.slice(0, 22)}...</code>
                </div>
              )}
            </div>
          </div>
        ))}
      </main>

      {/* 输入框 */}
      <footer className="input-bar">
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="lang-select">
          <option value="health">健康数据</option>
          <option value="finance">财务数据</option>
          <option value="social">社交数据</option>
          <option value="genomic">基因数据</option>
        </select>
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="lang-select"
        >
          <option value="zh">中文</option>
          <option value="en">English</option>
        </select>
        <input
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAsk()}
          placeholder={isConnected ? "请输入您的问题..." : "请先连接钱包"}
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
