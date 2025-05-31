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
  pgTable,
  serial,
  varchar,
  text,
  boolean,
  timestamp,
  jsonb,
  integer,
  index
} from 'drizzle-orm/pg-core';

// Schema definitions (inline to avoid import issues on Vercel)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique().notNull(),
  firstName: varchar("first_name").notNull(),
  lastName: varchar("last_name").notNull(),
  password: varchar("password").notNull(),
  isVerified: boolean("is_verified").default(false),
  verificationToken: varchar("verification_token"),
  isAdmin: boolean("is_admin").default(false),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const surveys = pgTable("surveys", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  description: text("description"),
  isPublished: boolean("is_published").default(false),
  questions: jsonb("questions").notNull().default([]),
  theme: jsonb("theme").default({}),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const responses = pgTable("responses", {
  id: serial("id").primaryKey(),
  surveyId: integer("survey_id").notNull().references(() => surveys.id),
  answers: jsonb("answers").notNull(),
  isComplete: boolean("is_complete").default(false),
  submittedAt: timestamp("submitted_at").defaultNow(),
});

// Database setup
neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set");
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema: { users, surveys, responses, sessions } });

// Email setup
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

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
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const { url, method } = req;
    const pathname = new URL(url || '', 'http://localhost').pathname;
    
    // Debug logging for Vercel
    console.log('API Request:', { url, method, pathname });
    
    // Authentication endpoints
    if (pathname.includes('/api/auth/user') || pathname === '/api/auth/user') {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      try {
        const token = authHeader.split(' ')[1];
        const userId = Buffer.from(token, 'base64').toString();
        
        console.log('Auth check - Token:', token, 'UserID:', userId);
        
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

        console.log('Auth check - User found:', !!user);

        if (!user) {
          res.status(401).json({ message: "User not found" });
          return;
        }

        res.status(200).json(user);
      } catch (error) {
        res.status(401).json({ message: "Unauthorized" });
      }
      return;
    }
    
    if ((pathname.includes('/api/auth/login') || pathname === '/api/auth/login') && method === 'POST') {
      const { email, password } = req.body;
      
      if (!email || !password) {
        res.status(400).json({ message: "Email and password are required" });
        return;
      }
      
      try {
        const [user] = await db.select().from(users).where(eq(users.email, email));
        
        if (!user) {
          res.status(401).json({ message: "Invalid credentials" });
          return;
        }

        const isValidPassword = await bcrypt.compare(password, user.password);
        
        if (!isValidPassword) {
          res.status(401).json({ message: "Invalid credentials" });
          return;
        }

        if (!user.isVerified) {
          res.status(401).json({ message: "Please verify your email before logging in" });
          return;
        }

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
    
    if ((pathname.includes('/api/auth/register') || pathname === '/api/auth/register') && method === 'POST') {
      const { email, password, firstName, lastName } = req.body;
      
      if (!email || !password || !firstName || !lastName) {
        res.status(400).json({ message: "All fields are required" });
        return;
      }

      try {
        if (email.length > 255 || firstName.length > 255 || lastName.length > 255) {
          res.status(400).json({ message: "Input fields are too long" });
          return;
        }

        const [existingUser] = await db.select().from(users).where(eq(users.email, email.toLowerCase().trim()));
        if (existingUser) {
          res.status(400).json({ message: "User with this email already exists" });
          return;
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const verificationToken = uuidv4();
        const userId = uuidv4();

        const [newUser] = await db.insert(users).values({
          id: userId,
          email: email.toLowerCase().trim(),
          password: hashedPassword,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          isVerified: false,
          isAdmin: false,
          verificationToken
        }).returning();

        await sendVerificationEmail(email.toLowerCase().trim(), verificationToken);

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
        console.error('Registration error:', error);
        res.status(500).json({ 
          message: "Registration failed", 
          details: error.message
        });
      }
      return;
    }

    // Admin endpoints
    if (pathname.includes('/api/admin/users') && method === 'GET') {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      try {
        const token = authHeader.split(' ')[1];
        const userId = Buffer.from(token, 'base64').toString();
        
        const [currentUser] = await db.select().from(users).where(eq(users.id, userId));
        
        if (!currentUser || !currentUser.isAdmin) {
          res.status(403).json({ message: "Admin access required" });
          return;
        }

        const allUsers = await db.select({
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          isVerified: users.isVerified,
          isAdmin: users.isAdmin,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt
        }).from(users);
        
        res.status(200).json(allUsers);
      } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ message: "Failed to fetch users" });
      }
      return;
    }

    if (pathname.includes('/api/admin/users') && method === 'POST') {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      try {
        const token = authHeader.split(' ')[1];
        const adminUserId = Buffer.from(token, 'base64').toString();
        
        const [currentUser] = await db.select().from(users).where(eq(users.id, adminUserId));
        
        if (!currentUser || !currentUser.isAdmin) {
          res.status(403).json({ message: "Admin access required" });
          return;
        }

        const { email, firstName, lastName, isAdmin, password } = req.body;
        
        if (!email || !firstName || !lastName || !password) {
          res.status(400).json({ message: "All fields are required" });
          return;
        }
        const [existingUser] = await db.select().from(users).where(eq(users.email, email.toLowerCase().trim()));
        if (existingUser) {
          res.status(400).json({ message: "User with this email already exists" });
          return;
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUserId = uuidv4();

        const [newUser] = await db.insert(users).values({
          id: newUserId,
          email: email.toLowerCase().trim(),
          password: hashedPassword,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          isVerified: true,
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

    if (pathname.match(/\/api\/admin\/users\/[^\/]+$/) && method === 'DELETE') {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      try {
        const token = authHeader.split(' ')[1];
        const currentUserId = Buffer.from(token, 'base64').toString();
        
        const [currentUser] = await db.select().from(users).where(eq(users.id, currentUserId));
        
        if (!currentUser || !currentUser.isAdmin) {
          res.status(403).json({ message: "Admin access required" });
          return;
        }

        const userIdToDelete = pathname.split('/').pop();
        
        if (!userIdToDelete) {
          res.status(400).json({ message: "User ID is required" });
          return;
        }

        await db.delete(users).where(eq(users.id, userIdToDelete));
        res.status(200).json({ message: "User deleted successfully" });
      } catch (error) {
        console.error('User deletion error:', error);
        res.status(500).json({ message: "Failed to delete user" });
      }
      return;
    }
    
    if (pathname.match(/\/api\/admin\/users\/[^\/]+\/verification/) && method === 'PATCH') {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      try {
        const token = authHeader.split(' ')[1];
        const adminUserId = Buffer.from(token, 'base64').toString();
        
        const [currentUser] = await db.select().from(users).where(eq(users.id, adminUserId));
        
        if (!currentUser || !currentUser.isAdmin) {
          res.status(403).json({ message: "Admin access required" });
          return;
        }

        const targetUserId = pathname.split('/')[4];
        const { isVerified } = req.body;
        
        await db.update(users)
          .set({ isVerified })
          .where(eq(users.id, targetUserId));
          
        res.status(200).json({ 
          message: "User verification updated successfully",
          isVerified 
        });
      } catch (error) {
        console.error('User verification update error:', error);
        res.status(500).json({ message: "Failed to update user verification" });
      }
      return;
    }
    
    if (pathname.match(/\/api\/admin\/users\/[^\/]+\/password/) && method === 'PATCH') {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      try {
        const token = authHeader.split(' ')[1];
        const adminUserId = Buffer.from(token, 'base64').toString();
        
        const [currentUser] = await db.select().from(users).where(eq(users.id, adminUserId));
        
        if (!currentUser || !currentUser.isAdmin) {
          res.status(403).json({ message: "Admin access required" });
          return;
        }

        const targetUserId = pathname.split('/')[4];
        const { password } = req.body;
        
        if (!password) {
          res.status(400).json({ message: "Password is required" });
          return;
        }
        
        const hashedPassword = await bcrypt.hash(password, 10);
        await db.update(users)
          .set({ password: hashedPassword })
          .where(eq(users.id, targetUserId));
          
        res.status(200).json({ message: "Password updated successfully" });
      } catch (error) {
        console.error('Password update error:', error);
        res.status(500).json({ message: "Failed to update password" });
      }
      return;
    }

    if (pathname.includes('/api/auth/verify-email') && method === 'GET') {
      const baseUrl = `https://${req.headers.host || 'localhost'}`;
      const urlObj = new URL(url || '/api/auth/verify-email', baseUrl);
      const token = urlObj.searchParams.get('token');
      
      if (!token) {
        res.status(400).json({ message: "Verification token is required" });
        return;
      }

      try {
        const [user] = await db.select().from(users).where(eq(users.verificationToken, token));
        
        if (!user) {
          res.status(400).json({ message: "Invalid or expired verification token" });
          return;
        }

        await db.update(users)
          .set({ isVerified: true, verificationToken: null })
          .where(eq(users.id, user.id));

        res.writeHead(302, { Location: '/login?verified=true' });
        res.end();
      } catch (error) {
        console.error('Email verification error:', error);
        res.status(500).json({ message: "Verification failed" });
      }
      return;
    }

    // Survey endpoints
    if (pathname.includes('/api/surveys') && method === 'GET') {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      const token = authHeader.replace('Bearer ', '');
      const userId = token; // In our token-based auth, the token IS the userId

      try {
        const userSurveys = await db.select({
          id: surveys.id,
          title: surveys.title,
          description: surveys.description,
          isPublished: surveys.isPublished,
          createdAt: surveys.createdAt,
          userId: surveys.userId,
          questions: surveys.questions
        }).from(surveys).where(eq(surveys.userId, userId));
        
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

    if (pathname.includes('/api/surveys') && method === 'POST') {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      const token = authHeader.replace('Bearer ', '');
      const userId = token;

      const { title, description, questions } = req.body;
      
      if (!title) {
        res.status(400).json({ message: "Title is required" });
        return;
      }

      try {
        const [newSurvey] = await db.insert(surveys).values({
          userId: userId,
          title,
          description: description || '',
          questions: questions || [],
          isPublished: false
        }).returning();

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
    
    // Default response with debugging info
    res.status(404).json({ 
      message: "API route not found",
      debug: {
        url,
        pathname,
        method,
        headers: req.headers
      }
    });
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}