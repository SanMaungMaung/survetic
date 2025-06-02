import { apiRequest } from "./queryClient";
import type { Survey, InsertSurvey, Response, InsertResponse } from "@shared/schema";

export const surveyApi = {
  // Survey operations
  async getSurveys(): Promise<Survey[]> {
    const response = await apiRequest("GET", "/api/surveys");
    return response.json();
  },

  async getSurvey(id: number): Promise<Survey> {
    const response = await apiRequest("GET", `/api/surveys/${id}`);
    return response.json();
  },

  async createSurvey(survey: InsertSurvey): Promise<Survey> {
    const response = await apiRequest("POST", "/api/surveys", survey);
    return response.json();
  },

  async updateSurvey(id: number, survey: Partial<InsertSurvey>): Promise<Survey> {
    const response = await apiRequest("PUT", `/api/surveys/${id}`, survey);
    return response.json();
  },

  async deleteSurvey(id: number): Promise<void> {
    await apiRequest("DELETE", `/api/surveys/${id}`);
  },

  // Response operations
  async getSurveyResponses(surveyId: number): Promise<Response[]> {
    const response = await apiRequest("GET", `/api/surveys/${surveyId}/responses`);
    return response.json();
  },

  async createResponse(surveyId: number, response: InsertResponse): Promise<Response> {
    const resp = await apiRequest("POST", `/api/surveys/${surveyId}/responses`, response);
    return resp.json();
  },

  async getSurveyStats(surveyId: number) {
    const response = await apiRequest("GET", `/api/surveys/${surveyId}/stats`);
    return response.json();
  },

  // Export
  async exportSurveyCSV(surveyId: number): Promise<Blob> {
    const response = await apiRequest("GET", `/api/surveys/${surveyId}/export`);
    return response.blob();
  },
};
