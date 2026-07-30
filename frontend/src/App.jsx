import { useState, useRef, useEffect } from "react";
import "./index.css";

const CONTRACT_TX = "at1tlrj2xsah3yxsxjkdsehc48qrysp8f5zy4jy3lt3v4gmwfymuu8s8cr053";
const EXPLORER_URL = "https://testnet.explorer.provable.com/transaction/" + CONTRACT_TX;

const CATEGORY_MAP = { 1: "健康", 2: "基因", 3: "财务", 4: "其他" };
const CAT_FULL = { 1: "健康数据", 2: "基因数据", 3: "财务数据", 4: "其他数据" };
const CAT_ICONS = { 1: "\u2764", 2: "\uD83E\uDDEC", 3: "\uD83D\uDCB0", 4: "\uD83D\uDCCB" };

function fmtTime(ts) {
  if (!ts) return "--";
  const remaining = ts - Date.now();
  if (remaining <= 0) return "\u5DF2\u8FC7\u671F";
  const h = Math.floor(remaining / 3600000);
  const m = Math.floor((remaining % 3600000) / 60000);
  if (h > 0) return h + "h" + m + "m";
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
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const chatEndRef = useRef(null);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chat]);

  useEffect(() => {
    if (isConnected && address) fetchAuthStatus();
    else setAuthState(null);
  }, [isConnected, address]);

  const fetchAuthStatus = async () => {
    try {
      const res = await fetch("http://localhost:3001/api/authorizations?address=" + encodeURIComponent(address));
      setAuthState((await res.json()).authorizations);
    } catch (e) { console.error(e); }
  };

  const handleGrant = async (catId) => {
    await fetch("http://localhost:3001/api/authorize", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address, category_id: catId }),
    });
    fetchAuthStatus();
  };

  const handleRevoke = async (catId) => {
    await fetch("http://localhost:3001/api/authorize", {
      method: "DELETE", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address, category_id: catId }),
    });
    fetchAuthStatus();
  };

  const handleConnect = (addr) => { setAddress(addr); setIsConnected(true); setNetwork("Aleo Testnet"); setChat([]); setSidebarOpen(true); };
  const disconnectWallet = () => { setAddress(null); setIsConnected(false); setNetwork(null); setChat([]); setAuthState(null); };

  const handleAsk = async () => {
    if (!prompt.trim() || loading) return;
    const userMsg = { role: "user", text: prompt };
    setChat((prev) => [...prev, userMsg, { role: "loading", text: "AI 正在思考中..." }]);
    setPrompt(""); setLoading(true);
    try {
      const res = await fetch("http://localhost:3001/api/ask", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: userMsg.text, language, category_id: categoryId, address }),
      });
      const data = await res.json();
      setChat((prev) => { const u = [...prev]; u[u.length - 1] = { role: "ai", text: data.answer, privacyTag: data.privacy_tag, verified: data.verified }; return u; });
    } catch (err) {
      setChat((prev) => { const u = [...prev]; u[u.length - 1] = { role: "error", text: "后端连接失败: " + err.message }; return u; });
    }
    setLoading(false);
  };

  const authorizedCount = authState ? Object.values(authState).filter((v) => v.authorized).length : 0;

  return (
    <div className="app-root">
      <header className="topbar">
        <span className="logo">Privacy AI Helper</span>
        <div className="topbar-right">
          {isConnected && <span className="network-badge"><span className="net-dot" />{network}</span>}
          {isConnected ? (
            <>
              <span className="wallet-addr">{address.slice(0, 6)}...{address.slice(-4)}</span>
              <button className="disconnect-btn" onClick={disconnectWallet}>断开</button>
            </>
          ) : (
            <div className="addr-input-group">
              <input className="addr-input" placeholder="粘贴 Aleo 地址"
                onKeyDown={(e) => { if (e.key === "Enter" && e.target.value.trim()) handleConnect(e.target.value.trim()); }}
              />
              <button className="connect-btn" onClick={() => { const el = document.querySelector(".addr-input"); if (el?.value.trim()) handleConnect(el.value.trim()); }}>确认</button>
            </div>
          )}
        </div>
      </header>

      {isConnected ? (
        <div className="main-layout">
          {authState && (
            <aside className={"sidebar" + (sidebarOpen ? " open" : "")}>
              <div className="sidebar-header">
                {sidebarOpen && <><span className="sidebar-title">{"\uD83D\uDD10"} 授权</span><span className="sidebar-count">{authorizedCount}/4</span></>}
                <button className="sidebar-toggle" onClick={() => setSidebarOpen(!sidebarOpen)} title={sidebarOpen ? "收起" : "展开"}>
                  {sidebarOpen ? "\u00AB" : "\u00BB"}
                </button>
              </div>

              {sidebarOpen && (
                <>
                  <div className="sidebar-addr">Aleo zkVM &middot; {address.slice(0, 6)}...{address.slice(-4)}</div>
                  <div className="sidebar-contract">
                    {"\uD83D\uDCE6"} 合约已部署{" "}
                    <a href={EXPLORER_URL} target="_blank" rel="noopener noreferrer">链上验证 &rarr;</a>
                  </div>

                  <div className="auth-list">
                    {[1, 2, 3, 4].map((catId) => {
                      const info = authState[catId];
                      const authorized = info?.authorized;
                      return (
                        <div key={catId} className={"auth-card " + (authorized ? "granted" : "denied")}>
                          <div className="auth-card-header">
                            <span className="auth-icon">{CAT_ICONS[catId]}</span>
                            <span className="auth-cat-name">{CAT_FULL[catId]}</span>
                            <span className={"auth-badge " + (authorized ? "badge-ok" : "badge-no")}>
                              {authorized ? "\u2705" : "\u274C"}
                            </span>
                          </div>
                          {authorized ? (
                            <div className="auth-card-body">
                              <div className="auth-meta">{"\u23F3"} {fmtTime(info.expiresAt)}</div>
                              <div className="auth-hash" title={"Poseidon2 ZK: " + info.hash}>
                                <span className="zk-label">ZK</span> {info.hash?.slice(0, 10)}...
                              </div>
                              <button className="auth-btn revoke" onClick={() => handleRevoke(catId)}>撤销</button>
                            </div>
                          ) : (
                            <div className="auth-card-body">
                              <button className="auth-btn grant" onClick={() => handleGrant(catId)}>授权 24h</button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="sidebar-zk-footer">
                    <span className="zk-footer-dot" /> Aleo zkVM &middot; Poseidon2 &middot; SNARK
                  </div>
                </>
              )}
            </aside>
          )}

          <main className="chat-area">
            {chat.length === 0 && (
              <div className="empty-chat">
                {authorizedCount === 0 ? "请先在左侧授权至少一个数据类别" : "你好，请输入你的问题"}
              </div>
            )}
            {chat.map((msg, i) => (
              <div key={i} className={"msg-row " + msg.role}>
                <div className="msg-bubble">
                  <div className="msg-label">{msg.role === "user" ? "你" : msg.role === "error" ? "错误" : "AI"}</div>
                  <div className="msg-body">{msg.role === "loading" ? <em>{msg.text}</em> : msg.text}</div>
                  {msg.privacyTag && (
                    <div className="zk-tag">
                      Privacy Tag: <code>{msg.privacyTag.slice(0, 22)}...</code>
                      <a href={EXPLORER_URL} target="_blank" rel="noopener noreferrer" style={{marginLeft:8,color:"#38bdf8",fontSize:11}}>合约验证 &rarr;</a>
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </main>
        </div>
      ) : (
        <div className="connect-prompt">{"\u26A0"} 请输入你的 Aleo 地址以开始对话</div>
      )}

      {isConnected && (
        <footer className="input-bar">
          <select value={categoryId} onChange={(e) => setCategoryId(Number(e.target.value))} className="lang-select">
            {Object.entries(CATEGORY_MAP).map(([id, name]) => (<option key={id} value={id}>{name}</option>))}
          </select>
          <select value={language} onChange={(e) => setLanguage(e.target.value)} className="lang-select">
            <option value="zh">中文</option>
            <option value="en">English</option>
          </select>
          <input value={prompt} onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAsk()}
            placeholder={isConnected ? (language === "zh" ? "请输入您的问题..." : "Type your question...") : "请先连接钱包"}
            disabled={loading || !isConnected}
          />
          <button onClick={handleAsk} disabled={loading || !isConnected}>{loading ? "请稍候" : "发送"}</button>
        </footer>
      )}
    </div>
  );
}

export default App;
