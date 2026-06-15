# Ledger — Expense Tracker Dashboard

### INTERN ID : CITS4146
### Organization: Codtech IT Solutions Private Limited

A dark-themed, fully client-side expense tracker dashboard. Add income/expense entries, filter your transaction history, and see a live category-wise spending
breakdown — all stored locally in your browser via `localStorage` (no server required).

## Features
- Add income or expense entries with description, amount, category, and date
- Live balance, total income, and total expense summary cards
- Filterable, scrollable transaction ledger (by type and category)
- Category-wise spending donut chart with legend
- Data persists in the browser between visits (`localStorage`) — works fully offline after first load
- Responsive layout for mobile and desktop

## Files
```
expense-tracker-dashboard/
├── index.html   # Page structure
├── style.css    # Styling (dark theme, layout, components)
└── script.js    # App logic + localStorage "backend"
```

## Run locally
Just open `index.html` in any browser — no build step, no install needed.

## Deploy with GitHub Pages

1. Create a new repository on GitHub (e.g. `expense-tracker-dashboard`) and push these files:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: expense tracker dashboard"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<your-repo>.git
   git push -u origin main
   ```

2. On GitHub, go to **Settings → Pages**.

3. Under **Build and deployment**, set **Source** to `Deploy from a branch`.

4. Set **Branch** to `main` and folder to `/ (root)`, then click **Save**.

5. After a minute, your site will be live at:
   ```
   https://<your-username>.github.io/<your-repo>/
   ```

## Notes
- Data is stored per-browser/device (`localStorage`), so it won't sync across devices. To add a real backend (e.g. Flask + SQLite/Postgres) with shared multi-device storage, the `saveTransactions()` / `loadTransactions()` functions in `script.js` are the integration points to swap for API calls.


