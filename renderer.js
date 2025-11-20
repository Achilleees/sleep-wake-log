const state = {
  settings: {},
  sleepSessions: [],
  tiredBlocks: [],
};

let editingSessionId = null;
let editingTiredId = null;

const sleepToggleBtn = document.getElementById('sleepToggleBtn');
const startSleepBtn = document.getElementById('startSleepBtn');
const endSleepBtn = document.getElementById('endSleepBtn');
const activeSessionInfo = document.getElementById('activeSessionInfo');

const sessionForm = document.getElementById('sessionForm');
const sessionStart = document.getElementById('sessionStart');
const sessionEnd = document.getElementById('sessionEnd');
const sessionFormTitle = document.getElementById('sessionFormTitle');
const sessionCancel = document.getElementById('sessionCancel');

const tiredForm = document.getElementById('tiredForm');
const tiredStart = document.getElementById('tiredStart');
const tiredEnd = document.getElementById('tiredEnd');
const tiredNote = document.getElementById('tiredNote');
const tiredFormTitle = document.getElementById('tiredFormTitle');
const tiredCancel = document.getElementById('tiredCancel');

const sessionsTableBody = document.querySelector('#sessionsTable tbody');
const tiredTableBody = document.querySelector('#tiredTable tbody');

const rangeSelect = document.getElementById('rangeSelect');
const customStart = document.getElementById('customStart');
const customEnd = document.getElementById('customEnd');

function generateId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`;
}

async function loadData() {
  const data = await window.api.getData();
  state.settings = data.settings || {};
  state.sleepSessions = data.sleepSessions || [];
  state.tiredBlocks = data.tiredBlocks || [];
  render();
}

function persist() {
  window.api.saveData(state);
}

function getActiveSession() {
  return state.sleepSessions.find((s) => s.end === null);
}

function updateToggleButtons() {
  const active = getActiveSession();
  if (active) {
    sleepToggleBtn.textContent = 'End Sleep';
    startSleepBtn.disabled = true;
    endSleepBtn.disabled = false;
    sleepToggleBtn.onclick = endSleep;
    activeSessionInfo.innerHTML = `<span class="active-tag">Sleeping since ${formatDate(active.start)}</span>`;
  } else {
    sleepToggleBtn.textContent = "I'm going to sleep";
    startSleepBtn.disabled = false;
    endSleepBtn.disabled = true;
    sleepToggleBtn.onclick = startSleep;
    activeSessionInfo.textContent = 'No active sleep session.';
  }
}

function startSleep() {
  if (getActiveSession()) return;
  const now = new Date().toISOString();
  state.sleepSessions.push({ id: generateId('sleep'), start: now, end: null });
  persist();
  render();
}

function endSleep() {
  const active = getActiveSession();
  if (!active) return;
  active.end = new Date().toISOString();
  persist();
  render();
}

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
}

function formatDuration(start, end) {
  if (!end) return 'Running…';
  const startDate = new Date(start);
  const endDate = new Date(end);
  const minutes = Math.max(0, Math.round((endDate - startDate) / 60000));
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
}

function validateRange(start, end) {
  const startDate = new Date(start);
  const endDate = end ? new Date(end) : null;
  if (!startDate || Number.isNaN(startDate.getTime())) return false;
  if (endDate && startDate > endDate) return false;
  return true;
}

sessionForm.addEventListener('submit', (e) => {
  e.preventDefault();
  if (!validateRange(sessionStart.value, sessionEnd.value)) {
    alert('End must be after start.');
    return;
  }
  if (editingSessionId) {
    const target = state.sleepSessions.find((s) => s.id === editingSessionId);
    if (target) {
      target.start = new Date(sessionStart.value).toISOString();
      target.end = new Date(sessionEnd.value).toISOString();
    }
  } else {
    state.sleepSessions.push({
      id: generateId('sleep'),
      start: new Date(sessionStart.value).toISOString(),
      end: new Date(sessionEnd.value).toISOString(),
    });
  }
  persist();
  resetSessionForm();
  render();
});

sessionCancel.addEventListener('click', resetSessionForm);

tiredForm.addEventListener('submit', (e) => {
  e.preventDefault();
  if (!validateRange(tiredStart.value, tiredEnd.value)) {
    alert('End must be after start.');
    return;
  }
  if (editingTiredId) {
    const target = state.tiredBlocks.find((t) => t.id === editingTiredId);
    if (target) {
      target.start = new Date(tiredStart.value).toISOString();
      target.end = new Date(tiredEnd.value).toISOString();
      target.note = tiredNote.value.trim();
    }
  } else {
    state.tiredBlocks.push({
      id: generateId('tired'),
      start: new Date(tiredStart.value).toISOString(),
      end: new Date(tiredEnd.value).toISOString(),
      note: tiredNote.value.trim(),
    });
  }
  persist();
  resetTiredForm();
  render();
});

tiredCancel.addEventListener('click', resetTiredForm);

function resetSessionForm() {
  editingSessionId = null;
  sessionFormTitle.textContent = 'Add Sleep Session';
  sessionSubmit.textContent = 'Save Session';
  sessionStart.value = '';
  sessionEnd.value = '';
}

function resetTiredForm() {
  editingTiredId = null;
  tiredFormTitle.textContent = 'Add Tired Period';
  tiredSubmit.textContent = 'Save Tired Period';
  tiredStart.value = '';
  tiredEnd.value = '';
  tiredNote.value = '';
}

function editSession(id) {
  const session = state.sleepSessions.find((s) => s.id === id);
  if (!session) return;
  editingSessionId = id;
  sessionFormTitle.textContent = 'Edit Sleep Session';
  sessionSubmit.textContent = 'Update Session';
  sessionStart.value = toLocalInputValue(session.start);
  sessionEnd.value = session.end ? toLocalInputValue(session.end) : '';
  sessionStart.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function editTired(id) {
  const tired = state.tiredBlocks.find((t) => t.id === id);
  if (!tired) return;
  editingTiredId = id;
  tiredFormTitle.textContent = 'Edit Tired Period';
  tiredSubmit.textContent = 'Update Tired Period';
  tiredStart.value = toLocalInputValue(tired.start);
  tiredEnd.value = toLocalInputValue(tired.end);
  tiredNote.value = tired.note || '';
  tiredStart.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function toLocalInputValue(iso) {
  const date = new Date(iso);
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function deleteSession(id) {
  if (!confirm('Delete this sleep session?')) return;
  state.sleepSessions = state.sleepSessions.filter((s) => s.id !== id);
  persist();
  render();
}

function deleteTired(id) {
  if (!confirm('Delete this tired period?')) return;
  state.tiredBlocks = state.tiredBlocks.filter((t) => t.id !== id);
  persist();
  render();
}

function filteredRange() {
  const now = new Date();
  const selection = rangeSelect.value;
  if (selection === 'all') return { start: null, end: null };
  if (selection === 'custom') {
    const start = customStart.value ? new Date(customStart.value) : null;
    const end = customEnd.value ? new Date(customEnd.value) : null;
    return { start, end };
  }
  const days = Number(selection);
  const end = now;
  const start = new Date(now);
  start.setDate(start.getDate() - days);
  return { start, end };
}

function overlapsRange(startIso, endIso, range) {
  const start = new Date(startIso);
  const end = endIso ? new Date(endIso) : new Date();
  if (range.start && end < range.start) return false;
  if (range.end && start > range.end) return false;
  return true;
}

function renderTables(range) {
  sessionsTableBody.innerHTML = '';
  const sortedSessions = [...state.sleepSessions].sort((a, b) => new Date(b.start) - new Date(a.start));
  sortedSessions
    .filter((s) => overlapsRange(s.start, s.end, range))
    .forEach((session) => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${formatDate(session.start)}</td>
        <td>${session.end ? formatDate(session.end) : '<span class="active-tag">Active</span>'}</td>
        <td>${formatDuration(session.start, session.end)}</td>
        <td>
          <button class="secondary" data-action="edit" data-id="${session.id}">Edit</button>
          <button class="ghost" data-action="delete" data-id="${session.id}">Delete</button>
        </td>
      `;
      row.querySelector('[data-action="edit"]').addEventListener('click', () => editSession(session.id));
      row.querySelector('[data-action="delete"]').addEventListener('click', () => deleteSession(session.id));
      sessionsTableBody.appendChild(row);
    });

  tiredTableBody.innerHTML = '';
  const sortedTired = [...state.tiredBlocks].sort((a, b) => new Date(b.start) - new Date(a.start));
  sortedTired
    .filter((t) => overlapsRange(t.start, t.end, range))
    .forEach((tired) => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${formatDate(tired.start)}</td>
        <td>${formatDate(tired.end)}</td>
        <td class="note-text">${tired.note || ''}</td>
        <td>
          <button class="secondary" data-action="edit" data-id="${tired.id}">Edit</button>
          <button class="ghost" data-action="delete" data-id="${tired.id}">Delete</button>
        </td>
      `;
      row.querySelector('[data-action="edit"]').addEventListener('click', () => editTired(tired.id));
      row.querySelector('[data-action="delete"]').addEventListener('click', () => deleteTired(tired.id));
      tiredTableBody.appendChild(row);
    });
}

function splitSessionByDay(session, range) {
  const segments = [];
  const sessionStart = new Date(session.start);
  const sessionEnd = session.end ? new Date(session.end) : new Date();
  let cursor = new Date(sessionStart);
  cursor.setHours(0, 0, 0, 0);
  const finalDay = new Date(sessionEnd);
  finalDay.setHours(0, 0, 0, 0);

  while (cursor <= finalDay) {
    const dayStart = new Date(cursor);
    const dayEnd = new Date(cursor);
    dayEnd.setDate(dayEnd.getDate() + 1);

    const startSlice = sessionStart > dayStart ? sessionStart : dayStart;
    const endSlice = sessionEnd < dayEnd ? sessionEnd : dayEnd;

    if (endSlice > startSlice) {
      if ((!range.start || startSlice >= range.start) && (!range.end || startSlice <= range.end)) {
        const startMinutes = startSlice.getHours() * 60 + startSlice.getMinutes();
        const endMinutes = endSlice.getHours() * 60 + endSlice.getMinutes();
        segments.push({
          dayKey: dayStart.toISOString().slice(0, 10),
          startMinutes,
          endMinutes,
        });
      }
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  return segments;
}

function buildTimeline(range) {
  const timeline = document.getElementById('timeline');
  const rangeSessions = state.sleepSessions.filter((s) => overlapsRange(s.start, s.end, range));
  const dayMap = new Map();

  rangeSessions.forEach((session) => {
    const pieces = splitSessionByDay(session, range);
    pieces.forEach((piece) => {
      if (!dayMap.has(piece.dayKey)) dayMap.set(piece.dayKey, []);
      dayMap.get(piece.dayKey).push(piece);
    });
  });

  // Ensure days exist even with no sleep
  let dayKeys;
  if (range.start && range.end) {
    const keys = [];
    const cursor = new Date(range.start);
    cursor.setHours(0, 0, 0, 0);
    const end = new Date(range.end);
    end.setHours(0, 0, 0, 0);
    while (cursor <= end) {
      keys.push(cursor.toISOString().slice(0, 10));
      cursor.setDate(cursor.getDate() + 1);
    }
    dayKeys = keys;
  } else {
    dayKeys = Array.from(dayMap.keys()).sort();
  }

  const grid = document.createElement('div');
  grid.className = 'timeline-grid';

  dayKeys.forEach((dayKey) => {
    const column = document.createElement('div');
    column.className = 'day-column';
    const header = document.createElement('div');
    const dateObj = new Date(`${dayKey}T00:00:00`);
    header.className = 'day-header';
    header.textContent = dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

    const bars = document.createElement('div');
    bars.className = 'day-bars';

    (dayMap.get(dayKey) || []).forEach((segment) => {
      const bar = document.createElement('div');
      const totalMinutes = 24 * 60;
      const heightPct = ((segment.endMinutes - segment.startMinutes) / totalMinutes) * 100;
      const offsetPct = (segment.startMinutes / totalMinutes) * 100;
      bar.className = 'bar';
      bar.style.top = `${offsetPct}%`;
      bar.style.height = `${heightPct}%`;
      bars.appendChild(bar);
    });

    column.appendChild(header);
    column.appendChild(bars);
    grid.appendChild(column);
  });

  timeline.innerHTML = '';
  timeline.appendChild(grid);
}

function render() {
  updateToggleButtons();
  const range = filteredRange();
  renderTables(range);
  buildTimeline(range);
}

rangeSelect.addEventListener('change', () => {
  const custom = rangeSelect.value === 'custom';
  customStart.style.display = custom ? 'inline-block' : 'none';
  customEnd.style.display = custom ? 'inline-block' : 'none';
  render();
});

customStart.addEventListener('change', render);
customEnd.addEventListener('change', render);

startSleepBtn.addEventListener('click', startSleep);
endSleepBtn.addEventListener('click', endSleep);
sleepToggleBtn.addEventListener('click', startSleep);

loadData();
