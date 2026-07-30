import { useState, useRef, useEffect } from "react";
import "./index.css";

const CONTRACT_TX = "at1tlrj2xsah3yxsxjkdsehc48qrysp8f5zy4jy3lt3v4gmwfymuu8s8cr053";
const EXPLORER_URL = "https://testnet.explorer.provable.com/transaction/" + CONTRACT_TX;

const CATEGORY_MAP = { 1: "健康数据", 2: "基因数据", 3: "财务数据", 4: "其他数据" };
const CAT_SHORT = { 1: "健康", 2: "基因", 3: "财务", 4: "其他" };
const CAT_ICONS = { 1: "❤", 2: "🧬", 3: "💰", 4: "📋" };
const PLACEHOLDER = { zh: "请输入您的问题...", en: "Type your question..." };

function fmtTime(ts) {
  if (!ts) return "--";
  const r = ts - Date.now();
  if (r <= 0) return "已过期";
  const h = Math.floor(r / 3600000), m = Math.floor((r % 3600000) / 60000);
  return h > 0 ? h + "h" + m + "m" : m + "m";
}

function App() {
  const [address, setAddress] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [chat, setChat] = useState([]);
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState("zh");
  const [categoryId, setCategoryId] = useState(1);
  const [authState, setAuthState] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const chatEndRef = useRef(null);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chat]);
  useEffect(() => { if (isConnected && address) fetchAuth(); else setAuthState(null); }, [isConnected, address]);

  const fetchAuth = async () => {
    try {
      const r = await fetch("http://localhost:3001/api/authorizations?address=" + encodeURIComponent(address));
      setAuthState((await r.json()).authorizations);
    } catch (e) { console.error(e); }
  };
  const grant = async (id) => {
    await fetch("http://localhost:3001/api/authorize", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ address, category_id: id }) });
    fetchAuth();
  };
  const revoke = async (id) => {
    await fetch("http://localhost:3001/api/authorize", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ address, category_id: id }) });
    fetchAuth();
  };

  const connect = (addr) => { setAddress(addr); setIsConnected(true); setChat([]); setSidebarOpen(true); };
  const disconnect = () => { setAddress(null); setIsConnected(false); setChat([]); setAuthState(null); };

  const handleAsk = async () => {
    if (!prompt.trim() || loading) return;
    const msg = { role: "user", text: prompt };
    setChat((p) => [...p, msg, { role: "loading", text: "AI 正在思考中..." }]);
    setPrompt(""); setLoading(true);
    try {
      const r = await fetch("http://localhost:3001/api/ask", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt: msg.text, language, category_id: categoryId, address }) });
      const d = await r.json();
      setChat((p) => { const u = [...p]; u[u.length - 1] = { role: "ai", text: d.answer, privacyTag: d.privacy_tag, verified: d.verified, blocked: !d.verified, catId: categoryId }; return u; });
    } catch (e) {
      setChat((p) => { const u = [...p]; u[u.length - 1] = { role: "error", text: "后端连接失败: " + e.message }; return u; });
    }
    setLoading(false);
  };

  const ac = authState ? Object.values(authState).filter((v) => v.authorized).length : 0;

  return (
    <div className="app-root">
      <header className="topbar">
        <span className="logo">Privacy AI Helper</span>
        <div className="topbar-right">
          {isConnected && <span className="network-badge"><span className="net-dot" />Aleo Testnet</span>}
          {isConnected ? (
            <button className="disconnect-btn" onClick={disconnect}>{address.slice(0, 6)}...{address.slice(-4)}</button>
          ) : (
            <div className="addr-input-group">
              <input className="addr-input" placeholder="粘贴 Aleo 地址" onKeyDown={(e) => { if (e.key === "Enter" && e.target.value.trim()) connect(e.target.value.trim()); }} />
              <button className="connect-btn" onClick={() => { const el = document.querySelector(".addr-input"); if (el?.value.trim()) connect(el.value.trim()); }}>确认</button>
            </div>
          )}
        </div>
      </header>

      {isConnected ? (
        <div className="main-layout">
          <aside className={"sidebar" + (sidebarOpen ? " open" : "")}>
            <div className="sidebar-header">
              {sidebarOpen && <span className="sidebar-title">授权</span>}
              <button className="sidebar-toggle" onClick={() => setSidebarOpen(!sidebarOpen)} title={sidebarOpen ? "收起" : "展开"}>
                {sidebarOpen ? "«" : "»"}
              </button>
            </div>
            {sidebarOpen && (
              <>
                <div className="sidebar-addr">Aleo zkVM · {ac}/4 已授权</div>
                <div className="sidebar-contract"><a href={EXPLORER_URL} target="_blank" rel="noopener noreferrer">📦 合约已部署 →</a></div>
                <div className="auth-list">
                  {[1,2,3,4].map((id) => {
                    const info = authState?.[id], ok = info?.authorized;
                    return (
                      <div key={id} className={"auth-card " + (ok ? "granted" : "denied") + (categoryId === id ? " active" : "")} onClick={() => setCategoryId(id)}>
                        <div className="auth-card-header">
                          <span className="auth-cat-name">{CAT_ICONS[id]} {CAT_SHORT[id]}</span>
                          <span className={"auth-badge " + (ok ? "badge-ok" : "badge-no")}>{ok ? "✅" : "❌"}</span>
                        </div>
                        {ok ? (
                          <div className="auth-card-body">
                            <span className="auth-meta">⏳ {fmtTime(info.expiresAt)}</span>
                            <span className="auth-hash"><span className="zk-label">ZK</span> {info.hash?.slice(0,10)}...</span>
                            <button className="auth-btn revoke" onClick={(e) => { e.stopPropagation(); revoke(id); }}>撤销</button>
                          </div>
                        ) : (
                          <div className="auth-card-body">
                            <button className="auth-btn grant" onClick={(e) => { e.stopPropagation(); grant(id); }}>授权 24h</button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className="sidebar-zk-footer"><span className="zk-footer-dot" />Aleo zkVM · Poseidon2 · SNARK</div>
              </>
            )}
          </aside>

          <main className="chat-area">
            {chat.length === 0 && (
              <div className="empty-chat">{ac === 0 ? "请先在左侧授权一个数据类别" : "你好，请输入你的问题"}</div>
            )}
            {chat.map((msg, i) => (
              <div key={i} className={"msg-row " + msg.role + (msg.blocked ? " blocked" : "")}>
                <div className="msg-bubble">
                  <div className="msg-label">{msg.role === "user" ? "你" : msg.role === "error" ? "错误" : "AI"}</div>
                  <div className="msg-body">{msg.role === "loading" ? <em>{msg.text}</em> : msg.text}</div>
                  {msg.blocked && (
                    <button className="quick-grant" onClick={() => { grant(msg.catId); setChat((p) => p.filter((_,j) => j !== i)); }}>
                      🔓 授权并重试
                    </button>
                  )}
                  {msg.privacyTag && (
                    <div className="zk-tag">Privacy Tag: <code>{msg.privacyTag.slice(0,22)}...</code>
                      <a href={EXPLORER_URL} target="_blank" rel="noopener noreferrer" style={{marginLeft:8,color:"#38bdf8",fontSize:11}}>合约验证 →</a>
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </main>
        </div>
      ) : (
        <div className="connect-prompt">⚠ 请输入你的 Aleo 地址以开始对话</div>
      )}

      {isConnected && (
        <footer className="input-bar">
          <select value={categoryId} onChange={(e) => setCategoryId(Number(e.target.value))} className="lang-select">
            {Object.entries(CAT_SHORT).map(([id, name]) => (<option key={id} value={id}>{name}</option>))}
          </select>
          <select value={language} onChange={(e) => setLanguage(e.target.value)} className="lang-select">
            <option value="zh">中文</option>
            <option value="en">English</option>
          </select>
          <input value={prompt} onChange={(e) => setPrompt(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleAsk()}
            placeholder={isConnected ? PLACEHOLDER[language] : "请先连接钱包"} disabled={loading || !isConnected} />
          <button onClick={handleAsk} disabled={loading || !isConnected}>{loading ? "请稍候" : "发送"}</button>
        </footer>
      )}
    </div>
  );
}

export default App;
