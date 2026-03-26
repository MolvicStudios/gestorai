// js/chatbot.js — Chatbot flotante GestorAI, disponible en todas las páginas
import { askIA, PROMPTS, buildCCAAContext } from './ia-client.js';
import { getSession, supabase } from './auth.js';

let chatOpen = false;
let messages = [];
let ccaaCtx = '';
let isTyping = false;

function createChatUI() {
  // FAB button
  const fab = document.createElement('button');
  fab.id = 'chat-fab';
  fab.setAttribute('aria-label', 'Abrir asistente IA');
  fab.innerHTML = `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`;
  document.body.appendChild(fab);

  // Chat panel
  const panel = document.createElement('div');
  panel.id = 'chat-panel';
  panel.innerHTML = `
    <div class="chat-header">
      <div class="chat-header-info">
        <span class="chat-avatar">🤖</span>
        <div>
          <strong>Asistente GestorAI</strong>
          <span class="chat-status">IA fiscal • Siempre disponible</span>
        </div>
      </div>
      <button id="chat-close" aria-label="Cerrar chat">✕</button>
    </div>
    <div id="chat-messages" class="chat-messages"></div>
    <div id="chat-typing" class="chat-typing" style="display:none;">
      <span></span><span></span><span></span>
    </div>
    <form id="chat-form" class="chat-input-bar">
      <input type="text" id="chat-input" placeholder="Pregunta lo que necesites..." autocomplete="off" maxlength="1000">
      <button type="submit" id="chat-send" aria-label="Enviar">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
      </button>
    </form>
  `;
  document.body.appendChild(panel);

  // Events
  fab.addEventListener('click', toggleChat);
  document.getElementById('chat-close').addEventListener('click', toggleChat);
  document.getElementById('chat-form').addEventListener('submit', handleSend);

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && chatOpen) toggleChat();
  });
}

function toggleChat() {
  chatOpen = !chatOpen;
  const panel = document.getElementById('chat-panel');
  const fab = document.getElementById('chat-fab');
  panel.classList.toggle('open', chatOpen);
  fab.classList.toggle('hidden', chatOpen);

  if (chatOpen && messages.length === 0) {
    addMessage('assistant', '¡Hola! Soy tu asistente fiscal y contable. Puedo ayudarte con facturación, impuestos, contratos, nóminas y cualquier duda sobre tu negocio. ¿En qué te puedo ayudar?');
    document.getElementById('chat-input').focus();
  }
}

function addMessage(role, content) {
  messages.push({ role, content });
  renderMessages();
}

function renderMessages() {
  const container = document.getElementById('chat-messages');
  container.innerHTML = messages.map(m => `
    <div class="chat-msg chat-msg-${m.role}">
      <div class="chat-bubble">${formatMessage(m.content)}</div>
    </div>
  `).join('');
  container.scrollTop = container.scrollHeight;
}

function formatMessage(text) {
  // Basic markdown: bold, italic, code, links, line breaks
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/\n/g, '<br>');
}

async function handleSend(e) {
  e.preventDefault();
  const input = document.getElementById('chat-input');
  const text = input.value.trim();
  if (!text || isTyping) return;

  addMessage('user', text);
  input.value = '';
  input.focus();

  // Show typing indicator
  isTyping = true;
  document.getElementById('chat-typing').style.display = 'flex';
  document.getElementById('chat-send').disabled = true;

  // Detect module from context
  const modulo = detectModule(text);
  const systemPrompt = buildSystemPrompt(modulo);

  // Build conversation context (last 6 messages for context window)
  const recentMessages = messages.slice(-6).map(m =>
    `${m.role === 'user' ? 'Usuario' : 'Asistente'}: ${m.content}`
  ).join('\n');

  const userPrompt = messages.length > 1
    ? `Contexto de la conversación:\n${recentMessages}\n\nÚltima pregunta del usuario: ${text}`
    : text;

  const result = await askIA({ systemPrompt, userPrompt, modulo });

  // Hide typing
  isTyping = false;
  document.getElementById('chat-typing').style.display = 'none';
  document.getElementById('chat-send').disabled = false;

  if (result.success) {
    addMessage('assistant', result.content);
  } else if (result.error === 'limite_free') {
    addMessage('assistant', '⚠️ Has alcanzado el límite de 5 consultas diarias del plan gratuito. Para consultas ilimitadas, mejora a **Pro** por solo 14,99 €/mes con 7 días gratis.');
    import('./upgrade-modal.js').then(m => m.showUpgradeModal('ia'));
  } else if (result.error === 'no_session') {
    addMessage('assistant', '⚠️ Tu sesión ha expirado. Por favor, recarga la página e inicia sesión de nuevo.');
  } else {
    addMessage('assistant', '❌ Error al conectar con el asistente. Inténtalo de nuevo en unos segundos.');
  }
}

function detectModule(text) {
  const t = text.toLowerCase();
  if (/factura|iva|base imponible|presupuesto|verifactu|cliente.*cobr/i.test(t)) return 'facturacion';
  if (/modelo\s*\d|irpf|trimestral|hacienda|declaración|retención|130|303|111|390/i.test(t)) return 'fiscal';
  if (/contrato|cláusula|nda|confidencialidad|mercantil|arrendamiento/i.test(t)) return 'contratos';
  if (/nómina|finiquito|sueldo|salario|cotización|seguridad social|smi|reta|despido/i.test(t)) return 'laboral';
  return 'general';
}

function buildSystemPrompt(modulo) {
  const base = PROMPTS[modulo] || PROMPTS.base;
  return base + ccaaCtx + '\nResponde de forma concisa y práctica. Si la pregunta requiere datos específicos del usuario que no tienes, pídelos.';
}

async function loadCCAAContext() {
  try {
    const session = await getSession();
    if (!session) return;
    const { data: profile } = await supabase.from('profiles').select('ccaa').eq('id', session.user.id).single();
    if (profile?.ccaa) {
      const { data: ccaaData } = await supabase.from('ccaa_legislacion').select('*').eq('codigo', profile.ccaa).single();
      if (ccaaData) ccaaCtx = buildCCAAContext(ccaaData);
    }
  } catch { /* silently fail — chatbot works without CCAA context */ }
}

function injectStyles() {
  const style = document.createElement('style');
  style.textContent = `
    #chat-fab {
      position: fixed;
      bottom: 1.5rem;
      right: 1.5rem;
      z-index: 9998;
      width: 56px;
      height: 56px;
      border-radius: 50%;
      border: none;
      background: var(--color-primary, #0D7966);
      color: #fff;
      cursor: pointer;
      box-shadow: 0 4px 16px rgba(0,0,0,.25);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform .2s, opacity .2s;
    }
    #chat-fab:hover { transform: scale(1.08); }
    #chat-fab.hidden { transform: scale(0); opacity: 0; pointer-events: none; }

    #chat-panel {
      position: fixed;
      bottom: 1.5rem;
      right: 1.5rem;
      z-index: 9999;
      width: 380px;
      max-width: calc(100vw - 2rem);
      height: 520px;
      max-height: calc(100vh - 3rem);
      background: var(--color-surface, #fff);
      border: 1px solid var(--color-border, #e2e8f0);
      border-radius: 1rem;
      box-shadow: 0 8px 32px rgba(0,0,0,.18);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      transform: scale(0.9) translateY(20px);
      opacity: 0;
      pointer-events: none;
      transition: transform .25s ease, opacity .25s ease;
      transform-origin: bottom right;
    }
    #chat-panel.open {
      transform: scale(1) translateY(0);
      opacity: 1;
      pointer-events: auto;
    }

    .chat-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: .75rem 1rem;
      background: var(--color-primary, #0D7966);
      color: #fff;
      flex-shrink: 0;
    }
    .chat-header-info { display: flex; align-items: center; gap: .6rem; }
    .chat-avatar { font-size: 1.5rem; }
    .chat-header strong { font-size: .95rem; display: block; }
    .chat-status { font-size: .75rem; opacity: .85; }
    #chat-close {
      background: none; border: none; color: #fff; font-size: 1.2rem;
      cursor: pointer; padding: .25rem; opacity: .8; line-height: 1;
    }
    #chat-close:hover { opacity: 1; }

    .chat-messages {
      flex: 1;
      overflow-y: auto;
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: .6rem;
      background: var(--color-bg);
    }
    .chat-msg { display: flex; }
    .chat-msg-user { justify-content: flex-end; }
    .chat-msg-assistant { justify-content: flex-start; }
    .chat-bubble {
      max-width: 85%;
      padding: .6rem .9rem;
      border-radius: .8rem;
      font-size: .9rem;
      line-height: 1.45;
      word-break: break-word;
    }
    .chat-msg-user .chat-bubble {
      background: var(--color-primary, #0D7966);
      color: #fff;
      border-bottom-right-radius: .2rem;
    }
    .chat-msg-assistant .chat-bubble {
      background: var(--color-surface-2, #f1f5f9);
      color: var(--color-text, #1e293b);
      border-bottom-left-radius: .2rem;
    }
    .chat-bubble code {
      background: rgba(0,0,0,.08);
      padding: .1rem .3rem;
      border-radius: .2rem;
      font-size: .85em;
    }
    .chat-bubble a {
      color: var(--color-primary, #0D7966);
      text-decoration: underline;
    }
    .chat-msg-user .chat-bubble a { color: #fff; }

    .chat-typing {
      display: none;
      align-items: center;
      gap: .3rem;
      padding: .5rem 1rem;
      flex-shrink: 0;
    }
    .chat-typing span {
      width: 8px; height: 8px;
      border-radius: 50%;
      background: var(--color-text-muted, #94a3b8);
      animation: chatTyping 1.2s infinite;
    }
    .chat-typing span:nth-child(2) { animation-delay: .2s; }
    .chat-typing span:nth-child(3) { animation-delay: .4s; }
    @keyframes chatTyping {
      0%, 60%, 100% { opacity: .3; transform: scale(.8); }
      30% { opacity: 1; transform: scale(1); }
    }

    .chat-input-bar {
      display: flex;
      gap: .5rem;
      padding: .75rem;
      border-top: 1px solid var(--color-border, #e2e8f0);
      flex-shrink: 0;
      background: var(--color-surface, #fff);
    }
    #chat-input {
      flex: 1;
      border: 1px solid var(--color-border, #e2e8f0);
      border-radius: .5rem;
      padding: .5rem .75rem;
      font-size: .9rem;
      background: var(--color-bg, #fff);
      color: var(--color-text, #1e293b);
      outline: none;
      font-family: inherit;
    }
    #chat-input::placeholder { color: var(--color-text-muted, #94a3b8); }
    #chat-input:focus { border-color: var(--color-primary, #0D7966); }
    #chat-send {
      width: 40px; height: 40px;
      border-radius: .5rem;
      border: none;
      background: var(--color-primary, #0D7966);
      color: #fff;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      transition: opacity .15s;
    }
    #chat-send:disabled { opacity: .5; cursor: not-allowed; }
    #chat-send:hover:not(:disabled) { opacity: .85; }

    /* Mobile: full-width panel */
    @media (max-width: 480px) {
      #chat-panel {
        width: 100vw;
        height: 100vh;
        max-height: 100vh;
        bottom: 0;
        right: 0;
        border-radius: 0;
      }
      #chat-fab { bottom: 1rem; right: 1rem; }
    }

    /* Avoid overlapping mobile bottom nav */
    @media (max-width: 768px) {
      #chat-fab { bottom: 5rem; }
    }
  `;
  document.head.appendChild(style);
}

export async function initChatbot() {
  injectStyles();
  createChatUI();
  loadCCAAContext(); // async, non-blocking
}
