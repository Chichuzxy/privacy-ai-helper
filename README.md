# Privacy AI Helper

> Aleo Hackathon — AI x Privacy Track
>
> 隐私保护的 AI 健康顾问：用零知识证明验证 AI 回答，不泄露你的数据。

---

## 解决的问题

AI 健康助手越来越普及，但每次使用都需要暴露敏感数据（血压、心率、病史）。你无法验证 AI 的回答是否基于你授权的数据范围，也无法向第三方证明"我真的只问了血压相关问题"。

**Privacy AI Helper** 让用户：
- 自主选择授权哪些数据类别给 AI（血压 / 心率 / 病历 / 基因）
- 每次 AI 回答附带零知识证明，链上可验证
- 不需要在链上存储任何原始数据——只存哈希

---

## 赛道匹配

| 评判维度 | 我们的设计 |
|----------|-----------|
| **AI + Privacy** | AI 分析 + Aleo ZK 验证，核心赛道 |
| **链上可验证** | Leo 合约 `store_data` + `verify_access` 在 Testnet 可执行 |
| **用户自主权** | 钱包授权 + 数据类别选择，用户控制一切 |
| **实用性** | 医疗/健康是真实刚需场景 |

---

## 技术架构

```
+-------------+       +--------------+       +------------------+
|  React 前端  | ----> | Express 后端  | ----> | Ollama (本地AI)  |
| Aleo Wallet |       | ZK Proof 生成 |       | Qwen2.5 1.5B    |
+------|------+       +------|-------+       +------------------+
       |                      |
       | 钱包连接 + 授权签名   | 数据类别哈希上链
       v                      v
+------------------------------------+
|      Aleo Testnet (Leo 合约)        |
|  - grant_access / revoke_access     |
|  - store_data (数据类别哈希)        |
|  - verify_access (ZK 验证)          |
+------------------------------------+
```

---

## Leo 合约核心函数

| 函数 | 功能 | 隐私保护方式 |
|------|------|-------------|
| `grant_access(data_hash)` | 用户授权应用访问隐私数据 | 链上存 field 哈希，不存类别名 |
| `check_access(owner)` | 查询授权哈希 | 返回 field，外部无法反推 |
| `store_data(category)` | 将数据类别哈希上链 | 权限校验，防止他人覆盖 |
| `revoke_access()` | 撤销授权 | 哈希清零 + 时间戳清零 |
| `is_authorized(owner, max_age)` | 验证授权 + 过期检查 | 含 block.height 时效判断 |

合约已通过语法检查，程序大小 2.33 KB。

---

## ZK 证明流程

```
用户提问"我的血压正常吗？"
       |
       v
后端生成 prompt + 数据类别哈希
       |
       v
Ollama 返回 AI 回答
       |
       v
后端用 SHA256(prompt + timestamp + address) 生成 ZK Proof
       |
       v
前端显示: ZK Proof: 0xa3f1...  (链上可验证)
```

> Demo 阶段使用 SHA256 模拟。生产环境替换为 Leo `verify_access` 的链上 ZK 验证。

---

## 项目结构

```
AI-Xiaozhushou/
├── frontend/              # React + Vite 前端
│   └── src/
│       ├── App.jsx        # 主界面（钱包 + 聊天 + 语言选择）
│       └── index.css      # 深色极简 UI
├── backend/               # Express 后端
│   └── index.js           # Ollama 对接 + ZK 生成
├── privacy_ai_helper/     # Leo 智能合约
│   └── src/main.leo       # 隐私授权合约（5 函数，已通过语法检查）
├── 一键启动.bat            # Windows 全栈一键启动
├── README.md              # 项目方案书
├── DEMO_SCRIPT.md         # Demo 演示脚本
├── PITCH_DECK.md          # 路演 PPT 逐字稿
└── PROJECT_OVERVIEW.md    # 项目说明文档
```

---

## 环境要求

| 组件 | 用途 |
|------|------|
| Windows 10/11 | 运行全栈（前端 + 后端 + Ollama + 合约文件） |
| Ollama + Qwen2.5 1.5B | 本地 AI 推理 |
| Leo Wallet 浏览器插件 | Aleo 钱包连接 |
| Node.js 18+ | 前后端运行 |

> Leo 合约文件位于本地 `privacy_ai_helper/src/main.leo`，无需 WSL。如需编译合约，使用 `leo build`（需安装 Leo 工具链）。

---

## 创新点

1. **数据类别授权制** — 不是"全有或全无"的权限，用户可以精细控制授权范围
2. **链上哈希存证** — 不存原始数据，但可验证授权行为真实发生过
3. **AI 回答 + ZK 证明双输出** — 每次回答附带可验证的隐私证明
4. **本地 AI 推理** — 数据不出用户电脑，彻底隐私保护
5. **一键启动** — 双击 `.bat` 文件即可跑通全栈，降低评委复现成本

---

## 未来规划

- 接入 Aleo 主网，实现真正的链上 ZK 验证
- 支持多数据类别组合授权（血压+心率 = 综合健康评估）
- 增加 AI 模型选择（Qwen / Llama / DeepSeek）
- 移动端适配

---

## 团队

- **Chichuzxy** — 全栈开发 + Leo 合约 + AI 集成

---

## License

MIT
