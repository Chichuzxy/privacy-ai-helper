# Submission Checklist — Privacy AI Helper

> Aleo Hackathon 2026 · AI x Privacy Track
> 截止日期: 2026.08.14 23:59

---

## 必须提交

| # | 项目 | 路径/内容 | 状态 |
|---|------|----------|------|
| 1 | GitHub Repo | `https://github.com/Chichuzxy/privacy-ai-helper` | [x] |
| 2 | README.md | 项目方案书（问题/方案/架构/创新） | [x] |
| 3 | Demo 视频 | 3 分钟内，按 DEMO_SCRIPT.md 录制 | [ ] |

---

## 路演材料

| # | 项目 | 路径/内容 | 状态 |
|---|------|----------|------|
| 4 | Demo 脚本 | `DEMO_SCRIPT.md`（3 轮对话含授权边界演示） | [x] |
| 5 | PPT / Pitch Deck | `PITCH_DECK.md` → 转 PowerPoint 8 页 | [ ] |
| 6 | 项目说明 | `PROJECT_OVERVIEW.md`（技术栈/创新点/完成度） | [x] |

---

## 合约 & 部署

| # | 项目 | 路径/内容 | 状态 |
|---|------|----------|------|
| 7 | 合约源码 | `privacy_ai_helper/src/main.leo`（v3: 4 函数 + assert 查询模式 + Poseidon2 内联调用） | [x] |
| 8 | 合约部署 | Aleo Testnet，tx `at1tlrj2xsah...`，5.19 credits | [x] |
| 9 | 浏览器验证 | Provable Explorer 链接可查 | [x] |

---

## 部署留存

| # | 项目 | 路径/内容 | 状态 |
|---|------|----------|------|
| 10 | 部署记录 | `README.md` 含部署记录章节 | [x] |
| 11 | 环境变量 | `privacy_ai_helper/.env`（私钥已在 .gitignore 排除） | [x] |
| 12 | 编译产物 | `privacy_ai_helper/build/`（Leo 编译输出） | [x] |

---

## 降级方案 (Plan B)

| # | 场景 | 应对 |
|---|------|------|
| 13 | 钱包降级 | 未安装钱包时弹出中文提示，改用地址输入框手动粘贴 |
| 14 | Ollama 不可用 | `?demo=true` 参数返回预设中文回答 |
| 15 | Aleo Testnet 不可达 | 展示本地方案：合约源码 + 编译产物 + 部署日志 |

---

## 文档一致性检查

| # | 检查项 | 路径/内容 | 状态 |
|---|--------|----------|------|
| 16 | README.md | 函数名/数量(4个)/合约大小与源码一致 | [x] |
| 17 | PITCH_DECK.md | Slide 4 三层防线 + Slide 7 真实场景 | [x] |
| 18 | DEMO_SCRIPT.md | 3 轮对话 + Q&A 弹药库 | [x] |
| 19 | 测试指南 | `TEST_GUIDE.md`（13 项功能测试 + 排错） | [x] |
| 20 | PROJECT_OVERVIEW.md | 章节编号正确，数据与部署记录一致 | [x] |
| 21 | SUBMISSION.md | Why Privacy + PMF + 合约详情提交内容完整 | [x] |
| 22 | 授权管理面板 | 4 类别独立授权/撤销/期限/哈希存证 | [x] |

---

## 最终自检

- [x] 合约 `main.leo` 含 `Poseidon2::hash_to_field` 显式调用
- [x] 前端 `npm run build` 0 error
- [x] 后端 `node --check backend/index.js` 0 error
- [x] 后端授权守卫 8/8 测试通过（curl 全端点验证）
- [x] 文档 7 份 md 全部无乱码、无旧 tx 残留
- [x] 录屏设置：1920x1080, 100% 缩放
- [ ] 录制 3 分钟 Demo 视频
- [ ] PITCH_DECK.md 转 PowerPoint
- [x] `.env` 已在 `.gitignore` 排除
- [x] `git push` 已推送
