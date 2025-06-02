import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage.js";
import { setupAuth, isAuthenticated, isAdmin } from "./auth.js";
import { insertSurveySchema, insertResponseSchema } from "../shared/schema.js";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware - simplified email authentication
  setupAuth(app);
  
  // Ensure API routes are handled first and have proper JSON headers
  app.use('/api/*', (req, res, next) => {
    res.setHeader('Content-Type', 'application/json');
    next();
  });

  // Email verification page route
  app.get('/verify-email', async (req, res) => {
    const { token } = req.query;
    if (!token) {
      return res.redirect('/?error=invalid-token');
    }
    
    try {
      const user = await storage.getUserByVerificationToken(token as string);
      if (!user) {
        return res.redirect('/?error=invalid-token');
      }
      
      if (user.isVerified) {
        return res.redirect('/login?message=already-verified');
      }
      
      await storage.verifyUser(user.id);
      return res.redirect('/login?message=email-verified');
    } catch (error) {
      console.error('Email verification error:', error);
      return res.redirect('/?error=verification-failed');
    }
  });

  // Test endpoint to check session
  app.get('/api/test-session', (req: any, res) => {
    console.log('Session test - sessionID:', req.sessionID);
    console.log('Session data:', req.session);
    console.log('User ID from session:', req.session?.userId);
    res.json({ 
      sessionID: req.sessionID,
      hasSession: !!req.session,
      userId: req.session?.userId,
      sessionData: req.session
    });
  });

  // Survey routes
  app.get('/api/surveys', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      console.log('Fetching surveys for user:', userId);
      const surveys = await storage.getUserSurveys(userId);
      console.log('Found surveys:', surveys.length);
      res.json(surveys);
    } catch (error) {
      console.error("Error fetching surveys:", error);
      res.status(500).json({ message: "Failed to fetch surveys" });
    }
  });

  app.get('/api/surveys/:id', async (req, res) => {
    try {
      const surveyId = parseInt(req.params.id);
      const survey = await storage.getSurvey(surveyId);
      if (!survey) {
        return res.status(404).json({ message: "Survey not found" });
      }
      res.json(survey);
    } catch (error) {
      console.error("Error fetching survey:", error);
      res.status(500).json({ message: "Failed to fetch survey" });
    }
  });

  app.post('/api/surveys', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const validatedData = insertSurveySchema.parse({
        ...req.body,
        userId,
      });
      const survey = await storage.createSurvey(validatedData);
      res.json(survey);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid survey data", errors: error.errors });
      }
      console.error("Error creating survey:", error);
      res.status(500).json({ message: "Failed to create survey" });
    }
  });

  app.put('/api/surveys/:id', isAuthenticated, async (req: any, res) => {
    try {
      const surveyId = parseInt(req.params.id);
      const userId = req.session.userId;
      
      // Verify ownership
      const existingSurvey = await storage.getSurvey(surveyId);
      if (!existingSurvey || existingSurvey.userId !== userId) {
        return res.status(404).json({ message: "Survey not found" });
      }

      const validatedData = insertSurveySchema.partial().parse(req.body);
      const survey = await storage.updateSurvey(surveyId, validatedData);
      res.json(survey);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid survey data", errors: error.errors });
      }
      console.error("Error updating survey:", error);
      res.status(500).json({ message: "Failed to update survey" });
    }
  });

  app.delete('/api/surveys/:id', isAuthenticated, async (req: any, res) => {
    try {
      const surveyId = parseInt(req.params.id);
      const userId = req.session.userId;
      
      // Verify ownership
      const existingSurvey = await storage.getSurvey(surveyId);
      if (!existingSurvey || existingSurvey.userId !== userId) {
        return res.status(404).json({ message: "Survey not found" });
      }

      await storage.deleteSurvey(surveyId);
      res.json({ message: "Survey deleted successfully" });
    } catch (error) {
      console.error("Error deleting survey:", error);
      res.status(500).json({ message: "Failed to delete survey" });
    }
  });

  // Response routes
  app.get('/api/surveys/:id/responses', isAuthenticated, async (req: any, res) => {
    try {
      const surveyId = parseInt(req.params.id);
      const userId = req.session.userId;
      
      // Verify ownership
      const survey = await storage.getSurvey(surveyId);
      if (!survey || survey.userId !== userId) {
        return res.status(404).json({ message: "Survey not found" });
      }

      const responses = await storage.getSurveyResponses(surveyId);
      res.json(responses);
    } catch (error) {
      console.error("Error fetching responses:", error);
      res.status(500).json({ message: "Failed to fetch responses" });
    }
  });

  app.post('/api/surveys/:id/responses', async (req, res) => {
    try {
      const surveyId = parseInt(req.params.id);
      
      // Verify survey exists and is published
      const survey = await storage.getSurvey(surveyId);
      if (!survey || !survey.isPublished) {
        return res.status(404).json({ message: "Survey not found or not published" });
      }

      const validatedData = insertResponseSchema.parse({
        ...req.body,
        surveyId,
      });
      const response = await storage.createResponse(validatedData);
      res.json(response);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid response data", errors: error.errors });
      }
      console.error("Error creating response:", error);
      res.status(500).json({ message: "Failed to create response" });
    }
  });

  app.get('/api/surveys/:id/stats', isAuthenticated, async (req: any, res) => {
    try {
      const surveyId = parseInt(req.params.id);
      const userId = req.session.userId;
      
      // Verify ownership
      const survey = await storage.getSurvey(surveyId);
      if (!survey || survey.userId !== userId) {
        return res.status(404).json({ message: "Survey not found" });
      }

      const stats = await storage.getSurveyStats(surveyId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // CSV export
  app.get('/api/surveys/:id/export', isAuthenticated, async (req: any, res) => {
    try {
      const surveyId = parseInt(req.params.id);
      const userId = req.session.userId;
      
      // Verify ownership
      const survey = await storage.getSurvey(surveyId);
      if (!survey || survey.userId !== userId) {
        return res.status(404).json({ message: "Survey not found" });
      }

      const responses = await storage.getSurveyResponses(surveyId);
      
      // Generate CSV
      let csv = 'Response ID,Submitted At,Is Complete';
      const questions = survey.questions as any[];
      questions.forEach((q, index) => {
        csv += `,Q${index + 1}: ${q.title}`;
      });
      csv += '\n';

      responses.forEach(response => {
        csv += `${response.id},${response.submittedAt},${response.isComplete}`;
        const answers = response.answers as any;
        questions.forEach((q, index) => {
          const answer = answers[q.id] || '';
          csv += `,"${String(answer).replace(/"/g, '""')}"`;
        });
        csv += '\n';
      });

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="survey-${surveyId}-responses.csv"`);
      res.send(csv);
    } catch (error) {
      console.error("Error exporting CSV:", error);
      res.status(500).json({ message: "Failed to export responses" });
    }
  });

  // Admin API routes
  app.get('/api/admin/users', isAuthenticated, isAdmin, async (req, res) => {
    try {
      console.log('🔍 Admin fetching all users...');
      const users = await storage.getAllUsers();
      console.log('📊 Found users:', users.length);
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Create user route for admin
  app.post('/api/admin/users', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { firstName, lastName, email, password, isAdmin, isVerified } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "User with this email already exists" });
      }

      // Hash password
      const bcrypt = await import('bcrypt');
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user with UUID
      const { v4: uuidv4 } = await import('uuid');
      const newUser = await storage.createUser({
        id: uuidv4(),
        firstName: firstName || null,
        lastName: lastName || null,
        email,
        password: hashedPassword,
        isAdmin: isAdmin || false,
        isVerified: isVerified !== false,
        verificationToken: null
      });

      res.json(newUser);
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  app.delete('/api/admin/users/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const userId = req.params.id;
      await storage.deleteUser(userId);
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  app.patch('/api/admin/users/:id/verification', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const userId = req.params.id;
      const { isVerified } = req.body;
      const user = await storage.toggleUserVerification(userId, isVerified);
      res.json(user);
    } catch (error) {
      console.error("Error updating verification:", error);
      res.status(500).json({ message: "Failed to update verification status" });
    }
  });

  app.patch('/api/admin/users/:id/password', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const userId = req.params.id;
      const { password } = req.body;
      
      if (!password || password.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters" });
      }
      
      const bcrypt = require('bcrypt');
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await storage.updateUserPassword(userId, hashedPassword);
      res.json({ message: "Password updated successfully" });
    } catch (error) {
      console.error("Error updating password:", error);
      res.status(500).json({ message: "Failed to update password" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
