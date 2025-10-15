# Quick Start Guide

Get your skin analysis platform running in 5 minutes!

## 📦 1. Install Dependencies

```bash
npm install
```

## 🗄️ 2. Set Up Supabase

### Create Project
1. Go to [https://supabase.com](https://supabase.com)
2. Click "New Project"
3. Choose a name and password

### Run Database Schema
1. Open SQL Editor in Supabase Dashboard
2. Copy contents from `lib/supabase/schema.sql`
3. Paste and click "Run"
4. Wait for success message

### Get API Keys
1. Go to Project Settings > API
2. Copy your project URL and anon key

## 🔑 3. Set Up OpenAI

1. Go to [https://platform.openai.com](https://platform.openai.com)
2. Create API key in API Keys section
3. Copy the key (starts with `sk-`)

## ⚙️ 4. Configure Environment

Create `.env.local` in project root:

```env
# Get these from Supabase Dashboard > Project Settings > API
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...your-anon-key
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...your-service-role-key

# Get this from OpenAI Dashboard
OPENAI_API_KEY=sk-...your-openai-key
```

## 🚀 5. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser!

## 🧪 6. Test the Application

### Test as a User
1. Click "Start Skin Analysis"
2. Upload a test image
3. Watch the AI analyze it
4. Submit for review

### Test as a Dermatologist

First, enable Supabase email auth:
1. Go to Authentication > Providers in Supabase
2. Enable Email provider

Then create a dermatologist account:

```bash
# Sign up a user first through the app or Supabase dashboard
# Then run this SQL in Supabase SQL Editor:

UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || '{"role": "dermatologist"}'::jsonb
WHERE email = 'dermatologist@example.com';
```

Navigate to `/dermatologist/cases` to see the review interface.

## 🎨 7. Customize (Optional)

### Update Branding
- Edit `app/page.tsx` for homepage content
- Modify `app/layout.tsx` for site metadata
- Update colors in `app/globals.css`

### Modify AI Prompts
- Edit `app/api/cases/analyze/route.ts`
- Adjust system prompt for different analysis styles

## 🐛 Common Issues

### "Cannot connect to Supabase"
- Check your `.env.local` file exists
- Verify Supabase URL and keys are correct
- Restart dev server after adding env vars

### "OpenAI API Error"
- Verify your OpenAI API key is valid
- Check you have credits in your OpenAI account
- Ensure key has access to GPT-4o model

### "Image upload failed"
- Check Supabase Storage bucket was created
- Verify storage policies were applied from schema.sql
- Ensure user is authenticated

### "Cannot find module" errors
- Delete `node_modules` and `.next` folders
- Run `npm install` again
- Restart dev server

## 📱 Mobile Testing

### Test on Real Device
1. Find your local IP: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
2. Start dev server: `npm run dev`
3. On phone, visit `http://YOUR_IP:3000`

### Test Responsive Design
1. Open browser DevTools (F12)
2. Click device toolbar icon
3. Select mobile device preset

## 🚢 Ready to Deploy?

See the main README.md for deployment instructions to:
- Vercel (easiest)
- Netlify
- AWS Amplify
- Other platforms

## 💡 Next Steps

1. Enable Supabase Auth email confirmation
2. Add email notifications for users
3. Implement user dashboard for case history
4. Add more AI analysis features
5. Customize UI to match your brand

## 🆘 Need Help?

- Check the full README.md for detailed documentation
- Review SUPABASE_SETUP.md for database setup
- Open an issue on GitHub
- Check Supabase/OpenAI documentation

---

Happy coding! 🎉


