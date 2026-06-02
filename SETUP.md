# ORI Sprint OS — Setup

## 1. Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project.
2. Copy your **Project URL** and **Anon Key** from Project Settings → API.
3. Update `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

## 2. Run the Schema

In Supabase → SQL Editor, paste and run the contents of `supabase/schema.sql`.

This creates all 7 tables and seeds a default settings row.

## 3. Run the App

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## 4. First Steps

1. Go to **Settings** and set your Revenue Goal, Current Revenue, Days Remaining, and Current Focus.
2. Hit **Save Settings**.
3. Return to **Dashboard** — the header and cards will reflect your values.
