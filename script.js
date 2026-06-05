const ADMIN_PIN = '1234';
let isAdmin = false;
 
const DIAS = ['Segunda','Terça','Quarta','Quinta','Sexta'];
const DIAS_SHORT = ['SEG','TER','QUA','QUI','SEX'];
const MESES = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
const MESES_FULL = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
 
let currentWeekOffset = 0;
let editingMerendaDay = null;
 
const data = {
  opinioes: JSON.parse(localStorage.getItem('ifpa_opinioes') || '[]'),
  eventos: JSON.parse(localStorage.getItem('ifpa_eventos') || 'null'),
  merenda: JSON.parse(localStorage.getItem('ifpa_merenda') || '{}'),
  likedOpinioes: JSON.parse(localStorage.getItem('ifpa_liked') || '[]')
};

function save() {
  localStorage.setItem('ifpa_opinioes', JSON.stringify(data.opinioes));
  localStorage.setItem('ifpa_eventos', JSON.stringify(data.eventos));
  localStorage.setItem('ifpa_merenda', JSON.stringify(data.merenda));
  localStorage.setItem('ifpa_liked', JSON.stringify(data.likedOpinioes));
}
 
function getWeekDates(offset) {
  const now = new Date();
  const day = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1) + offset * 7);
  const dates = [];
  for (let i = 0; i < 5; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    dates.push(d);
  }
  return dates;
}
 
function dateKey(d) {
  return d.toISOString().slice(0, 10);
}
 
function isToday(d) {
  return dateKey(d) === dateKey(new Date());
}
 
function showSection(id) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.getElementById('section-' + id).classList.add('active');
  document.getElementById('tab-' + id).classList.add('active');
  if (id === 'merenda') renderMerenda();
  if (id === 'eventos') renderEventos();
  if (id === 'opiniao') renderOpinioes('likes');
  if (id === 'inicio') renderInicio();
}
 
function renderInicio() {
  const totLikes = data.opinioes.reduce((s, o) => s + o.likes, 0);
  document.getElementById('stat-opiniao').textContent = data.opinioes.length;
  document.getElementById('stat-eventos').textContent = data.eventos.length;
  document.getElementById('stat-likes').textContent = totLikes;
 
  const todayKey = dateKey(new Date());
  const merenda = data.merenda[todayKey];
  const box = document.getElementById('merenda-hoje-box');
  if (merenda && merenda.length) {
    box.innerHTML = merenda.map(i => `<div style="display:flex;align-items:center;gap:8px;padding:3px 0;font-size:14px"><span style="color:var(--verde-claro);font-size:16px">•</span>${i}</div>`).join('');
  } else {
    box.innerHTML = '<span style="color:var(--cinza);font-style:italic;font-size:13px">Cardápio ainda não cadastrado para hoje</span>';
  }
 
  const now = new Date();
  const prox = data.eventos
    .filter(e => new Date(e.data + 'T00:00:00') >= now)
    .sort((a,b) => a.data.localeCompare(b.data))[0];
  const pbox = document.getElementById('proximo-evento-box');
  if (prox) {
    const d = new Date(prox.data + 'T00:00:00');
    pbox.innerHTML = `
      <div style="display:flex;gap:14px;align-items:flex-start">
        <div style="background:var(--verde-escuro);color:#fff;border-radius:10px;min-width:50px;padding:8px 6px;text-align:center;flex-shrink:0">
          <div style="font-family:'Sora',sans-serif;font-size:20px;font-weight:700;line-height:1">${d.getDate()}</div>
          <div style="font-size:10px;opacity:0.75;text-transform:uppercase">${MESES[d.getMonth()]}</div>
        </div>
        <div>
          <span class="event-badge badge-${prox.cat}">${prox.cat.charAt(0).toUpperCase()+prox.cat.slice(1)}</span>
          <div style="font-family:'Sora',sans-serif;font-weight:600;font-size:15px;margin-bottom:4px">${prox.titulo}</div>
          <div style="font-size:12px;color:var(--cinza)">🕐 ${prox.hora} · 📍 ${prox.local}</div>
        </div>
      </div>`;
  } else {
    pbox.innerHTML = '<span style="color:var(--cinza);font-style:italic;font-size:13px">Nenhum evento próximo cadastrado</span>';
  }
}
 
function enviarOpiniao() {
  const texto = document.getElementById('opiniao-texto').value.trim();
  const cat = document.getElementById('opiniao-categoria').value;
  if (!texto) return;
  data.opinioes.unshift({ id: Date.now(), texto, cat, likes: 0, data: new Date().toLocaleDateString('pt-BR') });
  document.getElementById('opiniao-texto').value = '';
  save();
  renderOpinioes(currentSort);
  document.getElementById('stat-opiniao').textContent = data.opinioes.length;
}
 
let currentSort = 'likes';
function sortOpinioes(mode, btn) {
  currentSort = mode;
  document.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderOpinioes(mode);
}
 
function renderOpinioes(mode) {
  const list = [...data.opinioes];
  if (mode === 'likes') list.sort((a,b) => b.likes - a.likes);
  const el = document.getElementById('opinions-list');
  if (!list.length) {
    el.innerHTML = '<div style="text-align:center;color:var(--cinza);padding:2rem;font-size:14px">Ainda não há opiniões. Seja o primeiro a contribuir! 💡</div>';
    return;
  }
  el.innerHTML = list.map((o, idx) => {
    const liked = data.likedOpinioes.includes(o.id);
    return `<div class="opinion-card">
      <div class="opinion-body">
        <div class="opinion-text">${o.texto}</div>
        <div class="opinion-meta">
          <span class="opinion-tag">${o.cat}</span>
          <span>📅 ${o.data}</span>
        </div>
      </div>
      <button class="like-btn ${liked ? 'liked' : ''}" onclick="toggleLike(${o.id})" title="Votar nesta sugestão">
        <span class="like-icon">${liked ? '👍' : '👍'}</span>
        <span class="like-count">${o.likes}</span>
      </button>
    </div>`;
  }).join('');
}
 
function toggleLike(id) {
  const idx = data.likedOpinioes.indexOf(id);
  const op = data.opinioes.find(o => o.id === id);
  if (!op) return;
  if (idx === -1) {
    data.likedOpinioes.push(id);
    op.likes++;
  } else {
    data.likedOpinioes.splice(idx, 1);
    op.likes = Math.max(0, op.likes - 1);
  }
  save();
  renderOpinioes(currentSort);
  const totLikes = data.opinioes.reduce((s, o) => s + o.likes, 0);
  document.getElementById('stat-likes').textContent = totLikes;
}
 
function renderEventos() {
  document.getElementById('btn-add-evento').style.display = isAdmin ? 'block' : 'none';
  const grid = document.getElementById('events-grid');
  if (!data.eventos.length) {
    grid.innerHTML = '<div style="text-align:center;color:var(--cinza);padding:2rem;font-size:14px">Nenhum evento cadastrado.</div>';
    return;
  }
  const sorted = [...data.eventos].sort((a,b) => a.data.localeCompare(b.data));
  grid.innerHTML = sorted.map(e => {
    const d = new Date(e.data + 'T00:00:00');
    return `<div class="event-card">
      <div class="event-date-box">
        <div class="event-day">${d.getDate()}</div>
        <div class="event-month">${MESES[d.getMonth()]}</div>
      </div>
      <div class="event-body">
        <span class="event-badge badge-${e.cat}">${e.cat.charAt(0).toUpperCase()+e.cat.slice(1)}</span>
        <div class="event-title">${e.titulo}</div>
        <div class="event-desc">${e.desc}</div>
        <div class="event-meta">
          <span>🕐 ${e.hora}</span>
          <span>📍 ${e.local}</span>
          ${isAdmin ? `<span style="margin-left:auto"><button onclick="deleteEvento(${e.id})" style="background:none;border:none;color:#DC2626;cursor:pointer;font-size:12px">✕ Remover</button></span>` : ''}
        </div>
      </div>
    </div>`;
  }).join('');
}
 
function deleteEvento(id) {
  if (!confirm('Remover este evento?')) return;
  data.eventos = data.eventos.filter(e => e.id !== id);
  save();
  renderEventos();
}
 
function renderMerenda() {
  const dates = getWeekDates(currentWeekOffset);
  const start = dates[0], end = dates[4];
  document.getElementById('week-label').textContent =
    `${start.getDate()} ${MESES[start.getMonth()]} – ${end.getDate()} ${MESES[end.getMonth()]}`;
 
  const grid = document.getElementById('merenda-grid');
  grid.innerHTML = dates.map((d, i) => {
    const key = dateKey(d);
    const items = data.merenda[key] || [];
    const today = isToday(d);
    return `<div class="merenda-day ${today ? 'today' : ''}">
      <div class="merenda-day-header">
        <span>${DIAS_SHORT[i]} ${d.getDate()}/${(d.getMonth()+1).toString().padStart(2,'0')}</span>
        ${today ? '<span class="today-tag">HOJE</span>' : ''}
      </div>
      <div class="merenda-day-body">
        ${items.length
          ? items.map(it => `<div class="merenda-item"><div class="merenda-dot"></div><span>${it}</span></div>`).join('')
          : '<div class="merenda-empty">Cardápio não informado</div>'
        }
        ${isAdmin ? `<button class="merenda-edit-btn" onclick="openMerendaEdit('${key}', '${DIAS[i]} ${d.getDate()}/${d.getMonth()+1}')">✏ Editar</button>` : ''}
      </div>
    </div>`;
  }).join('');
}
 
function changeWeek(dir) {
  currentWeekOffset += dir;
  renderMerenda();
}
 
function openMerendaEdit(key, label) {
  editingMerendaDay = key;
  document.getElementById('modal-merenda-title').textContent = `🍽 Editar Merenda – ${label}`;
  const items = data.merenda[key] || [];
  document.getElementById('merenda-input').value = items.join('\n');
  document.getElementById('modal-merenda').classList.add('open');
}
 
function saveMerenda() {
  const raw = document.getElementById('merenda-input').value;
  const items = raw.split('\n').map(s => s.trim()).filter(Boolean);
  data.merenda[editingMerendaDay] = items;
  save();
  closeModal('modal-merenda');
  renderMerenda();
  renderInicio();
}
 
function openEventoModal() {
  document.getElementById('modal-evento').classList.add('open');
}
 
function saveEvento() {
  const titulo = document.getElementById('evento-titulo').value.trim();
  const desc = document.getElementById('evento-desc').value.trim();
  const data_ = document.getElementById('evento-data').value;
  const hora = document.getElementById('evento-hora').value;
  const local = document.getElementById('evento-local').value.trim();
  const cat = document.getElementById('evento-cat').value;
  if (!titulo || !data_) { alert('Preencha pelo menos o título e a data.'); return; }
  data.eventos.push({ id: Date.now(), titulo, desc, data: data_, hora, local, cat });
  save();
  closeModal('modal-evento');
  renderEventos();
  document.getElementById('stat-eventos').textContent = data.eventos.length;
  ['titulo','desc','data','hora','local'].forEach(f => document.getElementById('evento-'+f).value = '');
}
 
function openAdminModal() {
  if (isAdmin) {
    isAdmin = false;
    alert('Modo admin desativado.');
    renderEventos();
    renderMerenda();
    return;
  }
  document.getElementById('pin-input').value = '';
  document.getElementById('pin-error').style.display = 'none';
  document.getElementById('modal-admin').classList.add('open');
}
 
function checkPin() {
  const val = document.getElementById('pin-input').value;
  if (val.length === 4) {
    if (val === ADMIN_PIN) {
      isAdmin = true;
      closeModal('modal-admin');
      renderEventos();
      renderMerenda();
      alert('✅ Modo admin ativado! Agora você pode editar a merenda e adicionar eventos.\n\nPara sair, clique em "Admin" novamente.');
    } else {
      document.getElementById('pin-error').style.display = 'block';
      document.getElementById('pin-input').value = '';
    }
  }
}
 
function closeModal(id) {
  document.getElementById(id).classList.remove('open');
}
 
document.querySelectorAll('.modal-overlay').forEach(m => {
  m.addEventListener('click', e => { if (e.target === m) m.classList.remove('open'); });
});
 
renderInicio();
renderOpinioes('likes');