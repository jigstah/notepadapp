# Expense Tracker — How to Use It

Your app: **https://jigstah.github.io/notepadapp/**
Repo: **https://github.com/jigstah/notepadapp**

Tip: open the app link on your phone and use your browser's **"Add to Home Screen"** so it opens like a normal app.

---

## 1. Logging an expense

Fill in the **Add expense** form and tap **Add expense**:

- **Amount** and **Currency** — EUR, USD or PHP. Enter a **negative amount** (e.g. `-30`) for a refund or an incoming payment — it shows in green and is subtracted from your totals.
- **Tag** — grouped dropdown:
  - Food — grocery, drinks out, eat out, order in/takeaway
  - Utilities — electricity, phone, water, heat
  - Exercise — badminton, gym, dance
  - Health — medicine, doctor, physio, acupuncture
  - Shopping — clothes, accessories, gifts
  - Calle loto — payment, broker, furniture, other
  - Transportation — metro, uber, other
  - Travel — ticket, accommodation, transportation, food
  - Other — a catch-all tag for anything that doesn't fit
- **Source** (payment method, required) — cash, card - UB, card - BPI, card - Wise, card - Santander
- **Date** — defaults to today
- **Comments** — optional

Currency and Source are **remembered** for the next entry, so logging several times a day is quick.

---

## 2. Reviewing your spending

- **Totals per currency** and a **tag filter** sit above the expense list.
- **Monthly report** — pick a month to see totals per currency, broken down by category and tag.
  - **Print / PDF** button saves a clean report (uses your browser's "Save as PDF").
  - **Export CSV** downloads just that month.

---

## 3. Backing up your data (important)

Your expenses are stored **only in the browser on the device you use** — not in the cloud, and not synced between devices. They are lost if you clear your browser data or switch devices.

So:
- Tap **Export** now and then to download a JSON backup.
- Tap **Import** to restore a backup, or to move data onto another device.
- **CSV** gives you a spreadsheet-friendly copy.

---

## Good to know / current limitations

- **Per-device:** totals only count what was entered in that browser; data isn't synced between devices.
- If you switch phones/browsers: **Import** your last backup to bring your data across.

## Possible next upgrade

Moving storage to a private cloud (e.g. your own Google Drive, or Firebase) would let your data **sync across all devices**. See the research notes shared in chat when you're ready.
