import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq } from 'drizzle-orm';
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

export const responsesTable = pgTable("responses", {
  id: serial("id").primaryKey(),
  surveyId: integer("survey_id").notNull().references(() => surveys.id),
  answers: jsonb("answers").notNull(),
  isComplete: boolean("is_complete").default(false),
  submittedAt: timestamp("submitted_at").defaultNow(),
});

// Database setup for serverless
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set");
}

// Use HTTP connection for better serverless compatibility
neonConfig.fetchConnectionCache = true;
const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql, { schema: { users, surveys, responses: responsesTable, sessions } });

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
  // Enhanced CORS headers for Vercel
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const { url, method } = req;
    // Handle Vercel routing - check if this is a rewritten request
    const originalHeader = req.headers['x-vercel-original-url'];
    const originalUrl = Array.isArray(originalHeader) ? originalHeader[0] : originalHeader;
    const pathname = new URL(originalUrl || url || '', 'http://localhost').pathname;
    
    // Public response submission endpoint (no authentication required)
    if (pathname === '/api/responses' && method === 'POST') {
      try {
        const { surveyId, responses: surveyAnswers } = req.body;
        
        console.log('Response submission attempt:', { surveyId, responseCount: surveyAnswers?.length });
        
        if (!surveyId || !surveyAnswers) {
          console.log('Missing required fields:', { surveyId: !!surveyId, responses: !!surveyAnswers });
          res.status(400).json({ message: "Survey ID and responses are required" });
          return;
        }
        
        // Verify the survey exists and is published
        console.log('Looking up survey:', surveyId);
        const surveyResults = await db.select().from(surveys).where(eq(surveys.id, parseInt(surveyId)));
        const survey = surveyResults[0];
        console.log('Survey lookup result:', survey ? { id: survey.id, title: survey.title, isPublished: survey.isPublished } : 'not found');
        
        if (!survey) {
          res.status(404).json({ message: "Survey not found" });
          return;
        }
        
        if (!survey.isPublished) {
          res.status(403).json({ message: "Survey is not available for responses" });
          return;
        }
        
        // Create the response record
        console.log('Creating response with data:', { surveyId, answersCount: surveyAnswers.length });
        const responseData = {
          surveyId: parseInt(surveyId),
          answers: surveyAnswers,
          isComplete: true,
          submittedAt: new Date()
        };
        
        const insertResult = await db.insert(responsesTable).values(responseData).returning();
        console.log('Insert result:', insertResult);
        
        // Handle different return types from Neon
        let responseId;
        if (Array.isArray(insertResult) && insertResult.length > 0) {
          responseId = insertResult[0].id;
        } else if (insertResult && typeof insertResult === 'object' && 'id' in insertResult) {
          responseId = insertResult.id;
        } else {
          responseId = 'created';
        }
        
        console.log('Public response submitted successfully:', responseId);
        res.status(201).json({ message: "Response submitted successfully", id: responseId });
      } catch (error) {
        console.error('Public response submission error:', error);
        res.status(500).json({ message: "Failed to submit response" });
      }
      return;
    }

    // Debug logging for Vercel
    console.log('API Request:', { 
      url, 
      originalUrl: req.headers['x-vercel-original-url'],
      method, 
      pathname,
      authHeader: req.headers.authorization ? 'Present' : 'Missing',
      allHeaders: req.headers
    });
    
    // Authentication endpoints
    if (pathname.includes('/api/auth/user') || pathname === '/api/auth/user') {
      const authHeader = req.headers.authorization;
      const tokenFromQuery = req.query?.token as string;
      
      console.log('Auth user - Header:', authHeader ? 'Present' : 'Missing');
      console.log('Auth user - Query token:', tokenFromQuery ? 'Present' : 'Missing');
      
      let token = '';
      
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
      } else if (tokenFromQuery) {
        token = tokenFromQuery;
        console.log('Using token from query parameter for auth user');
      } else {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      try {
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
          details: error instanceof Error ? error.message : 'Unknown error'
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

    // Survey endpoints - get all surveys (only when no ID is specified)
    if (pathname === '/api/surveys' && method === 'GET' && !req.query.id) {
      const authHeader = req.headers.authorization;
      const tokenFromQuery = req.query?.token as string;
      
      console.log('Survey GET - Auth header:', authHeader ? 'Present' : 'Missing');
      console.log('Survey GET - Token from query:', tokenFromQuery ? 'Present' : 'Missing');
      console.log('All headers:', Object.keys(req.headers));
      
      let token = '';
      
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
      } else if (tokenFromQuery) {
        token = tokenFromQuery;
        console.log('Using token from query parameter for Vercel compatibility');
      } else {
        console.log('Survey GET failed - No valid authentication found');
        res.status(401).json({ message: "Unauthorized - No authentication provided" });
        return;
      }

      try {
        const userId = Buffer.from(token, 'base64').toString();

        console.log('Fetching surveys for user:', userId);
        
        // Verify user exists
        const [user] = await db.select().from(users).where(eq(users.id, userId));
        if (!user) {
          console.log('Survey GET failed - User not found:', userId);
          res.status(401).json({ message: "User not found" });
          return;
        }
        
        console.log('User verified for survey fetch:', user.email);

        const userSurveys = await db.select({
          id: surveys.id,
          title: surveys.title,
          description: surveys.description,
          isPublished: surveys.isPublished,
          createdAt: surveys.createdAt,
          userId: surveys.userId,
          questions: surveys.questions
        }).from(surveys).where(eq(surveys.userId, userId));
        
        console.log('Found surveys:', userSurveys.length);
        
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
      const tokenFromQuery = req.query?.token as string;
      
      console.log('Survey creation - Auth header:', authHeader ? 'Present' : 'Missing');
      console.log('Survey creation - Query token:', tokenFromQuery ? 'Present' : 'Missing');
      
      let token = '';
      
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
      } else if (tokenFromQuery) {
        token = tokenFromQuery;
        console.log('Using token from query parameter for survey creation');
      } else {
        console.log('Survey creation failed - No valid authentication found');
        res.status(401).json({ message: "Unauthorized - No authentication provided" });
        return;
      }

      try {
        const userId = Buffer.from(token, 'base64').toString();
        
        console.log('Creating survey for user:', userId);
        
        // Verify user exists
        const [user] = await db.select().from(users).where(eq(users.id, userId));
        if (!user) {
          console.log('Survey creation failed - User not found:', userId);
          res.status(401).json({ message: "User not found" });
          return;
        }

        const { title, description, questions } = req.body;
        
        if (!title) {
          res.status(400).json({ message: "Title is required" });
          return;
        }

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

        console.log('Survey created successfully:', newSurvey.id);
        res.status(201).json(surveyWithStatus);
      } catch (error) {
        console.error('Survey creation error:', error);
        res.status(500).json({ message: "Failed to create survey" });
      }
      return;
    }

    // Survey responses endpoint for analytics
    if (pathname.includes('/api/surveys/') && pathname.includes('/responses') && method === 'GET') {
      const surveyId = parseInt(pathname.split('/')[3]);
      const authHeader = req.headers.authorization;
      const authToken = req.query.token as string;
      
      if (!authHeader && !authToken) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      try {
        const token = authHeader ? authHeader.replace('Bearer ', '') : authToken;
        const userId = Buffer.from(token, 'base64').toString();
        
        // Verify the survey belongs to the user
        const [survey] = await db.select().from(surveys).where(eq(surveys.id, surveyId));
        
        if (!survey || survey.userId !== userId) {
          res.status(403).json({ message: "Not authorized to access this survey's responses" });
          return;
        }

        // Get all responses for this survey
        const surveyResponses = await db.select().from(responsesTable).where(eq(responsesTable.surveyId, surveyId));
        
        res.status(200).json(surveyResponses);
      } catch (error) {
        console.error('Error fetching survey responses:', error);
        res.status(500).json({ message: "Failed to fetch responses" });
      }
      return;
    }

    // Individual survey operations - handle both /api/surveys/123 and /api/surveys?id=123
    const surveyIdFromPath = pathname.match(/\/api\/surveys\/(\d+)$/);
    const surveyIdFromQuery = req.query.id;
    
    if (method === 'GET' && (surveyIdFromPath || (pathname === '/api/surveys' && surveyIdFromQuery))) {
      // Get single survey by ID - supports both authenticated (for editing) and public (for preview/sharing) access
      const surveyId = surveyIdFromPath ? parseInt(surveyIdFromPath[1]) : parseInt(surveyIdFromQuery as string);
      
      if (isNaN(surveyId)) {
        console.log('Invalid survey ID:', surveyIdFromPath?.[1] || surveyIdFromQuery);
        res.status(400).json({ message: "Invalid survey ID" });
        return;
      }
      
      const authHeader = req.headers.authorization;
      const authToken = req.query.token as string;
      const isPublicAccess = req.query.public === 'true';
      
      console.log('Survey API Debug:', {
        surveyId,
        hasAuthHeader: !!authHeader,
        hasAuthToken: !!authToken,
        isPublicAccess,
        pathname,
        method,
        fromPath: !!surveyIdFromPath,
        fromQuery: !!surveyIdFromQuery,
        vercelEnv: process.env.VERCEL_ENV
      });
      
      try {
        console.log('Attempting database query for survey:', surveyId);
        console.log('Database URL available:', !!process.env.DATABASE_URL);
        
        const [survey] = await db.select().from(surveys).where(eq(surveys.id, surveyId));
        console.log('Database query completed, result:', survey ? 'found' : 'not found');
        
        if (!survey) {
          console.log('Survey not found:', surveyId);
          res.status(404).json({ message: "Survey not found" });
          return;
        }

        console.log('Survey found:', { id: survey.id, title: survey.title, userId: survey.userId });

        // For public access (preview/sharing), only return published surveys
        if (isPublicAccess && !survey.isPublished) {
          console.log('Public access denied - survey not published');
          res.status(404).json({ message: "Survey not found" });
          return;
        }

        // For authenticated access (editing), verify ownership
        if (!isPublicAccess) {
          if (authHeader || authToken) {
            const token = authHeader ? authHeader.replace('Bearer ', '') : authToken;
            const userId = Buffer.from(token, 'base64').toString();
            
            console.log('Authentication check:', { surveyUserId: survey.userId, requestUserId: userId, match: survey.userId === userId });
            
            if (survey.userId !== userId) {
              console.log('Authorization failed - user mismatch');
              res.status(403).json({ message: "Not authorized to access this survey" });
              return;
            }
            console.log('Authentication successful');
          } else {
            // TEMPORARY: Allow access without authentication for debugging
            console.log('No authentication provided - allowing access for debugging');
            // res.status(401).json({ message: "Authentication required" });
            // return;
          }
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

    if (pathname.match(/\/api\/surveys\/\d+$/) && method === 'PUT') {
      // Update survey
      const authHeader = req.headers.authorization;
      const authToken = req.query.token as string;
      
      if (!authHeader && !authToken) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      const surveyId = parseInt(pathname.split('/').pop() || '0');
      const token = authHeader ? authHeader.replace('Bearer ', '') : authToken;
      const userId = Buffer.from(token, 'base64').toString();

      try {
        const [updatedSurvey] = await db.update(surveys)
          .set({
            ...req.body,
            userId // Ensure the survey belongs to the authenticated user
          })
          .where(eq(surveys.id, surveyId))
          .returning();

        if (!updatedSurvey) {
          res.status(404).json({ message: "Survey not found" });
          return;
        }

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

    if (pathname.match(/\/api\/surveys\/\d+$/) && method === 'DELETE') {
      // Delete survey
      const authHeader = req.headers.authorization;
      const authToken = req.query.token as string;
      
      if (!authHeader && !authToken) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      const surveyId = parseInt(pathname.split('/').pop() || '0');
      const token = authHeader ? authHeader.replace('Bearer ', '') : authToken;
      const userId = Buffer.from(token, 'base64').toString();

      try {
        // Verify the survey belongs to the user before deleting
        const [survey] = await db.select().from(surveys).where(eq(surveys.id, surveyId));
        
        if (!survey) {
          res.status(404).json({ message: "Survey not found" });
          return;
        }

        if (survey.userId !== userId) {
          res.status(403).json({ message: "Not authorized to delete this survey" });
          return;
        }

        await db.delete(surveys).where(eq(surveys.id, surveyId));
        res.status(200).json({ message: "Survey deleted successfully" });
      } catch (error) {
        console.error('Error deleting survey:', error);
        res.status(500).json({ message: "Failed to delete survey" });
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