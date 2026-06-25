/**
 * gemini.js
 * 負責連接 Gemini API，處理天氣 App 設計師專屬的 Prompt
 */

const GeminiAPI = (() => {
  const STORAGE_KEY = 'ai-code-editor-api-key';
  const MODEL_KEY = 'ai-code-editor-model';
  const CWA_KEY = 'ai-code-editor-cwa-key';
  const API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

  function getApiKey() {
    return localStorage.getItem(STORAGE_KEY) || '';
  }

  function setApiKey(key) {
    localStorage.setItem(STORAGE_KEY, key.trim());
  }

  function getModel() {
    return localStorage.getItem(MODEL_KEY) || 'gemini-2.5-flash';
  }

  function setModel(model) {
    localStorage.setItem(MODEL_KEY, model);
  }

  function hasApiKey() {
    return getApiKey().length > 0;
  }

  // --- 中央氣象署（CWA）天氣 API 金鑰 ---
  function getCwaKey() {
    return localStorage.getItem(CWA_KEY) || '';
  }

  function setCwaKey(key) {
    localStorage.setItem(CWA_KEY, key.trim());
  }

  /**
   * 建立天氣 App 專屬的設計提示詞
   * @param {string} currentCode - 目前天氣 App 的完整程式碼 (HTML/CSS/JS)
   * @param {string} userInstruction - 使用者要修改的指令 (例如：「改成粉紅色」)
   */
  function buildSystemPrompt(currentCode, userInstruction) {
    return `你是一個高階網頁設計師與前端工程師。你的任務是協助使用者修改、設計一個「台灣即時天氣查詢 App」。

【目前的 App 完整原始碼】：
\`\`\`html
${currentCode}
\`\`\`

【使用者想要做出的修改或功能】：
${userInstruction}

【輸出規範（非常重要）】：
1. 請用「繁體中文」簡短說明你做了什麼（最多 2～3 句即可，不要長篇大論），重點是把完整程式碼交付出來。
2. 你「必須」提供修改後、完整且可以直接運作的 HTML 檔案（包含內置的 <style> 與 <script> 段落）。
3. 請把這份完整的程式碼放在一個獨立的 \`\`\`html ... \`\`\` 程式碼方塊中。請不要分散在多個方塊，也不要只提供修改片段。我們需要「完整且可直接執行」的整份網頁原始碼！
4. 這個 App 會串接「中央氣象署 CWA」真實天氣 API。請務必保留以下邏輯不要破壞：佔位字串 \`__CWA_API_KEY__\`、\`fetchRealWeather()\` 函式、CWA 失敗時回退到 \`mockData\` 的機制，以及 22 縣市下拉選單。除非使用者明確要求更動資料來源，否則不要刪除或改寫這些部分。
5. 盡量使用美觀的色彩、漸層、陰影（如 HSL 配色、毛玻璃效果等），確保在手機介面上看起來極為精緻、現代，有高級感！`;
  }

  /**
   * 呼叫 Gemini 進行對話串流
   */
  function streamDesign(currentCode, userInstruction, onChunk, onDone, onError) {
    const apiKey = getApiKey();
    const model = getModel();

    if (!apiKey) {
      onError('請先在設定中填入 Gemini API Key');
      return null;
    }

    const controller = new AbortController();
    const url = `${API_BASE}/${model}:streamGenerateContent?alt=sse&key=${apiKey}`;

    const prompt = buildSystemPrompt(currentCode, userInstruction);

    // 整份天氣 App HTML 約需數千 tokens，8192 不夠會在程式碼中途被截斷。
    // 舊款 gemini-2.0-flash 上限為 8192，其餘較新模型可給更大空間。
    const maxOutputTokens = model === 'gemini-2.0-flash' ? 8192 : 32768;

    const body = {
      contents: [
        {
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature: 0.5, // 稍微調低 temperature 讓程式碼生成更穩定
        maxOutputTokens,
      },
    };

    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) {
          const errText = await response.text();
          let errMsg = `API 錯誤 (${response.status})`;
          try {
            const errJson = JSON.parse(errText);
            errMsg = errJson.error?.message || errMsg;
          } catch {}
          throw new Error(errMsg);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let finishReason = null;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6).trim();
              if (data === '[DONE]') continue;

              try {
                const json = JSON.parse(data);
                const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
                if (text) {
                  onChunk(text);
                }
                // 記錄結束原因：MAX_TOKENS 代表輸出被長度上限截斷
                if (json.candidates?.[0]?.finishReason) {
                  finishReason = json.candidates[0].finishReason;
                }
              } catch {}
            }
          }
        }
        onDone(finishReason);
      })
      .catch((err) => {
        if (err.name !== 'AbortError') {
          onError(err.message);
        }
      });

    return controller;
  }

  return {
    getApiKey,
    setApiKey,
    getModel,
    setModel,
    hasApiKey,
    getCwaKey,
    setCwaKey,
    streamDesign,
  };
})();
