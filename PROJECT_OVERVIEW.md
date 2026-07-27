# Privacy AI Helper — 项目说明文档

> Aleo Hackathon 2026 · AI × Privacy Track
>
> 一句话：**用 Aleo 零知识证明保护用户隐私的本地 AI 健康顾问。**

---

## 一、做什么的

用户连接 Aleo 钱包，选择要授权的数据类别（如"健康数据"），向本地 AI 提问（如"血压135/85正常吗？"），AI 在本地推理后返回答案。每次回答附带一条 Privacy Tag 哈希，链上可验证。

**核心闭环：连接钱包 → 选择数据类别 → AI 问答 → Privacy Tag + 链上 ZK → 链上可查。**

---

## 二、技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| 前端 | React 19 + Vite + CSS | 深色 ChatGPT 风 UI，含钱包连接、数据类别选择、中英切换 |
| 后端 | Express (Node.js) | Ollama 对接、Privacy Tag 生成、隐私 prompt 构建 |
| AI 模型 | Ollama + Qwen2.5 1.5B | 本地推理，数据不出用户电脑 |
| 区块链 | Aleo Testnet + Leo 4.x | 隐私授权合约，链上哈希存证 |
| 钱包 | Leo Wallet + 手动地址输入 | 浏览器插件复制地址 → 前端文本框粘贴 |
| 合约 | Leo (privacy_ai_helper_v3.aleo) | 4 个函数：grant/revoke/check_access/is_authorized，assert 查询模式 |

---

## 三、创新点

| # | 创新 | 详细 |
|---|------|------|
| 1 | **数据边界划清** | 使用 Poseidon2 哈希 + 多类别独立授权 mapping，每个 (用户, 类别) 都是独立授权位。不是"全有或全无"的权限，而是精细控制数据边界 |
| 2 | **链上哈希不可反推** | 合约只存 `field` 哈希，Poseidon2 是单向函数——观察者只能看到数字，无法反推类别名 |
| 3 | **两层证明体系** | Layer1 链上 ZK（Aleo `is_authorized`）+ Layer2 链下承诺（Privacy Tag = SHA256 绑定），确保 AI 回答在授权范围内 |
| 4 | **本地 AI 推理** | Ollama 在用户电脑本地跑，原始数据从不离开设备 |
| 5 | **时间维度过期控制** | 合约 mapping 值即时间戳，`is_authorized` 含 `max_age` 参数，授权不是永久的，到期自动失效 |
| 6 | **一键启动** | 双击 `.bat` 自动拉起 Ollama + 后端 + 前端 + 浏览器 |

---

## 四、合约函数（4 个，v3 assert 模式）

| 函数 | 签名 | 功能 | 隐私设计 |
|------|------|------|---------|
| `grant_access` | `(category_id: u8) -> Final` | 授权某数据类别 | 合约内 Poseidon2 生成哈希键，链上只存 field |
| `check_access` | `(category_id: u8) -> Final` | 查询授权状态 | assert 模式：成功=已授权，revert=未授权 |
| `revoke_access` | `(category_id: u8) -> Final` | 撤销单个类别 | 指定类别清零，不影响其他授权 |
| `is_authorized` | `(owner, category_id, max_age) -> Final` | ZK 验证 + 过期 | assert 模式：成功=已授权且未过期。Leo v2 Final 限制，Mapping 返回值无法直接传出 |

---

## 五、项目完成度

| 模块 | 完成项 | 状态 |
|------|--------|------|
| 前端 | 钱包连接 + 聊天 UI + 数据类别选择 + 中英切换 | ✅ Done |
| 后端 | Ollama 对接 + Privacy Tag 生成 + 隐私 prompt 构建 | ✅ Done |
| AI | Qwen2.5 1.5B 中文推理正常 | ✅ Done |
| 合约 | 4 函数，已编译，**已部署到 Aleo Testnet** | ✅ Done |
| 文档 | README + DEMO_SCRIPT + PITCH_DECK + PROJECT_OVERVIEW | ✅ Done |
| 启动 | 一键启动.bat（Ollama + 后端 + 前端 + 浏览器） | ✅ Done |
| GitHub | https://github.com/Chichuzxy/privacy-ai-helper | ✅ Done |

## 六、合约部署记录

| 项目 | 值 |
|------|-----|
| 交易 ID | `at1tlrj2xsah3yxsxjkdsehc48qrysp8f5zy4jy3lt3v4gmwfymuu8s8cr053` |
| 合约地址 | `aleo1kdldc7kk6594c0zd6jy...` |
| 部署费用 | 5.19 credits |
| 程序大小 | 1.99 KB / 2000 KB |
| 变量数 | 89,079 / 2,097,152 |
| 约束数 | 63,949 / 2,097,152 |
| 网络 | Aleo Testnet |
| 确认 | 1 区块 |

---

## 七、全链路验证记录

| 检查项 | 结果 |
|--------|------|
| 前端 `npm run build` | 15 modules, 0 errors |
| 后端 `node --check` | SYNTAX OK |
| 合约 语法（4 函数、括号匹配） | PASS |
| Ollama 中文推理 | "你好！我是阿里云..." |
| API `/api/ask` 真实调用 | answer + privacy_tag 正常返回 |
| 文档完整性（4 个 md） | PASS |

---

## 八、待办

| 事项 | 做法 |
|------|------|
| 录 Demo 视频 | Win+G 录屏，按 DEMO_SCRIPT.md 演 3 分钟 |
| 做 PPT | 把 PITCH_DECK.md 内容贴进 PowerPoint |
| 提交比赛 | 截止 8 月 14 日，目前代码和文档已就绪 |

---

> 项目路径：`E:\XZ\tuanduei\BSxm\AI-Xiaozhushou\`
>
> GitHub：`https://github.com/Chichuzxy/privacy-ai-helper`
