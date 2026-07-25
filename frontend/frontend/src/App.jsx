import { useState, useMemo, useCallback } from "react";
import {
  WalletProvider,
  useWallet,
} from "@demox-labs/aleo-wallet-adapter-react";
import {
  WalletModalProvider,
  WalletMultiButton,
} from "@demox-labs/aleo-wallet-adapter-reactui";
import {
  LeoWalletAdapter,
} from "@demox-labs/aleo-wallet-adapter-leo";
import {
  DecryptPermission,
  WalletAdapterNetwork,
} from "@demox-labs/aleo-wallet-adapter-base";
import "@demox-labs/aleo-wallet-adapter-reactui/styles.css";
import "./App.css";

function AppContent() {
  const { wallet, publicKey, connected } = useWallet();
  const [prompt, setPrompt] = useState("");
  const [chat, setChat] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleAsk = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("http://localhost:3001/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
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
        { role: "error", text: "Backend connection failed: " + err.message },
      ]);
    }
    setLoading(false);
  };

  return (
    <div className="app">
      <header className="header">
        <h1>Privacy AI Helper</h1>
        <div className="wallet-area">
          <WalletMultiButton />
        </div>
      </header>

      {connected && publicKey && (
        <div className="badge">
          Verified Privacy Proof
          <span className="wallet-addr">
            {publicKey.slice(0, 6)}...{publicKey.slice(-4)}
          </span>
        </div>
      )}

      <div className="chat-container">
        {chat.map((msg, i) => (
          <div key={i} className={"msg msg-" + msg.role}>
            <div className="msg-role">
              {msg.role === "user" ? "You" : msg.role === "error" ? "Error" : "AI"}
            </div>
            <div className="msg-text">{msg.text}</div>
            {msg.zkProof && (
              <div className="msg-proof">
                ZK Proof: <code>{msg.zkProof.slice(0, 20)}...</code>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="input-area">
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAsk()}
          placeholder="Ask AI about your privacy..."
          disabled={loading || !connected}
        />
        <button onClick={handleAsk} disabled={loading || !connected}>
          {loading ? "..." : "Send"}
        </button>
      </div>
    </div>
  );
}

function App() {
  const wallets = useMemo(
    () => [
      new LeoWalletAdapter({
        appName: "Privacy AI Helper",
      }),
    ],
    []
  );

  return (
    <WalletProvider
      wallets={wallets}
      decryptPermission={DecryptPermission.UponRequest}
      network={WalletAdapterNetwork.Testnet}
      autoConnect
    >
      <WalletModalProvider>
        <AppContent />
      </WalletModalProvider>
    </WalletProvider>
  );
}

export default App;
