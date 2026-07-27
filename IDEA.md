# Privacy AI Helper - 项目状态笔记

Aleo Hackathon 2026 - AI x Privacy Track

## 当前架构

- 前端: React + Vite，手动地址输入框替代钱包插件连接
- 后端: Express + Node.js，授权守卫 + Privacy Tag 生成
- AI: Ollama + Qwen2.5 1.5B 本地推理
- 合约: privacy_ai_helper_v2.aleo 已部署 Testnet (5.19 credits)
- tx: at1tlrj2xsah3yxsxjkdsehc48qrysp8f5zy4jy3lt3v4gmwfymuu8s8cr053

## 已完成

- [x] 深色极简 UI + 中英双语切换 + 4 类数据选择器
- [x] 本地 AI 后端对接 Ollama（中文/英文回答均正常）
- [x] Leo 合约 4 函数 + Poseidon2 多类别独立授权，已部署 Testnet
- [x] Privacy Tag（SHA256 链下承诺）生成与前端展示
- [x] 后端授权守卫（Demo 模拟链上 is_authorized，3 轮对话模式）
- [x] 一键启动.bat
- [x] 6 份文档（README/PROJECT_OVERVIEW/PITCH_DECK/DEMO_SCRIPT/TEST_GUIDE/SUBMISSION_CHECKLIST）

## 待办

- [ ] 录制 3 分钟 Demo 视频（按 DEMO_SCRIPT.md）
- [ ] PITCH_DECK.md 转 PowerPoint 7 页
- [ ] 提交 Hackathon（截止 8.14）
