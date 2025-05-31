import {
  users,
  surveys,
  responses,
  type User,
  type UpsertUser,
  type Survey,
  type InsertSurvey,
  type Response,
  type InsertResponse,
} from "../shared/schema.js";
import { db } from "./db.js";
import { eq, desc, and } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByVerificationToken(token: string): Promise<User | undefined>;
  createUser(user: UpsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<UpsertUser>): Promise<User>;
  verifyUser(id: string): Promise<void>;
  
  // Admin operations
  getAllUsers(): Promise<User[]>;
  deleteUser(id: string): Promise<void>;
  toggleUserVerification(id: string, isVerified: boolean): Promise<User>;
  updateUserPassword(id: string, hashedPassword: string): Promise<User>;
  
  // Survey operations
  getUserSurveys(userId: string): Promise<Survey[]>;
  getSurvey(id: number): Promise<Survey | undefined>;
  createSurvey(survey: InsertSurvey): Promise<Survey>;
  updateSurvey(id: number, survey: Partial<InsertSurvey>): Promise<Survey>;
  deleteSurvey(id: number): Promise<void>;
  
  // Response operations
  getSurveyResponses(surveyId: number): Promise<Response[]>;
  createResponse(response: InsertResponse): Promise<Response>;
  getSurveyStats(surveyId: number): Promise<{
    totalResponses: number;
    completionRate: number;
    averageTime: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // User operations (IMPORTANT) mandatory for Replit Auth
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      password: users.password,
      isVerified: users.isVerified,
      verificationToken: users.verificationToken,
      isAdmin: users.isAdmin,
      profileImageUrl: users.profileImageUrl,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    }).from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserByVerificationToken(token: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.verificationToken, token));
    return user;
  }

  async createUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<UpsertUser>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ 
        ...updates,
        updatedAt: new Date() 
      })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async verifyUser(id: string): Promise<void> {
    await db
      .update(users)
      .set({ 
        isVerified: true, 
        verificationToken: null,
        updatedAt: new Date() 
      })
      .where(eq(users.id, id));
  }

  // Admin operations
  async getAllUsers(): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .orderBy(desc(users.createdAt));
  }

  async deleteUser(id: string): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  async toggleUserVerification(id: string, isVerified: boolean): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ 
        isVerified,
        updatedAt: new Date() 
      })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async updateUserPassword(id: string, hashedPassword: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ 
        password: hashedPassword,
        updatedAt: new Date() 
      })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  // Survey operations
  async getUserSurveys(userId: string): Promise<Survey[]> {
    return await db
      .select()
      .from(surveys)
      .where(eq(surveys.userId, userId))
      .orderBy(desc(surveys.updatedAt));
  }

  async getSurvey(id: number): Promise<Survey | undefined> {
    const [survey] = await db.select().from(surveys).where(eq(surveys.id, id));
    return survey;
  }

  async createSurvey(survey: InsertSurvey): Promise<Survey> {
    const [newSurvey] = await db
      .insert(surveys)
      .values(survey)
      .returning();
    return newSurvey;
  }

  async updateSurvey(id: number, survey: Partial<InsertSurvey>): Promise<Survey> {
    const [updatedSurvey] = await db
      .update(surveys)
      .set({ ...survey, updatedAt: new Date() })
      .where(eq(surveys.id, id))
      .returning();
    return updatedSurvey;
  }

  async deleteSurvey(id: number): Promise<void> {
    await db.delete(surveys).where(eq(surveys.id, id));
  }

  // Response operations
  async getSurveyResponses(surveyId: number): Promise<Response[]> {
    return await db
      .select()
      .from(responses)
      .where(eq(responses.surveyId, surveyId))
      .orderBy(desc(responses.submittedAt));
  }

  async createResponse(response: InsertResponse): Promise<Response> {
    const [newResponse] = await db
      .insert(responses)
      .values(response)
      .returning();
    return newResponse;
  }

  async getSurveyStats(surveyId: number): Promise<{
    totalResponses: number;
    completionRate: number;
    averageTime: number;
  }> {
    const allResponses = await this.getSurveyResponses(surveyId);
    const completedResponses = allResponses.filter(r => r.isComplete);
    
    return {
      totalResponses: allResponses.length,
      completionRate: allResponses.length > 0 ? (completedResponses.length / allResponses.length) * 100 : 0,
      averageTime: 204, // Mock average time in seconds
    };
  }
}

export const storage = new DatabaseStorage();
