# Doctor Chatbot Integration

## Overview
A GPT-4o-mini powered AI chatbot has been integrated into the dermatologist dashboard to assist doctors with medical information, diagnosis guidelines, and treatment recommendations.

## Features
- ✅ **AI-Powered Responses**: Uses OpenAI's GPT-4o-mini model for fast, accurate responses
- ✅ **Dermatology Specialization**: System prompt tailored for dermatology-specific queries
- ✅ **Beautiful UI**: Modern chat interface with gradient colors matching the app theme
- ✅ **Accessible**: Available on all dermatologist pages via the bottom navigation
- ✅ **Doctor-Only**: Chatbot button only appears on dermatologist routes (`/dermatologist/*`)

## Files Created/Modified

### New Files
1. **`components/DoctorChatbot.tsx`** - Chatbot UI component with modal interface
2. **`app/api/chatbot/route.ts`** - API endpoint handling OpenAI integration

### Modified Files
1. **`app/dermatologist/page.tsx`** - Main dashboard with chatbot button
2. **`app/dermatologist/appointments/page.tsx`** - Appointments page with chatbot button
3. **`app/dermatologist/cases/page.tsx`** - Cases review page with chatbot button
4. **`app/dermatologist/profile/page.tsx`** - Profile page with chatbot button

## Setup Instructions

### 1. Environment Variables
Ensure your `.env.local` file contains your OpenAI API key:

```bash
OPENAI_API_KEY=sk-proj-...your-key-here...
```

### 2. Testing the Chatbot
1. Navigate to any dermatologist page (requires login as a dermatologist)
2. Click the "Chatbot" button in the bottom navigation
3. The chatbot modal will open with an AI greeting
4. Type your dermatology-related questions and press Enter or click Send

## Technical Details

### AI Model Configuration
- **Model**: `gpt-4o-mini` (latest mini model from OpenAI)
- **Temperature**: 0.7 (balanced creativity and consistency)
- **Max Tokens**: 1000 per response
- **System Prompt**: Specialized for dermatology medical assistance

### API Endpoint
```
POST /api/chatbot
Body: { messages: [{ role: 'user' | 'assistant', content: string }] }
Response: { message: string }
```

### Error Handling
- Displays user-friendly error messages
- Handles API quota limits
- Graceful fallbacks for network issues

## Usage Examples

### Example Queries
- "What are the differential diagnoses for a maculopapular rash?"
- "Explain the treatment protocol for severe acne"
- "What are the key indicators of melanoma?"
- "How do I differentiate between eczema and psoriasis?"

## UI Features
- **Keyboard Shortcuts**: Enter to send, Shift+Enter for new line
- **Responsive Design**: Works on mobile and desktop
- **Dark Mode Support**: Adapts to user's theme preference
- **Loading States**: Clear visual feedback during API calls
- **Message History**: Maintains context throughout conversation

## Notes
- Patient site (`/`) continues to use the regular Health button (disabled)
- Only dermatologist routes show the functional Chatbot button
- Messages are stateful within a session but not persisted to database
- The chatbot provides medical information to supplement professional judgment, not replace it

## Future Enhancements
- [ ] Persist chat history to database
- [ ] Add file/image upload for visual diagnosis support
- [ ] Integration with case review for context-aware suggestions
- [ ] Voice input/output capabilities
- [ ] Multi-language support

