import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Footer } from "@/components/ui/footer";
import { useAuth } from "@/hooks/useAuth";
import Landing from "@/pages/landing";
import Login from "@/pages/login";
import Register from "@/pages/register";
import Dashboard from "@/pages/dashboard-new";
import ProfileSettings from "@/pages/profile";
import SurveyBuilderGuide from "@/pages/guide";
import SurveyBuilder from "@/pages/survey-builder";
import SurveyPreview from "@/pages/survey-preview";
import PublicSurvey from "@/pages/public-survey";
import SurveyAnalytics from "@/pages/survey-analytics";
import Templates from "@/pages/templates";
import AdminPanel from "@/pages/admin";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {/* Always available routes - these should work regardless of auth state */}
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/guide" component={SurveyBuilderGuide} />
      <Route path="/survey/:id" component={PublicSurvey} />
      
      {/* Home route - conditional based on auth state */}
      {isLoading ? (
        <Route path="/" component={Landing} />
      ) : !isAuthenticated ? (
        <>
          <Route path="/" component={Landing} />
        </>
      ) : (
        <>
          <Route path="/" component={Dashboard} />
          <Route path="/profile" component={ProfileSettings} />
          <Route path="/templates" component={Templates} />
          <Route path="/builder/:id?" component={SurveyBuilder} />
          <Route path="/preview/:id" component={SurveyPreview} />
          <Route path="/analytics/:id" component={SurveyAnalytics} />
          <Route path="/admin" component={AdminPanel} />
        </>
      )}
      
      {/* Catch all - 404 page */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen flex flex-col">
          <Toaster />
          <Router />
          <Footer />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
