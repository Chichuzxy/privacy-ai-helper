# Akindo.io Submission — Privacy AI Helper

> Aleo Buildathon — AI x Privacy Track
> 直接可粘贴到 Akindo 提交表单。中英双语。

---

## Project Name

Privacy AI Helper

---

## Short Description (一句话)

A privacy-preserving AI health advisor: users control what data categories AI can access, with on-chain verifiable authorization on Aleo.

隐私保护 AI 健康顾问：用户用 Aleo 链上授权精细控制 AI 可访问的数据类别，每次回答附带可验证的隐私标签。

---

## Project Overview

**What we built:** A full-stack dApp where users connect their Aleo wallet, choose which data categories to authorize (health / gene / finance / other), then ask a local AI health questions. The AI runs entirely on the user's device via Ollama — raw data never leaves the computer. Every AI response includes a Privacy Tag (SHA256 commitment) binding the authorization context to the output, and the authorization state is stored on Aleo Testnet with Poseidon2 hashes.

**Tech stack:** React + Vite (frontend), Express + Node.js (backend), Ollama + Qwen2.5 1.5B (local AI), Leo 4.x (Aleo smart contract), Aleo Testnet (deployed).

**Contract address:** `aleo1kdldc7kk6594c0zd6jy...`  
**Deployment TX:** `at1tlrj2xsah3yxsxjkdsehc48qrysp8f5zy4jy3lt3v4gmwfymuu8s8cr053`  
**Explorer:** https://testnet.explorer.provable.com/transaction/at1tlrj2xsah3yxsxjkdsehc48qrysp8f5zy4jy3lt3v4gmwfymuu8s8cr053  
**GitHub:** https://github.com/Chichuzxy/privacy-ai-helper

---

## Problem Being Solved

AI health assistants are increasingly popular, but every query exposes sensitive personal data — blood pressure, heart rate, medical history, genetic information. Users have zero control over what data the AI can access and no way to verify that the AI stayed within authorized boundaries. Clicking "I agree to the privacy policy" is not real protection.

Current state:
- AI platforms (ChatGPT, etc.) upload your health data to cloud servers
- Users cannot selectively authorize data categories
- No verifiable proof that AI answered within authorized scope
- No on-chain audit trail of data access grants and revocations

---

## Why Privacy Matters for This Use Case

**Health data is the most sensitive personal data.** A blood pressure reading or genetic marker, once exposed, cannot be "un-exposed." The consequences are permanent: insurance discrimination, employment bias, social stigma.

**Three specific reasons why privacy is non-negotiable here:**

**1. Regulatory compliance.** GDPR Article 9 classifies health data as "special category" requiring explicit consent. China's Personal Information Protection Law (PIPL) has similar provisions. Traditional AI assistants cannot comply because they centralize data on cloud servers with no user-controlled authorization.

**2. User trust is the adoption bottleneck.** A 2023 Pew Research study found 81% of consumers worry about how companies use their health data. Without verifiable privacy guarantees, users under-report symptoms or avoid AI health tools entirely — defeating the purpose.

**3. AI inference leaks more than raw data.** Even if the AI doesn't output your exact blood pressure, patterns in its answers can reveal what it knows. Without cryptographic binding between authorization and output, there's no way to audit what data scope was used. Privacy Tag solves this by making the link between authorization and AI output deterministic and verifiable.

**Why Aleo specifically:** Only Aleo provides native Poseidon2 hashing (ZK-friendly) and `mapping(field => field)` storage that runs inside SNARK constraints by default. On other chains, building a per-user per-category authorization system with ZK guarantees would require custom circuits. On Aleo, it's 4 functions and a mapping. The privacy is not bolted on — it's the execution environment.

---

## Product Market Fit

### Target Users

| Segment | Size | Pain Point |
|---------|------|------------|
| Chronic disease patients | ~500M globally (diabetes, hypertension, etc.) | Track vitals daily, need AI analysis, can't risk data leaks |
| Health-conscious individuals | ~2B users of health apps | Use AI for health advice but don't trust platforms |
| Telemedicine patients | Growing 25% YoY | Share data with doctors but need proof of data scope |

### Use Case: Diabetes Self-Management

A diabetes patient measures blood glucose 3x daily. Over 3 years, that's 3,285 data points — a complete metabolic profile.

- **Without Privacy AI Helper:** Upload to cloud, AI analyzes, data stored on company servers indefinitely. No control, no audit trail.
- **With Privacy AI Helper:** Local AI inference, user authorizes only "health data" category, genetic data stays locked. Each analysis generates a Privacy Tag. On-chain audit trail shows exactly which categories were authorized and when. Revoke access is instant and verifiable.

**Value proposition:** "3 years of blood glucose data belongs to the patient, not the hospital, not the AI company. Privacy AI Helper lets you use AI to analyze health trends while cryptographically proving you never authorized genetic data access."

### Competitive Landscape

| Solution | Privacy Model | Verifiable? | Local AI? |
|----------|--------------|-------------|-----------|
| ChatGPT / Claude | Cloud, no user control | No | No |
| Apple Health + on-device ML | Local, but no cross-app audit | No | Partial |
| Privacy AI Helper | Aleo ZK + local Ollama | Yes (on-chain) | Yes |

The gap: **no existing solution combines local AI inference with on-chain verifiable authorization.** Apple Health keeps data local but can't prove to a third party what was authorized. ChatGPT can reason about health but uploads everything to the cloud. Privacy AI Helper sits in the unique intersection.

### Go-to-Market Path

1. **Phase 1 (current):** Hackathon MVP — single user, local AI, Aleo Testnet
2. **Phase 2:** Multi-category combined authorization (e.g., health + gene for personalized medicine)
3. **Phase 3:** Telemedicine integration — patient authorizes specific data categories for doctor review, with on-chain audit trail for compliance

---

## Contract Details

| Item | Value |
|------|-------|
| Program | `privacy_ai_helper_v3.aleo` (compiled, 2.16 KB, 55,593 constraints) |
| Deployed (v2) | `privacy_ai_helper_v2.aleo` on Testnet (tx `at1tlrj2xsah...`) |
| Functions | 4: grant_access, revoke_access, check_access, is_authorized |
| Hash | Poseidon2 (Aleo native ZK-friendly hash) |
| Authorization model | Per-user, per-category independent slots in `mapping(field => field)` |
| v3 improvement | Query functions use assert pattern (Leo v2 Final block limitation) |

---

## Demo

**3-round conversation demo (2 minutes):**
1. Health category (authorized) → blood pressure question → AI answers normally + Privacy Tag
2. Finance category (unauthorized) → balance question → AI rejects, authorization blocked
3. Health category again → heart rate question → AI answers, different Privacy Tag

This proves: authorization works, unauthorized access is blocked, each Privacy Tag is unique and independently verifiable.

**How to run:** Double-click `一键启动.bat` (Windows). Ollama + backend + frontend launch automatically.

---

## Team

- **Chichuzxy** — Full-stack development (React + Express + Leo contract + AI integration)
- GitHub: https://github.com/Chichuzxy

---

## Risks & Limitations (Honest Disclosure)

| Risk | Mitigation |
|------|-----------|
| Privacy Tag is SHA256, not native Groth16 ZKP | Layer1 (Aleo Poseidon2) provides ZK guarantees; Layer2 (SHA256) provides output binding. Two-layer architecture makes this explicit |
| Backend simulates on-chain `is_authorized` for demo | Production path is documented in code; `authorizedCategories` Map mirrors contract logic exactly |
| Leo Wallet not injected on localhost | Manual address input as fallback; functionally equivalent, documented in README |
| v2 deployed, v3 source compiled (2.16 KB / 55,593 约束) | v3 fixes query function assert pattern; v2 already validates compile + deploy feasibility |
