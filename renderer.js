const state = {
  settings: {},
  sleepSessions: [],
};

let editingSessionId = null;
let viewMonth = startOfMonth(new Date());

const sleepToggleBtn = document.getElementById('sleepToggleBtn');
const startSleepBtn = document.getElementById('startSleepBtn');
const endSleepBtn = document.getElementById('endSleepBtn');
const activeSessionInfo = document.getElementById('activeSessionInfo');

const sessionForm = document.getElementById('sessionForm');
const sessionStart = document.getElementById('sessionStart');
const sessionEnd = document.getElementById('sessionEnd');
const sessionFormTitle = document.getElementById('sessionFormTitle');
const sessionCancel = document.getElementById('sessionCancel');
const sessionSubmit = document.getElementById('sessionSubmit');

const sessionsTableBody = document.querySelector('#sessionsTable tbody');
const monthLabel = document.getElementById('monthLabel');
const prevMonthBtn = document.getElementById('prevMonthBtn');
const nextMonthBtn = document.getElementById('nextMonthBtn');

function generateId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`;
}

function startOfMonth(date) {
  const d = new Date(date);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

function monthRange(date) {
  const start = startOfMonth(date);
  const end = new Date(start);
  end.setMonth(end.getMonth() + 1);
  end.setMilliseconds(end.getMilliseconds() - 1);
  return { start, end };
}

async function loadData() {
  const data = await window.api.getData();
  state.settings = data.settings || {};
  state.sleepSessions = data.sleepSessions || [];
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

function resetSessionForm() {
  editingSessionId = null;
  sessionFormTitle.textContent = 'Add Sleep Session';
  sessionSubmit.textContent = 'Save Session';
  sessionStart.value = '';
  sessionEnd.value = '';
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

function overlapsRange(startIso, endIso, range) {
  const start = new Date(startIso);
  const end = endIso ? new Date(endIso) : new Date();
  if (range.start && end < range.start) return false;
  if (range.end && start > range.end) return false;
  return true;
}

function getSessionColor(index) {
  const palette = ['#5b8def', '#4ec9b0', '#f5a524', '#ef5da8', '#7adcf0', '#c4a5ff'];
  return palette[index % palette.length];
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
}

function splitSessionByDay(session, range, color) {
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
      const inRange = (!range.start || endSlice > range.start) && (!range.end || startSlice < range.end);
      if (inRange) {
        const startMinutes = startSlice.getHours() * 60 + startSlice.getMinutes();
        const endMinutes = endSlice.getHours() * 60 + endSlice.getMinutes();
        segments.push({
          dayKey: dayStart.toISOString().slice(0, 10),
          startMinutes,
          endMinutes,
          color,
        });
      }
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  return segments;
}

function buildTimeline(range) {
  const timeline = document.getElementById('timeline');
  const rangeSessions = state.sleepSessions
    .filter((s) => overlapsRange(s.start, s.end, range))
    .sort((a, b) => new Date(a.start) - new Date(b.start));
  const dayMap = new Map();

  rangeSessions.forEach((session, index) => {
    const color = getSessionColor(index);
    const pieces = splitSessionByDay(session, range, color);
    pieces.forEach((piece) => {
      if (!dayMap.has(piece.dayKey)) dayMap.set(piece.dayKey, []);
      dayMap.get(piece.dayKey).push(piece);
    });
  });

  const dayKeys = [];
  const cursor = new Date(range.start);
  cursor.setHours(0, 0, 0, 0);
  const end = new Date(range.end);
  end.setHours(0, 0, 0, 0);
  while (cursor <= end) {
    dayKeys.push(cursor.toISOString().slice(0, 10));
    cursor.setDate(cursor.getDate() + 1);
  }

  const wrapper = document.createElement('div');
  wrapper.className = 'timeline-wrapper';

  const timeAxis = document.createElement('div');
  timeAxis.className = 'time-axis';
  timeAxis.innerHTML = '<span>Midnight</span><span>Noon</span><span>Midnight</span>';

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
      bar.style.background = segment.color;
      bars.appendChild(bar);
    });

    column.appendChild(header);
    column.appendChild(bars);
    grid.appendChild(column);
  });

  wrapper.appendChild(timeAxis);
  wrapper.appendChild(grid);

  timeline.innerHTML = '';
  timeline.appendChild(wrapper);
}

function render() {
  updateToggleButtons();
  const range = monthRange(viewMonth);
  monthLabel.textContent = viewMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  renderTables(range);
  buildTimeline(range);
}

function goToPreviousMonth() {
  viewMonth.setMonth(viewMonth.getMonth() - 1);
  render();
}

function goToNextMonth() {
  viewMonth.setMonth(viewMonth.getMonth() + 1);
  render();
}

prevMonthBtn.addEventListener('click', goToPreviousMonth);
nextMonthBtn.addEventListener('click', goToNextMonth);
startSleepBtn.addEventListener('click', startSleep);
endSleepBtn.addEventListener('click', endSleep);

loadData();
