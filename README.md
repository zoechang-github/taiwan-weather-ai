# 🌦️ Weather App Designer — 天氣 App 協同設計沙盒

這是一個結合「台灣天氣查詢 App」與「AI 協同程式碼編輯器」的雙層沙盒系統。您可以用手機介面與 AI 對話，一邊查看即時的天氣狀態，一邊指使 AI 替您修改、設計該天氣 App 的外觀與功能！

![Mobile Friendly](https://img.shields.io/badge/Mobile-First-8a63ff)
![Gemini AI](https://img.shields.io/badge/Gemini-API-00b4d8)
![GitHub Pages](https://img.shields.io/badge/Deploy-GitHub%20Pages-brightgreen)

## ✨ 特色與功能

1. 📱 **雙分欄沙盒（Sandbox）**
   * **上半部**：執行中的台灣天氣查詢 App 預覽。串接 **[Open-Meteo](https://open-meteo.com) 免費天氣 API**（免金鑰、支援 CORS），點下拉選單即時顯示全台 22 縣市的真實天氣（天氣狀況、氣溫、降雨機率、濕度、風速）。API 失敗時自動回退到內建示範資料。
   * **下半部**：AI 協同設計面板。提供快捷按鈕（🌸 粉紅主題、💎 毛玻璃風、📅 三日預報等）與自由對話框。
2. 🤖 **AI 即時程式碼生成與熱套用（Hot-Reload）**
   * 與 AI 對話（如「*把卡片改成粉紅色，並在下方加一個帶把雨傘的提醒小卡*」）後，AI 會修改完整的 HTML 程式碼。
   * 點選 **「套用修改」**，上半部的天氣 App 就會在一瞬間完全更新，不需重新整理！
3. 🔒 **安全性與便利**
   * 自動沿用您先前在 `localStorage` 中設定的 Gemini API Key。
   * 完全在瀏覽器本機進行 AI 呼叫，不需額外伺服器。

> ⚠️ **API Key 安全提醒**：本專案為純前端 Demo，API Key 存在瀏覽器 `localStorage`、並以查詢字串呼叫 Google API，**僅適合個人/教學使用**。請勿把含有正式金鑰的截圖或設定上傳到公開網路；正式產品請改用後端代理（backend proxy）來保管金鑰。

---

## 🛠️ 本機如何跑起來？

本專案是純前端靜態網頁，不需安裝任何套件，只要一個本機伺服器即可：

1. **開啟終端機（Terminal）**，切換到專案資料夾（把路徑換成你 clone 下來的位置）：
   ```bash
   cd 你的路徑/taiwan-weather-ai
   ```

2. **啟動伺服器**（擇一即可）：
   ```bash
   # 方法 A：Mac / Linux 內建的 Python
   python3 -m http.server 8080

   # 方法 B：若已安裝 Node.js
   npx serve -l 8080
   ```

3. **在瀏覽器打開網頁**：
   👉 **[http://localhost:8080](http://localhost:8080)**

4. 點右上角 ⚙️ 設定，貼上你的 [Gemini API Key](https://aistudio.google.com/app/apikey) 即可啟用 AI 協同設計。（天氣資料用 Open-Meteo，免金鑰，開箱即用。）

> 💡 為什麼不直接雙擊 `index.html`？在 `file://` 協定下，瀏覽器的部分安全機制會限制行為；透過本機伺服器（`http://`）開啟才最穩定。

---

## 🚀 部署到 GitHub Pages（發布到網路上）

若要發布至 GitHub 讓自己或朋友在實體手機上使用：

1. **在 GitHub 建立一個名為 `taiwan-weather-ai` 的新儲存庫（Repository）**。
2. **在終端機中推送程式碼**：
   ```bash
   git init
   git add .
   git commit -m "初始版本：台灣天氣 App 協同設計沙盒"
   git branch -M main
   git remote add origin https://github.com/您的帳號/taiwan-weather-ai.git
   git push -u origin main
   ```
3. **前往 GitHub Repository 頁面**：
   * 點選 **Settings** ➡️ **Pages**。
   * Build and deployment 的 Source 選擇 **Deploy from a branch**。
   * Branch 選擇 **main**，資料夾選擇 **/ (root)** ➡️ 點擊 **Save**。
4. **等待約一分鐘**，即可在 GitHub 給您的專屬網址上（例如：`https://您的帳號.github.io/taiwan-weather-ai/`）直接開啟，這時您就能用**自己真正的實體手機**體驗與 AI 協同設計的樂趣了！

---

## 📁 檔案結構

```
taiwan-weather-ai/
├── index.html            ← 設計沙盒主控台
├── weather-template.js   ← 預設的天氣 App 程式碼範本
├── css/
│   └── designer.css      ← 主控台樣式
├── js/
│   ├── app.js            ← 主程式邏輯（Iframe 渲染、AI 互動控制）
│   └── gemini.js         ← Gemini API 連線模組
├── .gitignore            ← Git 忽略清單
├── LICENSE               ← MIT 授權
└── README.md
```
