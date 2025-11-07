# Wallie 3.0 - Quick Setup Guide

Get Wallie up and running with real-time messaging in 5 minutes!

---

## ✅ Prerequisites (Already Done!)

- [x] Supabase account created
- [x] Database provisioned
- [x] Credentials added to `.env`
- [x] Dependencies installed

---

## 🚀 Setup Steps

### Step 1: Set Up Supabase Database Schema

You need to run the SQL schema on your Supabase database. Choose one method:

#### Method A: Via Supabase Dashboard (Easiest) ⭐ RECOMMENDED

1. Open your Supabase project: https://supabase.com/dashboard/project/hwcbxfpxlxdxdjzdyhzf

2. Click **SQL Editor** in the left sidebar

3. Click **New Query**

4. Open `supabase/setup.sql` in your code editor and copy ALL the contents

5. Paste into the SQL Editor

6. Click **Run** (or press Cmd/Ctrl + Enter)

7. Wait for the success message - should see:
   ```
   ✅ Wallie database schema created successfully!
   ```

#### Method B: Via Command Line (If you have psql installed)

```bash
npm run db:setup
```

---

### Step 2: Start Electric Sync Service

The Electric service acts as a real-time bridge between Supabase and your app.

**Requirements:**
- Docker installed and running

**Start the service:**

```bash
npm run electric:start
```

**Verify it's running:**

```bash
curl http://localhost:5133/v1/health
```

Should return: `{"status":"ok"}`

**View logs (if needed):**

```bash
npm run electric:logs
```

---

### Step 3: Start Development Server

```bash
npm run dev
```

Open your browser to **http://localhost:5173**

Check the browser console - you should see:

```
✅ Database initialized successfully
✅ Electric-enabled PGlite initialized
🚀 Initializing Electric sync...
```

---

## 🎉 You're Ready!

Your Wallie instance is now running with:
- ✅ Local PGlite database (in browser)
- ✅ Supabase Postgres (cloud database)
- ✅ Electric-SQL sync (real-time bridge)
- ✅ Real-time messaging infrastructure

---

## 📝 Next Steps

Now you can implement real-time features:

### Phase 3: New Chat UI
- User search by ID
- Create new conversations

### Phase 4: Real-Time Messages
- Messages appear instantly
- No refresh needed

### Phase 5: Typing Indicators
- See when someone is typing
- Animated "..." indicator

### Phase 6: Presence Status
- Online/offline indicators
- Last seen timestamps

### Phase 7: Message Receipts
- Delivered (✓✓)
- Read (blue ✓✓)

### Phase 8: Edit & Delete
- Edit messages (15-minute window)
- Delete messages for everyone

See `documentation/MESSAGING_FEATURES.md` for detailed implementation guide!

---

## 🛠️ Useful Commands

```bash
# Development
npm run dev                  # Start dev server
npm run typecheck           # Check TypeScript types
npm test                    # Run Playwright tests

# Electric Sync Service
npm run electric:start      # Start Electric
npm run electric:stop       # Stop Electric
npm run electric:logs       # View Electric logs
npm run electric:restart    # Restart Electric

# Database
npm run db:setup           # Run Supabase schema setup
```

---

## ❓ Troubleshooting

### Electric won't start

**Check Docker is running:**
```bash
docker ps
```

**Check logs:**
```bash
npm run electric:logs
```

**Restart Electric:**
```bash
npm run electric:restart
```

### Database connection fails

**Test connection:**
```bash
psql "$DATABASE_URL" -c "SELECT version();"
```

**Check .env file:**
- Verify `DATABASE_URL` is correct
- No extra spaces or quotes

### Tables not syncing

**Check Supabase realtime publication:**

In Supabase SQL Editor:
```sql
SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
```

Should show: users, profiles, messages, message_threads, etc.

---

## 📚 Documentation

- `documentation/MESSAGING_FEATURES.md` - Complete feature guide
- `supabase/README.md` - Detailed Supabase setup
- `CLAUDE.md` - Development guide

---

## 🐛 Common Issues

### "Cannot connect to Electric"

- Make sure Docker is running
- Check `npm run electric:start` completed successfully
- Verify port 5133 is not in use: `lsof -i :5133`

### "Table does not exist"

- Run `npm run db:setup` to create tables in Supabase
- Check Supabase dashboard → Table Editor to verify tables exist

### Messages not syncing in real-time

- Check Electric is running: `npm run electric:logs`
- Check browser console for errors
- Verify Supabase realtime is enabled for tables

---

## 🚢 Production Deployment

When you're ready to deploy:

1. **Deploy Electric to Railway/Fly.io**
   - Use the same Docker image: `electricsql/electric`
   - Set `DATABASE_URL` environment variable

2. **Update `.env` for production:**
   ```env
   ELECTRIC_SERVICE_URL=https://your-electric-service.railway.app
   ```

3. **Enable secure auth:**
   - Change `AUTH_MODE` from `insecure` to `secure`
   - Set up JWT authentication

---

## 🎯 Current Status

**✅ Phase 1: Database Schema** - COMPLETE
- Messages table with real-time columns
- Typing indicators table
- User presence table
- All helper functions implemented

**✅ Phase 2: Electric-SQL Integration** - COMPLETE
- Dependencies installed
- Electric client configured
- Docker Compose setup
- Supabase schema ready

**📋 Phase 3-9: Feature Implementation** - READY TO START
- New chat UI
- Real-time delivery
- Typing indicators
- Presence status
- Message receipts
- Edit/delete messages
- Testing & polish

---

**Need help?** Check the documentation files or open an issue!

**Ready to code?** Start with Phase 3 in `documentation/MESSAGING_FEATURES.md`!
