import { useState, useRef, useEffect } from "react";
import "./index.css";

const CONTRACT_TX = "at1tlrj2xsah3yxsxjkdsehc48qrysp8f5zy4jy3lt3v4gmwfymuu8s8cr053";
const EXPLORER_URL = "https://testnet.explorer.provable.com/transaction/" + CONTRACT_TX;

const CAT = { 1: "\u2764 \u5065\u5EB7", 2: "\uD83E\uDDEC \u57FA\u56E0", 3: "\uD83D\uDCB0 \u8D22\u52A1", 4: "\uD83D\uDCCB \u5176\u4ED6" };
const CAT_FULL = { 1: "\u5065\u5EB7\u6570\u636E", 2: "\u57FA\u56E0\u6570\u636E", 3: "\u8D22\u52A1\u6570\u636E", 4: "\u5176\u4ED6\u6570\u636E" };

function fmtTime(ts) {
  if (!ts) return "--";
  const r = ts - Date.now();
  if (r <= 0) return "\u5DF2\u8FC7\u671F";
  const h = Math.floor(r / 3600000), m = Math.floor((r % 3600000) / 60000);
  return h > 0 ? h + "h" + m + "m" : m + "m";
}

function App() {
  const [address, setAddress] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [network] = useState("Aleo Testnet");
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

  const grant = async (catId) => {
    await fetch("http://localhost:3001/api/authorize", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ address, category_id: catId }) });
    fetchAuth();
  };
  const revoke = async (catId) => {
    await fetch("http://localhost:3001/api/authorize", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ address, category_id: catId }) });
    fetchAuth();
  };

  const connect = (addr) => { setAddress(addr); setIsConnected(true); setChat([]); setSidebarOpen(true); };
  const disconnect = () => { setAddress(null); setIsConnected(false); setChat([]); setAuthState(null); };

  const selectCat = (catId) => { setCategoryId(catId); if (!sidebarOpen) setSidebarOpen(true); };

  const handleAsk = async () => {
    if (!prompt.trim() || loading) return;
    const msg = { role: "user", text: prompt };
    setChat((p) => [...p, msg, { role: "loading", text: "AI \u6B63\u5728\u601D\u8003\u4E2D..." }]);
    setPrompt(""); setLoading(true);
    try {
      const r = await fetch("http://localhost:3001/api/ask", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt: msg.text, language, category_id: categoryId, address }) });
      const d = await r.json();
      setChat((p) => { const u = [...p]; u[u.length - 1] = { role: "ai", text: d.answer, privacyTag: d.privacy_tag, verified: d.verified, blocked: !d.verified, catId: categoryId }; return u; });
    } catch (e) {
      setChat((p) => { const u = [...p]; u[u.length - 1] = { role: "error", text: "\u540E\u7AEF\u8FDE\u63A5\u5931\u8D25: " + e.message }; return u; });
    }
    setLoading(false);
  };

  const ac = authState ? Object.values(authState).filter((v) => v.authorized).length : 0;

  return (
    <div className="app-root">
      <header className="topbar">
        <span className="logo">Privacy AI Helper</span>
        <div className="topbar-right">
          {isConnected && <span className="network-badge"><span className="net-dot" />{network}</span>}
          {isConnected ? (
            <button className="disconnect-btn" onClick={disconnect}>{address.slice(0, 6)}...{address.slice(-4)} &times;</button>
          ) : (
            <div className="addr-input-group">
              <input className="addr-input" placeholder="\u7C98\u8D34 Aleo \u5730\u5740" onKeyDown={(e) => { if (e.key === "Enter" && e.target.value.trim()) connect(e.target.value.trim()); }} />
              <button className="connect-btn" onClick={() => { const el = document.querySelector(".addr-input"); if (el?.value.trim()) connect(el.value.trim()); }}>\u786E\u8BA4</button>
            </div>
          )}
        </div>
      </header>

      {isConnected ? (
        <div className="main-layout">
          <aside className={"sidebar" + (sidebarOpen ? " open" : "")}>
            <div className="sidebar-header">
              {sidebarOpen && <span className="sidebar-title">\u6388\u6743</span>}
              <button className="sidebar-toggle" onClick={() => setSidebarOpen(!sidebarOpen)} title={sidebarOpen ? "\u6536\u8D77" : "\u5C55\u5F00"}>
                {sidebarOpen ? "\u00AB" : "\u00BB"}
              </button>
            </div>
            {sidebarOpen && (
              <>
                <div className="sidebar-addr">Aleo zkVM &middot; {ac}/4 \u5DF2\u6388\u6743</div>
                <div className="sidebar-contract"><a href={EXPLORER_URL} target="_blank" rel="noopener noreferrer">\uD83D\uDCE6 \u5408\u7EA6\u5DF2\u90E8\u7F72 &rarr;</a></div>
                <div className="auth-list">
                  {[1, 2, 3, 4].map((id) => {
                    const info = authState?.[id];
                    const ok = info?.authorized;
                    return (
                      <div key={id} className={"auth-card " + (ok ? "granted" : "denied") + (categoryId === id ? " active" : "")} onClick={() => selectCat(id)}>
                        <div className="auth-card-header">
                          <span className="auth-cat-name">{CAT[id]}</span>
                          <span className={"auth-badge " + (ok ? "badge-ok" : "badge-no")}>{ok ? "\u2705" : "\u274C"}</span>
                        </div>
                        {ok && (
                          <div className="auth-card-body">
                            <span className="auth-meta">{"\u23F3"} {fmtTime(info.expiresAt)}</span>
                            <span className="auth-hash" title={"Poseidon2 ZK: " + info.hash}><span className="zk-label">ZK</span> {info.hash?.slice(0, 10)}...</span>
                            <button className="auth-btn revoke" onClick={(e) => { e.stopPropagation(); revoke(id); }}>\u64A4\u9500</button>
                          </div>
                        )}
                        {!ok && (
                          <div className="auth-card-body">
                            <button className="auth-btn grant" onClick={(e) => { e.stopPropagation(); grant(id); }}>\u6388\u6743 24h</button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className="sidebar-zk-footer"><span className="zk-footer-dot" />Aleo zkVM &middot; Poseidon2 &middot; SNARK</div>
              </>
            )}
          </aside>

          <main className="chat-area">
            {chat.length === 0 && (
              <div className="empty-chat">{ac === 0 ? "\u8BF7\u5148\u5728\u5DE6\u4FA7\u6388\u6743\u81F3\u5C11\u4E00\u4E2A\u6570\u636E\u7C7B\u522B" : "\u4F60\u597D\uFF0C\u8BF7\u8F93\u5165\u4F60\u7684\u95EE\u9898"}</div>
            )}
            {chat.map((msg, i) => (
              <div key={i} className={"msg-row " + msg.role + (msg.blocked ? " blocked" : "")}>
                <div className="msg-bubble">
                  <div className="msg-label">{msg.role === "user" ? "\u4F60" : msg.role === "error" ? "\u9519\u8BEF" : "AI"}</div>
                  <div className="msg-body">{msg.role === "loading" ? <em>{msg.text}</em> : msg.text}</div>
                  {msg.blocked && (
                    <button className="quick-grant" onClick={() => { grant(msg.catId); setChat((p) => p.filter((_, j) => j !== i)); }}>
                      \uD83D\uDD13 \u6388\u6743 {CAT[msg.catId]} \u5E76\u91CD\u8BD5
                    </button>
                  )}
                  {msg.privacyTag && (
                    <div className="zk-tag">Privacy Tag: <code>{msg.privacyTag.slice(0, 22)}...</code>
                      <a href={EXPLORER_URL} target="_blank" rel="noopener noreferrer" style={{marginLeft:8,color:"#38bdf8",fontSize:11}}>\u5408\u7EA6\u9A8C\u8BC1 &rarr;</a>
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </main>
        </div>
      ) : (
        <div className="connect-prompt">{"\u26A0"} \u8BF7\u8F93\u5165\u4F60\u7684 Aleo \u5730\u5740\u4EE5\u5F00\u59CB\u5BF9\u8BDD</div>
      )}

      {isConnected && (
        <footer className="input-bar">
          <select value={categoryId} onChange={(e) => setCategoryId(Number(e.target.value))} className="lang-select">
            {Object.entries(CAT).map(([id, name]) => (<option key={id} value={id}>{name}</option>))}
          </select>
          <select value={language} onChange={(e) => setLanguage(e.target.value)} className="lang-select">
            <option value="zh">\u4E2D\u6587</option>
            <option value="en">English</option>
          </select>
          <input value={prompt} onChange={(e) => setPrompt(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleAsk()}
            placeholder={language === "zh" ? "\u8BF7\u8F93\u5165\u60A8\u7684\u95EE\u9898..." : "Type your question..."}
            disabled={loading || !isConnected} />
          <button onClick={handleAsk} disabled={loading || !isConnected}>{loading ? "\u8BF7\u7A0D\u5019" : "\u53D1\u9001"}</button>
        </footer>
      )}
    </div>
  );
}

export default App;
