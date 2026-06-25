/**
 * weather-template.js
 * 包含預設天氣 App 的完整原始碼 (HTML, CSS, JS)
 * AI 會讀取這個範本並在此基礎上進行修改
 *
 * 真實資料：串接「中央氣象署開放資料平臺」F-C0032-001（今明 36 小時天氣預報）。
 * 金鑰以佔位字串 __CWA_API_KEY__ 表示，由外層 app.js 在渲染時注入。
 * 若未設定金鑰或 API 失敗，會自動回退到內建的示範資料。
 */

const DefaultWeatherAppCode = `<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>台灣即時天氣查詢</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Noto+Sans+TC:wght@300;400;500;700&display=swap" rel="stylesheet">
  <style>
    /* --- 設計系統與變數 --- */
    :root {
      --bg-sunny: linear-gradient(135deg, #ff9e80 0%, #ff5252 100%);
      --bg-cloudy: linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%);
      --bg-rainy: linear-gradient(135deg, #130cb7 0%, #52e5e7 100%);
      --bg-night: linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%);

      --card-bg: rgba(255, 255, 255, 0.12);
      --card-border: rgba(255, 255, 255, 0.2);
      --text-color: #ffffff;
      --text-secondary: rgba(255, 255, 255, 0.7);
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Inter', 'Noto Sans TC', sans-serif;
      color: var(--text-color);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 20px;
      transition: background 0.8s ease;
      background: var(--bg-sunny);
      overflow-x: hidden;
    }

    /* --- 天氣容器 --- */
    .weather-container {
      width: 100%;
      max-width: 400px;
      margin-top: 10px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    /* --- 下拉選單 --- */
    .select-wrapper {
      position: relative;
      width: 100%;
    }

    .county-select {
      width: 100%;
      padding: 16px 20px;
      font-size: 16px;
      font-weight: 500;
      color: var(--text-color);
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 16px;
      outline: none;
      cursor: pointer;
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      appearance: none;
      -webkit-appearance: none;
      transition: all 0.3s ease;
      box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.15);
    }

    .county-select:focus {
      border-color: rgba(255, 255, 255, 0.5);
      box-shadow: 0 8px 32px 0 rgba(255, 255, 255, 0.1);
    }

    .select-wrapper::after {
      content: '▼';
      position: absolute;
      right: 20px;
      top: 50%;
      transform: translateY(-50%);
      font-size: 12px;
      color: var(--text-secondary);
      pointer-events: none;
    }

    /* --- 主要天氣卡片 --- */
    .weather-card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 24px;
      padding: 24px;
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.2);
      text-align: center;
      animation: fadeIn 0.6s ease-out;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .location {
      font-size: 26px;
      font-weight: 700;
      margin-bottom: 4px;
      letter-spacing: 0.5px;
    }

    .weather-icon {
      font-size: 72px;
      margin: 10px 0;
      filter: drop-shadow(0 10px 15px rgba(0,0,0,0.15));
      animation: float 3s ease-in-out infinite;
    }

    @keyframes float {
      0%, 100% { transform: translateY(0px); }
      50% { transform: translateY(-8px); }
    }

    .temperature {
      font-size: 64px;
      font-weight: 300;
      line-height: 1;
      margin-bottom: 8px;
      display: inline-flex;
      align-items: flex-start;
    }

    .temp-unit {
      font-size: 24px;
      font-weight: 500;
      margin-top: 10px;
      margin-left: 2px;
    }

    .condition {
      font-size: 18px;
      font-weight: 500;
      color: var(--text-secondary);
      margin-bottom: 8px;
    }

    /* --- 細節統計資訊 --- */
    .details-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
      margin-top: 10px;
    }

    .detail-item {
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 16px;
      padding: 12px 8px;
      text-align: center;
    }

    .detail-label {
      font-size: 11px;
      color: var(--text-secondary);
      margin-bottom: 4px;
      text-transform: uppercase;
    }

    .detail-value {
      font-size: 15px;
      font-weight: 600;
    }

    /* --- 穿衣與建議提示卡 --- */
    .tip-card {
      background: rgba(0, 0, 0, 0.2);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 20px;
      padding: 16px 20px;
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .tip-icon {
      font-size: 24px;
    }

    .tip-text {
      font-size: 13px;
      line-height: 1.5;
      text-align: left;
    }

    /* --- 資料來源標示 --- */
    .source-tag {
      font-size: 11px;
      color: var(--text-secondary);
      text-align: center;
      opacity: 0.8;
    }
  </style>
</head>
<body>

  <div class="weather-container">
    <!-- 縣市下拉選單 -->
    <div class="select-wrapper">
      <select id="county-select" class="county-select">
        <option value="臺北市">臺北市</option>
        <option value="新北市">新北市</option>
        <option value="桃園市">桃園市</option>
        <option value="臺中市">臺中市</option>
        <option value="臺南市">臺南市</option>
        <option value="高雄市">高雄市</option>
        <option value="基隆市">基隆市</option>
        <option value="新竹市">新竹市</option>
        <option value="新竹縣">新竹縣</option>
        <option value="苗栗縣">苗栗縣</option>
        <option value="彰化縣">彰化縣</option>
        <option value="南投縣">南投縣</option>
        <option value="雲林縣">雲林縣</option>
        <option value="嘉義市">嘉義市</option>
        <option value="嘉義縣">嘉義縣</option>
        <option value="屏東縣">屏東縣</option>
        <option value="宜蘭縣">宜蘭縣</option>
        <option value="花蓮縣">花蓮縣</option>
        <option value="臺東縣">臺東縣</option>
        <option value="澎湖縣">澎湖縣</option>
        <option value="金門縣">金門縣</option>
        <option value="連江縣">連江縣</option>
      </select>
    </div>

    <!-- 主要天氣卡 -->
    <div class="weather-card">
      <div class="location" id="location">臺北市</div>
      <div class="weather-icon" id="weather-icon">☀️</div>
      <div>
        <span class="temperature" id="temp-val">28</span>
        <span class="temp-unit">°C</span>
      </div>
      <div class="condition" id="condition">晴天</div>

      <!-- 細節格線（皆來自 CWA 36 小時預報） -->
      <div class="details-grid">
        <div class="detail-item">
          <div class="detail-label">降雨機率</div>
          <div class="detail-value" id="rain-val">10%</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">最高溫</div>
          <div class="detail-value" id="high-val">30°</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">最低溫</div>
          <div class="detail-value" id="low-val">24°</div>
        </div>
      </div>
    </div>

    <!-- AI 溫馨建議 -->
    <div class="tip-card">
      <div class="tip-icon" id="tip-icon">💡</div>
      <div class="tip-text" id="tip-text">天氣炎熱，外出請注意防曬並多補充水分。</div>
    </div>

    <!-- 資料來源 -->
    <div class="source-tag" id="source-tag">資料來源：示範資料</div>
  </div>

  <script>
    // === CWA 金鑰：由外層 app.js 在渲染時把 __CWA_API_KEY__ 換成真實金鑰 ===
    const CWA_API_KEY = "__CWA_API_KEY__";
    const CWA_ENDPOINT = "https://opendata.cwa.gov.tw/api/v1/rest/datastore/F-C0032-001";

    // --- 內建示範資料（API 未設定或失敗時的後備） ---
    const mockData = {
      "臺北市": { temp: 31, weather: "晴天", icon: "☀️", rain: 10, bg: "var(--bg-sunny)", tip: "紫外線指數偏高，外出請攜帶防曬用品並多喝水。" },
      "新北市": { temp: 30, weather: "晴時多雲", icon: "⛅", rain: 20, bg: "var(--bg-cloudy)", tip: "多雲到晴的天氣，下午山區可能有零星陣雨。" },
      "桃園市": { temp: 29, weather: "多雲", icon: "☁️", rain: 20, bg: "var(--bg-cloudy)", tip: "風力稍大，戶外活動建議戴頂帽子防風。" },
      "臺中市": { temp: 32, weather: "晴天", icon: "☀️", rain: 0, bg: "var(--bg-sunny)", tip: "天氣晴朗穩定，非常適合洗曬衣物與戶外活動。" },
      "臺南市": { temp: 32, weather: "晴朗偏熱", icon: "☀️", rain: 10, bg: "var(--bg-sunny)", tip: "高溫炎熱，中午前後請儘量減少戶外高強度活動。" },
      "高雄市": { temp: 33, weather: "晴天", icon: "☀️", rain: 10, bg: "var(--bg-sunny)", tip: "熱浪來襲！請注意防曬，慎防中暑並適時補水。" },
      "基隆市": { temp: 26, weather: "陣雨", icon: "🌧️", rain: 80, bg: "var(--bg-rainy)", tip: "基隆雨勢較大，出門務必攜帶雨具，行車請注意安全。" },
      "新竹市": { temp: 29, weather: "多雲時晴", icon: "⛅", rain: 15, bg: "var(--bg-cloudy)", tip: "新竹風勢強勁，路口強風注意，騎車請握穩把手。" },
      "新竹縣": { temp: 28, weather: "多雲", icon: "☁️", rain: 20, bg: "var(--bg-cloudy)", tip: "多雲天氣，氣溫舒適，適合出門走走。" },
      "苗栗縣": { temp: 29, weather: "晴時多雲", icon: "⛅", rain: 10, bg: "var(--bg-cloudy)", tip: "氣候宜人，午後山區需留意局部雲量增多。" },
      "彰化縣": { temp: 31, weather: "晴天", icon: "☀️", rain: 10, bg: "var(--bg-sunny)", tip: "陽光充足，戶外紫外線強，外出記得防曬。" },
      "南投縣": { temp: 27, weather: "雷陣雨", icon: "⛈️", rain: 70, bg: "var(--bg-rainy)", tip: "山區午後易有雷陣雨，避免前往溪邊或易崩塌路段。" },
      "雲林縣": { temp: 31, weather: "晴時多雲", icon: "⛅", rain: 15, bg: "var(--bg-cloudy)", tip: "天氣舒適溫暖，風速較慢，需注意空氣品質。" },
      "嘉義市": { temp: 31, weather: "晴天", icon: "☀️", rain: 10, bg: "var(--bg-sunny)", tip: "萬里無雲，體感溫度偏高，記得穿著通風衣物。" },
      "嘉義縣": { temp: 30, weather: "多雲時晴", icon: "⛅", rain: 20, bg: "var(--bg-cloudy)", tip: "天氣大致良好，山區請留意午後對流降雨。" },
      "屏東縣": { temp: 32, weather: "午後雷雨", icon: "⛈️", rain: 60, bg: "var(--bg-rainy)", tip: "午後可能突降大雨，出門記得攜帶雨具備用。" },
      "宜蘭縣": { temp: 27, weather: "短暫雨", icon: "🌧️", rain: 50, bg: "var(--bg-rainy)", tip: "迎風面局部陣雨，出門帶把傘最保險。" },
      "花蓮縣": { temp: 28, weather: "多雲時晴", icon: "⛅", rain: 30, bg: "var(--bg-cloudy)", tip: "多雲偶見陽光，沿海地區浪大，請避免海上活動。" },
      "臺東縣": { temp: 29, weather: "晴時多雲", icon: "☀️", rain: 20, bg: "var(--bg-sunny)", tip: "吹焚風機率偏高，氣溫可能偏高，請多補充水分。" },
      "澎湖縣": { temp: 28, weather: "晴朗", icon: "☀️", rain: 0, bg: "var(--bg-sunny)", tip: "離島海風較大，陽光猛烈，前往沙灘請加強防曬。" },
      "金門縣": { temp: 27, weather: "多雲", icon: "☁️", rain: 10, bg: "var(--bg-cloudy)", tip: "易有濃霧影響能見度，行車請開大燈並減速慢行。" },
      "連江縣": { temp: 22, weather: "陰雨", icon: "🌧️", rain: 65, bg: "var(--bg-rainy)", tip: "氣溫偏涼且有雨，外出請加穿外套防寒並攜帶雨具。" }
    };

    // --- 依天氣文字與降雨機率推導 emoji 圖示與背景 ---
    function pickIcon(wx, pop) {
      if (/雷/.test(wx)) return "⛈️";
      if (/雨/.test(wx)) return "🌧️";
      if (/陰/.test(wx)) return "☁️";
      if (/多雲/.test(wx)) return "⛅";
      if (/晴/.test(wx)) return "☀️";
      return "🌡️";
    }
    function pickBg(wx, pop) {
      if (pop >= 50 || /雨|雷/.test(wx)) return "var(--bg-rainy)";
      if (/多雲|陰/.test(wx)) return "var(--bg-cloudy)";
      return "var(--bg-sunny)";
    }

    // --- 呼叫 CWA 取得真實天氣；失敗則回傳 null ---
    async function fetchRealWeather(county) {
      // 金鑰尚未注入（仍是佔位字串）或空白 → 不打 API
      if (!CWA_API_KEY || CWA_API_KEY.indexOf("__CWA") === 0) return null;

      const url = CWA_ENDPOINT
        + "?Authorization=" + encodeURIComponent(CWA_API_KEY)
        + "&locationName=" + encodeURIComponent(county);

      const res = await fetch(url);
      if (!res.ok) throw new Error("CWA API " + res.status);
      const json = await res.json();

      const loc = json.records && json.records.location && json.records.location[0];
      if (!loc) return null;

      // 把 weatherElement 陣列轉成好取用的物件
      const el = {};
      loc.weatherElement.forEach((e) => { el[e.elementName] = e.time; });

      const wx = el.Wx[0].parameter.parameterName;        // 天氣現象，如「多雲時晴」
      const pop = Number(el.PoP[0].parameter.parameterName); // 降雨機率 %
      const minT = Number(el.MinT[0].parameter.parameterName);
      const maxT = Number(el.MaxT[0].parameter.parameterName);
      const ci = el.CI[0].parameter.parameterName;        // 舒適度，如「舒適」

      return {
        temp: Math.round((minT + maxT) / 2),
        high: maxT,
        low: minT,
        weather: wx,
        rain: pop,
        icon: pickIcon(wx, pop),
        bg: pickBg(wx, pop),
        tip: "舒適度「" + ci + "」。" + (pop >= 50 ? "降雨機率偏高，出門記得帶傘。" : "祝您有美好的一天！")
      };
    }

    // --- 後備：把示範資料補上 high/low 欄位 ---
    function getMock(county) {
      const m = mockData[county];
      if (!m) return null;
      return Object.assign({}, m, { high: m.temp + 1, low: m.temp - 5 });
    }

    // --- DOM 綁定 ---
    const select = document.getElementById('county-select');
    const locText = document.getElementById('location');
    const weatherIcon = document.getElementById('weather-icon');
    const tempVal = document.getElementById('temp-val');
    const condition = document.getElementById('condition');
    const rainVal = document.getElementById('rain-val');
    const highVal = document.getElementById('high-val');
    const lowVal = document.getElementById('low-val');
    const tipText = document.getElementById('tip-text');
    const sourceTag = document.getElementById('source-tag');

    function render(d, source) {
      locText.textContent = d.county;
      weatherIcon.textContent = d.icon;
      tempVal.textContent = d.temp;
      condition.textContent = d.weather;
      rainVal.textContent = d.rain + "%";
      highVal.textContent = d.high + "°";
      lowVal.textContent = d.low + "°";
      tipText.textContent = d.tip;
      sourceTag.textContent = source;
      document.body.style.background = d.bg;
    }

    async function updateWeather(county) {
      condition.textContent = "查詢中…";
      let data = null;
      let source = "資料來源：示範資料";
      try {
        data = await fetchRealWeather(county);
        if (data) source = "資料來源：中央氣象署（今明 36 小時預報）";
      } catch (err) {
        console.warn("CWA 取得失敗，改用示範資料：", err);
      }
      if (!data) data = getMock(county);
      if (!data) return;
      data.county = county;
      render(data, source);
    }

    select.addEventListener('change', (e) => updateWeather(e.target.value));

    // 預設載入臺北市
    updateWeather("臺北市");
  </script>
</body>
</html>`;
