# notepadapp — Expense Tracker

A tiny, no-server web app for logging daily expenses with tags, currency, date and comments.
Everything runs in your browser; your data is stored locally (`localStorage`).

**Live app:** https://jigstah.github.io/notepadapp/

## Features

- Add expenses several times a day in a couple of taps
- Tags grouped by category:
  - **Food** — grocery, drinks out, eat out, order in/takeaway
  - **Utilities** — electricity, phone, water, heat
  - **Exercise** — badminton, gym, dance
  - **Health** — medicine, doctor, physio, acupuncture
- Currency: **EUR**, **USD**, **PHP**
- Date field (defaults to today) and free-text comments
- Running totals per currency, filter by tag
- **Monthly report** — pick a month for per-currency totals broken down by category and tag, with Print/PDF and CSV export
- **Spending alerts** — optional Telegram alert when the month's total (all currencies converted to EUR at live ECB rates) passes €500 / €750 / €1000 / €1250 / €1500
- **Export / Import** JSON backups and **CSV** export

> Data lives only in the browser you use. Tap **Export** now and then to keep a backup.

## Daily Telegram reminder (22:00 Central-European time)

A GitHub Actions workflow ([`.github/workflows/reminder.yml`](.github/workflows/reminder.yml))
sends you a Telegram message every day at 22:00 Berlin time (handles the CET/CEST switch).

### One-time setup

1. **Create a bot:** In Telegram, message [@BotFather](https://t.me/BotFather), send `/newbot`,
   follow the prompts, and copy the **bot token** it gives you.
2. **Start the bot:** Open your new bot and press **Start** (send it any message). This lets it message you.
3. **Get your chat id:** Open
   `https://api.telegram.org/bot<YOUR_TOKEN>/getUpdates` in a browser
   and copy the `"chat":{"id": ... }` number.
4. **Add repo secrets:** In this repo → **Settings → Secrets and variables → Actions → New repository secret**:
   - `TELEGRAM_BOT_TOKEN` = your bot token
   - `TELEGRAM_CHAT_ID` = your chat id
5. **Test it:** **Actions → Daily expense reminder → Run workflow** — you should get a Telegram message right away.

## Spending alerts (in-app, threshold-based)

Separate from the fixed 22:00 daily reminder, the app can Telegram you when your
**monthly spending** crosses €500 / €750 / €1000 / €1250 / €1500 (each once per month).

Because the running total lives in your browser, these alerts are sent **by the app itself**
the moment you add an expense that crosses a level — so they work on the device where you log expenses.

To enable: open the **🔔 Spending alerts & Telegram setup** panel in the app, paste the same
bot token and chat ID you used for the reminder, tick **Enable spending alerts**, and **Save**.
The token is stored only in that browser (never committed). Use **Send test alert** to verify.

## Running locally

Just open `index.html` in any browser, or serve the folder with any static file server.
