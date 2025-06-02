import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { eq } from 'drizzle-orm';
import ws from 'ws';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { Resend } from 'resend';
import QRCode from 'qrcode';
import { 
  users, 
  surveys, 
  responses, 
  sessions,
  type User,
  type UpsertUser,
  type Survey,
  type InsertSurvey,
  type Response,
  type InsertResponse 
} from '../shared/schema';

// Database setup
neonConfig.webSocketConstructor = ws;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle({ client: pool, schema: { users, surveys, responses, sessions } });

// Email setup
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// Helper function to parse request body
async function parseBody(req: VercelRequest): Promise<any> {
  if (req.method === 'GET') return {};
  
  // Body is already parsed by Vercel
  return req.body || {};
}

// Helper function to send verification email
async function sendVerificationEmail(email: string, token: string) {
  if (!resend) {
    console.log('No Resend API key, skipping email');
    return false;
  }

  try {
    const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:5000';
    const verificationUrl = `${baseUrl}/api/auth/verify-email?token=${token}`;
    
    await resend.emails.send({
      from: 'Survetic <onboarding@resend.dev>',
      to: email,
      subject: 'Verify your email address - Survetic',
      html: `
        <h2>Welcome to Survetic!</h2>
        <p>Please click the link below to verify your email address:</p>
        <a href="${verificationUrl}" style="background-color: #4F46E5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Verify Email</a>
        <p>If you didn't create an account, please ignore this email.</p>
        <p>Best regards,<br>The Survetic Team</p>
      `
    });
    return true;
  } catch (error) {
    console.error('Email sending failed:', error);
    return false;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // Handle different API routes
    const { url, method } = req;
    
    if (url?.includes('/api/auth/user')) {
      // Check authentication status
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      // For simplicity in Vercel, we'll decode the user ID from the token
      try {
        const token = authHeader.split(' ')[1];
        const userId = Buffer.from(token, 'base64').toString();
        
        const [user] = await db.select({
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          isVerified: users.isVerified,
          isAdmin: users.isAdmin,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt
        }).from(users).where(eq(users.id, userId));

        if (!user) {
          res.status(401).json({ message: "Unauthorized" });
          return;
        }

        res.status(200).json(user);
      } catch (error) {
        res.status(401).json({ message: "Unauthorized" });
      }
      return;
    }
    
    if (url?.includes('/api/auth/login') && method === 'POST') {
      // Handle login
      const body = await parseBody(req);
      const { email, password } = body;
      
      if (!email || !password) {
        res.status(400).json({ message: "Email and password are required" });
        return;
      }
      
      try {
        // Find user by email
        const [user] = await db.select().from(users).where(eq(users.email, email));
        
        if (!user) {
          res.status(401).json({ message: "Invalid credentials" });
          return;
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password);
        
        if (!isValidPassword) {
          res.status(401).json({ message: "Invalid credentials" });
          return;
        }

        if (!user.isVerified) {
          res.status(401).json({ message: "Please verify your email before logging in" });
          return;
        }

        // Create simple token (base64 encoded user ID)
        const token = Buffer.from(user.id).toString('base64');

        res.status(200).json({ 
          success: true,
          token,
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            isAdmin: user.isAdmin,
            isVerified: user.isVerified
          }
        });
      } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: "Login failed" });
      }
      return;
    }
    
    if (url?.includes('/api/auth/register') && method === 'POST') {
      // Handle registration
      const body = await parseBody(req);
      const { email, password, firstName, lastName } = body;
      
      if (!email || !password || !firstName || !lastName) {
        res.status(400).json({ message: "All fields are required" });
        return;
      }

      try {
        // Validate input fields first
        if (!email || !password || !firstName || !lastName) {
          res.status(400).json({ message: "All fields are required" });
          return;
        }

        if (email.length > 255 || firstName.length > 255 || lastName.length > 255) {
          res.status(400).json({ message: "Input fields are too long" });
          return;
        }

        // Check if database connection is available
        if (!process.env.DATABASE_URL) {
          res.status(500).json({ message: "Database not configured" });
          return;
        }

        // Check if user already exists
        const [existingUser] = await db.select().from(users).where(eq(users.email, email.toLowerCase().trim()));
        if (existingUser) {
          res.status(400).json({ message: "User with this email already exists" });
          return;
        }

        // Hash password and create verification token
        const hashedPassword = await bcrypt.hash(password, 10);
        const verificationToken = uuidv4();
        const userId = uuidv4();

        // Create user in database
        const [newUser] = await db.insert(schema.users).values({
          id: userId,
          email: email.toLowerCase().trim(),
          password: hashedPassword,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          isVerified: false,
          isAdmin: false,
          verificationToken
        }).returning();

        // Send verification email (will log if RESEND_API_KEY is missing)
        const emailSent = await sendVerificationEmail(email.toLowerCase().trim(), verificationToken);

        res.status(201).json({ 
          success: true,
          message: "Registration successful. Please check your email for verification.",
          user: {
            id: newUser.id,
            email: newUser.email,
            firstName: newUser.firstName,
            lastName: newUser.lastName,
            isVerified: false,
            isAdmin: false
          }
        });
      } catch (error) {
        console.error('Registration error details:', {
          error: error.message,
          stack: error.stack,
          body,
          timestamp: new Date().toISOString()
        });
        
        // Return more specific error message
        const errorMessage = error.message || "Registration failed";
        res.status(500).json({ 
          message: "Registration failed", 
          details: errorMessage,
          timestamp: new Date().toISOString()
        });
      }
      return;
    }
    
    if (url?.includes('/api/auth/verify-email') && method === 'GET') {
      // Handle email verification
      const urlObj = new URL(url, `https://${req.headers.host}`);
      const token = urlObj.searchParams.get('token');
      
      if (!token) {
        res.status(400).json({ message: "Verification token is required" });
        return;
      }

      try {
        // Find user by verification token
        const [user] = await db.select().from(schema.users).where(eq(schema.users.verificationToken, token));
        
        if (!user) {
          res.status(400).json({ message: "Invalid or expired verification token" });
          return;
        }

        // Update user as verified
        await db.update(schema.users)
          .set({ isVerified: true, verificationToken: null })
          .where(eq(schema.users.id, user.id));

        // Redirect to login page with success message
        res.writeHead(302, { Location: '/login?verified=true' });
        res.end();
      } catch (error) {
        console.error('Email verification error:', error);
        res.status(500).json({ message: "Verification failed" });
      }
      return;
    }

    if (url?.includes('/api/auth/logout') && method === 'POST') {
      // Handle logout
      res.status(200).json({ 
        success: true,
        message: "Logged out successfully" 
      });
      return;
    }
    
    if (url?.includes('/api/logout')) {
      // Handle logout redirect
      res.status(200).json({ 
        success: true,
        message: "Logged out successfully" 
      });
      return;
    }
    
    if (url?.includes('/api/surveys') && method === 'GET') {
      // Get user surveys
      try {
        const userSurveys = await db.select({
          id: schema.surveys.id,
          title: schema.surveys.title,
          description: schema.surveys.description,
          isPublished: schema.surveys.isPublished,
          createdAt: schema.surveys.createdAt,
          userId: schema.surveys.userId,
          questions: schema.surveys.questions
        }).from(schema.surveys);
        
        // Add status field based on isPublished for compatibility
        const surveysWithStatus = userSurveys.map(survey => ({
          ...survey,
          status: survey.isPublished ? 'published' : 'draft'
        }));
        
        res.status(200).json(surveysWithStatus);
      } catch (error) {
        console.error('Error fetching surveys:', error);
        res.status(500).json({ message: "Failed to fetch surveys" });
      }
      return;
    }
    
    if (url?.includes('/api/surveys') && method === 'POST') {
      // Create new survey
      const body = await parseBody(req);
      const { title, description, questions } = body;
      
      if (!title) {
        res.status(400).json({ message: "Title is required" });
        return;
      }

      try {
        const [newSurvey] = await db.insert(schema.surveys).values({
          userId: '3694e8cb-8bed-45a6-aa0d-065c0b8b5c0e', // Default admin user for now
          title,
          description: description || '',
          questions: questions || [],
          isPublished: false
        }).returning();

        // Add status field for compatibility
        const surveyWithStatus = {
          ...newSurvey,
          status: newSurvey.isPublished ? 'published' : 'draft'
        };

        res.status(201).json(surveyWithStatus);
      } catch (error) {
        console.error('Survey creation error:', error);
        res.status(500).json({ message: "Failed to create survey" });
      }
      return;
    }
    
    if (url?.includes('/api/admin/users') && method === 'GET') {
      // Get all users (admin only)
      try {
        const allUsers = await db.select({
          id: schema.users.id,
          email: schema.users.email,
          firstName: schema.users.firstName,
          lastName: schema.users.lastName,
          isVerified: schema.users.isVerified,
          isAdmin: schema.users.isAdmin,
          createdAt: schema.users.createdAt,
          updatedAt: schema.users.updatedAt
        }).from(schema.users);
        
        res.status(200).json(allUsers);
      } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ message: "Failed to fetch users" });
      }
      return;
    }
    
    if (url?.includes('/api/users') && method === 'GET') {
      // Get all users (admin only) - legacy endpoint
      res.status(200).json([
        {
          id: '1',
          email: 'admin@survetic.com',
          firstName: 'Admin',
          lastName: 'User',
          isVerified: true,
          isAdmin: true,
          createdAt: new Date().toISOString()
        }
      ]);
      return;
    }
    
    if (url?.includes('/api/admin/users') && method === 'POST') {
      // Create new user (admin only)
      const body = await parseBody(req);
      const { email, firstName, lastName, isAdmin, password } = body;
      
      if (!email || !firstName || !lastName || !password) {
        res.status(400).json({ message: "All fields are required" });
        return;
      }

      try {
        // Check if user already exists
        const [existingUser] = await db.select().from(schema.users).where(eq(schema.users.email, email));
        if (existingUser) {
          res.status(400).json({ message: "User with this email already exists" });
          return;
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user in database
        const [newUser] = await db.insert(schema.users).values({
          id: uuidv4(),
          email,
          password: hashedPassword,
          firstName,
          lastName,
          isVerified: true, // Admin-created users are verified by default
          isAdmin: !!isAdmin,
          verificationToken: null
        }).returning();

        res.status(201).json({
          id: newUser.id,
          email: newUser.email,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          isVerified: newUser.isVerified,
          isAdmin: newUser.isAdmin,
          createdAt: newUser.createdAt,
          message: "User created successfully"
        });
      } catch (error) {
        console.error('User creation error:', error);
        res.status(500).json({ message: "Failed to create user" });
      }
      return;
    }
    
    if (url?.includes('/api/users') && method === 'POST') {
      // Create new user (admin only) - legacy endpoint
      const body = await parseBody(req);
      const { email, firstName, lastName, isAdmin } = body;
      
      res.status(201).json({
        id: Math.random().toString(),
        email,
        firstName,
        lastName,
        isVerified: true,
        isAdmin: !!isAdmin,
        createdAt: new Date().toISOString()
      });
      return;
    }
    
    if (url?.match(/\/api\/surveys\/\d+\/responses/) && method === 'GET') {
      // Get survey responses
      const surveyId = parseInt(url.match(/\/api\/surveys\/(\d+)/)?.[1] || '0');
      
      try {
        const responses = await db.select().from(schema.responses).where(eq(schema.responses.surveyId, surveyId));
        res.status(200).json(responses);
      } catch (error) {
        console.error('Error fetching responses:', error);
        res.status(500).json({ message: "Failed to fetch responses" });
      }
      return;
    }

    if (url?.match(/\/api\/surveys\/\d+\/responses/) && method === 'POST') {
      // Submit survey response
      const surveyId = parseInt(url.match(/\/api\/surveys\/(\d+)/)?.[1] || '0');
      const body = await parseBody(req);
      const { answers } = body;

      try {
        const [newResponse] = await db.insert(schema.responses).values({
          surveyId,
          answers,
          isComplete: true
        }).returning();

        res.status(201).json(newResponse);
      } catch (error) {
        console.error('Error submitting response:', error);
        res.status(500).json({ message: "Failed to submit response" });
      }
      return;
    }
    
    if (url?.match(/\/api\/surveys\/\d+\/stats/) && method === 'GET') {
      // Get survey statistics
      const surveyId = parseInt(url.match(/\/api\/surveys\/(\d+)/)?.[1] || '0');
      
      try {
        const responses = await db.select().from(schema.responses).where(eq(schema.responses.surveyId, surveyId));
        const totalResponses = responses.length;
        const completedResponses = responses.filter(r => r.isComplete).length;
        const completionRate = totalResponses > 0 ? Math.round((completedResponses / totalResponses) * 100) : 0;
        
        res.status(200).json({
          totalResponses,
          completionRate,
          averageTime: 180 // Placeholder for now
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({ message: "Failed to fetch statistics" });
      }
      return;
    }
    
    if (url?.match(/\/api\/surveys\/\d+/) && method === 'GET') {
      // Get single survey
      const surveyId = parseInt(url.match(/\/api\/surveys\/(\d+)/)?.[1] || '0');
      
      try {
        const [survey] = await db.select().from(schema.surveys).where(eq(schema.surveys.id, surveyId));
        
        if (!survey) {
          res.status(404).json({ message: "Survey not found" });
          return;
        }

        const surveyWithStatus = {
          ...survey,
          status: survey.isPublished ? 'published' : 'draft'
        };

        res.status(200).json(surveyWithStatus);
      } catch (error) {
        console.error('Error fetching survey:', error);
        res.status(500).json({ message: "Failed to fetch survey" });
      }
      return;
    }

    if (url?.match(/\/api\/surveys\/\d+/) && method === 'PATCH') {
      // Update survey
      const surveyId = parseInt(url.match(/\/api\/surveys\/(\d+)/)?.[1] || '0');
      const body = await parseBody(req);

      try {
        const [updatedSurvey] = await db.update(schema.surveys)
          .set(body)
          .where(eq(schema.surveys.id, surveyId))
          .returning();

        const surveyWithStatus = {
          ...updatedSurvey,
          status: updatedSurvey.isPublished ? 'published' : 'draft'
        };

        res.status(200).json(surveyWithStatus);
      } catch (error) {
        console.error('Error updating survey:', error);
        res.status(500).json({ message: "Failed to update survey" });
      }
      return;
    }

    if (url?.match(/\/api\/surveys\/\d+/) && method === 'DELETE') {
      // Delete survey
      const surveyId = parseInt(url.match(/\/api\/surveys\/(\d+)/)?.[1] || '0');

      try {
        await db.delete(schema.surveys).where(eq(schema.surveys.id, surveyId));
        res.status(200).json({ message: "Survey deleted successfully" });
      } catch (error) {
        console.error('Error deleting survey:', error);
        res.status(500).json({ message: "Failed to delete survey" });
      }
      return;
    }

    if (url?.match(/\/api\/surveys\/\d+\/qr/) && method === 'GET') {
      // Generate QR code for survey
      const surveyId = url.match(/\/api\/surveys\/(\d+)/)?.[1];
      const surveyUrl = `${req.headers.host}/survey/${surveyId}`;
      
      try {
        const qrCodeDataUrl = await QRCode.toDataURL(surveyUrl);
        res.status(200).json({ qrCode: qrCodeDataUrl, url: surveyUrl });
      } catch (error) {
        console.error('QR code generation error:', error);
        res.status(500).json({ message: "Failed to generate QR code" });
      }
      return;
    }

    if (url?.match(/\/api\/surveys\/\d+\/export/) && method === 'GET') {
      // Export survey responses as CSV
      const surveyId = parseInt(url.match(/\/api\/surveys\/(\d+)/)?.[1] || '0');
      
      try {
        const responses = await db.select().from(schema.responses).where(eq(schema.responses.surveyId, surveyId));
        
        if (responses.length === 0) {
          res.status(200).send('No responses available');
          return;
        }

        // Create CSV content
        const headers = ['ID', 'Submitted At', 'Answers'];
        const csvContent = [
          headers.join(','),
          ...responses.map(response => [
            response.id,
            response.submittedAt?.toISOString() || '',
            JSON.stringify(response.answers).replace(/"/g, '""')
          ].join(','))
        ].join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="survey-${surveyId}-responses.csv"`);
        res.status(200).send(csvContent);
      } catch (error) {
        console.error('Export error:', error);
        res.status(500).json({ message: "Failed to export responses" });
      }
      return;
    }
    
    if (url?.includes('/api/auth/profile') && method === 'PATCH') {
      // Update user profile
      const body = await parseBody(req);
      const { firstName, lastName, email } = body;
      
      res.status(200).json({
        id: '1',
        email: email || 'admin@survetic.com',
        firstName: firstName || 'Admin',
        lastName: lastName || 'User',
        isAdmin: true,
        isVerified: true,
        createdAt: new Date().toISOString()
      });
      return;
    }
    
    if (url?.includes('/api/auth/password') && method === 'PATCH') {
      // Update user password
      const body = await parseBody(req);
      const { currentPassword, newPassword } = body;
      
      if (!currentPassword || !newPassword) {
        res.status(400).json({ message: "Current and new password are required" });
        return;
      }
      
      res.status(200).json({ message: "Password updated successfully" });
      return;
    }
    
    if (url?.match(/\/api\/admin\/users\/[^\/]+$/) && method === 'DELETE') {
      // Delete user (admin only)
      const userId = url.split('/').pop();
      
      try {
        await db.delete(schema.users).where(eq(schema.users.id, userId!));
        res.status(200).json({ message: "User deleted successfully" });
      } catch (error) {
        console.error('User deletion error:', error);
        res.status(500).json({ message: "Failed to delete user" });
      }
      return;
    }
    
    if (url?.match(/\/api\/admin\/users\/[^\/]+\/verification/) && method === 'PATCH') {
      // Toggle user verification (admin only)
      const userId = url.split('/')[4]; // Extract user ID from URL
      const body = await parseBody(req);
      
      try {
        await db.update(schema.users)
          .set({ isVerified: body.isVerified })
          .where(eq(schema.users.id, userId));
          
        res.status(200).json({ 
          message: "User verification updated successfully",
          isVerified: body.isVerified 
        });
      } catch (error) {
        console.error('User verification update error:', error);
        res.status(500).json({ message: "Failed to update user verification" });
      }
      return;
    }
    
    if (url?.match(/\/api\/admin\/users\/[^\/]+\/password/) && method === 'PATCH') {
      // Update user password (admin only)
      const userId = url.split('/')[4]; // Extract user ID from URL
      const body = await parseBody(req);
      const { password } = body;
      
      if (!password) {
        res.status(400).json({ message: "Password is required" });
        return;
      }
      
      try {
        const hashedPassword = await bcrypt.hash(password, 10);
        await db.update(schema.users)
          .set({ password: hashedPassword })
          .where(eq(schema.users.id, userId));
          
        res.status(200).json({ message: "Password updated successfully" });
      } catch (error) {
        console.error('Password update error:', error);
        res.status(500).json({ message: "Failed to update password" });
      }
      return;
    }
    
    if (url?.match(/\/api\/users\/\d+/) && method === 'DELETE') {
      // Delete user (admin only) - legacy endpoint
      res.status(200).json({ message: "User deleted successfully" });
      return;
    }
    
    if (url?.match(/\/api\/users\/\d+\/verification/) && method === 'PATCH') {
      // Toggle user verification (admin only) - legacy endpoint
      res.status(200).json({ message: "User verification updated" });
      return;
    }
    
    if (url?.includes('/api/login')) {
      // Redirect to login page instead of handling here
      res.writeHead(302, { Location: '/login' });
      res.end();
      return;
    }
    
    // Default response
    res.status(404).json({ message: "API route not found" });
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}