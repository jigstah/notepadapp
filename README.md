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
  - **Shopping** — clothes, accessories, gifts
  - **Calle loto** — payment, broker, furniture, other
- Currency: **EUR**, **USD**, **PHP**
- Source (payment method): **cash**, **card - UB**, **card - BPI**, **card - Wise**, **card - Santander**
- Date field (defaults to today) and free-text comments
- Running totals per currency, filter by tag
- **Monthly report** — pick a month for per-currency totals broken down by category and tag, with Print/PDF and CSV export
- **Export / Import** JSON backups and **CSV** export

> Data lives only in the browser you use. Tap **Export** now and then to keep a backup.

## Running locally

Just open `index.html` in any browser, or serve the folder with any static file server.
