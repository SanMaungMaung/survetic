import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  Search,
  Star,
  Users,
  Heart,
  Briefcase,
  GraduationCap,
  ShoppingCart,
  Calendar,
  MessageSquare
} from "lucide-react";
import type { Question, QuestionType } from "@shared/schema";

interface SurveyTemplate {
  id: string;
  title: string;
  description: string;
  category: string;
  icon: any;
  color: string;
  questions: Question[];
  estimatedTime: string;
}

const surveyTemplates: SurveyTemplate[] = [
  {
    id: "customer-satisfaction",
    title: "Customer Satisfaction Survey",
    description: "Measure customer satisfaction and gather feedback on your products or services",
    category: "Business",
    icon: Star,
    color: "bg-yellow-100 text-yellow-600",
    estimatedTime: "3-5 min",
    questions: [
      {
        id: "overall-satisfaction",
        type: "rating",
        title: "How satisfied are you with our product/service overall?",
        required: true,
        ratingScale: 5
      },
      {
        id: "recommendation",
        type: "rating",
        title: "How likely are you to recommend us to a friend or colleague?",
        description: "0 = Not at all likely, 10 = Extremely likely",
        required: true,
        ratingScale: 10
      },
      {
        id: "best-feature",
        type: "multiple-choice",
        title: "What do you like most about our product/service?",
        required: false,
        options: ["Quality", "Price", "Customer Service", "Ease of Use", "Features", "Other"]
      },
      {
        id: "improvements",
        type: "text-input",
        title: "What could we improve?",
        description: "Please share any suggestions for improvement",
        required: false
      }
    ]
  },
  {
    id: "employee-engagement",
    title: "Employee Engagement Survey",
    description: "Assess employee satisfaction, engagement, and workplace culture",
    category: "HR",
    icon: Users,
    color: "bg-blue-100 text-blue-600",
    estimatedTime: "5-7 min",
    questions: [
      {
        id: "job-satisfaction",
        type: "rating",
        title: "How satisfied are you with your current role?",
        required: true,
        ratingScale: 5
      },
      {
        id: "work-environment",
        type: "multiple-choice",
        title: "How would you describe your work environment?",
        required: true,
        options: ["Excellent", "Good", "Fair", "Needs Improvement", "Poor"]
      },
      {
        id: "career-development",
        type: "rating",
        title: "How satisfied are you with career development opportunities?",
        required: true,
        ratingScale: 5
      },
      {
        id: "work-life-balance",
        type: "rating",
        title: "How would you rate your work-life balance?",
        required: true,
        ratingScale: 5
      },
      {
        id: "feedback",
        type: "text-input",
        title: "What suggestions do you have for improving our workplace?",
        required: false
      }
    ]
  },
  {
    id: "event-feedback",
    title: "Event Feedback Survey",
    description: "Gather attendee feedback to improve future events",
    category: "Events",
    icon: Calendar,
    color: "bg-purple-100 text-purple-600",
    estimatedTime: "2-4 min",
    questions: [
      {
        id: "overall-rating",
        type: "rating",
        title: "How would you rate the event overall?",
        required: true,
        ratingScale: 5
      },
      {
        id: "content-quality",
        type: "multiple-choice",
        title: "How would you rate the content quality?",
        required: true,
        options: ["Excellent", "Very Good", "Good", "Fair", "Poor"]
      },
      {
        id: "most-valuable",
        type: "text-input",
        title: "What was the most valuable part of the event?",
        required: false
      },
      {
        id: "improvements",
        type: "text-input",
        title: "What could we improve for future events?",
        required: false
      },
      {
        id: "recommend",
        type: "multiple-choice",
        title: "Would you recommend this event to others?",
        required: true,
        options: ["Definitely", "Probably", "Maybe", "Probably Not", "Definitely Not"]
      }
    ]
  },
  {
    id: "product-research",
    title: "Product Market Research",
    description: "Understand market needs and validate product concepts",
    category: "Research",
    icon: ShoppingCart,
    color: "bg-green-100 text-green-600",
    estimatedTime: "4-6 min",
    questions: [
      {
        id: "product-interest",
        type: "rating",
        title: "How interested are you in this type of product?",
        required: true,
        ratingScale: 5
      },
      {
        id: "current-solution",
        type: "text-input",
        title: "What solution do you currently use for this need?",
        required: false
      },
      {
        id: "price-range",
        type: "multiple-choice",
        title: "What price range would you expect for this product?",
        required: true,
        options: ["Under $25", "$25-$50", "$50-$100", "$100-$200", "Over $200"]
      },
      {
        id: "key-features",
        type: "multiple-choice",
        title: "Which features are most important to you?",
        description: "Select all that apply",
        required: true,
        options: ["Ease of use", "Price", "Quality", "Speed", "Customer support", "Customization"]
      }
    ]
  },
  {
    id: "course-evaluation",
    title: "Course Evaluation Survey",
    description: "Collect feedback on educational courses and training programs",
    category: "Education",
    icon: GraduationCap,
    color: "bg-indigo-100 text-indigo-600",
    estimatedTime: "3-5 min",
    questions: [
      {
        id: "course-rating",
        type: "rating",
        title: "How would you rate this course overall?",
        required: true,
        ratingScale: 5
      },
      {
        id: "instructor-rating",
        type: "rating",
        title: "How would you rate the instructor?",
        required: true,
        ratingScale: 5
      },
      {
        id: "content-clarity",
        type: "multiple-choice",
        title: "How clear was the course content?",
        required: true,
        options: ["Very Clear", "Clear", "Somewhat Clear", "Unclear", "Very Unclear"]
      },
      {
        id: "pace",
        type: "multiple-choice",
        title: "How was the pace of the course?",
        required: true,
        options: ["Too Fast", "Just Right", "Too Slow"]
      },
      {
        id: "additional-comments",
        type: "text-input",
        title: "Any additional comments or suggestions?",
        required: false
      }
    ]
  }
];

export default function Templates() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const { toast } = useToast();

  const createSurveyMutation = useMutation({
    mutationFn: async (template: SurveyTemplate) => {
      const response = await apiRequest("POST", "/api/surveys", {
        title: template.title,
        description: template.description,
        questions: template.questions,
        theme: { primaryColor: "#2563eb", fontFamily: "Inter" },
        isPublished: false,
      });
      return response.json();
    },
    onSuccess: (newSurvey) => {
      queryClient.invalidateQueries({ queryKey: ["/api/surveys"] });
      setLocation(`/builder/${newSurvey.id}`);
      toast({
        title: "Survey created",
        description: "Template has been loaded and is ready for customization.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create survey from template. Please try again.",
        variant: "destructive",
      });
    },
  });

  const categories = ["All", ...Array.from(new Set(surveyTemplates.map(t => t.category)))];

  const filteredTemplates = surveyTemplates.filter(template => {
    const matchesSearch = template.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "All" || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleUseTemplate = (template: SurveyTemplate) => {
    createSurveyMutation.mutate(template);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setLocation("/")}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h1 className="text-xl font-semibold text-gray-900">Survey Templates</h1>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Start with a Template
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Choose from our professionally designed survey templates to get started quickly
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className="whitespace-nowrap"
              >
                {category}
              </Button>
            ))}
          </div>
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => {
            const IconComponent = template.icon;
            return (
              <Card key={template.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <div className={`p-2 rounded-lg ${template.color}`}>
                      <IconComponent className="h-6 w-6" />
                    </div>
                    <Badge variant="secondary">{template.estimatedTime}</Badge>
                  </div>
                  <CardTitle className="text-lg">{template.title}</CardTitle>
                  <p className="text-sm text-gray-600">{template.description}</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-2">
                        INCLUDES {template.questions.length} QUESTIONS
                      </p>
                      <div className="space-y-1">
                        {template.questions.slice(0, 3).map((question, index) => (
                          <div key={index} className="text-xs text-gray-600 truncate">
                            • {question.title}
                          </div>
                        ))}
                        {template.questions.length > 3 && (
                          <div className="text-xs text-gray-500">
                            + {template.questions.length - 3} more questions
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <Button 
                      className="w-full"
                      onClick={() => handleUseTemplate(template)}
                      disabled={createSurveyMutation.isPending}
                    >
                      {createSurveyMutation.isPending ? "Creating..." : "Use This Template"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filteredTemplates.length === 0 && (
          <div className="text-center py-12">
            <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No templates found</h3>
            <p className="text-gray-600">Try adjusting your search or filter criteria</p>
          </div>
        )}
      </div>
    </div>
  );
}