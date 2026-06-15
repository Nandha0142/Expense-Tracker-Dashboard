/* ============ CONFIG ============ */
const CATEGORY_META = {
  Food:          { color:'#FB7185', icon:'🍔' },
  Transport:     { color:'#60A5FA', icon:'🚌' },
  Shopping:      { color:'#F472B6', icon:'🛍️' },
  Bills:         { color:'#FBBF24', icon:'🧾' },
  Entertainment: { color:'#A78BFA', icon:'🎬' },
  Health:        { color:'#2DD4BF', icon:'💊' },
  Salary:        { color:'#4ADE80', icon:'💰' },
  Other:         { color:'#94A3B8', icon:'📦' }
};
const STORAGE_KEY = 'ledger_transactions_v1';

/* ============ STATE ============ */
let transactions = loadTransactions();
let typeFilter = 'all';
let categoryFilter = 'all';
let currentType = 'expense';

/* ============ STORAGE (the "backend") ============ */
function loadTransactions(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if(raw) return JSON.parse(raw);
  }catch(e){ console.warn('Could not read saved data', e); }

  // Seed data so the dashboard isn't empty on first load
  return [
    { id: crypto.randomUUID(), type:'income',  desc:'Monthly salary',     category:'Salary',   amount:25000, date: daysAgo(20) },
    { id: crypto.randomUUID(), type:'expense', desc:'Groceries',          category:'Food',     amount:1450,  date: daysAgo(12) },
    { id: crypto.randomUUID(), type:'expense', desc:'Bus pass',           category:'Transport',amount:600,   date: daysAgo(10) },
    { id: crypto.randomUUID(), type:'expense', desc:'Electricity bill',   category:'Bills',    amount:2100,  date: daysAgo(7) },
    { id: crypto.randomUUID(), type:'expense', desc:'Movie night',        category:'Entertainment', amount:450, date: daysAgo(3) },
    { id: crypto.randomUUID(), type:'expense', desc:'New headphones',     category:'Shopping', amount:1999,  date: daysAgo(1) },
  ];
}

function saveTransactions(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
}

function daysAgo(n){
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}

/* ============ HELPERS ============ */
function formatCurrency(n){
  return '₹' + n.toLocaleString('en-IN', { maximumFractionDigits: 2, minimumFractionDigits: n % 1 === 0 ? 0 : 2 });
}

function formatDate(dateStr){
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' });
}

function escapeHtml(str){
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/* ============ RENDER: STATS ============ */
function renderStats(){
  const income = transactions.filter(t => t.type === 'income').reduce((s,t) => s + Number(t.amount), 0);
  const expense = transactions.filter(t => t.type === 'expense').reduce((s,t) => s + Number(t.amount), 0);
  const balance = income - expense;

  document.getElementById('statIncome').textContent = formatCurrency(income);
  document.getElementById('statExpense').textContent = formatCurrency(expense);

  const balanceEl = document.getElementById('statBalance');
  balanceEl.textContent = formatCurrency(balance);
  balanceEl.style.color = balance < 0 ? 'var(--expense)' : 'var(--text)';
}

/* ============ RENDER: TRANSACTION LIST ============ */
function renderList(){
  const list = document.getElementById('txList');

  let filtered = transactions.slice().sort((a,b) => new Date(b.date) - new Date(a.date));

  if(typeFilter !== 'all'){
    filtered = filtered.filter(t => t.type === typeFilter);
  }
  if(categoryFilter !== 'all'){
    filtered = filtered.filter(t => t.category === categoryFilter);
  }

  if(filtered.length === 0){
    list.innerHTML = `
      <div class="empty-state">
        <div class="big">🗒️</div>
        No transactions match this view.<br>Try a different filter or add a new entry above.
      </div>`;
    return;
  }

  list.innerHTML = filtered.map(t => {
    const meta = CATEGORY_META[t.category] || CATEGORY_META.Other;
    const sign = t.type === 'income' ? '+' : '−';
    return `
      <div class="tx-row">
        <div class="tx-icon" style="background:${meta.color}22; color:${meta.color}">${meta.icon}</div>
        <div class="tx-main">
          <div class="tx-desc">${escapeHtml(t.desc)}</div>
          <div class="tx-meta">${formatDate(t.date)}</div>
        </div>
        <div class="tx-cat">${t.category}</div>
        <div class="tx-amount ${t.type}">${sign} ${formatCurrency(Number(t.amount))}</div>
        <button class="tx-delete" title="Delete entry" data-id="${t.id}">✕</button>
      </div>`;
  }).join('');

  // wire up delete buttons
  list.querySelectorAll('.tx-delete').forEach(btn => {
    btn.addEventListener('click', () => {
      transactions = transactions.filter(t => t.id !== btn.dataset.id);
      saveTransactions();
      renderAll();
    });
  });
}

/* ============ RENDER: DONUT CHART ============ */
function renderDonut(){
  const donut = document.getElementById('donut');
  const legend = document.getElementById('legend');

  const expenses = transactions.filter(t => t.type === 'expense');
  const total = expenses.reduce((s,t) => s + Number(t.amount), 0);

  document.getElementById('donutTotal').textContent = formatCurrency(total);

  if(total === 0){
    donut.style.background = 'var(--surface-2)';
    legend.innerHTML = `<div class="empty-state" style="padding:10px;">No expenses yet — add one to see the breakdown.</div>`;
    return;
  }

  // group by category
  const byCategory = {};
  expenses.forEach(t => {
    byCategory[t.category] = (byCategory[t.category] || 0) + Number(t.amount);
  });

  // sort largest first
  const sorted = Object.entries(byCategory).sort((a,b) => b[1] - a[1]);

  // build conic-gradient
  let gradientParts = [];
  let cursor = 0;
  sorted.forEach(([cat, amt]) => {
    const meta = CATEGORY_META[cat] || CATEGORY_META.Other;
    const pct = (amt / total) * 100;
    const start = cursor;
    const end = cursor + pct;
    gradientParts.push(`${meta.color} ${start}% ${end}%`);
    cursor = end;
  });
  donut.style.background = `conic-gradient(${gradientParts.join(', ')})`;

  // legend
  legend.innerHTML = sorted.map(([cat, amt]) => {
    const meta = CATEGORY_META[cat] || CATEGORY_META.Other;
    const pct = ((amt / total) * 100).toFixed(1);
    return `
      <div class="legend-row">
        <span class="dot" style="background:${meta.color}"></span>
        <span class="name">${meta.icon} ${cat}</span>
        <span class="pct" style="color:${meta.color}">${pct}%</span>
        <span class="amt">${formatCurrency(amt)}</span>
      </div>`;
  }).join('');
}

/* ============ RENDER ALL ============ */
function renderAll(){
  renderStats();
  renderList();
  renderDonut();
}

/* ============ EVENTS ============ */

// type toggle (income/expense)
document.getElementById('typeToggle').addEventListener('click', (e) => {
  const btn = e.target.closest('button');
  if(!btn) return;
  currentType = btn.dataset.type;
  document.querySelectorAll('#typeToggle button').forEach(b => b.classList.toggle('active', b === btn));
});

// add entry form
document.getElementById('txForm').addEventListener('submit', (e) => {
  e.preventDefault();

  const desc = document.getElementById('desc').value.trim();
  const amount = parseFloat(document.getElementById('amount').value);
  const date = document.getElementById('date').value;
  const category = document.getElementById('category').value;

  if(!desc || !amount || amount <= 0 || !date) return;

  transactions.push({
    id: crypto.randomUUID(),
    type: currentType,
    desc,
    category,
    amount,
    date
  });

  saveTransactions();
  renderAll();

  // reset form (keep type & category as-is for fast repeat entry)
  document.getElementById('desc').value = '';
  document.getElementById('amount').value = '';
  document.getElementById('desc').focus();
});

// filters
document.querySelectorAll('.filters button[data-filter]').forEach(btn => {
  btn.addEventListener('click', () => {
    typeFilter = btn.dataset.filter;
    document.querySelectorAll('.filters button[data-filter]').forEach(b => b.classList.toggle('active', b === btn));
    renderList();
  });
});

document.getElementById('categoryFilter').addEventListener('change', (e) => {
  categoryFilter = e.target.value;
  renderList();
});

/* ============ INIT ============ */
document.getElementById('date').value = new Date().toISOString().split('T')[0];
document.getElementById('todayDate').textContent = new Date().toLocaleDateString('en-IN', {
  weekday:'long', day:'numeric', month:'long', year:'numeric'
});

saveTransactions(); // persist seed data on first run
renderAll();
