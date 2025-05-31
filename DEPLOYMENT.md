# Survetic - Vercel Deployment Guide

## 🚀 Quick Deployment Steps

### 1. Prerequisites
- Vercel account
- PostgreSQL database (Neon, Supabase, or similar)
- Resend account for email verification

### 2. Environment Variables for Vercel
Set these in your Vercel dashboard under Settings > Environment Variables:

```
DATABASE_URL=postgresql://username:password@hostname:port/database
SESSION_SECRET=your-super-secret-session-key-here
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxx
NODE_ENV=production
```

### 3. Database Setup
1. Create a PostgreSQL database
2. Run database migrations:
   ```bash
   npm run db:push
   ```

### 4. Deploy to Vercel
1. Connect your GitHub repository to Vercel
2. Import your project
3. Add environment variables
4. Deploy!

## 🔧 Configuration Details

### Email Verification
- Uses Resend service for professional email delivery
- Verification emails are automatically sent to new users
- Dynamic URL generation works with your Vercel deployment

### Database
- Uses Drizzle ORM with PostgreSQL
- Automatic session management
- User authentication and verification system

### Security
- Secure session management with PostgreSQL store
- Password hashing with bcrypt
- Email verification required for account activation

## 📧 Email Service Setup
Get your Resend API key from: https://resend.com/
Add it to your Vercel environment variables as `RESEND_API_KEY`

## 🎯 Features Ready for Production
✅ User registration with email verification
✅ Secure authentication system
✅ Survey creation and management
✅ Real-time analytics
✅ Admin panel
✅ Responsive design
✅ Professional email templates

Your Survetic application is now ready for production deployment!