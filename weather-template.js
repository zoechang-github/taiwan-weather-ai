/**
 * weather-template.js
 * 包含預設天氣 App 的完整原始碼 (HTML, CSS, JS)
 * AI 會讀取這個範本並在此基礎上進行修改
 *
 * 真實資料：串接 Open-Meteo（https://open-meteo.com）。
 * 此 API 免金鑰、原生支援 CORS，瀏覽器可直接呼叫，適合純前端 / GitHub Pages。
 * 若 API 失敗，會自動回退到內建的示範資料。
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
        <optgroup label="北部">
          <option value="基隆市">基隆市</option>
          <option value="臺北市">臺北市</option>
          <option value="新北市">新北市</option>
          <option value="桃園市">桃園市</option>
          <option value="新竹市">新竹市</option>
          <option value="新竹縣">新竹縣</option>
          <option value="苗栗縣">苗栗縣</option>
        </optgroup>
        <optgroup label="中部">
          <option value="臺中市">臺中市</option>
          <option value="彰化縣">彰化縣</option>
          <option value="南投縣">南投縣</option>
          <option value="雲林縣">雲林縣</option>
        </optgroup>
        <optgroup label="南部">
          <option value="嘉義市">嘉義市</option>
          <option value="嘉義縣">嘉義縣</option>
          <option value="臺南市">臺南市</option>
          <option value="高雄市">高雄市</option>
          <option value="屏東縣">屏東縣</option>
          <option value="澎湖縣">澎湖縣</option>
          <option value="金門縣">金門縣</option>
        </optgroup>
        <optgroup label="東部">
          <option value="宜蘭縣">宜蘭縣</option>
          <option value="花蓮縣">花蓮縣</option>
          <option value="臺東縣">臺東縣</option>
          <option value="連江縣">連江縣</option>
        </optgroup>
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

      <!-- 細節格線（皆為 Open-Meteo 即時資料） -->
      <div class="details-grid">
        <div class="detail-item">
          <div class="detail-label">降雨機率</div>
          <div class="detail-value" id="rain-val">10%</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">濕度</div>
          <div class="detail-value" id="humidity-val">65%</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">風速</div>
          <div class="detail-value" id="wind-val">3 m/s</div>
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
    const OPEN_METEO = "https://api.open-meteo.com/v1/forecast";

    // --- 22 縣市座標（取縣市中心點） ---
    const coords = {
      "臺北市": [25.04, 121.56], "新北市": [25.01, 121.46], "桃園市": [24.99, 121.31],
      "臺中市": [24.15, 120.67], "臺南市": [22.99, 120.21], "高雄市": [22.62, 120.31],
      "基隆市": [25.13, 121.74], "新竹市": [24.80, 120.97], "新竹縣": [24.70, 121.12],
      "苗栗縣": [24.56, 120.82], "彰化縣": [24.08, 120.54], "南投縣": [23.91, 120.69],
      "雲林縣": [23.71, 120.43], "嘉義市": [23.48, 120.45], "嘉義縣": [23.46, 120.29],
      "屏東縣": [22.55, 120.55], "宜蘭縣": [24.70, 121.74], "花蓮縣": [23.99, 121.60],
      "臺東縣": [22.76, 121.14], "澎湖縣": [23.57, 119.58], "金門縣": [24.43, 118.32],
      "連江縣": [26.16, 119.95]
    };

    // --- 內建示範資料（API 失敗時的後備） ---
    const mockData = {
      "臺北市": { temp: 31, weather: "晴天", icon: "☀️", rain: 10, humidity: 62, wind: 2, bg: "var(--bg-sunny)", tip: "紫外線指數偏高，外出請攜帶防曬用品並多喝水。" },
      "新北市": { temp: 30, weather: "晴時多雲", icon: "⛅", rain: 20, humidity: 68, wind: 3, bg: "var(--bg-cloudy)", tip: "多雲到晴的天氣，下午山區可能有零星陣雨。" },
      "桃園市": { temp: 29, weather: "多雲", icon: "☁️", rain: 20, humidity: 72, wind: 4, bg: "var(--bg-cloudy)", tip: "風力稍大，戶外活動建議戴頂帽子防風。" },
      "臺中市": { temp: 32, weather: "晴天", icon: "☀️", rain: 0, humidity: 58, wind: 2, bg: "var(--bg-sunny)", tip: "天氣晴朗穩定，非常適合洗曬衣物與戶外活動。" },
      "臺南市": { temp: 32, weather: "晴朗偏熱", icon: "☀️", rain: 10, humidity: 65, wind: 3, bg: "var(--bg-sunny)", tip: "高溫炎熱，中午前後請儘量減少戶外高強度活動。" },
      "高雄市": { temp: 33, weather: "晴天", icon: "☀️", rain: 10, humidity: 64, wind: 2, bg: "var(--bg-sunny)", tip: "熱浪來襲！請注意防曬，慎防中暑並適時補水。" },
      "基隆市": { temp: 26, weather: "陣雨", icon: "🌧️", rain: 80, humidity: 90, wind: 5, bg: "var(--bg-rainy)", tip: "基隆雨勢較大，出門務必攜帶雨具，行車請注意安全。" },
      "新竹市": { temp: 29, weather: "多雲時晴", icon: "⛅", rain: 15, humidity: 69, wind: 6, bg: "var(--bg-cloudy)", tip: "新竹風勢強勁，路口強風注意，騎車請握穩把手。" },
      "新竹縣": { temp: 28, weather: "多雲", icon: "☁️", rain: 20, humidity: 73, wind: 5, bg: "var(--bg-cloudy)", tip: "多雲天氣，氣溫舒適，適合出門走走。" },
      "苗栗縣": { temp: 29, weather: "晴時多雲", icon: "⛅", rain: 10, humidity: 70, wind: 3, bg: "var(--bg-cloudy)", tip: "氣候宜人，午後山區需留意局部雲量增多。" },
      "彰化縣": { temp: 31, weather: "晴天", icon: "☀️", rain: 10, humidity: 66, wind: 4, bg: "var(--bg-sunny)", tip: "陽光充足，戶外紫外線強，外出記得防曬。" },
      "南投縣": { temp: 27, weather: "雷陣雨", icon: "⛈️", rain: 70, humidity: 82, wind: 1, bg: "var(--bg-rainy)", tip: "山區午後易有雷陣雨，避免前往溪邊或易崩塌路段。" },
      "雲林縣": { temp: 31, weather: "晴時多雲", icon: "⛅", rain: 15, humidity: 71, wind: 2, bg: "var(--bg-cloudy)", tip: "天氣舒適溫暖，風速較慢，需注意空氣品質。" },
      "嘉義市": { temp: 31, weather: "晴天", icon: "☀️", rain: 10, humidity: 68, wind: 2, bg: "var(--bg-sunny)", tip: "萬里無雲，體感溫度偏高，記得穿著通風衣物。" },
      "嘉義縣": { temp: 30, weather: "多雲時晴", icon: "⛅", rain: 20, humidity: 73, wind: 2, bg: "var(--bg-cloudy)", tip: "天氣大致良好，山區請留意午後對流降雨。" },
      "屏東縣": { temp: 32, weather: "午後雷雨", icon: "⛈️", rain: 60, humidity: 78, wind: 2, bg: "var(--bg-rainy)", tip: "午後可能突降大雨，出門記得攜帶雨具備用。" },
      "宜蘭縣": { temp: 27, weather: "短暫雨", icon: "🌧️", rain: 50, humidity: 85, wind: 3, bg: "var(--bg-rainy)", tip: "迎風面局部陣雨，出門帶把傘最保險。" },
      "花蓮縣": { temp: 28, weather: "多雲時晴", icon: "⛅", rain: 30, humidity: 76, wind: 3, bg: "var(--bg-cloudy)", tip: "多雲偶見陽光，沿海地區浪大，請避免海上活動。" },
      "臺東縣": { temp: 29, weather: "晴時多雲", icon: "☀️", rain: 20, humidity: 74, wind: 4, bg: "var(--bg-sunny)", tip: "吹焚風機率偏高，氣溫可能偏高，請多補充水分。" },
      "澎湖縣": { temp: 28, weather: "晴朗", icon: "☀️", rain: 0, humidity: 75, wind: 5, bg: "var(--bg-sunny)", tip: "離島海風較大，陽光猛烈，前往沙灘請加強防曬。" },
      "金門縣": { temp: 27, weather: "多雲", icon: "☁️", rain: 10, humidity: 80, wind: 4, bg: "var(--bg-cloudy)", tip: "易有濃霧影響能見度，行車請開大燈並減速慢行。" },
      "連江縣": { temp: 22, weather: "陰雨", icon: "🌧️", rain: 65, humidity: 88, wind: 6, bg: "var(--bg-rainy)", tip: "氣溫偏涼且有雨，外出請加穿外套防寒並攜帶雨具。" }
    };

    // --- WMO 天氣代碼 → 中文敘述 + emoji 圖示 ---
    // 參考 https://open-meteo.com/en/docs（weather_code 定義）
    function wmoInfo(code) {
      if (code === 0) return { text: "晴天", icon: "☀️" };
      if (code === 1) return { text: "晴時多雲", icon: "🌤️" };
      if (code === 2) return { text: "多雲", icon: "⛅" };
      if (code === 3) return { text: "陰天", icon: "☁️" };
      if (code === 45 || code === 48) return { text: "起霧", icon: "🌫️" };
      if (code >= 51 && code <= 57) return { text: "毛毛雨", icon: "🌦️" };
      if (code >= 61 && code <= 67) return { text: "下雨", icon: "🌧️" };
      if (code >= 71 && code <= 77) return { text: "下雪", icon: "🌨️" };
      if (code >= 80 && code <= 82) return { text: "陣雨", icon: "🌧️" };
      if (code === 85 || code === 86) return { text: "陣雪", icon: "🌨️" };
      if (code >= 95) return { text: "雷雨", icon: "⛈️" };
      return { text: "天氣未知", icon: "🌡️" };
    }

    function pickBg(code, rain) {
      if (rain >= 50 || code >= 51) return "var(--bg-rainy)";
      if (code === 2 || code === 3 || code === 45 || code === 48) return "var(--bg-cloudy)";
      return "var(--bg-sunny)";
    }

    function makeTip(temp, rain, code) {
      if (rain >= 60 || code >= 61) return "降雨機率偏高，出門記得攜帶雨具。";
      if (temp >= 32) return "天氣炎熱，請注意防曬、多補充水分以免中暑。";
      if (temp <= 16) return "氣溫偏涼，外出建議多加件外套保暖。";
      return "天氣大致舒適，祝您有美好的一天！";
    }

    // --- 呼叫 Open-Meteo 取得真實天氣；失敗則回傳 null ---
    async function fetchRealWeather(county) {
      const c = coords[county];
      if (!c) return null;

      const url = OPEN_METEO
        + "?latitude=" + c[0] + "&longitude=" + c[1]
        + "&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m"
        + "&daily=precipitation_probability_max"
        + "&timezone=Asia%2FTaipei&forecast_days=1";

      const res = await fetch(url);
      if (!res.ok) throw new Error("Open-Meteo " + res.status);
      const json = await res.json();

      const cur = json.current;
      const code = cur.weather_code;
      const rain = (json.daily && json.daily.precipitation_probability_max
        && json.daily.precipitation_probability_max[0]) || 0;
      const info = wmoInfo(code);

      return {
        temp: Math.round(cur.temperature_2m),
        weather: info.text,
        icon: info.icon,
        rain: rain,
        humidity: cur.relative_humidity_2m,
        wind: Math.round(cur.wind_speed_10m / 3.6), // km/h → m/s
        bg: pickBg(code, rain),
        tip: makeTip(cur.temperature_2m, rain, code)
      };
    }

    // --- DOM 綁定 ---
    const select = document.getElementById('county-select');
    const locText = document.getElementById('location');
    const weatherIcon = document.getElementById('weather-icon');
    const tempVal = document.getElementById('temp-val');
    const condition = document.getElementById('condition');
    const rainVal = document.getElementById('rain-val');
    const humidityVal = document.getElementById('humidity-val');
    const windVal = document.getElementById('wind-val');
    const tipText = document.getElementById('tip-text');
    const sourceTag = document.getElementById('source-tag');

    function render(d, source) {
      locText.textContent = d.county;
      weatherIcon.textContent = d.icon;
      tempVal.textContent = d.temp;
      condition.textContent = d.weather;
      rainVal.textContent = d.rain + "%";
      humidityVal.textContent = d.humidity + "%";
      windVal.textContent = d.wind + " m/s";
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
        if (data) source = "資料來源：Open-Meteo 即時天氣";
      } catch (err) {
        console.warn("Open-Meteo 取得失敗，改用示範資料：", err);
      }
      if (!data) data = mockData[county];
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
