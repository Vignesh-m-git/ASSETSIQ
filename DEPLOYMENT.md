# AssetIQ - AI-Powered Asset Management System

## Deployment to Vercel

This application is ready to deploy to Vercel.

### Prerequisites
- GitHub account
- Vercel account (free tier works)
- Supabase project with credentials

### Deployment Steps

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/assetiq.git
   git push -u origin main
   ```

2. **Deploy to Vercel**
   - Go to https://vercel.com
   - Click "Add New Project"
   - Import your GitHub repository
   - Vercel will auto-detect Vite framework

3. **Configure Environment Variables**
   In Vercel dashboard, go to Settings → Environment Variables and add:
   
   - `SUPABASE_URL` = `https://wymperwlgzgmbgvutnjj.supabase.co`
   - `SUPABASE_KEY` = `your-anon-key-here`
   - `GEMINI_API_KEY` = `your-gemini-key-here`
   - `GLM_API_KEY` = `your-glm-key-here` (optional)

4. **Deploy**
   - Click "Deploy"
   - Wait for build to complete
   - Your app will be live at `https://your-project.vercel.app`

### Important Notes

- Environment variables are automatically injected during build
- The app uses client-side routing (HashRouter), so it works on Vercel without additional config
- SSL is automatically enabled
- Auto-deploys on every git push to main branch

### Local Development

```bash
npm install
npm run dev
```

### Build for Production

```bash
npm run build
npm run preview
```

## Features

- ✅ AI-powered asset extraction (Gemini & GLM-4.5-Flash)
- ✅ Supabase authentication
- ✅ Real-time data storage
- ✅ Export to CSV/XLSX/JSON
- ✅ Advanced filtering and search
- ✅ Responsive design with Tailwind CSS

## Tech Stack

- React 19
- TypeScript
- Vite
- Supabase
- Tailwind CSS
- ExcelJS
- Recharts
