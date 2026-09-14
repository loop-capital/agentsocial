/**
 * Gisele Chat Widget — Standalone embed script
 *
 * Add to any website with a single line:
 *   <script src="https://cdn.agentsocial.ai/chat-widget/gisele.js" data-brand-color="#3b82f6"></script>
 *
 * Or for WordPress (in child theme functions.php or a Custom HTML widget):
 *   See installation instructions below.
 *
 * Framework-agnostic. Zero dependencies. 256x256 WebP avatar with B&W filter.
 * Talks to POST /api/v1/chat (Gemini-powered with keyword fallback).
 */

(function () {
  "use strict";

  // ─── Config ───────────────────────────────────────────────────
  const SCRIPT_TAG = document.currentScript || document.querySelector('script[data-gisele]');
  const CONFIG = {
    agentName: SCRIPT_TAG?.dataset?.agentName || "Gisele",
    agentTitle: SCRIPT_TAG?.dataset?.agentTitle || "PLEIJ Salon · Online",
    avatarUrl: SCRIPT_TAG?.dataset?.avatarUrl || "https://api.getagentsocial.com/assets/chat-widget/gisele-avatar.webp",
    brandColor: SCRIPT_TAG?.dataset?.brandColor || "#3b82f6",
    greeting: SCRIPT_TAG?.dataset?.greeting || "Hi! I'm Gisele, your digital stylist at PLEIJ. How can I help you today?",
    apiEndpoint: SCRIPT_TAG?.dataset?.apiEndpoint || "https://api.getagentsocial.com/api/v1/chat",
    position: SCRIPT_TAG?.dataset?.position || "bottom-right",
    quickReplies: JSON.parse(SCRIPT_TAG?.dataset?.quickReplies || '["Book appointment", "Hours & location", "Services & pricing", "Stylists"]'),
    locale: SCRIPT_TAG?.dataset?.locale || "en-US",
    autoOpenDelay: parseInt(SCRIPT_TAG?.dataset?.autoOpenDelay || "0", 10), // ms, 0 = disabled
  };

  // ─── State ────────────────────────────────────────────────────
  let state = "closed"; // closed | open | minimized
  let messages = [];
  let input = "";
  let isTyping = false;
  let hasGreeted = false;
  let sessionId = null;

  // ─── Styles ────────────────────────────────────────────────────
  const CSS = `
.gisele-widget * { box-sizing: border-box; margin: 0; padding: 0; }
.gisele-widget button { cursor: pointer; border: none; background: none; font-family: inherit; }
.gisele-widget input { font-family: inherit; }

/* Launcher */
.gisele-launcher {
  position: fixed; z-index: 999999; width: 56px; height: 56px; border-radius: 50%;
  border: 2px solid rgba(255,255,255,0.2); overflow: hidden;
  box-shadow: 0 4px 16px rgba(0,0,0,0.2); transition: transform 0.2s, box-shadow 0.2s;
}
.gisele-launcher:hover { transform: scale(1.08); box-shadow: 0 6px 24px rgba(0,0,0,0.3); }
.gisele-launcher img {
  width: 100%; height: 100%; object-fit: cover; filter: grayscale(100%) contrast(1.1);
}
.gisele-launcher-bottom-right { bottom: 24px; right: 24px; }
.gisele-launcher-bottom-left { bottom: 24px; left: 24px; }

/* Pulse ring */
.gisele-pulse {
  position: fixed; z-index: 999998; width: 56px; height: 56px; border-radius: 50%;
  pointer-events: none; animation: gisele-ping 2s cubic-bezier(0,0,0.2,1) infinite;
}
.gisele-pulse-bottom-right { bottom: 24px; right: 24px; }
.gisele-pulse-bottom-left { bottom: 24px; left: 24px; }
@keyframes gisele-ping {
  0% { transform: scale(1); opacity: 0.4; }
  75%, 100% { transform: scale(1.8); opacity: 0; }
}

/* Tooltip */
.gisele-tooltip {
  position: fixed; z-index: 999999; background: #1a1a1a; color: white;
  font-size: 13px; padding: 8px 14px; border-radius: 8px; white-space: nowrap;
  pointer-events: none; opacity: 0; transition: opacity 0.2s;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}
.gisele-tooltip::after {
  content: ''; position: absolute; top: 50%; transform: translateY(-50%);
  border: 6px solid transparent;
}
.gisele-tooltip-bottom-right { bottom: 44px; right: 88px; }
.gisele-tooltip-bottom-right::after { right: -12px; border-left-color: #1a1a1a; }
.gisele-tooltip-bottom-left { bottom: 44px; left: 88px; }
.gisele-tooltip-bottom-left::after { left: -12px; border-right-color: #1a1a1a; }
.gisele-launcher:hover ~ .gisele-tooltip { opacity: 1; }

/* Badge */
.gisele-badge {
  position: absolute; top: -4px; right: -4px; background: #ef4444; color: white;
  font-size: 11px; font-weight: 700; width: 20px; height: 20px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center; border: 2px solid white;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

/* Chat Panel */
.gisele-panel {
  position: fixed; z-index: 1000000; width: 380px; max-width: calc(100vw - 48px);
  height: 560px; max-height: calc(100vh - 96px);
  background: white; border-radius: 16px; overflow: hidden;
  box-shadow: 0 20px 60px rgba(0,0,0,0.15), 0 4px 16px rgba(0,0,0,0.1);
  display: flex; flex-direction: column;
  animation: gisele-slide-in 0.3s ease-out;
}
.gisele-panel-bottom-right { bottom: 96px; right: 24px; }
.gisele-panel-bottom-left { bottom: 96px; left: 24px; }
@keyframes gisele-slide-in {
  from { transform: translateY(16px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

/* Header */
.gisele-header {
  display: flex; align-items: center; gap: 12px; padding: 12px 16px;
  color: white; flex-shrink: 0;
}
.gisele-header-avatar {
  width: 40px; height: 40px; border-radius: 50%; overflow: hidden;
  border: 2px solid rgba(255,255,255,0.3); flex-shrink: 0; position: relative;
}
.gisele-header-avatar img {
  width: 100%; height: 100%; object-fit: cover; filter: grayscale(100%) contrast(1.1);
}
.gisele-online-dot {
  position: absolute; bottom: 0; right: 0; width: 10px; height: 10px;
  background: #4ade80; border-radius: 50%; border: 2px solid white;
}
.gisele-header-info { flex: 1; min-width: 0; }
.gisele-header-name { font-size: 14px; font-weight: 600; line-height: 1.3; }
.gisele-header-title { font-size: 11px; opacity: 0.8; }
.gisele-header-actions { display: flex; gap: 4px; }
.gisele-header-actions button {
  padding: 6px; border-radius: 8px; color: white; transition: background 0.2s;
}
.gisele-header-actions button:hover { background: rgba(255,255,255,0.2); }

/* Messages */
.gisele-messages {
  flex: 1; overflow-y: auto; padding: 12px 16px; background: #f7f8fa;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}
.gisele-msg { display: flex; gap: 8px; margin-bottom: 12px; }
.gisele-msg-user { justify-content: flex-end; }
.gisele-msg-bot { justify-content: flex-start; }
.gisele-msg-avatar {
  width: 28px; height: 28px; border-radius: 50%; overflow: hidden;
  flex-shrink: 0; margin-top: 4px;
}
.gisele-msg-avatar img {
  width: 100%; height: 100%; object-fit: cover; filter: grayscale(100%) contrast(1.1);
}
.gisele-msg-bubble {
  max-width: 75%; padding: 10px 14px; border-radius: 16px; font-size: 14px;
  line-height: 1.5; word-wrap: break-word;
}
.gisele-msg-user .gisele-msg-bubble {
  background: ${CONFIG.brandColor}; color: white; border-bottom-right-radius: 4px;
}
.gisele-msg-bot .gisele-msg-bubble {
  background: white; color: #1a1a1a; border-bottom-left-radius: 4px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.06); border: 1px solid #eee;
}
.gisele-msg-time {
  font-size: 10px; margin-top: 4px; display: block;
}
.gisele-msg-user .gisele-msg-time { color: rgba(255,255,255,0.7); }
.gisele-msg-bot .gisele-msg-time { color: #9ca3af; }

/* Typing indicator */
.gisele-typing { display: flex; gap: 8px; justify-content: flex-start; margin-bottom: 12px; }
.gisele-typing-dots {
  background: white; border-radius: 16px; border-bottom-left-radius: 4px;
  padding: 12px 16px; display: flex; gap: 6px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.06); border: 1px solid #eee;
}
.gisele-typing-dot {
  width: 8px; height: 8px; background: #9ca3af; border-radius: 50%;
  animation: gisele-bounce 1.4s infinite both;
}
.gisele-typing-dot:nth-child(2) { animation-delay: 0.15s; }
.gisele-typing-dot:nth-child(3) { animation-delay: 0.3s; }
@keyframes gisele-bounce {
  0%, 80%, 100% { transform: scale(0); }
  40% { transform: scale(1); }
}

/* Quick Replies */
.gisele-quick-replies {
  display: flex; flex-wrap: wrap; gap: 6px; padding: 8px 16px;
  border-top: 1px solid #f0f0f0; background: white;
}
.gisele-quick-reply {
  padding: 6px 14px; font-size: 12px; font-weight: 500; border-radius: 20px;
  border: 1px solid ${CONFIG.brandColor}33; background: ${CONFIG.brandColor}0d;
  color: ${CONFIG.brandColor}; cursor: pointer; transition: all 0.2s;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}
.gisele-quick-reply:hover {
  background: ${CONFIG.brandColor}1a; border-color: ${CONFIG.brandColor}66;
}

/* Input */
.gisele-input-bar {
  display: flex; align-items: center; gap: 8px; padding: 12px 16px;
  border-top: 1px solid #e5e7eb; background: white;
}
.gisele-input {
  flex: 1; font-size: 14px; background: #f7f8fa; border: 1px solid #e5e7eb;
  border-radius: 24px; padding: 10px 16px; outline: none;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  transition: border-color 0.2s;
}
.gisele-input:focus { border-color: ${CONFIG.brandColor}; }
.gisele-input::placeholder { color: #9ca3af; }
.gisele-send {
  width: 36px; height: 36px; border-radius: 50%; color: white; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center; transition: opacity 0.2s;
}
.gisele-send:disabled { opacity: 0.4; cursor: not-allowed; }
.gisele-send:not(:disabled):hover { opacity: 0.9; }

/* Footer */
.gisele-footer {
  text-align: center; padding: 6px; border-top: 1px solid #f0f0f0; background: #f7f8fa;
}
.gisele-footer span { font-size: 10px; color: #9ca3af; }

/* Mobile responsive */
@media (max-width: 480px) {
  .gisele-panel {
    width: 100vw; height: 100vh; max-height: 100vh;
    bottom: 0; right: 0; border-radius: 0;
  }
  .gisele-panel-bottom-right, .gisele-panel-bottom-left { bottom: 0; right: 0; left: 0; }
}
`;

  // ─── SVG Icons ─────────────────────────────────────────────────
  const X_ICON = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>';
  const MINUS_ICON = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/></svg>';
  const SEND_ICON = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>';

  // ─── Render Functions ──────────────────────────────────────────

  function injectStyles() {
    const style = document.createElement("style");
    style.textContent = CSS;
    document.head.appendChild(style);
  }

  function createLauncher() {
    const pos = CONFIG.position;

    // Pulse ring
    const pulse = document.createElement("div");
    pulse.className = `gisele-widget gisele-pulse gisele-pulse-${pos}`;
    pulse.style.background = CONFIG.brandColor;
    document.body.appendChild(pulse);

    // Launcher button
    const launcher = document.createElement("button");
    launcher.className = `gisele-widget gisele-launcher gisele-launcher-${pos}`;
    launcher.style.background = CONFIG.brandColor;
    launcher.setAttribute("aria-label", `Chat with ${CONFIG.agentName}`);
    launcher.innerHTML = `<img src="${CONFIG.avatarUrl}" alt="${CONFIG.agentName}" />`;
    launcher.addEventListener("click", openWidget);
    document.body.appendChild(launcher);

    // Tooltip
    const tooltip = document.createElement("div");
    tooltip.className = `gisele-widget gisele-tooltip gisele-tooltip-${pos}`;
    tooltip.textContent = `Chat with ${CONFIG.agentName}`;
    document.body.appendChild(tooltip);

    // Auto-show tooltip briefly
    setTimeout(() => { tooltip.style.opacity = "1"; }, 2000);
    setTimeout(() => { tooltip.style.opacity = "0"; }, 5000);

    // Auto-open
    if (CONFIG.autoOpenDelay > 0) {
      setTimeout(openWidget, CONFIG.autoOpenDelay);
    }

    return { launcher, pulse, tooltip };
  }

  function createPanel() {
    const pos = CONFIG.position;
    const panel = document.createElement("div");
    panel.className = `gisele-widget gisele-panel gisele-panel-${pos}`;
    panel.id = "gisele-chat-panel";

    panel.innerHTML = `
      <div class="gisele-header" style="background: ${CONFIG.brandColor}">
        <div class="gisele-header-avatar">
          <img src="${CONFIG.avatarUrl}" alt="${CONFIG.agentName}" />
          <div class="gisele-online-dot"></div>
        </div>
        <div class="gisele-header-info">
          <div class="gisele-header-name">${CONFIG.agentName}</div>
          <div class="gisele-header-title">${CONFIG.agentTitle}</div>
        </div>
        <div class="gisele-header-actions">
          <button aria-label="Minimize" onclick="document.giseleWidget.minimize()">${MINUS_ICON}</button>
          <button aria-label="Close" onclick="document.giseleWidget.close()">${X_ICON}</button>
        </div>
      </div>
      <div class="gisele-messages" id="gisele-messages"></div>
      <div class="gisele-quick-replies" id="gisele-quick-replies"></div>
      <div class="gisele-input-bar">
        <input class="gisele-input" id="gisele-input" type="text" placeholder="Type a message..." autocomplete="off" />
        <button class="gisele-send" id="gisele-send" style="background: ${CONFIG.brandColor}" disabled aria-label="Send">${SEND_ICON}</button>
      </div>
      <div class="gisele-footer"><span>Powered by AgentSocial</span></div>
    `;

    document.body.appendChild(panel);

    // Event listeners
    const inputEl = panel.querySelector("#gisele-input");
    const sendBtn = panel.querySelector("#gisele-send");

    inputEl.addEventListener("input", () => {
      sendBtn.disabled = !inputEl.value.trim();
      input = inputEl.value;
    });

    inputEl.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && inputEl.value.trim()) {
        sendMessage(inputEl.value.trim());
      }
    });

    sendBtn.addEventListener("click", () => {
      if (inputEl.value.trim()) {
        sendMessage(inputEl.value.trim());
      }
    });

    return panel;
  }

  // ─── Widget Actions ────────────────────────────────────────────

  function openWidget() {
    state = "open";
    const panel = document.getElementById("gisele-chat-panel");
    if (panel) panel.style.display = "flex";

    // Hide launcher elements
    document.querySelectorAll(".gisele-launcher, .gisele-pulse, .gisele-tooltip").forEach((el) => {
      el.style.display = "none";
    });

    if (!hasGreeted) {
      hasGreeted = true;
      addBotMessage(CONFIG.greeting, CONFIG.quickReplies);
    }

    // Focus input
    setTimeout(() => {
      const input = document.getElementById("gisele-input");
      if (input) input.focus();
    }, 100);
  }

  function closeWidget() {
    state = "closed";
    const panel = document.getElementById("gisele-chat-panel");
    if (panel) panel.style.display = "none";
    document.querySelectorAll(".gisele-launcher, .gisele-pulse, .gisele-tooltip").forEach((el) => {
      el.style.display = "";
    });
  }

  function minimizeWidget() {
    state = "minimized";
    const panel = document.getElementById("gisele-chat-panel");
    if (panel) panel.style.display = "none";
    document.querySelectorAll(".gisele-launcher, .gisele-pulse, .gisele-tooltip").forEach((el) => {
      el.style.display = "";
    });
  }

  // ─── Messages ──────────────────────────────────────────────────

  function formatTime(date) {
    return date.toLocaleTimeString(CONFIG.locale, { hour: "numeric", minute: "2-digit" });
  }

  function addUserMessage(text) {
    const msg = { id: crypto.randomUUID(), role: "user", content: text, timestamp: new Date() };
    messages.push(msg);
    renderMessage(msg);
  }

  function addBotMessage(text, quickReplies) {
    const msg = { id: crypto.randomUUID(), role: "bot", content: text, timestamp: new Date(), quickReplies };
    messages.push(msg);
    renderMessage(msg);
    renderQuickReplies(quickReplies || []);
    isTyping = false;
  }

  function renderMessage(msg) {
    const container = document.getElementById("gisele-messages");
    if (!container) return;

    const div = document.createElement("div");
    div.className = `gisele-msg gisele-msg-${msg.role}`;

    let html = "";
    if (msg.role === "bot") {
      html += `<div class="gisele-msg-avatar"><img src="${CONFIG.avatarUrl}" alt="${CONFIG.agentName}" /></div>`;
    }

    html += `<div class="gisele-msg-bubble"><p>${escapeHtml(msg.content)}</p><span class="gisele-msg-time">${formatTime(msg.timestamp)}</span></div>`;
    div.innerHTML = html;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
  }

  function renderTypingIndicator() {
    const container = document.getElementById("gisele-messages");
    if (!container) return;

    const div = document.createElement("div");
    div.className = "gisele-typing";
    div.id = "gisele-typing";
    div.innerHTML = `
      <div class="gisele-msg-avatar"><img src="${CONFIG.avatarUrl}" alt="${CONFIG.agentName}" /></div>
      <div class="gisele-typing-dots">
        <div class="gisele-typing-dot"></div>
        <div class="gisele-typing-dot"></div>
        <div class="gisele-typing-dot"></div>
      </div>`;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
  }

  function removeTypingIndicator() {
    const el = document.getElementById("gisele-typing");
    if (el) el.remove();
  }

  function renderQuickReplies(replies) {
    const container = document.getElementById("gisele-quick-replies");
    if (!container) return;
    container.innerHTML = "";

    if (!replies || replies.length === 0) return;

    replies.forEach((reply) => {
      const btn = document.createElement("button");
      btn.className = "gisele-quick-reply";
      btn.textContent = reply;
      btn.addEventListener("click", () => sendMessage(reply));
      container.appendChild(btn);
    });
  }

  function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  // ─── Send Message ──────────────────────────────────────────────

  async function sendMessage(text) {
    if (!text.trim()) return;

    addUserMessage(text);
    isTyping = true;
    renderQuickReplies([]);
    renderTypingIndicator();

    if (!sessionId) sessionId = crypto.randomUUID();

    try {
      const res = await fetch(CONFIG.apiEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text.trim(),
          brandId: "pleij",
          context: "salon_chat",
          sessionId: sessionId,
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      removeTypingIndicator();
      addBotMessage(data.response || data.message || "I'm not sure about that. Let me connect you with our team.", data.quickReplies);
    } catch {
      removeTypingIndicator();
      addBotMessage(...getKeywordResponse(text));
    }
  }

  // ─── Keyword Fallback ──────────────────────────────────────────

  function getKeywordResponse(message) {
    const lower = message.toLowerCase();
    const QUICK_REPLIES = {
      hours: ["Book appointment", "Get directions", "Call salon"],
      booking: ["Haircut", "Color & highlights", "Blowout", "All services"],
      services: ["Book appointment", "Price list", "Stylist info"],
      pricing: ["Book appointment", "Service details", "Call salon"],
      fallback: ["Book appointment", "Hours & location", "Call salon"],
    };

    if (/hour|open|close|time/.test(lower))
      return ["PLEIJ is open Tuesday–Saturday 9AM–7PM, and Sunday 10AM–5PM. We're closed Mondays. Want me to help you book an appointment?", QUICK_REPLIES.hours];
    if (/book|appointment|schedule|reserve/.test(lower))
      return ["I'd love to help you book! You can book online at pleijsalon.com/book or call us at (614) 665-1751. What service are you looking for?", QUICK_REPLIES.booking];
    if (/price|cost|how much|pricing/.test(lower))
      return ["Our prices vary by stylist and service. Haircuts start at $45, color services from $85. Want me to show you the full menu?", QUICK_REPLIES.pricing];
    if (/service|menu|offer|haircut|color|style|balayage|highlight|treatment|keratin|blowout|updo|extension/.test(lower))
      return ["We offer haircuts, color, highlights, balayage, styling, treatments, and more! Each of our 10 stylists specializes in different areas. What are you most interested in?", QUICK_REPLIES.services];
    if (/location|address|directions|where|park/.test(lower))
      return ["We're at 6800 N High St, Columbus, OH 43214. Free parking available! Need directions or want to book?", ["Get directions", "Book appointment", "Call salon"]];
    if (/stylist|who|recommend|best/.test(lower))
      return ["We have 10 talented stylists at different levels — Senior, Master, and Junior. Each specializes in different areas. Want me to help match you with the right stylist?", ["Book consultation", "Call salon", "All services"]];
    if (/cancel|reschedule|policy/.test(lower))
      return ["We have a 24-hour cancellation policy. To cancel or reschedule, call us at (614) 665-1751 or use your confirmation link.", ["Call salon", "Book appointment", "Hours & location"]];
    if (/thank|bye|goodbye/.test(lower))
      return ["You're welcome! Feel free to reach out anytime. Have a beautiful day! 💇‍♀️", []];
    return ["That's a great question! Let me connect you with our team for the best answer. You can also call us at (614) 665-1751. Is there anything else I can help with?", QUICK_REPLIES.fallback];
  }

  // ─── Initialize ───────────────────────────────────────────────

  function init() {
    injectStyles();
    createLauncher();
    createPanel();

    // Expose API for programmatic control
    document.giseleWidget = {
      open: openWidget,
      close: closeWidget,
      minimize: minimizeWidget,
      sendMessage: sendMessage,
    };
  }

  // Wait for DOM ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();