# Privacy AI Helper — 项目说明文档

> Aleo Hackathon 2026 · AI × Privacy Track
>
> 一句话：**用 Aleo 零知识证明保护用户隐私的本地 AI 健康顾问。**

---

## 一、做什么的

用户连接 Aleo 钱包，选择要授权的数据类别（如"健康数据"），向本地 AI 提问（如"血压135/85正常吗？"），AI 在本地推理后返回答案。每次回答附带一条 ZK Proof 哈希，链上可验证。

**核心闭环：连接钱包 → 选择数据类别 → AI 问答 → ZK 证明 → 链上可查。**

---

## 二、技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| 前端 | React 19 + Vite + CSS | 深色 ChatGPT 风 UI，含钱包连接、数据类别选择、中英切换 |
| 后端 | Express (Node.js) | Ollama 对接、ZK 证明生成、隐私 prompt 构建 |
| AI 模型 | Ollama + Qwen2.5 1.5B | 本地推理，数据不出用户电脑 |
| 区块链 | Aleo Testnet + Leo 4.x | 隐私授权合约，链上哈希存证 |
| 钱包 | Leo Wallet (原生 API) | `window.aleo.connect()`，3 次重试 + 自动降级 |
| 合约 | Leo (privacy_ai_helper.aleo) | 5 个函数：grant/check/revoke/store/is_authorized |

---

## 三、创新点

| # | 创新 | 详细 |
|---|------|------|
| 1 | **数据类别精细授权** | 不搞"同意隐私政策"就全放开——用户可选健康/财务/社交/基因，AI 只能访问授权范围内的数据 |
| 2 | **链上哈希存证** | 合约只存 `field` 哈希，不存原始数据类别名，外部无法反推 |
| 3 | **AI + ZK 双输出** | 每次回答附带可验证的 ZK Proof，链上 `is_authorized` 可验证授权真实性 |
| 4 | **本地 AI 推理** | Ollama 在用户电脑本地跑，原始数据从不离开设备 |
| 5 | **时间维度过期控制** | 合约内置 `auth_timestamps` + `max_age`，授权不是永久的，到期自动失效 |
| 6 | **一键启动** | 双击 `.bat` 自动拉起 Ollama + 后端 + 前端 + 浏览器 |

---

## 四、合约函数（5 个）

| 函数 | 功能 | 隐私设计 |
|------|------|---------|
| `grant_access(data_hash)` | 授权某数据类别 | 链上存哈希，不存类别名 |
| `check_access(owner)` | 查询授权哈希 | 返回 field，外部无法反推 |
| `revoke_access()` | 撤销授权 | 哈希清零 + 时间戳清零 |
| `store_data(category)` | 记录数据类别 | 权限校验，防止他人覆盖 |
| `is_authorized(owner, max_age)` | 验证授权 + 过期检查 | 含 block.height 时效判断 |

---

## 五、项目完成度

| 模块 | 完成项 | 状态 |
|------|--------|------|
| 前端 | 钱包连接 + 聊天 UI + 数据类别选择 + 中英切换 | Done |
| 后端 | Ollama 对接 + ZK Proof 生成 + 隐私 prompt 构建 | Done |
| AI | Qwen2.5 1.5B 中文推理正常 | Done |
| 合约 | 5 函数，语法通过，无 bool 隐私泄露 | Done |
| 文档 | README + DEMO_SCRIPT + PITCH_DECK + PROJECT_OVERVIEW | Done |
| 启动 | 一键启动.bat（Ollama + 后端 + 前端 + 浏览器） | Done |
| GitHub | https://github.com/Chichuzxy/privacy-ai-helper | Done |

---

## 六、全链路验证记录

| 检查项 | 结果 |
|--------|------|
| 前端 `npm run build` | 15 modules, 0 errors |
| 后端 `node --check` | SYNTAX OK |
| 合约 语法（5 函数、括号匹配） | PASS |
| Ollama 中文推理 | "你好！我是阿里云..." |
| API `/api/ask` 真实调用 | answer + zk_proof 正常返回 |
| 文档完整性（4 个 md） | PASS |

---

## 七、待办

| 事项 | 做法 |
|------|------|
| 录 Demo 视频 | Win+G 录屏，按 DEMO_SCRIPT.md 演 3 分钟 |
| 做 PPT | 把 PITCH_DECK.md 内容贴进 PowerPoint |
| 提交比赛 | 截止 8 月 14 日，目前代码和文档已就绪 |

---

> 项目路径：`E:\XZ\tuanduei\BSxm\AI-Xiaozhushou\`
>
> GitHub：`https://github.com/Chichuzxy/privacy-ai-helper`
