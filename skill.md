# 🛠️ Skill：讓使用者回報意見、上架 GitHub、並用 AI 協同修改上版

這份文件記錄「天氣 App」從本機開發 → 上 GitHub → 開放手機使用 → 收集使用者意見 → 協同修改上版」的完整流程，照著做就能複製整套機制。

> 範例帳號／repo：`zoechang-github/taiwan-weather-ai`
> 線上網址：`https://zoechang-github.github.io/taiwan-weather-ai/`
> 請把上面換成你自己的帳號 / repo 名稱。

---

## 目錄
1. [整體架構（先看這個）](#1-整體架構)
2. [本機跑起來](#2-本機跑起來)
3. [上傳到 GitHub](#3-上傳到-github)
4. [啟用 GitHub Pages（手機可開）](#4-啟用-github-pages)
5. [意見回饋功能怎麼運作](#5-意見回饋功能)
6. [收到 Issue 後如何協同修改上版](#6-協同修改上版)
7. [（進階）讓 AI 自動開 PR](#7-進階讓-ai-自動開-pr)
8. [需要的 token / 金鑰總表](#8-token--金鑰總表)
9. [常見問題](#9-常見問題)

---

## 1. 整體架構

```
使用者（手機/電腦）
   │ 在 App 點 💬 填意見
   ▼
GitHub Issue（自動預填標題/內文/標籤 feedback）
   │
   ▼
你（或 AI）依 Issue 修改程式 → 開 Pull Request
   │
   ▼
你 Review → Merge（這就是「approval 上版」）
   │
   ▼
GitHub Pages 自動重新部署 → 手機網址看到最新版 🎉
```

重點觀念：這是**純前端**專案。AI 對話（Gemini）與天氣（Open-Meteo）都由瀏覽器直接呼叫，**沒有後端伺服器**。所以「自動開 PR、自動改 code」這種需要金鑰的動作，必須放在 GitHub 伺服器端（GitHub Actions），不能放前端（會外洩金鑰）。

---

## 2. 本機跑起來

純前端、免安裝套件，只要一個本機伺服器：

```bash
cd 你的路徑/taiwan-weather-ai
python3 -m http.server 8080      # 或：npx serve -l 8080
```
瀏覽器開 `http://localhost:8080`，點 ⚙️ 貼上 Gemini API Key（天氣免金鑰）。

> ⚠️ 不要直接雙擊 `index.html`（`file://` 會有安全限制），一定要透過 `http://localhost`。
> 💡 改完程式按 `Cmd+Shift+R` 強制重整，避免瀏覽器快取騙人。

---

## 3. 上傳到 GitHub

### 3-1. 本機初始化 git（只需一次）
```bash
cd 你的路徑/taiwan-weather-ai
git init
git add .
git commit -m "初始版本"
git branch -M main
```

### 3-2. 在 GitHub 建立「空」repo
1. 打開 <https://github.com/new>
2. **Repository name**：`taiwan-weather-ai`（與本機資料夾同名）
3. **Public**（要讓別人回報意見、要用免費 Pages，就必須 Public；金鑰不在程式碼裡，不會外洩）
4. ⚠️ **不要勾** Add README / .gitignore / license（本機已有，勾了會衝突）
5. **Create repository**

### 3-3. 設定遠端並推送
```bash
git remote add origin https://github.com/你的帳號/taiwan-weather-ai.git
git push -u origin main
```
推送時的登入：
- **Username**：你的 GitHub 帳號
- **Password**：貼上 **Personal Access Token（PAT）**，不是密碼！

### 3-4. 如何取得 PAT（第一次推送用）
1. <https://github.com/settings/tokens> → **Generate new token** → **Tokens (classic)**
2. Note 隨意、Expiration 選 90 天、勾選範圍 **`repo`**
3. **Generate token** → 立刻複製 `ghp_...`（離開頁面就看不到了）

> 之後日常更新只要三行：`git add .` → `git commit -m "..."` → `git push`

---

## 4. 啟用 GitHub Pages

讓專案有一個手機可開的網址。

1. 打開 `https://github.com/你的帳號/taiwan-weather-ai/settings/pages`
2. **Source** 選 **Deploy from a branch**
3. **Branch** 選 **main** / **/ (root)** → **Save**
4. 等 1～2 分鐘，網址為：
   `https://你的帳號.github.io/taiwan-weather-ai/`
5. 手機用一般瀏覽器（Safari/Chrome）打開即可；可「加入主畫面」變成像 App 的圖示。

> 每台裝置的 Gemini 金鑰要各自輸入一次（localStorage 不跨裝置）。
> Pages 只部署 `main` 分支內容，所以改動要 merge 進 main 才會上線。

---

## 5. 意見回饋功能

### 使用者怎麼回報
App 右上角 💬 → 選類型 + 填意見 → 送出 → 自動開啟 GitHub「新 Issue」頁（已預填標題/內文/`feedback` 標籤）→ 對方按「Submit new issue」完成。

### 程式在哪、怎麼運作
- 程式：`js/app.js` 的 `submitFeedback()`，目標 repo 設在最上面 `const GITHUB_REPO = '你的帳號/taiwan-weather-ai'`。
- 原理：**不是用 API 直接寫入**，而是把內容組成 GitHub 支援的「預填網址」並 `window.open()`。好處：零後端、零 token，最安全。
- 關鍵：`encodeURIComponent()` 把中文/換行轉成網址安全字元。

### 必做的設定
1. repo 必須存在且 **Public**（Private 會讓沒權限的人看到 404）。
2. 建立 `feedback` 標籤：repo → **Issues → Labels → New label** → 名稱 `feedback` → Create。

---

## 6. 協同修改上版

收到 Issue 後，最簡單免費的方式：**你 + AI（Claude Code / App 內的 Gemini）一起改**，再用「分支 + PR」走正規流程。

```bash
# 1. 從乾淨的 main 開新分支
git checkout main
git pull
git checkout -b feature/簡短描述

# 2. （改好程式後）提交；用 Closes #編號 讓合併後自動關閉該 Issue
git add .
git commit -m "依 Issue #3 新增未來七天預報

Closes #3"

# 3. 推上分支
git push -u origin feature/簡短描述
```
接著到 GitHub：**Compare & pull request** → **Create pull request** → Review 變更 → **Merge** → **Delete branch**。

合併後同步本機：
```bash
git checkout main
git pull
```
> merge 進 main 後 Pages 會自動重新部署，手機網址 1～2 分鐘後看到最新版。
> 「你按 Merge」就是你要的 approval 上版。

---

## 7. （進階）讓 AI 自動開 PR

用官方 **Claude Code GitHub Action**：Issue 帶 `feedback` 標籤 → 自動觸發 AI 讀 Issue、改 code、開 PR；你只負責最後 Review/Merge。

設定檔已在 `.github/workflows/claude-issue-to-pr.yml`。啟用步驟：

### 認證二選一
| 方式 | 適合 | 設定 |
|---|---|---|
| **訂閱 OAuth token** | 有 Claude Pro/Max 訂閱、不想另外付 API 費 | 本機跑 `claude setup-token` 取得 token |
| **API 金鑰** | 願意按用量付費 | 到 <https://console.anthropic.com> 建立 `sk-ant-...` |

> 注意：OAuth 路線「不額外收費」，但會消耗你訂閱的用量額度（與 claude.ai 共用）。

### 加入 repo secret
repo → **Settings → Secrets and variables → Actions → New repository secret**：
- 用 OAuth：名稱 `CLAUDE_CODE_OAUTH_TOKEN`
- 用 API key：名稱 `ANTHROPIC_API_KEY`（並把 workflow 內的 `claude_code_oauth_token` 換回 `anthropic_api_key`）

### 其他
- repo → **Settings → Actions → General** → 允許 Actions 執行。
- GitHub Actions 分鐘數免費額度：Public 每月 2000 分鐘、Private 免費帳號 500 分鐘。超過才計費。
- 測試：開一則帶 `feedback` 標籤的 Issue → 看 **Actions** 分頁有沒有跑 → 完成後 **Pull requests** 會出現 AI 的 PR。

---

## 8. token / 金鑰總表

| 名稱 | 用途 | 哪裡拿 | 放哪裡 | 免費？ |
|---|---|---|---|---|
| **GitHub PAT** (`ghp_...`) | `git push` 推送認證 | github.com/settings/tokens（classic，勾 `repo`） | 推送時當密碼貼上 | ✅ 免費 |
| **Gemini API Key** | App 內 AI 協同設計 | aistudio.google.com/app/apikey | App ⚙️ 設定（存使用者瀏覽器 localStorage） | ✅ 有免費額度 |
| **Open-Meteo** | 真實天氣資料 | 不需要金鑰 | — | ✅ 免費免金鑰 |
| **Claude OAuth token** | （進階）CI 自動開 PR | 本機 `claude setup-token` | repo secret `CLAUDE_CODE_OAUTH_TOKEN` | 含在 Claude 訂閱 |
| **Anthropic API key** (`sk-ant-...`) | （進階）CI 自動開 PR | console.anthropic.com | repo secret `ANTHROPIC_API_KEY` | 💰 用量計費 |

> 🔒 安全守則：**任何金鑰都不可寫進程式碼或 commit**。前端用的 Gemini 金鑰只存在使用者自己的瀏覽器；CI 用的金鑰只放 GitHub Secrets（加密、log 會自動遮蔽）。

---

## 9. 常見問題

- **意見送出後 404**：repo 還沒建立、或是 Private（沒權限的人看到 404）。→ 建好 repo 並設 Public。
- **看不到新功能/按鈕**：瀏覽器快取。→ `Cmd+Shift+R` 強制重整。
- **手機網址 404**：Pages 還沒啟用或還在部署。→ 依第 4 節啟用，等 1～2 分鐘。
- **改了卻沒上線**：改動還在分支沒 merge 進 `main`。→ Pages 只看 main。
- **天氣顯示「示範資料」**：Open-Meteo 暫時失敗會自動回退；通常重整即可恢復真實資料。
- **CWA（中央氣象署）為何不用**：其 API 不支援瀏覽器 CORS，純前端無法直接呼叫；故改用免金鑰且支援 CORS 的 Open-Meteo。
