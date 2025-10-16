# Google OAuth Setup for Supabase - Troubleshooting Guide

## Problem: Cannot Enable Google Auth in Supabase Dashboard

### Prerequisites Checklist
- [ ] Google Cloud Console account created
- [ ] Google Cloud project created
- [ ] Supabase project is active and accessible

## Step 1: Google Cloud Console Setup

### 1.1 Create/Select Project
1. Go to https://console.cloud.google.com/
2. Click the project dropdown at the top
3. Click "New Project" if needed
4. Name: "UmDeepTech OAuth"
5. Click "Create"

### 1.2 Enable Required APIs
1. Go to "APIs & Services" > "Library"
2. Search for "Google+ API" and click it
3. Click "ENABLE" button
4. Also enable "Gmail API" (optional but recommended)

### 1.3 Configure OAuth Consent Screen (REQUIRED)
1. Go to "APIs & Services" > "OAuth consent screen"
2. Choose "External" user type
3. Fill in required information:
   - App name: "UmDeepTech"
   - User support email: your-email@example.com
   - Developer contact information: your-email@example.com
4. Click "Save and Continue"
5. Skip scopes (click "Save and Continue")
6. Skip test users (click "Save and Continue")
7. Click "Back to Dashboard"

### 1.4 Create OAuth 2.0 Credentials
1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client IDs"
3. Application type: "Web application"
4. Name: "UmDeepTech Supabase"
5. Authorized redirect URIs: 
   ```
   https://your-project-ref.supabase.co/auth/v1/callback
   ```
   (Replace "your-project-ref" with your actual Supabase project reference)
6. Click "Create"
7. **COPY the Client ID and Client Secret**

## Step 2: Find Your Supabase Project Reference

1. Go to https://app.supabase.com/
2. Select your project
3. Go to Settings > General
4. Find "Reference ID" - this is what you need for the redirect URL
5. Your callback URL will be: `https://[reference-id].supabase.co/auth/v1/callback`

## Step 3: Enable Google Auth in Supabase

1. Go to your Supabase project dashboard
2. Navigate to Authentication > Providers
3. Find "Google" in the provider list
4. **If the toggle is grayed out:**
   - Refresh the page
   - Try a different browser
   - Check if you're on the correct Supabase account
   - Ensure your project is not paused/suspended
5. Toggle Google to "Enabled"
6. Enter your Google Client ID
7. Enter your Google Client Secret
8. Click "Save"

## Common Issues and Solutions

### Issue 1: "OAuth consent screen not configured"
- **Solution**: Complete Step 1.3 above - this is mandatory

### Issue 2: "Invalid redirect URI"
- **Solution**: Double-check your Supabase project reference ID
- Make sure the URL format is exactly: `https://[ref].supabase.co/auth/v1/callback`

### Issue 3: Toggle button is grayed out
- **Solution 1**: Refresh the Supabase dashboard
- **Solution 2**: Try incognito/private browsing mode
- **Solution 3**: Clear browser cache for supabase.com
- **Solution 4**: Try a different browser

### Issue 4: "Provider not available on this plan"
- **Solution**: This shouldn't happen on free tier, contact Supabase support

### Issue 5: Changes don't save
- **Solution**: Make sure both Client ID and Secret are entered before saving
- Try copying credentials again (no extra spaces)

## Testing Your Setup

1. After enabling Google auth in Supabase
2. Go to your app: http://localhost:3000/auth/login
3. Click the Google login button
4. Should redirect to Google login instead of showing error

## Need Help?

If you're still having issues:
1. Take a screenshot of the Supabase providers page
2. Check the browser console for any error messages
3. Verify your Google Cloud project has the OAuth consent screen configured
4. Make sure the APIs are enabled in Google Cloud Console

## Contact Information
- Google Cloud Console: https://console.cloud.google.com/
- Supabase Dashboard: https://app.supabase.com/
- Supabase Docs: https://supabase.com/docs/guides/auth/social-login/auth-google