/* ===== Carnet — planificateur personnel (vanilla JS, sans dépendances) ===== */

const STORAGE_KEY = 'carnet-data';
const EMPTY = { rituals: [], inbox: [], oneoffs: [], notes: [], wishlist: [], completions: {} };
const DAYS_FR = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];
const START_HOUR = 6, END_HOUR = 23, HOUR_HEIGHT = 56;

function pad(n) { return String(n).padStart(2, '0'); }
function toDateStr(d) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }
function fmtHeader(d) {
  const days = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
  const months = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
  return `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]}`;
}
function getISOWeek(d) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = (date.getUTCDay() + 6) % 7;
  date.setUTCDate(date.getUTCDate() - dayNum + 3);
  const firstThursday = new Date(Date.UTC(date.getUTCFullYear(), 0, 4));
  return 1 + Math.round((date - firstThursday) / (7 * 24 * 3600 * 1000));
}
function uid() { return Math.random().toString(36).slice(2, 10); }
function timeToMinutes(t) { if (!t) return null; const [h, m] = t.split(':').map(Number); return h * 60 + m; }
function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

/* ---------- state (persisted) + ui (ephemeral) ---------- */
function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...EMPTY, ...JSON.parse(raw) };
  } catch (e) { /* stockage indisponible dans ce contexte — on repart à vide */ }
  return JSON.parse(JSON.stringify(EMPTY));
}
function saveState() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
  catch (e) { /* pas de persistance possible ici (ex. aperçu sandboxé) */ }
}

let state = loadState();
let ui = { tab: 'today', date: new Date(), scheduling: null, quickOpen: false, ritualForm: null, noteTag: 'Toutes', noteEditing: null };

const root = document.getElementById('app');

/* ---------- render ---------- */
function render() {
  const dateStr = toDateStr(ui.date);
  const isToday = dateStr === toDateStr(new Date());
  root.innerHTML = `
    ${renderHeader(isToday)}
    ${renderTabs()}
    <div id="tab-content">${renderTab(dateStr, isToday)}</div>
  `;
}

function renderHeader(isToday) {
  return `
  <div style="margin-bottom:20px;">
    <div class="header-eyebrow">Semaine ${getISOWeek(ui.date)}</div>
    <div class="header-row">
      <button class="icon-btn" data-action="shift-day" data-dir="-1" aria-label="Jour précédent">‹</button>
      <div style="text-align:center;">
        <div class="header-date">${fmtHeader(ui.date)}</div>
        ${!isToday ? `<button class="today-link" data-action="go-today">revenir à aujourd'hui</button>` : ''}
      </div>
      <button class="icon-btn" data-action="shift-day" data-dir="1" aria-label="Jour suivant">›</button>
    </div>
  </div>`;
}

function renderTabs() {
  const items = [
    { id: 'today', label: "Aujourd'hui", icon: '📅' },
    { id: 'rituels', label: 'Rituels', icon: '🔁' },
    { id: 'notes', label: 'Notes', icon: '📝' },
    { id: 'envies', label: 'Envies', icon: '🤍' },
  ];
  return `<div class="tab-bar">${items.map(it => `
    <button class="tab-btn ${ui.tab === it.id ? 'active' : ''}" data-action="set-tab" data-tab="${it.id}">
      <span>${it.icon}</span>${it.label}
    </button>`).join('')}</div>`;
}

function renderTab(dateStr, isToday) {
  if (ui.tab === 'rituels') return renderRituels();
  if (ui.tab === 'notes') return renderNotes();
  if (ui.tab === 'envies') return renderEnvies();
  return renderToday(dateStr, isToday);
}

function renderToday(dateStr, isToday) {
  const weekday = ui.date.getDay();
  const ritualItems = state.rituals.filter(r => r.days.includes(weekday)).map(r => ({
    kind: 'ritual', id: r.id, title: r.title, time: r.time, duration: r.duration || 30,
    done: !!state.completions[`${r.id}_${dateStr}`], color: '#2F6F5E'
  }));
  const oneoffItems = state.oneoffs.filter(o => o.date === dateStr).map(o => ({
    kind: 'oneoff', id: o.id, title: o.title, time: o.time, duration: o.duration || 30, done: !!o.completed, color: '#5B4B8A'
  }));
  const allItems = [...ritualItems, ...oneoffItems];
  const timed = allItems.filter(i => i.time).sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time));
  const untimed = allItems.filter(i => !i.time);

  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const showNow = isToday && nowMinutes >= START_HOUR * 60 && nowMinutes <= END_HOUR * 60;

  return `
  <div>
    <div style="margin-bottom:16px;">
      <div style="display:flex;gap:8px;">
        <input id="inbox-input" class="input" placeholder="Capturer une idée, une tâche…" />
        <button class="icon-btn" style="background:#A6635A;color:#fff;border:none;" data-action="add-inbox">+</button>
      </div>
      ${state.inbox.length > 0 ? `<div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:10px;">
        ${state.inbox.map(item => `
          <div class="chip">
            <span>${esc(item.title)}</span>
            <button class="chip-btn" data-action="toggle-schedule" data-id="${item.id}" aria-label="Planifier">🕐</button>
            <button class="chip-btn" data-action="finish-inbox" data-id="${item.id}" aria-label="Fait">✓</button>
          </div>`).join('')}
      </div>` : ''}
      ${ui.scheduling ? `
        <div class="card" style="margin-top:10px;display:flex;gap:8px;align-items:center;">
          <input id="sched-time" type="time" class="input" style="width:100px;" />
          <select id="sched-dur" class="input" style="width:90px;">
            ${[15, 30, 45, 60, 90, 120].map(d => `<option value="${d}">${d} min</option>`).join('')}
          </select>
          <button class="icon-btn" style="background:#23252B;color:#fff;border:none;width:auto;padding:0 12px;" data-action="confirm-schedule" data-id="${ui.scheduling}">Placer</button>
        </div>` : ''}
    </div>

    ${untimed.length > 0 ? `
      <div style="margin-bottom:14px;">
        <div class="label">Sans horaire</div>
        <div class="row-gap">
          ${untimed.map(item => `
            <div class="task-row">
              <button class="checkbox" style="border-color:${item.color};background:${item.done ? item.color : 'transparent'};" data-action="toggle-done" data-kind="${item.kind}" data-id="${item.id}"></button>
              <span style="flex:1;font-size:13.5px;${item.done ? 'text-decoration:line-through;color:#9CA3AF;' : ''}">${esc(item.title)}</span>
              ${item.kind === 'oneoff' ? `<button class="trash-btn" data-action="delete-oneoff" data-id="${item.id}">🗑</button>` : ''}
            </div>`).join('')}
        </div>
      </div>` : ''}

    <div class="label">Planning du jour</div>
    <div class="timeline">
      <div class="timeline-rule"></div>
      ${Array.from({ length: END_HOUR - START_HOUR + 1 }).map((_, i) => {
        const hour = START_HOUR + i;
        return `<div class="hour-row"><span class="hour-label">${pad(hour)}:00</span></div>`;
      }).join('')}
      ${timed.map(item => {
        const start = timeToMinutes(item.time);
        const top = (start - START_HOUR * 60) / 60 * HOUR_HEIGHT;
        const height = Math.max(26, item.duration / 60 * HOUR_HEIGHT);
        const bg = item.done ? '' : `background:${item.color};color:#fff;`;
        return `<div class="task-block ${item.done ? 'done' : ''}" style="top:${top}px;height:${height}px;${bg}" data-action="toggle-done" data-kind="${item.kind}" data-id="${item.id}">${esc(item.title)}</div>`;
      }).join('')}
      ${showNow ? `<div class="now-line" style="top:${(nowMinutes - START_HOUR * 60) / 60 * HOUR_HEIGHT}px;"><div class="now-dot"></div></div>` : ''}
    </div>

    <div style="margin-top:14px;">
      ${!ui.quickOpen ? `
        <button class="ghost-btn" data-action="open-quick">+ Ajouter une tâche à une heure précise</button>
      ` : `
        <div class="card">
          <input id="quick-title" class="input" placeholder="Titre de la tâche" style="margin-bottom:8px;" />
          <div style="display:flex;gap:8px;">
            <input id="quick-time" type="time" class="input" style="width:100px;" />
            <select id="quick-dur" class="input" style="width:90px;">
              ${[15, 30, 45, 60, 90, 120].map(d => `<option value="${d}">${d} min</option>`).join('')}
            </select>
            <button class="icon-btn" style="background:#23252B;color:#fff;border:none;width:auto;padding:0 12px;" data-action="add-quick">Ajouter</button>
          </div>
        </div>
      `}
    </div>
  </div>`;
}

function renderRituels() {
  const f = ui.ritualForm;
  return `
  <div>
    <div class="label">Tâches récurrentes</div>
    <div class="row-gap" style="margin-bottom:14px;">
      ${state.rituals.length === 0 ? `<div class="empty">Aucun rituel pour l'instant — ajoute les tâches qui reviennent chaque semaine.</div>` : ''}
      ${state.rituals.map(r => `
        <div class="card" style="border-left:4px solid #2F6F5E;cursor:pointer;" data-action="edit-ritual" data-id="${r.id}">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <span style="font-size:14px;font-weight:500;">${esc(r.title)}</span>
            <button class="trash-btn" data-action="delete-ritual" data-id="${r.id}" data-stop="1">🗑</button>
          </div>
          <div style="font-size:12px;color:#9CA3AF;margin-top:3px;">
            ${r.time ? `${r.time} · ${r.duration} min · ` : ''}${DAY_ORDER.filter(d => r.days.includes(d)).map(d => DAYS_FR[d]).join(' ')}
          </div>
        </div>`).join('')}
    </div>
    ${!f ? `<button class="ghost-btn" data-action="new-ritual">+ Nouveau rituel</button>` : `
      <div class="card">
        <input id="ritual-title" class="input" placeholder="Titre (ex. Sport, Révision anglais…)" style="margin-bottom:8px;" value="${esc(f.title || '')}" />
        <div style="display:flex;gap:8px;margin-bottom:8px;">
          <input id="ritual-time" type="time" class="input" style="width:100px;" value="${f.time || ''}" />
          <select id="ritual-dur" class="input" style="width:90px;">
            ${[15, 30, 45, 60, 90, 120].map(d => `<option value="${d}" ${Number(f.duration) === d ? 'selected' : ''}>${d} min</option>`).join('')}
          </select>
        </div>
        <div style="display:flex;gap:4px;margin-bottom:10px;">
          ${DAY_ORDER.map(d => `<button class="day-toggle ${f.days.includes(d) ? 'active' : ''}" data-action="toggle-ritual-day" data-day="${d}">${DAYS_FR[d]}</button>`).join('')}
        </div>
        <div style="display:flex;gap:8px;">
          <button class="icon-btn" style="background:#23252B;color:#fff;border:none;width:auto;padding:0 16px;flex:1;" data-action="save-ritual">Enregistrer</button>
          <button class="icon-btn" style="background:#fff;width:auto;padding:0 16px;" data-action="cancel-ritual">Annuler</button>
        </div>
      </div>`}
  </div>`;
}

function renderNotes() {
  const tags = ['Toutes', ...Array.from(new Set(state.notes.map(n => n.tag).filter(Boolean)))];
  const filtered = ui.noteTag === 'Toutes' ? state.notes : state.notes.filter(n => n.tag === ui.noteTag);
  const e = ui.noteEditing;
  return `
  <div>
    <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:14px;">
      ${tags.map(t => `<button class="tag-chip ${ui.noteTag === t ? 'active' : ''}" data-action="set-note-tag" data-tag="${esc(t)}">${esc(t)}</button>`).join('')}
    </div>
    ${!e ? `
      <div class="row-gap" style="margin-bottom:14px;">
        ${filtered.length === 0 ? `<div class="empty">Aucune note ici — capture un cours ou une idée.</div>` : ''}
        ${filtered.map(n => `
          <div class="card" style="cursor:pointer;" data-action="edit-note" data-id="${n.id}">
            <div style="display:flex;justify-content:space-between;">
              <span style="font-size:14px;font-weight:500;">${esc(n.title)}</span>
              ${n.tag ? `<span style="font-size:11px;color:#C08A2E;">${esc(n.tag)}</span>` : ''}
            </div>
            ${n.content ? `<div style="font-size:12.5px;color:#9CA3AF;margin-top:4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${esc(n.content)}</div>` : ''}
          </div>`).join('')}
      </div>` : ''}
    ${!e ? `<button class="ghost-btn" data-action="new-note">+ Nouvelle note</button>` : `
      <div class="card">
        <input id="note-title" class="input" placeholder="Titre" style="margin-bottom:8px;" value="${esc(e.title || '')}" />
        <input id="note-tag" class="input" placeholder="Sujet (ex. Cours stats, Idées…)" style="margin-bottom:8px;" value="${esc(e.tag || '')}" />
        <textarea id="note-content" class="input" placeholder="Contenu…" rows="6" style="resize:vertical;">${esc(e.content || '')}</textarea>
        <div style="display:flex;gap:8px;margin-top:10px;">
          <button class="icon-btn" style="background:#23252B;color:#fff;border:none;width:auto;padding:0 16px;flex:1;" data-action="save-note">Enregistrer</button>
          <button class="icon-btn" style="background:#fff;width:auto;padding:0 16px;" data-action="cancel-note">Annuler</button>
          ${e.id ? `<button class="icon-btn" style="background:#fff;width:auto;padding:0 12px;color:#A6635A;" data-action="delete-note" data-id="${e.id}">🗑</button>` : ''}
        </div>
      </div>`}
  </div>`;
}

function renderEnvies() {
  return `
  <div>
    <div class="label">Envies</div>
    <div class="row-gap" style="margin-bottom:14px;">
      ${state.wishlist.length === 0 ? `<div class="empty">Rien pour l'instant — note ici les envies d'achat non essentielles.</div>` : ''}
      ${state.wishlist.map(w => `
        <div class="task-row">
          <button class="checkbox" style="border-color:#C08A2E;background:${w.completed ? '#C08A2E' : 'transparent'};" data-action="toggle-wish" data-id="${w.id}"></button>
          <div style="flex:1;">
            <div style="font-size:13.5px;${w.completed ? 'text-decoration:line-through;color:#9CA3AF;' : ''}">${esc(w.title)}</div>
            ${w.note ? `<div style="font-size:11.5px;color:#9CA3AF;">${esc(w.note)}</div>` : ''}
          </div>
          <button class="trash-btn" data-action="delete-wish" data-id="${w.id}">🗑</button>
        </div>`).join('')}
    </div>
    <div class="card">
      <input id="wish-title" class="input" placeholder="Quoi ?" style="margin-bottom:8px;" />
      <input id="wish-note" class="input" placeholder="Détail (prix, lien…) — optionnel" style="margin-bottom:8px;" />
      <button class="icon-btn" style="background:#C08A2E;color:#fff;border:none;width:100%;" data-action="add-wish">+</button>
    </div>
  </div>`;
}

/* ---------- events (delegated, bound once) ---------- */
function handleClick(e) {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;
  const action = btn.dataset.action;
  const dateStr = toDateStr(ui.date);

  if (action === 'shift-day') { const d = new Date(ui.date); d.setDate(d.getDate() + Number(btn.dataset.dir)); ui.date = d; render(); return; }
  if (action === 'go-today') { ui.date = new Date(); render(); return; }
  if (action === 'set-tab') { ui.tab = btn.dataset.tab; render(); return; }

  if (action === 'add-inbox') {
    const input = document.getElementById('inbox-input');
    const t = input.value.trim(); if (!t) return;
    state.inbox.push({ id: uid(), title: t }); saveState(); render(); return;
  }
  if (action === 'finish-inbox') {
    state.inbox = state.inbox.filter(i => i.id !== btn.dataset.id); saveState(); render(); return;
  }
  if (action === 'toggle-schedule') {
    ui.scheduling = ui.scheduling === btn.dataset.id ? null : btn.dataset.id; render(); return;
  }
  if (action === 'confirm-schedule') {
    const item = state.inbox.find(i => i.id === btn.dataset.id);
    if (!item) return;
    const time = document.getElementById('sched-time').value;
    const dur = document.getElementById('sched-dur').value;
    state.inbox = state.inbox.filter(i => i.id !== item.id);
    state.oneoffs.push({ id: uid(), title: item.title, date: dateStr, time: time || null, duration: Number(dur), completed: false });
    ui.scheduling = null; saveState(); render(); return;
  }
  if (action === 'toggle-done') {
    const kind = btn.dataset.kind, id = btn.dataset.id;
    if (kind === 'ritual') {
      const key = `${id}_${dateStr}`;
      state.completions[key] = !state.completions[key];
    } else {
      state.oneoffs = state.oneoffs.map(o => o.id === id ? { ...o, completed: !o.completed } : o);
    }
    saveState(); render(); return;
  }
  if (action === 'delete-oneoff') {
    state.oneoffs = state.oneoffs.filter(o => o.id !== btn.dataset.id); saveState(); render(); return;
  }
  if (action === 'open-quick') { ui.quickOpen = true; render(); return; }
  if (action === 'add-quick') {
    const title = document.getElementById('quick-title').value.trim(); if (!title) return;
    const time = document.getElementById('quick-time').value;
    const dur = document.getElementById('quick-dur').value;
    state.oneoffs.push({ id: uid(), title, date: dateStr, time: time || null, duration: Number(dur), completed: false });
    ui.quickOpen = false; saveState(); render(); return;
  }

  if (action === 'new-ritual') { ui.ritualForm = { id: null, title: '', time: '', duration: 30, days: [1, 2, 3, 4, 5] }; render(); return; }
  if (action === 'edit-ritual') {
    if (btn.dataset.stop) e.stopPropagation();
    const r = state.rituals.find(r => r.id === btn.dataset.id);
    ui.ritualForm = { ...r, time: r.time || '' }; render(); return;
  }
  if (action === 'delete-ritual') {
    e.stopPropagation();
    state.rituals = state.rituals.filter(r => r.id !== btn.dataset.id); saveState(); render(); return;
  }
  if (action === 'toggle-ritual-day') {
    const d = Number(btn.dataset.day);
    const days = ui.ritualForm.days.includes(d) ? ui.ritualForm.days.filter(x => x !== d) : [...ui.ritualForm.days, d];
    ui.ritualForm = { ...ui.ritualForm, days }; render(); return;
  }
  if (action === 'save-ritual') {
    const title = document.getElementById('ritual-title').value.trim(); if (!title) return;
    const time = document.getElementById('ritual-time').value;
    const dur = document.getElementById('ritual-dur').value;
    const f = ui.ritualForm;
    const clean = { title, time: time || null, duration: Number(dur), days: f.days };
    if (f.id) { state.rituals = state.rituals.map(r => r.id === f.id ? { ...clean, id: f.id } : r); }
    else { state.rituals.push({ ...clean, id: uid() }); }
    ui.ritualForm = null; saveState(); render(); return;
  }
  if (action === 'cancel-ritual') { ui.ritualForm = null; render(); return; }

  if (action === 'set-note-tag') { ui.noteTag = btn.dataset.tag; render(); return; }
  if (action === 'new-note') { ui.noteEditing = { id: null, title: '', tag: '', content: '' }; render(); return; }
  if (action === 'edit-note') {
    const n = state.notes.find(n => n.id === btn.dataset.id);
    ui.noteEditing = { ...n }; render(); return;
  }
  if (action === 'save-note') {
    const title = document.getElementById('note-title').value.trim(); if (!title) return;
    const tag = document.getElementById('note-tag').value.trim();
    const content = document.getElementById('note-content').value;
    const ed = ui.noteEditing;
    if (ed.id) { state.notes = state.notes.map(n => n.id === ed.id ? { ...n, title, tag, content } : n); }
    else { state.notes.unshift({ id: uid(), title, tag, content }); }
    ui.noteEditing = null; saveState(); render(); return;
  }
  if (action === 'cancel-note') { ui.noteEditing = null; render(); return; }
  if (action === 'delete-note') {
    state.notes = state.notes.filter(n => n.id !== btn.dataset.id);
    ui.noteEditing = null; saveState(); render(); return;
  }

  if (action === 'add-wish') {
    const title = document.getElementById('wish-title').value.trim(); if (!title) return;
    const note = document.getElementById('wish-note').value.trim();
    state.wishlist.unshift({ id: uid(), title, note, completed: false });
    saveState(); render(); return;
  }
  if (action === 'toggle-wish') {
    state.wishlist = state.wishlist.map(w => w.id === btn.dataset.id ? { ...w, completed: !w.completed } : w);
    saveState(); render(); return;
  }
  if (action === 'delete-wish') {
    state.wishlist = state.wishlist.filter(w => w.id !== btn.dataset.id);
    saveState(); render(); return;
  }
}

function handleKeydown(e) {
  if (e.key !== 'Enter') return;
  if (e.target.id === 'inbox-input') {
    const t = e.target.value.trim(); if (!t) return;
    state.inbox.push({ id: uid(), title: t }); saveState(); render();
  }
}

root.addEventListener('click', handleClick);
root.addEventListener('keydown', handleKeydown);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('service-worker.js').catch(() => {});
  });
}

render();
