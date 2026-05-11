# MoTrack: Cinematic Productivity OS

A premium, full-stack productivity application built with React, Vite, Supabase, and Framer Motion.

## 🚀 Getting Started

### 1. Supabase Setup
1. Create a new project at [supabase.com](https://supabase.com).
2. Go to the **SQL Editor** and paste the contents of `SUPABASE_SCHEMA.sql` (found in the root of this project).
3. Run the SQL to create all tables, RLS policies, and triggers.
4. Go to **Project Settings > API** and copy your `Project URL` and `anon public key`.

### 2. Storage Setup
1. Go to **Storage** in your Supabase dashboard.
2. Create a new bucket named `avatars`.
3. Set the bucket to **Public**.
4. (Optional) Set up an RLS policy for the bucket:
   - Allow `SELECT` for everyone (public).
   - Allow `INSERT`, `UPDATE`, `DELETE` only for `authenticated` users where `owner_id = auth.uid()`.

### 3. Environment Variables
1. Create a `.env` file from `.env.example`.
2. Add your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_project_url
   VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_key
   ```

### 3. Installation
```bash
npm install
npm run dev
```

## 💎 Features
- **Dashboard**: Momentum tracking, productivity scoring, activity feed.
- **Habits**: Daily routine builder with streak tracking.
- **Focus**: High-fidelity Pomodoro timer with flow presets and history.
- **Projects**: Goal-oriented project management with task tracking and progress bars.
- **Notes**: Minimalist capture system for ideas and drafts.
- **Analytics**: Deep behavioral insights via cinematic data visualization.
- **Profile & Settings**: Full customization of your productivity environment.

## 🛠 Tech Stack
- **Frontend**: React 19, TypeScript, Tailwind CSS
- **Animations**: Framer Motion
- **Database**: Supabase (PostgreSQL + RLS)
- **Routing**: React Router 7
- **Charts**: Recharts
- **Icons**: Lucide React
- **PWA**: Installable web experience

## 📦 Deployment
This app is ready for deployment on Vercel:
1. Connect your repository.
2. Add the environment variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`) in the Vercel dashboard.
3. Deploy.

---
Built with MoTrack — *Design your legacy through daily action.*
