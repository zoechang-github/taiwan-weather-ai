/**
 * app.js
 * 主控台邏輯：負責 Iframe 載入、AI 對話流、解析 Markdown 及熱套用程式碼
 */

const App = (() => {
  const $ = (id) => document.getElementById(id);

  let currentAppCode = '';       // 保存目前運作中的天氣 App 程式碼
  let proposedAppCode = '';      // 保存 AI 剛修改完、尚未套用的程式碼
  let currentController = null;  // 串流控制器

  /**
   * 初始化 App
   */
  function init() {
    // 1. 載入預設程式碼並渲染
    currentAppCode = DefaultWeatherAppCode;
    reloadPreview();

    // 2. 綁定事件
    bindEvents();

    // 3. 檢查 API Key 狀態
    checkFirstRun();
    loadSettings();
  }

  /**
   * 將目前的程式碼載入預覽 Iframe
   */
  function reloadPreview() {
    const iframe = $('app-preview');
    if (iframe) {
      iframe.srcdoc = currentAppCode;
    }
  }

  /**
   * 綁定所有 UI 事件
   */
  function bindEvents() {
    // 設定按鈕與視窗
    $('btn-settings').addEventListener('click', openSettings);
    $('btn-close-settings').addEventListener('click', closeSettings);
    $('settings-overlay').addEventListener('click', closeSettings);
    $('btn-save-settings').addEventListener('click', saveSettings);
    $('btn-toggle-key').addEventListener('click', toggleKeyVisibility);

    // 歡迎畫面
    $('btn-welcome-start').addEventListener('click', handleWelcome);
    $('welcome-api-key').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleWelcome();
    });

    // 傳送對話
    $('btn-send').addEventListener('click', () => handleUserChat());
    $('ai-input').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleUserChat();
    });

    // 快捷按鈕
    document.querySelectorAll('.ai-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const promptText = btn.dataset.prompt;
        if (promptText) {
          handleUserChat(promptText);
        }
      });
    });

    // 套用修改
    $('btn-apply').addEventListener('click', applyProposedCode);
  }

  // --- API Key & 設定管理 ---

  function checkFirstRun() {
    if (GeminiAPI.hasApiKey()) {
      $('welcome-overlay').classList.add('hidden');
    }
  }

  function handleWelcome() {
    const key = $('welcome-api-key').value.trim();
    if (!key) {
      showToast('❌ 請輸入 API Key', 'error');
      return;
    }
    GeminiAPI.setApiKey(key);
    $('welcome-overlay').classList.add('hidden');
    showToast('🎉 設定成功！歡迎使用！', 'success');
  }

  function openSettings() {
    $('api-key-input').value = GeminiAPI.getApiKey();
    $('model-select').value = GeminiAPI.getModel();
    $('settings-modal').classList.add('active');
    $('settings-overlay').classList.add('active');
  }

  function closeSettings() {
    $('settings-modal').classList.remove('active');
    $('settings-overlay').classList.remove('active');
  }

  function saveSettings() {
    const key = $('api-key-input').value.trim();
    const model = $('model-select').value;

    if (!key) {
      showToast('❌ 請輸入 API Key', 'error');
      return;
    }

    GeminiAPI.setApiKey(key);
    GeminiAPI.setModel(model);
    closeSettings();
    showToast('✅ 設定已儲存', 'success');
  }

  function loadSettings() {
    if ($('model-select')) {
      $('model-select').value = GeminiAPI.getModel();
    }
  }

  function toggleKeyVisibility() {
    const input = $('api-key-input');
    const isPassword = input.type === 'password';
    input.type = isPassword ? 'text' : 'password';
    $('btn-toggle-key').textContent = isPassword ? '🙈' : '👁';
  }

  // --- AI 對話與沙盒控制 ---

  /**
   * 處理使用者送出的訊息
   */
  function handleUserChat(customText = '') {
    const input = $('ai-input');
    const text = customText ? customText : input.value.trim();
    if (!text) return;

    if (!GeminiAPI.hasApiKey()) {
      showToast('🔑 請先設定 API Key', 'error');
      openSettings();
      return;
    }

    if (!customText) {
      input.value = '';
    }

    // 1. 新增使用者對話泡泡
    appendMessage('user', text);

    // 2. 新增 AI 思考中泡泡與 loading 效果
    const aiBubbleId = 'ai-msg-' + Date.now();
    appendMessage('system', `
      <div class="chat-loading" id="loading-${aiBubbleId}">
        <span></span><span></span><span></span>
      </div>
      <div id="content-${aiBubbleId}"></div>
    `, aiBubbleId);

    // 隱藏前次的套用面板
    $('ai-action-bar').style.display = 'none';
    $('btn-send').classList.add('loading');

    // 3. 開始串流呼叫
    let fullText = '';
    currentController = GeminiAPI.streamDesign(
      currentAppCode,
      text,
      // onChunk
      (chunk) => {
        const loading = $(`loading-${aiBubbleId}`);
        if (loading) loading.style.display = 'none';

        fullText += chunk;
        const formatted = formatMarkdown(fullText);
        $(`content-${aiBubbleId}`).innerHTML = formatted;

        // 自動滾動到底部
        const body = $('ai-chat-body');
        body.scrollTop = body.scrollHeight;
      },
      // onDone
      () => {
        $('btn-send').classList.remove('loading');
        currentController = null;

        // 4. 解析是否有產生的程式碼區塊
        const codeBlock = extractCodeBlock(fullText);
        if (codeBlock) {
          proposedAppCode = codeBlock;
          $('ai-action-bar').style.display = 'block'; // 顯示套用按鈕
          showToast('✨ 程式碼修改完成，請點選下方套用按鈕！', 'success');
        }
      },
      // onError
      (error) => {
        $('btn-send').classList.remove('loading');
        const loading = $(`loading-${aiBubbleId}`);
        if (loading) loading.style.display = 'none';

        $(`content-${aiBubbleId}`).innerHTML = `
          <div style="color: var(--accent-red); font-weight: 500;">
            ❌ 連線錯誤：${escapeHtml(error)}<br>
            <span style="font-size: 11px;">(提示：若是額度限制，請等待一分鐘或在設定中切換成 2.5 Flash 模型)</span>
          </div>
        `;
        currentController = null;
      }
    );
  }

  /**
   * 套用修改後的代碼並刷新沙盒
   */
  function applyProposedCode() {
    if (!proposedAppCode) {
      showToast('⚠️ 沒有可套用的修改', 'error');
      return;
    }

    currentAppCode = proposedAppCode;
    reloadPreview();
    proposedAppCode = '';
    
    // 隱藏套用列
    $('ai-action-bar').style.display = 'none';
    showToast('🚀 已成功更新天氣 App！', 'success');
  }

  // --- 小工具與 Markdown 簡易渲染 ---

  function appendMessage(sender, text, id = '') {
    const container = $('ai-chat-body');
    const msgDiv = document.createElement('div');
    msgDiv.className = `chat-message ${sender}`;
    if (id) msgDiv.id = id;

    const senderName = sender === 'user' ? '👤 您的需求' : '✨ AI 設計師';
    
    msgDiv.innerHTML = `
      <div class="chat-sender">${senderName}</div>
      <div class="chat-text">${text}</div>
    `;

    container.appendChild(msgDiv);
    container.scrollTop = container.scrollHeight;
  }

  function extractCodeBlock(text) {
    // 匹配 ```html ... ``` 區塊
    const codeMatch = text.match(/```html\n([\s\S]*?)```/) || text.match(/```[\s\S]*?\n([\s\S]*?)```/);
    return codeMatch ? codeMatch[1].trim() : null;
  }

  function formatMarkdown(text) {
    let html = escapeHtml(text);

    // 程式碼區塊隱藏，或是渲染為縮小框，避免太佔版面
    html = html.replace(/```(html)?\n([\s\S]*?)```/g, (_, __, code) => {
      return `
        <div style="background: rgba(0,0,0,0.3); border: 1px solid var(--border); border-radius: 8px; padding: 10px; margin: 10px 0; font-family: monospace; font-size: 11px;">
          🛠️ [產生的天氣 App 網頁原始碼 - 已準備就緒]
        </div>
      `;
    });

    // 行內程式碼
    html = html.replace(/`([^`]+)`/g, '<code style="background: rgba(255,255,255,0.08); padding: 2px 6px; border-radius: 4px; color: var(--accent-blue); font-family: monospace;">$1</code>');

    // 粗體
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

    // 標題
    html = html.replace(/^### (.+)$/gm, '<h4 style="margin: 10px 0 4px; color: var(--accent-blue);">$1</h4>');
    html = html.replace(/^## (.+)$/gm, '<h3 style="margin: 12px 0 6px; color: var(--accent-blue);">$1</h3>');

    // 列表項目
    html = html.replace(/^- (.+)$/gm, '<li style="margin-left: 14px; margin-bottom: 2px;">$1</li>');

    // 換行
    html = html.replace(/\n/g, '<br>');

    return html;
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function showToast(message, type = '') {
    const toast = $('toast');
    toast.textContent = message;
    toast.className = 'toast show ' + type;

    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => {
      toast.className = 'toast';
    }, 3000);
  }

  return { init };
})();

document.addEventListener('DOMContentLoaded', App.init);
