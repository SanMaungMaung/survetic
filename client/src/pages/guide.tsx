import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { 
  ArrowLeft, 
  ArrowUp,
  Play, 
  CheckCircle, 
  FileText, 
  Settings, 
  Share, 
  BarChart3,
  Users,
  MessageSquare,
  Star,
  List,
  Type,
  MousePointer,
  Eye,
  Send,
  Download,
  Shield,
  Lightbulb,
  Target,
  Zap,
  Clock,
  TrendingUp,
  Plus
} from 'lucide-react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';

export default function SurveyBuilderGuide() {
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();
  const [activeSection, setActiveSection] = useState('getting-started');
  const [showBackToTop, setShowBackToTop] = useState(false);

  // Handle scroll to show/hide back to top button
  const handleScroll = () => {
    setShowBackToTop(window.scrollY > 300);
  };

  // Smooth scroll to section
  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Scroll to top
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Add scroll listener
  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const sections = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      icon: Play,
      description: 'Learn the basics of creating your first survey'
    },
    {
      id: 'question-types',
      title: 'Question Types',
      icon: MessageSquare,
      description: 'Explore all available question formats'
    },
    {
      id: 'customization',
      title: 'Customization',
      icon: Settings,
      description: 'Personalize your survey appearance and behavior'
    },
    {
      id: 'sharing',
      title: 'Sharing & Distribution',
      icon: Share,
      description: 'Learn how to distribute your surveys effectively'
    },
    {
      id: 'analytics',
      title: 'Analytics & Reports',
      icon: BarChart3,
      description: 'Understand and analyze your survey results'
    },
    {
      id: 'best-practices',
      title: 'Best Practices',
      icon: Lightbulb,
      description: 'Tips for creating effective surveys'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white/90 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Button 
                variant="ghost" 
                onClick={() => setLocation('/')}
                className="mr-4 hover:bg-blue-50 transition-colors"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Survey Builder Guide
              </h1>
            </div>
            <Badge variant="secondary" className="bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border-0 shadow-sm">
              Complete Tutorial
            </Badge>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24 bg-white/80 backdrop-blur-sm border-0 shadow-lg ring-1 ring-gray-200/50">
              <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
                <CardTitle className="text-lg font-semibold">Guide Sections</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <nav className="space-y-1 p-2">
                  {sections.map((section) => {
                    const IconComponent = section.icon;
                    return (
                      <button
                        key={section.id}
                        onClick={() => scrollToSection(section.id)}
                        className={`w-full text-left px-4 py-3 flex items-center space-x-3 rounded-lg transition-all duration-200 group ${
                          activeSection === section.id 
                            ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 text-blue-700 shadow-sm' 
                            : 'text-gray-700 hover:bg-gray-50 hover:shadow-sm'
                        }`}
                      >
                        <IconComponent className={`h-5 w-5 transition-colors ${
                          activeSection === section.id ? 'text-blue-600' : 'text-gray-400 group-hover:text-blue-500'
                        }`} />
                        <div>
                          <div className="font-medium">{section.title}</div>
                          <div className="text-xs text-gray-500">{section.description}</div>
                        </div>
                      </button>
                    );
                  })}
                </nav>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-12">
            {/* Getting Started */}
            <div id="getting-started" className="scroll-mt-24">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Play className="h-6 w-6 mr-3 text-blue-600" />
                    Getting Started with Survetic
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <p className="text-gray-600 text-lg">
                    Welcome to Survetic! This guide will walk you through everything you need to know to create, 
                    distribute, and analyze professional surveys.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className="border-blue-200 bg-blue-50">
                      <CardContent className="p-4">
                        <Target className="h-8 w-8 text-blue-600 mb-2" />
                        <h3 className="font-semibold text-blue-900">Set Clear Goals</h3>
                        <p className="text-blue-700 text-sm">Define what you want to learn from your survey before you start building.</p>
                      </CardContent>
                    </Card>
                    
                    <Card className="border-green-200 bg-green-50">
                      <CardContent className="p-4">
                        <Users className="h-8 w-8 text-green-600 mb-2" />
                        <h3 className="font-semibold text-green-900">Know Your Audience</h3>
                        <p className="text-green-700 text-sm">Understanding your respondents helps you create more effective questions.</p>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                    <div className="flex">
                      <Lightbulb className="h-5 w-5 text-yellow-400" />
                      <div className="ml-3">
                        <p className="text-sm text-yellow-700">
                          <strong>Pro Tip:</strong> Start with a simple survey to get familiar with the platform before creating complex questionnaires.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Question Types */}
            <div id="question-types" className="scroll-mt-24">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <MessageSquare className="h-6 w-6 mr-3 text-green-600" />
                    Available Question Types
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="border-l-4 border-l-blue-500">
                      <CardContent className="p-4">
                        <div className="flex items-center mb-3">
                          <List className="h-5 w-5 text-blue-500 mr-2" />
                          <h3 className="font-semibold">Multiple Choice</h3>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">Perfect for collecting specific preferences or single-select options.</p>
                        <ul className="text-xs text-gray-500 space-y-1">
                          <li>• Single selection enforced</li>
                          <li>• Customizable option labels</li>
                          <li>• Support for "Other" option</li>
                        </ul>
                      </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-green-500">
                      <CardContent className="p-4">
                        <div className="flex items-center mb-3">
                          <Type className="h-5 w-5 text-green-500 mr-2" />
                          <h3 className="font-semibold">Text Input</h3>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">Collect detailed feedback and open-ended responses.</p>
                        <ul className="text-xs text-gray-500 space-y-1">
                          <li>• Single line or paragraph text</li>
                          <li>• Character limits available</li>
                          <li>• Input validation options</li>
                        </ul>
                      </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-purple-500">
                      <CardContent className="p-4">
                        <div className="flex items-center mb-3">
                          <Star className="h-5 w-5 text-purple-500 mr-2" />
                          <h3 className="font-semibold">Rating Scale</h3>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">Measure satisfaction, agreement, or importance levels.</p>
                        <ul className="text-xs text-gray-500 space-y-1">
                          <li>• 1-10 scale options</li>
                          <li>• Star ratings available</li>
                          <li>• Custom scale labels</li>
                        </ul>
                      </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-orange-500">
                      <CardContent className="p-4">
                        <div className="flex items-center mb-3">
                          <MousePointer className="h-5 w-5 text-orange-500 mr-2" />
                          <h3 className="font-semibold">Dropdown</h3>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">Space-efficient option selection for long lists.</p>
                        <ul className="text-xs text-gray-500 space-y-1">
                          <li>• Compact display format</li>
                          <li>• Searchable options</li>
                          <li>• Default selection support</li>
                        </ul>
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Customization */}
            <div id="customization" className="scroll-mt-24">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Settings className="h-6 w-6 mr-3 text-purple-600" />
                    Survey Customization
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="design" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="design">Visual Design</TabsTrigger>
                      <TabsTrigger value="behavior">Behavior Settings</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="design" className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card>
                          <CardContent className="p-4">
                            <h4 className="font-semibold mb-3">Visual Appearance</h4>
                            <ul className="space-y-2 text-sm text-gray-600">
                              <li>• Custom color schemes and themes</li>
                              <li>• Logo and branding integration</li>
                              <li>• Font selection and typography</li>
                              <li>• Background images and patterns</li>
                            </ul>
                          </CardContent>
                        </Card>
                        
                        <Card>
                          <CardContent className="p-4">
                            <h4 className="font-semibold mb-3">Layout Options</h4>
                            <ul className="space-y-2 text-sm text-gray-600">
                              <li>• Single page vs. multi-page layout</li>
                              <li>• Progress bar customization</li>
                              <li>• Question spacing and alignment</li>
                              <li>• Mobile-responsive design</li>
                            </ul>
                          </CardContent>
                        </Card>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="behavior" className="space-y-4">
                      <div className="space-y-4">
                        <Card>
                          <CardContent className="p-4">
                            <h4 className="font-semibold mb-3">Response Management</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <h5 className="text-sm font-medium mb-2">Collection Settings</h5>
                                <ul className="text-xs text-gray-600 space-y-1">
                                  <li>• Response limits and quotas</li>
                                  <li>• Time limits per survey</li>
                                  <li>• Anonymous vs. identified responses</li>
                                </ul>
                              </div>
                              <div>
                                <h5 className="text-sm font-medium mb-2">Validation Rules</h5>
                                <ul className="text-xs text-gray-600 space-y-1">
                                  <li>• Required question enforcement</li>
                                  <li>• Input format validation</li>
                                  <li>• Logic branching support</li>
                                </ul>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>

            {/* Sharing & Distribution */}
            <div id="sharing" className="scroll-mt-24">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Share className="h-6 w-6 mr-3 text-indigo-600" />
                    Sharing & Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="text-center border-indigo-200">
                      <CardContent className="p-4">
                        <Send className="h-8 w-8 text-indigo-600 mx-auto mb-2" />
                        <h3 className="font-semibold mb-2">Direct Link</h3>
                        <p className="text-sm text-gray-600">Share a unique URL that works across all devices and platforms.</p>
                      </CardContent>
                    </Card>

                    <Card className="text-center border-green-200">
                      <CardContent className="p-4">
                        <Eye className="h-8 w-8 text-green-600 mx-auto mb-2" />
                        <h3 className="font-semibold mb-2">QR Code</h3>
                        <p className="text-sm text-gray-600">Generate QR codes for easy mobile access at events or printed materials.</p>
                      </CardContent>
                    </Card>

                    <Card className="text-center border-purple-200">
                      <CardContent className="p-4">
                        <Shield className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                        <h3 className="font-semibold mb-2">Private Access</h3>
                        <p className="text-sm text-gray-600">Control access with passwords or restricted sharing lists.</p>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="bg-blue-50 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-900 mb-2">Distribution Best Practices</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Choose the right channel for your audience</li>
                      <li>• Provide clear instructions and context</li>
                      <li>• Set realistic completion timeframes</li>
                      <li>• Follow up appropriately to increase response rates</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Analytics & Reports */}
            <div id="analytics" className="scroll-mt-24">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart3 className="h-6 w-6 mr-3 text-red-600" />
                    Analytics & Reports
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                      <CardContent className="p-4">
                        <TrendingUp className="h-6 w-6 text-green-600 mb-3" />
                        <h3 className="font-semibold mb-2">Real-time Analytics</h3>
                        <p className="text-sm text-gray-600 mb-3">Monitor responses as they come in with live updates and insights.</p>
                        <ul className="text-xs text-gray-500 space-y-1">
                          <li>• Response rate tracking</li>
                          <li>• Completion analytics</li>
                          <li>• Geographic distribution</li>
                          <li>• Device and browser insights</li>
                        </ul>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4">
                        <Download className="h-6 w-6 text-blue-600 mb-3" />
                        <h3 className="font-semibold mb-2">Export Options</h3>
                        <p className="text-sm text-gray-600 mb-3">Export your data in multiple formats for further analysis.</p>
                        <ul className="text-xs text-gray-500 space-y-1">
                          <li>• CSV for spreadsheet analysis</li>
                          <li>• PDF reports for presentations</li>
                          <li>• JSON for developer integration</li>
                          <li>• Automated report scheduling</li>
                        </ul>
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Best Practices */}
            <div id="best-practices" className="scroll-mt-24">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Lightbulb className="h-6 w-6 mr-3 text-yellow-600" />
                    Survey Best Practices
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="writing">
                      <AccordionTrigger>Writing Effective Questions</AccordionTrigger>
                      <AccordionContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Card className="border-green-200 bg-green-50">
                            <CardContent className="p-4">
                              <h4 className="font-semibold text-green-900 mb-2 flex items-center">
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Do This
                              </h4>
                              <ul className="text-green-800 text-sm space-y-1">
                                <li>• Use clear, simple language</li>
                                <li>• Ask one thing at a time</li>
                                <li>• Avoid leading questions</li>
                                <li>• Provide balanced answer options</li>
                              </ul>
                            </CardContent>
                          </Card>
                          
                          <Card className="border-red-200 bg-red-50">
                            <CardContent className="p-4">
                              <h4 className="font-semibold text-red-900 mb-2 flex items-center">
                                <span className="h-4 w-4 mr-2 text-red-600">✗</span>
                                Avoid This
                              </h4>
                              <ul className="text-red-800 text-sm space-y-1">
                                <li>• Double-barreled questions</li>
                                <li>• Technical jargon</li>
                                <li>• Biased or loaded language</li>
                                <li>• Too many required questions</li>
                              </ul>
                            </CardContent>
                          </Card>
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="length">
                      <AccordionTrigger>Optimal Survey Length</AccordionTrigger>
                      <AccordionContent>
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                            <div>
                              <div className="text-2xl font-bold text-green-600">5-10</div>
                              <div className="text-sm text-gray-600">Questions for high completion rates</div>
                            </div>
                            <div>
                              <div className="text-2xl font-bold text-yellow-600">3-5</div>
                              <div className="text-sm text-gray-600">Minutes ideal completion time</div>
                            </div>
                            <div>
                              <div className="text-2xl font-bold text-blue-600">80%+</div>
                              <div className="text-sm text-gray-600">Expected completion rate</div>
                            </div>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="timing">
                      <AccordionTrigger>Timing and Distribution</AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-4">
                          <Card>
                            <CardContent className="p-4">
                              <h4 className="font-semibold mb-3">Best Times to Send</h4>
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <strong>Weekdays:</strong> Tuesday-Thursday, 10AM-2PM
                                </div>
                                <div>
                                  <strong>Weekends:</strong> Sunday evening, Saturday morning
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
              </Card>
            </div>

            {/* Quick Action Buttons */}
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <Button 
                onClick={() => setLocation(isAuthenticated ? '/builder' : '/login')}
                className="bg-blue-600 hover:bg-blue-700 flex-1"
              >
                <Plus className="h-4 w-4 mr-2" />
                {isAuthenticated ? 'Start Building Your Survey' : 'Sign In to Start Building'}
              </Button>
              <Button 
                variant="outline"
                onClick={() => setLocation(isAuthenticated ? '/templates' : '/login')}
                className="flex-1"
              >
                <FileText className="h-4 w-4 mr-2" />
                {isAuthenticated ? 'Browse Templates' : 'Sign In to Browse Templates'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Back to Top Button */}
      {showBackToTop && (
        <Button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 h-12 w-12 rounded-full bg-blue-600 hover:bg-blue-700 shadow-lg z-50"
          size="icon"
        >
          <ArrowUp className="h-5 w-5" />
        </Button>
      )}
    </div>
  );
}