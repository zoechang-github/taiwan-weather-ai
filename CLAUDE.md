# 專案規範（給 AI 自動修改時遵循）

## 專案簡介
台灣天氣 App AI 協同設計沙盒。純前端、無框架。
- `index.html`：主控台
- `css/designer.css`：主控台樣式
- `js/app.js`：主邏輯（iframe 預覽、AI 對話、意見回饋）
- `js/gemini.js`：Gemini API 串接
- `weather-template.js`：被預覽的天氣 App 範本（內含 Open-Meteo 真實天氣串接）

## 程式風格
- 使用原生 JavaScript（ES6+），**不要**引入任何前端框架或建置工具。
- 沿用既有的 IIFE 模組寫法（`App`、`GeminiAPI`）。
- CSS 一律用既有的 CSS 變數（`:root` 內的 `--accent-*`、`--bg-*` 等），不要寫死色碼。
- 介面以行動裝置優先（mobile-first），確保手機上正常。
- 註解、UI 文案、Issue/PR 說明都用繁體中文。

## 不可破壞的重點
- 天氣資料用 Open-Meteo（免金鑰、支援 CORS）。請保留 `coords`、`fetchRealWeather()`、
  `wmoInfo()` 與失敗回退 `mockData` 的機制，以及 22 縣市下拉選單。
- API 金鑰一律只存在使用者瀏覽器的 `localStorage`，**絕不可**寫進程式碼或 commit。

## PR 規範
- 分支命名：`feature/簡短描述` 或 `fix/簡短描述`
- PR 內文需連結回觸發的 Issue
- 改動盡量小而聚焦，只處理該 Issue 的需求
