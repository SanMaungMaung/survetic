# Survetic - Survey Builder and Analytics Platform

A modern, full-stack survey builder and analytics platform built with React, TypeScript, and Node.js. Create beautiful surveys, collect responses, and analyze data with powerful visualizations.

## 🚀 Features

### Survey Creation
- **Drag & Drop Builder** - Intuitive survey creation interface
- **Multiple Question Types** - Text input, multiple choice, rating scales, dropdowns
- **Real-time Preview** - See your survey as you build it
- **Template Library** - Pre-built templates for common survey types
- **Custom Themes** - Personalize your surveys with custom styling

### Sharing & Distribution
- **Multiple Sharing Options** - Social media, email, direct links
- **QR Code Generation** - Create QR codes for easy mobile access
- **Embed Codes** - Integrate surveys into websites
- **Anonymous Response Collection** - No login required for respondents

### Analytics & Reporting
- **Real-time Dashboard** - Live response tracking
- **Visual Charts** - Pie charts, bar charts, and detailed statistics
- **Response Export** - Download data as CSV
- **Completion Tracking** - Monitor survey performance

### Authentication
- **Secure Login** - Email/password authentication
- **Social Auth Ready** - Google and Facebook login support
- **User Management** - Profile management and security

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Passport.js with multiple strategies
- **Charts**: Recharts for data visualization
- **QR Codes**: QRCode.js for generation
- **Form Handling**: React Hook Form with Zod validation

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- PostgreSQL database
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/SanMaungMaung/survetic.git
   cd survetic
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory:
   ```env
   DATABASE_URL=your_postgresql_connection_string
   SESSION_SECRET=your_session_secret
   REPL_ID=your_replit_id
   REPLIT_DOMAINS=your_domain
   
   # Optional: Social Authentication
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   FACEBOOK_APP_ID=your_facebook_app_id
   FACEBOOK_APP_SECRET=your_facebook_app_secret
   ```

4. **Database Setup**
   ```bash
   npm run db:push
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```

   The app will be available at `http://localhost:5000`

## 📁 Project Structure

```
survetic/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom React hooks
│   │   └── lib/           # Utilities and API client
├── server/                # Backend Express application
│   ├── routes.ts          # API routes
│   ├── storage.ts         # Database operations
│   ├── db.ts             # Database connection
│   └── replitAuth.ts     # Authentication setup
├── shared/                # Shared types and schemas
│   └── schema.ts         # Database schema and types
└── vercel.json           # Vercel deployment config
```

## 🚀 Deployment

### Vercel Deployment

1. **Connect to Vercel**
   - Import your GitHub repository to Vercel
   - Configure environment variables in Vercel dashboard

2. **Environment Variables**
   Set these in your Vercel project settings:
   - `DATABASE_URL`
   - `SESSION_SECRET`
   - `REPL_ID`
   - `REPLIT_DOMAINS`
   - Social auth credentials (optional)

3. **Deploy**
   ```bash
   npm run vercel-build
   ```

### Manual Deployment

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Start production server**
   ```bash
   npm start
   ```

## 🔧 Configuration

### Database Schema
The application uses Drizzle ORM with PostgreSQL. Key tables:
- `users` - User accounts and profiles
- `surveys` - Survey definitions and metadata
- `responses` - Survey response data
- `sessions` - User session storage

### Authentication
Supports multiple authentication methods:
- Email/password login
- Google OAuth (with credentials)
- Facebook OAuth (with credentials)
- Replit OAuth (built-in)

## 📊 API Endpoints

### Surveys
- `GET /api/surveys` - List user surveys
- `POST /api/surveys` - Create new survey
- `GET /api/surveys/:id` - Get survey details
- `PUT /api/surveys/:id` - Update survey
- `DELETE /api/surveys/:id` - Delete survey

### Responses
- `GET /api/surveys/:id/responses` - Get survey responses
- `POST /api/surveys/:id/responses` - Submit response
- `GET /api/surveys/:id/stats` - Get survey statistics

### Authentication
- `GET /api/auth/user` - Get current user
- `POST /api/login` - Login endpoint
- `POST /api/logout` - Logout endpoint

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Zack**
- Designed and developed this survey platform
- Focused on user experience and modern web technologies

## 🙏 Acknowledgments

- Built with modern React and TypeScript
- UI components from shadcn/ui
- Icons from Lucide React
- Charts powered by Recharts
- Authentication via Passport.js

---

© 2025 Zack. All rights reserved.