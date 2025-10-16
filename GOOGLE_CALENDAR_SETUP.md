# Google Calendar Integration Setup

## Overview
This feature automatically adds booked appointments to the user's Google Calendar with email and popup reminders.

## Features
- ✅ Automatic calendar event creation
- ✅ Email reminders (1 day and 1 hour before)
- ✅ Popup reminders (15 minutes before)
- ✅ Appointment details and location
- ✅ Patient and doctor information
- ✅ Attendee management

## Setup Instructions

### 1. Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Google Calendar API**:
   - Go to "APIs & Services" → "Library"
   - Search for "Google Calendar API"
   - Click "Enable"

### 2. Create OAuth 2.0 Credentials

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth client ID"
3. Choose "Web application"
4. Add authorized JavaScript origins:
   - `http://localhost:3000` (for development)
   - `https://yourdomain.com` (for production)
5. Add authorized redirect URIs (optional but recommended):
   - `http://localhost:3000` (for development)
   - `https://yourdomain.com` (for production)
6. Copy the **Client ID**

### 2b. Create API Key

1. Click "Create Credentials" → "API Key"
2. Restrict the API key (recommended):
   - Go to "Application restrictions" → "HTTP referrers"
   - Add your domains: `localhost:3000/*`, `yourdomain.com/*`
   - Go to "API restrictions" → "Restrict key"
   - Select "Google Calendar API"
3. Copy the **API Key**

### 3. Environment Variables

Create a `.env.local` file in your project root:

```bash
NEXT_PUBLIC_GOOGLE_API_KEY=your_api_key_here
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_client_id_here
```

### 4. Test the Integration

1. Start your development server: `npm run dev`
2. Go to the appointment booking page
3. Click "Connect Google Calendar"
4. Sign in with your Google account
5. Grant calendar permissions
6. Book an appointment
7. Check your Google Calendar for the new event

## How It Works

### Authentication Flow (New Google Identity Services)
The integration now uses Google's new authentication system:
1. Loads Google Identity Services library
2. Initializes token client with OAuth 2.0
3. Requests access token when user signs in
4. Uses token for API calls to Google Calendar

### Appointment Event Structure
```javascript
{
  summary: "Medical Appointment with Dr. Smith",
  description: "Appointment details with patient and doctor info",
  location: "Medical Center",
  start: { dateTime: "2024-10-16T14:00:00", timeZone: "America/New_York" },
  end: { dateTime: "2024-10-16T15:00:00", timeZone: "America/New_York" },
  reminders: {
    overrides: [
      { method: 'email', minutes: 1440 }, // 1 day before
      { method: 'email', minutes: 60 },   // 1 hour before
      { method: 'popup', minutes: 15 }    // 15 minutes before
    ]
  },
  attendees: [{ email: "patient@email.com" }]
}
```

### Security & Privacy
- Users must explicitly connect their Google Calendar
- Only appointment data is shared with Google
- Calendar access can be revoked at any time
- No sensitive medical data is stored in calendar events

## Troubleshooting

### Common Issues

1. **"Sign-in failed"**
   - Check if your domain is in authorized JavaScript origins
   - Verify the Client ID is correct
   - Ensure Google Calendar API is enabled

2. **"Permission denied"**
   - User needs to grant calendar access during sign-in
   - Check if the calendar scope is correct

3. **"API key invalid"**
   - Verify the API key in environment variables
   - Check if the API key has proper restrictions

### Development Tips

- Use browser developer tools to debug API calls
- Check the Network tab for failed requests
- Verify environment variables are loaded correctly
- Test with different Google accounts

## Future Enhancements

- [ ] Multiple reminder preferences
- [ ] Calendar selection (work vs personal)
- [ ] Appointment rescheduling sync
- [ ] Bulk calendar operations
- [ ] Integration with other calendar providers (Outlook, Apple Calendar)