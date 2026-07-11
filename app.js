"use strict";

const STORAGE_KEY = "expense-tracker.v1";

const form = document.getElementById("expense-form");
const amountEl = document.getElementById("amount");
const currencyEl = document.getElementById("currency");
const sourceEl = document.getElementById("source");
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

const reportMonthEl = document.getElementById("report-month");
const reportOutputEl = document.getElementById("report-output");
const reportCsvBtn = document.getElementById("report-csv-btn");
const reportPrintBtn = document.getElementById("report-print-btn");

const CURRENCY_SYMBOL = { EUR: "€", USD: "$", PHP: "₱" };

const SETTINGS_KEY = "expense-tracker.settings";
const FX_KEY = "expense-tracker.fx";
const THRESHOLDS = [500, 750, 1000, 1250, 1500];
// Rates are "units of currency per 1 EUR" (same shape Frankfurter returns).
const FX_FALLBACK = { USD: 1.08, PHP: 63 };
let fxRates = loadFx();

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
        <div class="exp-meta">${escapeHtml(formatDate(exp.date))}${exp.source ? " · " + escapeHtml(exp.source) : ""}</div>
        ${exp.comments ? `<div class="exp-comments">${escapeHtml(exp.comments)}</div>` : ""}
      </div>
      <button class="del-btn" title="Delete" aria-label="Delete expense" data-id="${exp.id}">✕</button>
    `;
    listEl.appendChild(li);
  }

  renderTotals(filter ? visible : expenses);
  renderFilterOptions();
  renderReport();
  updateAlertsUI();
}

function monthLabel(ym) {
  const d = new Date(ym + "-01T00:00:00");
  if (isNaN(d)) return ym;
  return d.toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

function renderReport() {
  const ym = reportMonthEl.value;
  if (!ym) {
    reportOutputEl.innerHTML = "";
    return;
  }
  const items = expenses.filter((e) => e.date.slice(0, 7) === ym);
  if (!items.length) {
    reportOutputEl.innerHTML = `<p class="report-empty">No expenses recorded in ${escapeHtml(monthLabel(ym))}.</p>`;
    return;
  }

  // Group: currency -> category -> tag -> {sum, count}
  const byCur = {};
  for (const e of items) {
    const cur = e.currency;
    const category = e.tag.split(" - ")[0] || "other";
    byCur[cur] = byCur[cur] || { total: 0, count: 0, cats: {} };
    byCur[cur].total += Number(e.amount);
    byCur[cur].count += 1;
    const cats = byCur[cur].cats;
    cats[category] = cats[category] || { total: 0, tags: {} };
    cats[category].total += Number(e.amount);
    cats[category].tags[e.tag] = (cats[category].tags[e.tag] || 0) + Number(e.amount);
  }

  let html = "";
  for (const cur of Object.keys(byCur).sort()) {
    const c = byCur[cur];
    html += `<div class="report-cur">
      <div class="report-cur-head">
        <span class="cur-name">${escapeHtml(cur)} · ${escapeHtml(monthLabel(ym))}</span>
        <span><span class="cur-total">${escapeHtml(formatMoney(c.total, cur))}</span>
        <span class="cur-count"> · ${c.count} ${c.count === 1 ? "entry" : "entries"}</span></span>
      </div>`;
    for (const cat of Object.keys(c.cats).sort()) {
      const cd = c.cats[cat];
      html += `<div class="report-cat">
        <div class="report-cat-head">
          <span class="cat-name">${escapeHtml(cat)}</span>
          <span>${escapeHtml(formatMoney(cd.total, cur))}</span>
        </div>`;
      for (const tag of Object.keys(cd.tags).sort()) {
        html += `<div class="report-tag-row">
          <span>${escapeHtml(tag)}</span>
          <span class="tag-amt">${escapeHtml(formatMoney(cd.tags[tag], cur))}</span>
        </div>`;
      }
      html += `</div>`;
    }
    html += `</div>`;
  }
  reportOutputEl.innerHTML = html;
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

// --- currency conversion & spending alerts -------------------------------
function loadFx() {
  try {
    const o = JSON.parse(localStorage.getItem(FX_KEY));
    if (o && o.rates && o.rates.USD && o.rates.PHP) return o.rates;
  } catch {}
  return FX_FALLBACK;
}

function maybeRefreshFx() {
  let cached = null;
  try { cached = JSON.parse(localStorage.getItem(FX_KEY)); } catch {}
  if (cached && cached.fetched === todayISO()) {
    fxRates = cached.rates;
    return;
  }
  // Frankfurter serves ECB rates, is free, needs no key, and allows browser requests.
  fetch("https://api.frankfurter.dev/v1/latest?base=EUR&symbols=USD,PHP")
    .then((r) => r.json())
    .then((d) => {
      if (d && d.rates && d.rates.USD && d.rates.PHP) {
        fxRates = d.rates;
        localStorage.setItem(FX_KEY, JSON.stringify({ rates: d.rates, date: d.date, fetched: todayISO() }));
        updateAlertsUI();
        checkThresholds();
      }
    })
    .catch(() => { /* keep cached/fallback rates */ });
}

function toEur(amount, currency) {
  if (currency === "EUR") return amount;
  const r = fxRates[currency];
  return r ? amount / r : amount;
}

function monthlyEurTotal(ym) {
  return expenses
    .filter((e) => e.date.slice(0, 7) === ym)
    .reduce((sum, e) => sum + toEur(Number(e.amount), e.currency), 0);
}

function getSettings() {
  try { return JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {}; }
  catch { return {}; }
}
function saveSettings(s) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
}

// Telegram blocks normal browser (CORS) calls, so we fire a fire-and-forget
// GET via an image beacon — the request still reaches Telegram and the
// message is delivered; we just can't read the response.
function sendTelegram(token, chatId, text) {
  if (!token || !chatId) return false;
  const url =
    "https://api.telegram.org/bot" + token + "/sendMessage" +
    "?chat_id=" + encodeURIComponent(chatId) +
    "&text=" + encodeURIComponent(text) +
    "&disable_web_page_preview=true";
  const img = new Image();
  img.onload = img.onerror = function () {}; // response is JSON, not an image — expected
  img.src = url;
  return true;
}

function checkThresholds() {
  const s = getSettings();
  if (!s.alertsEnabled || !s.token || !s.chatId) return;
  const ym = todayISO().slice(0, 7);
  const total = monthlyEurTotal(ym);
  s.fired = s.fired || {};
  const fired = new Set(s.fired[ym] || []);

  // Re-arm any threshold the total has since dropped back below (e.g. after a delete).
  for (const t of Array.from(fired)) if (total < t) fired.delete(t);

  const newlyCrossed = THRESHOLDS.filter((t) => total >= t && !fired.has(t));
  if (newlyCrossed.length) {
    const highest = Math.max(...newlyCrossed);
    newlyCrossed.forEach((t) => fired.add(t));
    sendTelegram(
      s.token,
      s.chatId,
      `⚠️ ${monthLabel(ym)} spending has reached €${total.toFixed(2)} — passed your €${highest} alert level.`
    );
  }
  s.fired[ym] = Array.from(fired).sort((a, b) => a - b);
  saveSettings(s);
  updateAlertsUI();
}

function updateAlertsUI() {
  const el = document.getElementById("alerts-status");
  if (!el) return;
  const ym = todayISO().slice(0, 7);
  const total = monthlyEurTotal(ym);
  const s = getSettings();
  const fired = new Set((s.fired && s.fired[ym]) || []);
  const chips = THRESHOLDS.map((t) => {
    const passed = total >= t;
    const alerted = fired.has(t);
    return `<span class="thr ${passed ? "thr-passed" : ""}">€${t}${alerted ? " 🔔" : passed ? " ✓" : ""}</span>`;
  }).join(" ");
  el.innerHTML =
    `<div class="alerts-total">${escapeHtml(monthLabel(ym))} so far: <strong>€${total.toFixed(2)}</strong>` +
    ` <span class="fx-note">(all currencies at ECB rates)</span></div>` +
    `<div class="thr-row">${chips}</div>`;
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
    source: sourceEl.value,
    tag: tagEl.value,
    date: dateEl.value || todayISO(),
    comments: commentsEl.value.trim(),
  });
  save();
  render();
  checkThresholds();

  // Reset for the next quick entry; keep currency + source, default date to today.
  const last = expenses[expenses.length - 1];
  form.reset();
  currencyEl.value = last.currency;
  sourceEl.value = last.source;
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
  const header = ["date", "amount", "currency", "source", "tag", "comments"];
  const rows = [...expenses]
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .map((e) =>
      [e.date, e.amount, e.currency, e.source || "", e.tag, e.comments]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(",")
    );
  download(`expenses-${todayISO()}.csv`, [header.join(","), ...rows].join("\r\n"), "text/csv");
});

reportMonthEl.addEventListener("change", renderReport);

reportPrintBtn.addEventListener("click", () => window.print());

reportCsvBtn.addEventListener("click", () => {
  const ym = reportMonthEl.value;
  const items = expenses
    .filter((e) => e.date.slice(0, 7) === ym)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
  if (!items.length) {
    alert("No expenses to export for that month.");
    return;
  }
  const header = ["date", "amount", "currency", "source", "category", "tag", "comments"];
  const rows = items.map((e) =>
    [e.date, e.amount, e.currency, e.source || "", e.tag.split(" - ")[0], e.tag, e.comments]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(",")
  );
  download(`expenses-${ym}.csv`, [header.join(","), ...rows].join("\r\n"), "text/csv");
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
          source: e.source ? String(e.source) : "",
          tag: String(e.tag),
          date: String(e.date),
          comments: e.comments ? String(e.comments) : "",
        }));
      const existing = new Set(expenses.map((e) => e.id));
      const merged = expenses.concat(cleaned.filter((e) => !existing.has(e.id)));
      expenses = merged;
      save();
      render();
      checkThresholds();
      alert(`Imported ${cleaned.length} expense(s).`);
    } catch (err) {
      alert("Could not import that file: " + err.message);
    }
    importFile.value = "";
  };
  reader.readAsText(file);
});

// --- settings panel ------------------------------------------------------
const tokenEl = document.getElementById("tg-token");
const chatEl = document.getElementById("tg-chat");
const alertsEnabledEl = document.getElementById("alerts-enabled");

(function fillSettings() {
  const s = getSettings();
  if (s.token) tokenEl.value = s.token;
  if (s.chatId) chatEl.value = s.chatId;
  alertsEnabledEl.checked = !!s.alertsEnabled;
})();

document.getElementById("settings-save").addEventListener("click", () => {
  const s = getSettings();
  s.token = tokenEl.value.trim();
  s.chatId = chatEl.value.trim();
  s.alertsEnabled = alertsEnabledEl.checked;
  saveSettings(s);
  updateAlertsUI();
  checkThresholds();
  alert("Settings saved on this device.");
});

document.getElementById("settings-test").addEventListener("click", () => {
  const token = tokenEl.value.trim();
  const chatId = chatEl.value.trim();
  if (!token || !chatId) {
    alert("Enter your bot token and chat ID first.");
    return;
  }
  sendTelegram(token, chatId, "✅ Test alert from your Expense Tracker — alerts are working!");
  alert("Test alert sent. Check Telegram — if nothing arrives within ~10s, re-check the token and chat ID.");
});

// --- init ----------------------------------------------------------------
dateEl.value = todayISO();
reportMonthEl.value = todayISO().slice(0, 7);
render();
maybeRefreshFx();
checkThresholds();
