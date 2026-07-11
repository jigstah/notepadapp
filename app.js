"use strict";

const STORAGE_KEY = "expense-tracker.v1";

const form = document.getElementById("expense-form");
const amountEl = document.getElementById("amount");
const currencyEl = document.getElementById("currency");
const tagEl = document.getElementById("tag");
const dateEl = document.getElementById("date");
const commentsEl = document.getElementById("comments");

const listEl = document.getElementById("expense-list");
const emptyEl = document.getElementById("empty");
const totalsEl = document.getElementById("totals");
const filterEl = document.getElementById("filter-tag");

const exportBtn = document.getElementById("export-btn");
const importBtn = document.getElementById("import-btn");
const importFile = document.getElementById("import-file");
const csvBtn = document.getElementById("csv-btn");

const CURRENCY_SYMBOL = { EUR: "€", USD: "$", PHP: "₱" };

/** @type {{id:string, amount:number, currency:string, tag:string, date:string, comments:string}[]} */
let expenses = load();

// --- persistence ---------------------------------------------------------
function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("Could not read saved expenses:", e);
    return [];
  }
}

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
  } catch (e) {
    alert("Could not save — your browser storage may be full or blocked.");
    console.error(e);
  }
}

// --- helpers -------------------------------------------------------------
function todayISO() {
  const d = new Date();
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10);
}

function formatMoney(amount, currency) {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
    }).format(amount);
  } catch {
    const sym = CURRENCY_SYMBOL[currency] || "";
    return `${sym}${amount.toFixed(2)} ${currency}`;
  }
}

function formatDate(iso) {
  const d = new Date(iso + "T00:00:00");
  if (isNaN(d)) return iso;
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

// --- rendering -----------------------------------------------------------
function render() {
  const filter = filterEl.value;
  const sorted = [...expenses].sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? 1 : -1;
    return a.id < b.id ? 1 : -1;
  });
  const visible = filter ? sorted.filter((e) => e.tag === filter) : sorted;

  listEl.innerHTML = "";
  emptyEl.style.display = visible.length ? "none" : "block";
  if (!visible.length && expenses.length) {
    emptyEl.textContent = "No expenses match this tag.";
  } else {
    emptyEl.textContent = "No expenses yet. Add your first one above.";
  }

  for (const exp of visible) {
    const li = document.createElement("li");
    li.className = "expense-item";
    li.innerHTML = `
      <div class="exp-main">
        <div class="exp-top">
          <span class="exp-amount">${escapeHtml(formatMoney(exp.amount, exp.currency))}</span>
          <span class="exp-tag">${escapeHtml(exp.tag)}</span>
        </div>
        <div class="exp-meta">${escapeHtml(formatDate(exp.date))}</div>
        ${exp.comments ? `<div class="exp-comments">${escapeHtml(exp.comments)}</div>` : ""}
      </div>
      <button class="del-btn" title="Delete" aria-label="Delete expense" data-id="${exp.id}">✕</button>
    `;
    listEl.appendChild(li);
  }

  renderTotals(filter ? visible : expenses);
  renderFilterOptions();
}

function renderTotals(items) {
  const byCurrency = {};
  for (const e of items) {
    byCurrency[e.currency] = (byCurrency[e.currency] || 0) + Number(e.amount);
  }
  const currencies = Object.keys(byCurrency);
  totalsEl.innerHTML = "";
  if (!currencies.length) return;
  for (const cur of currencies) {
    const chip = document.createElement("span");
    chip.className = "chip";
    chip.textContent = `Total: ${formatMoney(byCurrency[cur], cur)}`;
    totalsEl.appendChild(chip);
  }
}

function renderFilterOptions() {
  const used = [...new Set(expenses.map((e) => e.tag))].sort();
  const current = filterEl.value;
  filterEl.innerHTML = '<option value="">All tags</option>';
  for (const tag of used) {
    const opt = document.createElement("option");
    opt.value = tag;
    opt.textContent = tag;
    filterEl.appendChild(opt);
  }
  if (used.includes(current)) filterEl.value = current;
}

// --- events --------------------------------------------------------------
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const amount = parseFloat(amountEl.value);
  if (isNaN(amount) || amount < 0) {
    amountEl.focus();
    return;
  }
  expenses.push({
    id: uid(),
    amount,
    currency: currencyEl.value,
    tag: tagEl.value,
    date: dateEl.value || todayISO(),
    comments: commentsEl.value.trim(),
  });
  save();
  render();

  // Reset for the next quick entry; keep currency, default date to today.
  form.reset();
  currencyEl.value = expenses[expenses.length - 1].currency;
  dateEl.value = todayISO();
  tagEl.selectedIndex = 0;
  amountEl.focus();
});

listEl.addEventListener("click", (e) => {
  const btn = e.target.closest(".del-btn");
  if (!btn) return;
  const id = btn.dataset.id;
  const exp = expenses.find((x) => x.id === id);
  if (exp && confirm(`Delete this expense (${formatMoney(exp.amount, exp.currency)} · ${exp.tag})?`)) {
    expenses = expenses.filter((x) => x.id !== id);
    save();
    render();
  }
});

filterEl.addEventListener("change", render);

// --- backup / restore ----------------------------------------------------
function download(filename, text, type) {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

exportBtn.addEventListener("click", () => {
  const stamp = todayISO();
  download(`expenses-${stamp}.json`, JSON.stringify(expenses, null, 2), "application/json");
});

csvBtn.addEventListener("click", () => {
  const header = ["date", "amount", "currency", "tag", "comments"];
  const rows = [...expenses]
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .map((e) =>
      [e.date, e.amount, e.currency, e.tag, e.comments]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(",")
    );
  download(`expenses-${todayISO()}.csv`, [header.join(","), ...rows].join("\r\n"), "text/csv");
});

importBtn.addEventListener("click", () => importFile.click());

importFile.addEventListener("change", () => {
  const file = importFile.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      if (!Array.isArray(data)) throw new Error("File is not a list of expenses.");
      const cleaned = data
        .filter((e) => e && typeof e.amount !== "undefined" && e.tag && e.date)
        .map((e) => ({
          id: e.id || uid(),
          amount: Number(e.amount),
          currency: e.currency || "EUR",
          tag: String(e.tag),
          date: String(e.date),
          comments: e.comments ? String(e.comments) : "",
        }));
      const existing = new Set(expenses.map((e) => e.id));
      const merged = expenses.concat(cleaned.filter((e) => !existing.has(e.id)));
      expenses = merged;
      save();
      render();
      alert(`Imported ${cleaned.length} expense(s).`);
    } catch (err) {
      alert("Could not import that file: " + err.message);
    }
    importFile.value = "";
  };
  reader.readAsText(file);
});

// --- init ----------------------------------------------------------------
dateEl.value = todayISO();
render();
