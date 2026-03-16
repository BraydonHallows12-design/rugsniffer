# Push RugSniffer to GitHub and Open in Vercel

Follow these steps to get your repo on GitHub and deploy via Vercel.

---

## 1. Install Git (if needed)

- Download: **https://git-scm.com/download/win**
- Run the installer (defaults are fine).
- **Close and reopen** your terminal/Cursor after installing.

---

## 2. Create a new repository on GitHub

1. Go to **https://github.com/new**
2. **Repository name:** `rugsniffer` (or any name you like)
3. Choose **Public**
4. **Do not** check "Add a README" or ".gitignore" (you already have them)
5. Click **Create repository**
6. Copy the repo URL (looks like `https://github.com/YOUR_USERNAME/rugsniffer.git`)

---

## 3. Push your project to GitHub

Open **PowerShell** or **Command Prompt** and run:

```powershell
cd "C:\Users\Braydon Hallows\rugsniffer-app"

git init
git add .
git commit -m "Initial commit: RugSniffer DeFi app with backend"

git branch -M main
git remote add origin PASTE_YOUR_GITHUB_URL_HERE
git push -u origin main
```

Replace **`PASTE_YOUR_GITHUB_URL_HERE`** with your repo URL, e.g.  
`https://github.com/YourUsername/rugsniffer.git`

If GitHub asks you to sign in, use your GitHub account (or a Personal Access Token if you use 2FA).

---

## 4. Connect the repo to Vercel

1. Go to **https://vercel.com** and sign in (or create an account).
2. Click **Add New…** → **Project**.
3. **Import** your GitHub repo (e.g. `rugsniffer`).
4. Vercel will detect the project. Leave **Root Directory** as `.` and **Build Command** empty (no build step).
5. Under **Environment Variables**, add (optional but recommended):
   - `SOLANA_RPC_URL` = your RPC URL (or leave blank for public mainnet)
   - `TREASURY_WALLET` = your Solana wallet address for premium payments
6. Click **Deploy**.

After the deploy finishes, Vercel will give you a URL like `https://rugsniffer-xxx.vercel.app`.

---

## 5. Set treasury in the frontend (for premium payments)

1. In your repo on GitHub, open **index.html**.
2. Search for `TREASURY_WALLET` and replace `YOUR_SOLANA_WALLET_ADDRESS` with the same address you used for `TREASURY_WALLET` in Vercel.
3. Commit and push. Vercel will redeploy automatically.

---

## Quick reference

| Step | Where | Action |
|------|--------|--------|
| 1 | Your PC | Install Git |
| 2 | github.com | Create new repo, copy URL |
| 3 | Terminal | `git init`, `add`, `commit`, `remote add`, `push` |
| 4 | vercel.com | Import repo, add env vars, Deploy |
| 5 | GitHub (index.html) | Set treasury address, push for redeploy |
