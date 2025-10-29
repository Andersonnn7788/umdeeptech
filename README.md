# AI-Powered Teledermatology Platform

A modern, mobile-first Next.js application that provides AI-powered skin analysis with professional dermatologist review. Built with Next.js 15, Supabase, OpenAI, and Tailwind CSS.

## 🌟 Features

### User Workflow
1. **Photo Capture/Upload** - Mobile-optimized interface for taking or uploading skin photos
2. **AI Analysis** - Instant preliminary analysis using OpenAI's GPT-4o Vision API
3. **Professional Review** - Submit cases to certified dermatologists for review
4. **Comprehensive Reports** - Receive detailed reports with diagnosis and treatment recommendations

### Key Capabilities
- 📱 **Mobile-First Design** - Seamless experience across all devices
- 🤖 **AI-Powered Analysis** - Advanced computer vision for skin condition detection
- 👨‍⚕️ **Dermatologist Dashboard** - Professional interface for case review
- 🔒 **Secure & Private** - Row-level security with Supabase
- 📊 **Detailed Reports** - Comprehensive analysis and treatment plans
- 🎨 **Modern UI** - Beautiful, accessible interface with dark mode support

## 🏗️ Architecture

### Tech Stack
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Backend**: Supabase (PostgreSQL + Storage + Auth)
- **AI**: OpenAI GPT-4o Vision API
- **Image Processing**: Sharp
- **Deployment**: Vercel (recommended)

### Project Structure
```
umdeeptech/
├── app/
│   ├── api/                    # API routes
│   │   ├── cases/
│   │   │   ├── upload/        # Image upload endpoint
│   │   │   ├── analyze/       # AI analysis endpoint
│   │   │   ├── submit-for-review/
│   │   │   └── [caseId]/      # Get case details
│   │   └── dermatologist/
│   │       ├── cases/         # Get review queue
│   │       └── review/        # Submit review
│   ├── skin-analysis/         # User workflow page
│   ├── cases/[caseId]/        # Case details & report
│   ├── dermatologist/cases/   # Dermatologist dashboard
│   ├── page.tsx              # Landing page
│   └── layout.tsx            # Root layout
├── components/
│   ├── PhotoCapture.tsx      # Photo upload component
│   └── LoadingSpinner.tsx    # Loading indicator
├── lib/
│   ├── supabase/
│   │   ├── client.ts         # Browser Supabase client
│   │   ├── server.ts         # Server Supabase client
│   │   └── schema.sql        # Database schema
│   └── types/
│       └── case.ts           # TypeScript types
└── SUPABASE_SETUP.md         # Setup instructions
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Supabase account ([https://supabase.com](https://supabase.com))
- OpenAI API key ([https://platform.openai.com](https://platform.openai.com))

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd umdeeptech
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase**
   - Create a new Supabase project
   - Copy the contents of `lib/supabase/schema.sql`
   - Run it in your Supabase SQL Editor
   - See `SUPABASE_SETUP.md` for detailed instructions

4. **Configure environment variables**
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   OPENAI_API_KEY=your_openai_api_key
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📱 User Guide

### For Patients

1. **Start Analysis**
   - Click "Start Skin Analysis" on the homepage
   - Take a photo or upload an existing image
   - Ensure good lighting and clear focus

2. **View AI Analysis**
   - Review the preliminary AI assessment
   - Check detected conditions and severity
   - Read AI recommendations

3. **Submit for Review**
   - Submit your case to a dermatologist
   - Receive a notification when review is complete

4. **View Report**
   - Access your comprehensive report
   - Review professional diagnosis
   - Follow treatment recommendations

### For Dermatologists

1. **Access Dashboard**
   - Navigate to "For Professionals" in the header
   - View all cases pending review

2. **Review Cases**
   - Click on a case to view details
   - Review AI analysis and image
   - Provide professional diagnosis

3. **Submit Review**
   - Enter diagnosis and treatment recommendations
   - Set urgency level
   - Approve or request resubmission

## 🗄️ Database Schema

### Tables
- **cases** - Stores user submissions
- **analysis_results** - AI analysis data
- **dermatologist_reviews** - Professional reviews
- **user_reports** - Final reports for users

### Security
- Row Level Security (RLS) enabled on all tables
- Users can only access their own data
- Dermatologists have special permissions
- Storage policies for image access control

## 🔐 Security Features

- **Authentication** - Supabase Auth with email/password
- **Authorization** - Role-based access control (user/dermatologist)
- **Row Level Security** - Database-level access control
- **Secure Storage** - Private image storage with signed URLs
- **API Protection** - Server-side authentication checks

## 🎨 UI/UX Features

- **Responsive Design** - Mobile-first, works on all screen sizes
- **Dark Mode** - Automatic dark/light theme support
- **Touch-Friendly** - Large tap targets for mobile
- **Progress Indicators** - Clear workflow visualization
- **Loading States** - Smooth transitions and feedback
- **Error Handling** - User-friendly error messages

## 📊 API Endpoints

### Public Endpoints
- `POST /api/cases/upload` - Upload and create case
- `POST /api/cases/analyze` - Trigger AI analysis
- `POST /api/cases/submit-for-review` - Submit for review
- `GET /api/cases/[caseId]` - Get case details

### Dermatologist Endpoints
- `GET /api/dermatologist/cases` - Get review queue
- `POST /api/dermatologist/review` - Submit review

## 🧪 Testing the Application

### Test as a Regular User
1. Navigate to homepage
2. Click "Start Skin Analysis"
3. Upload a test image
4. Wait for AI analysis
5. Submit for review

### Test as a Dermatologist
1. Create a user in Supabase Auth
2. Update user metadata in Supabase SQL Editor:
   ```sql
   UPDATE auth.users
   SET raw_user_meta_data = raw_user_meta_data || '{"role": "dermatologist"}'::jsonb
   WHERE email = 'your-dermatologist-email@example.com';
   ```
3. Navigate to "For Professionals"
4. Review submitted cases

## 🚢 Deployment

### Vercel (Recommended)
1. Push your code to GitHub
2. Connect your repo to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Other Platforms
- Netlify
- AWS Amplify
- Any Node.js hosting platform

## 📝 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Yes |
| `OPENAI_API_KEY` | OpenAI API key | Yes |

## ⚠️ Important Disclaimers

### Medical Disclaimer
This application is designed for preliminary skin analysis and educational purposes only. It is **NOT** a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of qualified healthcare providers with any questions regarding medical conditions.

### AI Limitations
- AI analysis is preliminary and non-diagnostic
- Professional dermatologist review is required
- Results may vary based on image quality
- Not suitable for emergency medical situations

## 🤝 Contributing

Contributions are welcome! Please follow these steps:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For issues, questions, or feature requests:
- Open an issue on GitHub
- Contact: [your-email@example.com]

## 🙏 Acknowledgments

- OpenAI for GPT-4o Vision API
- Supabase for backend infrastructure
- Vercel for hosting platform
- Next.js team for the amazing framework

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

---

Built with ❤️ using Next.js, Supabase, and OpenAI
