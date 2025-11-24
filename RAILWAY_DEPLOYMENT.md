# 🚂 Deploy Hey Potu POS to Railway.app (NO CARD REQUIRED)

**Railway.app** is a great alternative to Render that gives you **$5 FREE credit/month** without requiring a credit card initially!

---

## 🎯 Step 1: Sign Up for Railway

1. Go to **[railway.app](https://railway.app)**
2. Click **"Login"**
3. Select **"Login with GitHub"**
4. Authorize Railway to access your repositories

---

## 🚀 Step 2: Create New Project

1. Click **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. Choose: **`Ayman-ilias/hey_potu_pos`**
4. Railway will show you the repository

---

## 🗄️ Step 3: Add PostgreSQL Database

1. In your project, click **"+ New"**
2. Select **"Database"**
3. Choose **"PostgreSQL"**
4. Railway creates the database automatically

---

## 🔧 Step 4: Deploy Backend

1. Click **"+ New"** again
2. Select **"GitHub Repo"**
3. Choose your repo: `Ayman-ilias/hey_potu_pos`
4. Configure:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install --production`
   - **Start Command**: `npm start`

5. **Add Environment Variables** (click on backend service → Variables):
   - Copy `DATABASE_URL` from PostgreSQL service (Railway auto-provides this)
   - Add manually:
     - `NODE_ENV` = `production`
     - `PORT` = `5000`

6. Click **"Deploy"**

---

## 📱 Step 5: Deploy Frontend

1. Click **"+ New"** again
2. Select **"GitHub Repo"**
3. Choose your repo: `Ayman-ilias/hey_potu_pos`
4. Configure:
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npx serve -s dist -p $PORT`

5. **Add Environment Variable**:
   - `VITE_API_URL` = Your backend URL (get from backend service)

6. Click **"Deploy"**

---

## ✅ Step 6: Get Your URLs

Once deployed:

1. **Backend**: Click on backend service → Copy the public URL
2. **Frontend**: Click on frontend service → Copy the public URL
3. **Share frontend URL with your client!**

---

## 💰 Cost

- **$5 FREE credit/month** (enough for your app)
- **No credit card required** initially
- If you exceed $5, they'll ask for a card (unlikely for your traffic)

---

## 🔄 Auto-Deploy

Railway automatically redeploys when you push to GitHub!

```bash
git add .
git commit -m "Update"
git push
```

Railway detects changes and redeploys automatically! 🚀

---

## 🐛 Troubleshooting

### Frontend needs serve package

If frontend fails to start, update the start command to:
```
npm install -g serve && serve -s dist -p $PORT
```

### Database Connection

Railway automatically provides `DATABASE_URL` - just reference it in your backend variables.

---

## 📊 Monitoring

- View logs in Railway dashboard
- Monitor usage and credits
- Check deployment status

---

**Railway is easier and doesn't need a card! Give it a try!** 🚂
