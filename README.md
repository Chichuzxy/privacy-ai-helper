# Privacy AI Helper

> Aleo Hackathon — AI x Privacy Track
>
> 隐私保护的 AI 健康顾问：用可验证的隐私标签保护 AI 回答，不泄露你的数据。

---

## 解决的问题

AI 健康助手越来越普及，但每次使用都需要暴露敏感数据（血压、心率、病史）。你无法验证 AI 的回答是否基于你授权的数据范围，也无法向第三方证明"我真的只问了血压相关问题"。

**Privacy AI Helper** 让用户：
- 自主选择授权哪些数据类别给 AI（血压 / 心率 / 病历 / 基因）
- 每次 AI 回答附带可验证的隐私标签，链上可查询
- 不需要在链上存储任何原始数据——只存哈希

---

## 赛道匹配

| 评判维度 | 我们的设计 |
|----------|-----------|
| **AI + Privacy** | AI 分析 + Aleo ZK 验证，核心赛道 |
| **链上可验证** | Leo 合约 `is_authorized` + `check_access` 在 Testnet 可执行 |
| **用户自主权** | 钱包授权 + 4 类数据独立控制，用户控制一切 |
| **实用性** | 医疗/健康是真实刚需场景 |

## 合约部署

**Testnet 已部署！**

| 项目 | 值 |
|------|-----|
| 交易 ID | `at1tlrj2xsah3yxsxjkdsehc48qrysp8f5zy4jy3lt3v4gmwfymuu8s8cr053` |
| 合约地址 | `aleo1kdldc7kk6594c0zd6jy...` |
| 费用 | 5.19 credits |
| 程序大小 | 1.99 KB |
| 网络 | Aleo Testnet |
| 函数数 | 4 个 |
| 合约版本 | v2 已部署, v3 源码在 `privacy_ai_helper/src/main.leo`（修复了查询函数的 assert 模式） |

---

## 技术架构

```
+-------------+       +--------------+       +------------------+
|  React 前端  | ----> | Express 后端  | ----> | Ollama (本地AI)  |
| Aleo Wallet |       | Privacy Tag 生成|       | Qwen2.5 1.5B    |
+------|------+       +------|-------+       +------------------+
       |                      |
       | 钱包连接 + 授权签名   | 数据类别哈希上链
       v                      v
+------------------------------------+
|      Aleo Testnet (Leo 合约)        |
|  - grant_access / revoke_access     |
|  - check_access (查询授权状态)      |
|  - is_authorized (ZK 验证 + 过期)   |
+------------------------------------+
```

---

## Leo 合约核心函数

| 函数 | 签名 | 功能 | 隐私保护方式 |
|------|------|------|-------------|
| `grant_access` | `(category_id: u8) -> Final` | 用户授权某数据类别 | 合约内 Poseidon2 生成哈希键，链上只存 field |
| `check_access` | `(category_id: u8) -> Final` | 查询某类别授权状态 | assert 模式：调用成功=已授权，revert=未授权。外部无法反推类别 |
| `revoke_access` | `(category_id: u8) -> Final` | 撤销单个类别授权 | 指定类别键值清零，不影响其他已授权类别 |
| `is_authorized` | `(owner, category_id, max_age) -> Final` | 验证授权 + 过期检查 | assert 模式：成功=已授权且未过期，revert=未授权/已过期。含 block.height 时效判断 |
| `Poseidon2::hash_to_field` | 内联调用 | 类别ID转Poseidon2哈希 | 每个函数内联执行，非独立函数 |

合约已通过 `leo build` 编译并部署到 Aleo Testnet。

## 数据边界设计

### 类别哈希生成规则

使用 **Poseidon2 哈希函数**（Aleo 原生 ZK 友好哈希）将类别名转换为链上 field 值。

**规则：** 合约调用 `Poseidon2::hash_to_field(category_id)`，传入 1-4 的数字 ID。Leo 合约中预定义了 `CATEGORY_HEALTH = 1u8` 等 4 个常量，`match` 校验只接受这 4 个值。

| 类别 | category_id | 输入 | 说明 |
|------|------------|------|------|
| 健康数据 | 1 | `Poseidon2(1u8)` | 血压、心率、病史 |
| 基因数据 | 2 | `Poseidon2(2u8)` | DNA、遗传信息 |
| 财务数据 | 3 | `Poseidon2(3u8)` | 收入、支出、投资 |
| 其他数据 | 4 | `Poseidon2(4u8)` | 其他授权类别 |

**为什么用 Poseidon2 而非 SHA256？**
- Poseidon2 是 Aleo Leo 原生哈希函数，可在链上直接计算和验证
- 任何人可以独立复算验证：`Poseidon2::hash_to_field(1u8)` 必然得到相同的 field 值
- 零知识友好，适合 SNARK 电路中的约束生成

### 多类别独立授权

合约使用 `mapping(field => field)` 结构，键为 `Poseidon2(user_addr, category_hash)`：

| 用户操作 | 合约状态变化 |
|---------|-------------|
| 授权健康(category_id=1) | `authorizations[Poseidon2(addr, hash(1))] = block.height` |
| 再授权基因(category_id=2) | `authorizations[Poseidon2(addr, hash(2))] = block.height` |
| 撤销基因(category_id=2) | `authorizations[Poseidon2(addr, hash(2))] = 0` |

每个 (用户, 类别) 组合是独立授权位，互不干扰。外部观察者只能看到 field 值的增删，无法区分是血压还是基因。

## 两层证明体系

Privacy AI Helper 采用**链上 ZK + 链下承诺**双层架构：

| 层级 | 技术 | 功能 | 谁可以验证 |
|------|------|------|-----------|
| **Layer1 — 链上** | Aleo Leo `is_authorized` | 验证用户授权过某类别 | 任何人查 Aleo 链 |
| **Layer2 — 链下** | SHA256 Privacy Tag | 绑定 AI 请求与授权上下文 | 任何人重放计算 |

### 为什么需要两层？

只存链上授权状态 = 无法证明"AI 这次确实用了授权约束"。
AI 可以无视授权、自由回答任何问题。

Layer2 的 Privacy Tag 把授权上下文与 AI 输出绑定：
`Privacy_Tag = SHA256(category_id | answer | timestamp)`

后端无法事后伪造 —— 任何人可用相同输入重算验证。

### 完整交互流程

```
① 用户连接钱包 → wallet.connect()
② 选择数据类别 → 前端设置 category_id = 1 (健康)
③ POST /api/ask {prompt, category_id: 1, address}
         │
④ 后端查询链上: is_authorized(address, category_id=1, max_age) → true/false
         │
⑤ 后端构建约束 prompt: "你只能基于健康数据范围回答。"
         │
⑥ Ollama 本地推理 → AI 回答（数据不出电脑）
         │
⑦ 生成 Privacy Tag = SHA256(category_id + answer + timestamp)
         │
⑧ 返回前端: {answer, privacy_tag, category_id, contract_tx}
         │
⑨ 前端展示: ✅ 回答 + ✅ Privacy Tag + ✅ 链上验证链接
```

### 核心隐私抗辩

> 原始数据**从不离开用户电脑**。Ollama 本地推理完全离线。
> Aleo 链上只存 Poseidon2 field 值 —— 即使下载整个区块链，也无法反推用户的授权类别。
> 这就是 **用 ZK 划清数据边界** 的真正含义。

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
│   └── src/main.leo       # 隐私授权合约（4 函数，已部署到 Testnet）
├── 一键启动.bat            # Windows 全栈一键启动
├── README.md              # 项目方案书
├── DEMO_SCRIPT.md         # Demo 演示脚本
├── PITCH_DECK.md          # 路演 PPT 逐字稿
├── PROJECT_OVERVIEW.md    # 项目说明文档
├── TEST_GUIDE.md          # 测试操作流程（13 项）
└── SUBMISSION_CHECKLIST.md # 提交清单
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
3. **AI 回答 + Privacy Tag 双输出** — 每次回答附带 SHA256 可用性承诺，链上 Poseidon2 ZK 哈希不可反推
4. **本地 AI 推理** — 数据不出用户电脑，彻底隐私保护
5. **一键启动** — 双击 `.bat` 文件即可跑通全栈，降低评委复现成本

---

## 为什么选 Aleo？赛道对比

| 项目 | 定位 | ZK 哈希 | 合约语言 | 适合做授权门禁？ |
|------|------|---------|---------|----------------|
| **Aleo** | 可编程隐私 L1 | Poseidon2 (原生) | Leo | **:heavy_check_mark: `mapping(field=>field)` 即 ZK storage** |
| Aztec | 隐私交易 L2 | Pedersen | Noir | 偏交易，不支持 field→field ZK mapping |
| Tornado | 隐私混币器 | MiMC | Solidity | 单一功能，不可编程 |
| zkSync | ZK Rollup L2 | SHA256/Keccak | Solidity | 无原生 ZK 存储概念 |
| Mina | 轻量 ZK L1 | Poseidon | SnarkyJS | ZK 强但存储限制严格 |

**选择 Aleo 的核心原因：** Poseidon2 是 Aleo 合约的原语，`Mapping::set/get` 默认在 SNARK 约束内。我们的多类别独立授权模型依赖 `Poseidon2(user_addr, category_hash)` 作为 ZK 友好的键值结构 —— 这在其他链上需要手写电路，在 Aleo 上是 3 行代码。

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
