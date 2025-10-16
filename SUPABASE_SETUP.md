# Supabase Setup Instructions

## 1. Create Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
OPENAI_API_KEY=your_openai_api_key
```

## 2. Run Database Schema

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `lib/supabase/schema.sql`
4. Execute the SQL script

This will create:
- All necessary tables (cases, analysis_results, dermatologist_reviews, user_reports)
- Row Level Security (RLS) policies
- Storage bucket for skin images
- Indexes for performance
- Triggers for automatic timestamp updates

## 3. Configure Authentication

1. In Supabase Dashboard > Authentication > Providers
2. Enable Email provider (or your preferred auth method)
3. Optionally add user metadata field for roles (user/dermatologist)

## 4. Test the Setup

After running the application, you can:
- Sign up as a regular user to submit skin analysis cases
- Create a dermatologist user by updating user metadata in Supabase:
  ```sql
  UPDATE auth.users
  SET raw_user_meta_data = raw_user_meta_data || '{"role": "dermatologist"}'::jsonb
  WHERE email = 'dermatologist@example.com';
  ```



