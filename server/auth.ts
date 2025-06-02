import express, { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import session from 'express-session';
import connectPg from 'connect-pg-simple';
import { storage } from './storage.js';
import { sendVerificationEmail } from './emailService.js';
import { z } from 'zod';

// Extend session data type
declare module 'express-session' {
  interface SessionData {
    userId: string;
  }
}

// Session configuration
export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  
  // Use memory store for development to debug session issues
  return session({
    secret: process.env.SESSION_SECRET || 'survetic-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: sessionTtl,
    },
  });
}

// Authentication middleware
export const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (req.session?.userId) {
    return next();
  }
  return res.status(401).json({ message: "Unauthorized" });
};

// Admin middleware
export const isAdmin = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.session?.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const user = await storage.getUser(req.session.userId);
    if (!user || !user.isAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }
    next();
  } catch (error) {
    console.error('Admin check error:', error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Registration schema
const registerSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// Login schema
const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export function setupAuth(app: express.Express) {
  app.use(getSession());

  // Register endpoint
  app.post('/api/auth/register', async (req: Request, res: Response) => {
    try {
      const validatedData = registerSchema.parse(req.body);
      const { firstName, lastName, email, password } = validatedData;

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists with this email" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);
      
      // Generate verification token
      const verificationToken = crypto.randomBytes(32).toString('hex');
      
      // Create user
      const userId = uuidv4();
      console.log('🔄 Creating user with data:', { userId, email, firstName, lastName });
      
      const user = await storage.createUser({
        id: userId,
        email,
        firstName,
        lastName,
        password: hashedPassword,
        isVerified: false,
        verificationToken,
      });

      console.log('✅ User created successfully:', user.id);

      // Send verification email
      console.log('📧 Sending verification email to:', email);
      const emailSent = await sendVerificationEmail(email, firstName, verificationToken);
      console.log('📧 Email sent result:', emailSent);
      
      if (!emailSent) {
        // For development, still allow registration even if email fails
        console.log('⚠️ Email sending failed, but registration completed for development');
      }

      res.status(201).json({ 
        message: "Registration successful! Please check your email to verify your account.",
        userId: user.id 
      });

    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      console.error('Registration error:', error);
      res.status(500).json({ message: "Registration failed" });
    }
  });

  // Resend verification email endpoint
  app.post('/api/auth/resend-verification', async (req: Request, res: Response) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      // Find user by email
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (user.isVerified) {
        return res.status(400).json({ message: "User is already verified" });
      }

      // Generate new verification token
      const verificationToken = crypto.randomUUID();
      
      // Update user with new verification token
      await storage.updateUser(user.id, { verificationToken });

      // Send verification email
      const emailSent = await sendVerificationEmail(email, user.firstName, verificationToken);
      
      if (!emailSent) {
        return res.status(500).json({ message: "Failed to send verification email" });
      }

      res.json({ message: "Verification email sent successfully" });

    } catch (error) {
      console.error('Resend verification error:', error);
      res.status(500).json({ message: "Failed to resend verification email" });
    }
  });

  // Email verification endpoint
  app.get('/api/auth/verify-email', async (req: Request, res: Response) => {
    try {
      const { token } = req.query;
      
      if (!token || typeof token !== 'string') {
        return res.status(400).json({ message: "Invalid verification token" });
      }

      const user = await storage.getUserByVerificationToken(token);
      if (!user) {
        return res.status(400).json({ message: "Invalid or expired verification token" });
      }

      if (user.isVerified) {
        return res.status(400).json({ message: "Email already verified" });
      }

      // Verify the user
      await storage.verifyUser(user.id);

      res.json({ message: "Email verified successfully! You can now log in." });

    } catch (error) {
      console.error('Email verification error:', error);
      res.status(500).json({ message: "Email verification failed" });
    }
  });

  // Login endpoint
  app.post('/api/auth/login', async (req: Request, res: Response) => {
    try {
      const validatedData = loginSchema.parse(req.body);
      const { email, password } = validatedData;

      // Find user
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Check if email is verified
      if (!user.isVerified) {
        return res.status(401).json({ message: "Please verify your email before logging in" });
      }

      // Check password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Set session
      req.session.userId = user.id;

      const { password: _, verificationToken: __, ...userWithoutSensitiveData } = user;
      res.json({ 
        message: "Login successful",
        user: userWithoutSensitiveData 
      });

    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      console.error('Login error:', error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Logout endpoint
  app.post('/api/auth/logout', (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.clearCookie('connect.sid');
      res.json({ message: "Logout successful" });
    });
  });

  // GET logout for direct browser access
  app.get('/api/logout', (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        console.error('Session destroy error:', err);
        return res.status(500).send('<html><body><h1>Logout failed</h1><a href="/">Go Home</a></body></html>');
      }
      res.clearCookie('connect.sid');
      res.send('<html><body><h1>Logged out successfully!</h1><p>You have been logged out.</p><a href="/login">Login Again</a> | <a href="/">Go Home</a></body></html>');
    });
  });

  // Get current user endpoint
  app.get('/api/auth/user', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId!;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Debug: Log the full user object
      console.log('Full user from database:', user);
      
      const { password: _, verificationToken: __, ...userWithoutSensitiveData } = user;
      console.log('User data being sent to frontend:', userWithoutSensitiveData);
      res.json(userWithoutSensitiveData);

    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({ message: "Failed to get user" });
    }
  });
}