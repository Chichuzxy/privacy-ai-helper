# Pitch Deck — Privacy AI Helper

> Aleo Hackathon — AI × Privacy Track

---

## Slide 1: 标题页

**Privacy AI Helper**

隐私保护的 AI 健康顾问

*Aleo Hackathon 2026 — AI × Privacy Track*

*Chichuzxy*

---

## Slide 2: 问题

### 你的AI助手，正在偷看你的数据

- 每次问AI健康问题，你都在暴露敏感信息
- 血压、心率、病史 —— 你无法控制AI如何使用这些数据
- "同意隐私政策"只是一个按钮，不是真正的保护

**用户需要：** 
- 精细控制 AI 能访问哪些数据
- 可验证的隐私保护证明
- 数据不离开自己的设备

---

## Slide 3: 解决方案

### AI 分析能力 + Aleo 零知识证明 = 真正的隐私

| 用户操作 | 隐私保护 |
|----------|---------|
| 连接 Aleo 钱包 | 匿名身份，不暴露个人信息 |
| 选择数据类别 | 精细授权 (健康/财务/基因) |
| 向 AI 提问 | Ollama 本地推理，数据不出电脑 |
| 获得回答 + Privacy Tag | 链上可验证，不泄露原始数据 |

**一条龙：授权 → 本地AI分析 → Privacy Tag + 链上 ZK → 链上可查**

---

## Slide 4: 技术架构 — ZK 数据边界

### 三层隐私防线

```
第一层：本地 AI 推理
Ollama + Qwen2.5 在用户电脑运行
原始数据（血压值/心率/病史）从不离开设备

第二层：ZK 授权边界
合约存储 Poseidon2(user_addr, category_hash)
链上观察者只能看到 field 值，无法反推类别名
授权 = 在隐私边界上开一道门，门牌号是 Poseidon2 哈希

第三层：可用性承诺（Privacy Tag）
每次 AI 请求附带 Privacy Tag
= SHA256(category_id + AI输出 + 时间)
任何人可重算验证，确保 AI 确实在授权范围内推理
```

### 为什么选 Aleo？

| 维度 | Aleo 的优势 |
|------|-----------|
| 原生 ZK 哈希 | Poseidon2 是合约原语，不需要外部预言机 |
| field 类型 | 天然适合存哈希，SHA256 转 field 有损耗 |
| 隐私默认 | SNARK 验证内置于共识层，不是后加功能 |
| Leo 语言 | 开发者无需手写电路，`mapping` 即 ZK storage |

---

## Slide 5: 创新点

| # | 创新 | 说明 |
|---|------|------|
| 1 | **数据类别授权制** | 不是"全有或全无"，精细控制 |
| 2 | **链上哈希存证** | 不存原始数据，但可验证行为 |
| 3 | **AI + Privacy Tag 双输出** | 每次回答附带 SHA256 可用性承诺 + 链上 Poseidon2 ZK 验证 |
| 4 | **本地 AI 推理** | 数据不出电脑，彻底隐私 |
| 5 | **一键启动** | 双击即跑，降低评委复现成本 |

---

## Slide 6: 合约部署 & 演示

**Aleo Testnet 已部署！**
- 交易: `at1tlrj2xsah...`
- 费用: 5.19 credits | 大小: 1.99 KB

**演示截图：**
1. 深色极简 UI + 连接钱包按钮
2. 选择数据类别：健康数据
3. 提问："我的血压135/85正常吗？"
4. AI 中文回答 + Privacy Tag 展示
5. Testnet 交易记录可查

---

## Slide 7: 真实场景用例

### 慢性病患者长期健康追踪

**角色：** 糖尿病患者，每天测血糖

| 环节 | 传统做法 | Privacy AI Helper |
|------|---------|-------------------|
| 数据存储 | 上传云端，无隐私控制 | 本地存储，Ollama 推理不出电脑 |
| AI 分析 | ChatGPT 上传血糖趋势 | 本地 AI 分析，授权"健康数据"后可用 |
| 隐私证明 | 无 | Aleo 链上 Poseidon2 哈希记录每次授权 |
| 撤销 | 删除账号，数据可能被保留 | `revoke_access(category_id=1)` 链上清零，不可恢复 |
| 合规 | 不知道数据在哪 | 链上审计轨迹完整，GDPR/个人信息保护法友好 |

**一句话：** "每天测 3 次血糖，测了 3 年 —— 这些数据不属于医院，不属于 AI 公司，只属于你自己。Privacy AI Helper 让你用 AI 分析健康趋势，同时用 Aleo ZK 证明你从未授权过基因数据。"

---

## Slide 8: 未来规划 & 感谢

**下一步：**
- Aleo 主网部署
- 多类别联合授权
- 移动端适配

**感谢评委！**

*Build the Future of Programmable Privacy*
