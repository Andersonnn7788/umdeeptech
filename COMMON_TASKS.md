# Common Tasks & Troubleshooting

Quick reference for common operations and fixes.

## 🚀 Getting Started

### First Time Setup
```bash
# 1. Install dependencies
npm install

# 2. Create environment file
cp .env.local.example .env.local  # (if exists)
# or create .env.local manually

# 3. Add your keys to .env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key
OPENAI_API_KEY=sk-your-openai-key

# 4. Start development server
npm run dev
```

## 🗄️ Database Operations

### Run Initial Schema
```sql
-- Copy lib/supabase/schema.sql
-- Paste into Supabase SQL Editor
-- Click "Run" or press Ctrl+Enter
```

### Create Dermatologist User
```sql
-- First, sign up a user through your app or Supabase Auth

-- Then promote to dermatologist:
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || '{"role": "dermatologist"}'::jsonb
WHERE email = 'dermatologist@example.com';
```

### Check User Role
```sql
SELECT email, raw_user_meta_data->>'role' as role
FROM auth.users;
```

### View All Cases
```sql
SELECT id, user_id, status, created_at
FROM cases
ORDER BY created_at DESC;
```

### Check Analysis Results
```sql
SELECT c.id as case_id, c.status, ar.ai_confidence_score, ar.severity
FROM cases c
LEFT JOIN analysis_results ar ON c.id = ar.case_id
ORDER BY c.created_at DESC;
```

### View Reviews
```sql
SELECT c.id as case_id, dr.professional_diagnosis, dr.reviewed_at
FROM cases c
LEFT JOIN dermatologist_reviews dr ON c.id = dr.case_id
WHERE dr.id IS NOT NULL
ORDER BY dr.reviewed_at DESC;
```

## 🧪 Testing Scenarios

### Test User Flow
1. Go to `http://localhost:3000`
2. Click "Start Skin Analysis"
3. Upload test image (any clear photo)
4. Wait for AI analysis
5. Review results
6. Submit for professional review
7. Check case details page

### Test Dermatologist Flow
1. Create dermatologist user (see SQL above)
2. Go to `/dermatologist/cases`
3. View pending cases
4. Click "Review Case"
5. Fill in diagnosis and recommendations
6. Submit review
7. Check that report was created

### Test API Endpoints
```bash
# Upload image (requires authentication)
curl -X POST http://localhost:3000/api/cases/upload \
  -F "image=@test-image.jpg" \
  -H "Cookie: your-auth-cookie"

# Get case details
curl http://localhost:3000/api/cases/[caseId] \
  -H "Cookie: your-auth-cookie"
```

## 🔧 Common Customizations

### Change AI Analysis Prompt
Edit `app/api/cases/analyze/route.ts`:
```typescript
// Line ~40: Modify the system prompt
content: `You are an AI assistant helping with preliminary skin analysis.
YOUR CUSTOM INSTRUCTIONS HERE...`
```

### Modify Detected Conditions Format
Edit `app/api/cases/analyze/route.ts`:
```typescript
// Line ~48: Adjust the JSON structure
{
  "confidence_score": 0-100,
  "detected_conditions": [
    // Your custom fields
  ]
}
```

### Change Image Upload Limits
Edit `app/api/cases/upload/route.ts`:
```typescript
// Line ~30: Change max file size (currently 10MB)
if (file.size > 10 * 1024 * 1024) {
  // Change to desired size in bytes
}
```

### Adjust Image Quality
Edit `app/api/cases/upload/route.ts`:
```typescript
// Line ~34: Change main image quality
.jpeg({ quality: 85 })  // 1-100

// Line ~39: Change thumbnail quality
.jpeg({ quality: 80 })  // 1-100
```

### Update Brand Colors
Edit `app/globals.css`:
```css
/* Change primary colors */
--background: #ffffff;
--foreground: #171717;
```

Edit components for gradient colors:
```tsx
// Find: from-blue-600 to-purple-600
// Replace with your colors
```

### Change Page Titles
Edit `app/layout.tsx`:
```typescript
export const metadata: Metadata = {
  title: "Your Brand Name - Skin Analysis",
  description: "Your custom description",
}
```

## 🐛 Troubleshooting

### Error: "Cannot connect to Supabase"
```bash
# Check environment variables
cat .env.local

# Verify keys are correct in Supabase dashboard
# Project Settings > API

# Restart dev server
npm run dev
```

### Error: "OpenAI API Error"
```bash
# Verify API key
echo $OPENAI_API_KEY

# Check OpenAI dashboard
# https://platform.openai.com/account/api-keys

# Verify you have credits
# https://platform.openai.com/account/billing

# Ensure access to GPT-4o model
```

### Error: "Image upload failed"
```sql
-- Check if storage bucket exists
SELECT * FROM storage.buckets WHERE id = 'skin-images';

-- If missing, run schema.sql again

-- Check storage policies
SELECT * FROM storage.objects_policies;
```

### Error: "Case not found"
```sql
-- Check if case exists
SELECT * FROM cases WHERE id = 'your-case-id';

-- Check RLS policies are applied
-- Ensure user is authenticated
```

### Error: "Cannot create analysis"
```sql
-- Check if analysis_results table exists
SELECT * FROM information_schema.tables 
WHERE table_name = 'analysis_results';

-- Check if case has existing analysis
SELECT * FROM analysis_results WHERE case_id = 'your-case-id';
```

### UI not updating
```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules
npm install

# Restart dev server
npm run dev
```

### Dark mode not working
```tsx
// Check if you're using the correct Tailwind classes
className="dark:bg-gray-800"  // ✅ Correct
className="bg-gray-800-dark"  // ❌ Wrong
```

### Images not loading
```tsx
// Add domain to next.config.ts
images: {
  domains: ['your-supabase-project.supabase.co'],
}
```

## 📊 Monitoring

### Check Application Logs
```bash
# Development
npm run dev
# Watch console for errors

# Production (Vercel)
# Check Vercel dashboard > Logs
```

### Monitor Supabase Usage
```
Supabase Dashboard > Settings > Usage
- Database size
- Storage used
- API requests
```

### Monitor OpenAI Usage
```
OpenAI Dashboard > Usage
- API calls
- Tokens used
- Cost tracking
```

## 🔄 Updates

### Update Dependencies
```bash
# Check for updates
npm outdated

# Update all dependencies
npm update

# Update specific package
npm install package-name@latest
```

### Update Next.js
```bash
npm install next@latest react@latest react-dom@latest
```

### Update Supabase Client
```bash
npm install @supabase/supabase-js@latest @supabase/ssr@latest
```

## 🚢 Deployment

### Deploy to Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Add environment variables in Vercel dashboard
```

### Database Migrations
```sql
-- When updating schema, create migration file
-- Run new SQL commands in Supabase SQL Editor
-- Keep track of changes for rollback
```

## 📝 Maintenance

### Backup Database
```
Supabase Dashboard > Database > Backups
- Daily automatic backups (Pro plan)
- Manual backups anytime
```

### Clean Old Images
```sql
-- Find old images
SELECT * FROM cases 
WHERE created_at < NOW() - INTERVAL '90 days';

-- Delete (be careful!)
-- Consider archiving instead of deleting
```

### Monitor Error Rates
```sql
-- Create error logging table
CREATE TABLE error_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Query recent errors
SELECT * FROM error_logs 
WHERE created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;
```

## 🆘 Get Help

### Resources
- 📖 README.md - Full documentation
- 🚀 QUICKSTART.md - Fast setup
- 🏗️ ARCHITECTURE.md - System design
- 📊 PROJECT_OVERVIEW.md - Feature overview

### External Documentation
- [Next.js Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [OpenAI API Docs](https://platform.openai.com/docs)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)

### Community
- GitHub Issues
- Stack Overflow (tag: nextjs, supabase)
- Supabase Discord
- OpenAI Community Forum

---

**Pro Tip**: Always test changes in development before deploying to production!



