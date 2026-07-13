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

## 4. Daily reminder at 22:00 (Central-European time)

A GitHub Action sends you a Telegram reminder every day at 22:00 Berlin time (it handles the winter/summer clock change automatically). Already set up. If you ever need to redo it:

1. In Telegram, message **@BotFather** → `/newbot` → copy the **bot token**.
2. Open your new bot and press **Start** (send it any message).
3. Visit `https://api.telegram.org/bot<YOUR_TOKEN>/getUpdates` and copy the `"chat":{"id": ... }` number.
4. In the repo → **Settings → Secrets and variables → Actions**, add:
   - `TELEGRAM_BOT_TOKEN` = the bot token
   - `TELEGRAM_CHAT_ID` = the chat id
5. Test it: repo → **Actions → Daily expense reminder → Run workflow**.

---

## 5. Spending alerts (€500 / €750 / €1000 / €1250 / €1500)

Get a Telegram alert when this month's total — **all currencies converted to EUR** at live European Central Bank rates — passes each level (once per level, per month).

To turn it on, open the **🔔 Spending alerts & Telegram setup** panel in the app:

1. **Telegram bot token** — the long string from BotFather, with a **colon and letters** (e.g. `8291234567:AAHk2Ld...`). *Not* the plain number.
2. **Telegram chat ID** — the plain number only (e.g. `8034297532`).
3. Tick **Enable spending alerts**.
4. Tap **Save** → you'll see a "Settings saved" popup. *(Save just stores it — it does not send a message.)*
5. Tap **Send test alert** → you should get a Telegram message within ~10 seconds. This is how you confirm it works.

**Token vs chat ID — the easy tell:** the **token has a colon and letters**; the **chat ID is only digits**.

---

## Good to know / current limitations

- **Per-device:** spending totals and alerts only count what was entered in that browser. Alerts fire when you add an expense that crosses a level, from the device where you log.
- **The token is stored only in your browser** (never uploaded or committed to the public code).
- **EUR thresholds shift slightly** with daily exchange rates, since other currencies are converted.
- If you switch phones/browsers: re-enter the token + chat ID in Settings and **Import** your last backup.

## Possible next upgrade

Moving storage to a private cloud (e.g. your own Google Drive, or Firebase) would let your data **sync across all devices** and make the spending alerts work fully server-side (even when the app is closed). See the research notes shared in chat when you're ready.
