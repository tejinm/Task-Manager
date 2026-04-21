# 📋 Personal Task Manager — Appwrite Edition

A multi-user task manager built with **React + Appwrite**, deployable to **GitHub Pages** in minutes. No separate backend server — Appwrite Cloud handles auth, database, and real-time updates for free.

---

## Stack

| Layer     | Technology                              |
|-----------|-----------------------------------------|
| Frontend  | React 18 + Vite                         |
| Auth      | Appwrite Auth (email/password)          |
| Database  | Appwrite Cloud (hosted)                 |
| Realtime  | Appwrite Realtime (built-in, WebSocket) |
| Hosting   | GitHub Pages                            |

---

## Features

- 🔐 Email/password login & registration
- 👥 Shared workspaces — join via a **6-character code** (no user IDs to copy)
- 🔄 **Live updates** — changes appear instantly for all members (Appwrite Realtime)
- 📊 Kanban board — 5 columns: In Preparation / To Do / In Progress / Blocked / Done
- 📝 Table view & 📅 Weekly calendar view
- ☀️ Today's To-Do's panel
- 🌍 Regions + 🏷️ Tags per workspace
- 👤 Task assignment to workspace members
- 🔑 Owner can regenerate join code to revoke access

---

## Setup (one-time, ~10 minutes)

### Step 1 — Create an Appwrite Cloud project

1. Go to [cloud.appwrite.io](https://cloud.appwrite.io) and create a free account
2. Click **Create Project**, name it `task-manager`
3. Note your **Project ID** (shown in Settings → General)

### Step 2 — Add a Web Platform

In your Appwrite project:

1. Go to **Overview → Add a platform → Web**
2. **Name:** Task Manager
3. **Hostname:** `localhost` (for local dev)  
   Add a second platform for your GitHub Pages URL later:
   `YOUR_USERNAME.github.io`
4. Click **Next** through the rest (no SDK setup needed — we handle it in code)

### Step 3 — Configure environment

```bash
cp .env.example .env
```

Edit `.env`:
```
VITE_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
VITE_APPWRITE_PROJECT_ID=your-project-id-here
VITE_APPWRITE_DATABASE_ID=task-manager-db
```

### Step 4 — Create an API key for setup

In Appwrite Console:
1. Go to **Overview → Integrate with your server → API Key**
2. Name: `setup-key`
3. Scopes: check **databases.read**, **databases.write**, **collections.read**, **collections.write**, **attributes.read**, **attributes.write**, **indexes.read**, **indexes.write**, **documents.read**, **documents.write**
4. Copy the key and add to `.env`:
   ```
   APPWRITE_API_KEY=your-api-key-here
   ```

### Step 5 — Run the setup script

```bash
npm install
npm run setup
```

This automatically creates the database and all 6 collections with the correct attributes and indexes. Takes about 15 seconds.

You should see:
```
✅  Created database: task-manager-db
✅  Created collection: Profiles
✅  Created collection: Workspaces
✅  Created collection: Workspace Members
✅  Created collection: Tasks
✅  Created collection: Regions
✅  Created collection: Tags
🎉  Setup complete!
```

### Step 6 — Run locally

```bash
npm run dev
```

Open [http://localhost:5173/task-manager/](http://localhost:5173/task-manager/)

Register an account, create a workspace, and you're in.

---

## Deploy to GitHub Pages

### First deploy

1. Create a GitHub repo named exactly `task-manager`

2. If your repo has a different name, update these two lines:

   **`vite.config.js`:**
   ```js
   base: '/your-repo-name/',
   ```

   **`src/main.jsx`:**
   ```jsx
   <BrowserRouter basename="/your-repo-name">
   ```

3. Push code to GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/task-manager.git
   git push -u origin main
   ```

4. Deploy:
   ```bash
   npm run deploy
   ```

5. In GitHub repo → **Settings → Pages**:
   - Source: `Deploy from a branch`
   - Branch: `gh-pages` / `/ (root)` → Save

6. Add your GitHub Pages URL as a platform in Appwrite:
   - Appwrite Console → **Overview → Add a platform → Web**
   - Hostname: `YOUR_USERNAME.github.io`

Your app is live at: `https://YOUR_USERNAME.github.io/task-manager/`

### Re-deploy after changes

```bash
npm run deploy
```

---

## How to invite colleagues (for up to 6 users)

1. **You** (workspace owner) go to ⚙️ **Settings → Members**
2. Click **Show Join Code** — a 6-character code appears (e.g. `A3B9FX`)
3. Share that code with your colleague by any means (chat, email, etc.)
4. **They** go to the Workspaces screen → **🔑 Join by Code** tab
5. Enter the code → they're instantly in the workspace

To revoke access to a join code at any time, click **↻ New Code** — the old code stops working immediately.

---

## Project structure

```
task-manager/
├── appwrite-setup.js         ← One-time collection setup (npm run setup)
├── .env.example              ← Copy to .env and fill in your values
├── vite.config.js
├── package.json
├── index.html
└── src/
    ├── lib/
    │   ├── appwrite.js       ← All auth + database functions
    │   └── constants.js      ← Statuses, priorities, helpers
    ├── pages/
    │   ├── Login.jsx
    │   ├── Register.jsx
    │   ├── WorkspacePicker.jsx   ← Create or join workspaces
    │   └── Dashboard.jsx         ← Main app
    ├── components/
    │   ├── KanbanBoard.jsx
    │   ├── TableView.jsx
    │   ├── CalendarView.jsx
    │   ├── TodayPanel.jsx
    │   ├── TaskModal.jsx
    │   ├── SettingsModal.jsx     ← Join code, members, regions, tags
    │   └── Toast.js
    ├── App.jsx               ← Routing + auth state
    ├── main.jsx
    └── index.css
```

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Blank page after deploy | Check `base` in `vite.config.js` matches your repo name exactly |
| "Invalid credentials" on login | Make sure you registered first at `/register` |
| Setup script fails | Check your API key has all database scopes enabled |
| Can't connect to Appwrite | Add `localhost` and your GitHub Pages domain as Web platforms in Appwrite Console |
| Join code "not found" | Codes are case-insensitive but must be exactly 6 characters |
| Colleague can't see tasks | Confirm they joined the same workspace (check ⚙️ Settings → Members) |
