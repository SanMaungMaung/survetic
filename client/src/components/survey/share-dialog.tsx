import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import QRCode from "qrcode";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
  Copy, 
  Link, 
  Code, 
  Mail,
  Share2,
  ExternalLink,
  CheckCircle,
  QrCode,
  Download
} from "lucide-react";
import { SiFacebook, SiX, SiLinkedin } from "react-icons/si";

interface ShareDialogProps {
  isOpen: boolean;
  onClose: () => void;
  surveyId: number;
  surveyTitle: string;
  isPublished: boolean;
}

export function ShareDialog({ isOpen, onClose, surveyId, surveyTitle, isPublished }: ShareDialogProps) {
  const [copied, setCopied] = useState<string | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const { toast } = useToast();

  const surveyUrl = `${window.location.origin}/survey/${surveyId}`;
  const embedCode = `<iframe src="${surveyUrl}" width="100%" height="600" frameborder="0"></iframe>`;

  useEffect(() => {
    if (isPublished) {
      generateQRCode();
    }
  }, [isPublished, surveyUrl]);

  const generateQRCode = async () => {
    try {
      const qrDataUrl = await QRCode.toDataURL(surveyUrl, {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      setQrCodeUrl(qrDataUrl);
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  };

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      toast({
        title: "Copied!",
        description: `${type} copied to clipboard`,
      });
      setTimeout(() => setCopied(null), 2000);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const shareViaEmail = () => {
    const subject = encodeURIComponent(`Take this survey: ${surveyTitle}`);
    const body = encodeURIComponent(`I'd love to get your feedback! Please take a moment to complete this survey:\n\n${surveyUrl}\n\nThank you!`);
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  const shareToFacebook = () => {
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(surveyUrl)}&quote=${encodeURIComponent(`Please take a moment to complete this survey: ${surveyTitle}`)}`;
    window.open(facebookUrl, '_blank', 'width=600,height=400');
  };

  const shareToX = () => {
    const xText = encodeURIComponent(`Please take a moment to complete this survey: ${surveyTitle}`);
    const xUrl = `https://twitter.com/intent/tweet?text=${xText}&url=${encodeURIComponent(surveyUrl)}`;
    window.open(xUrl, '_blank', 'width=600,height=400');
  };

  const shareToLinkedIn = () => {
    const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(surveyUrl)}`;
    window.open(linkedInUrl, '_blank', 'width=600,height=400');
  };

  const downloadQRCode = () => {
    if (!qrCodeUrl) return;
    
    const link = document.createElement('a');
    link.download = `${surveyTitle.replace(/[^a-zA-Z0-9]/g, '_')}_QR_Code.png`;
    link.href = qrCodeUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "QR Code Downloaded",
      description: "QR code has been saved to your downloads folder",
    });
  };

  const openSurvey = () => {
    window.open(surveyUrl, '_blank');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Share2 className="h-5 w-5" />
            <span>Share Your Survey</span>
          </DialogTitle>
        </DialogHeader>

        {!isPublished && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <span className="text-sm font-medium text-yellow-800">Survey is not published</span>
            </div>
            <p className="text-sm text-yellow-700 mt-1">
              You need to publish your survey before sharing it publicly.
            </p>
          </div>
        )}

        <Tabs defaultValue="link" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="link">Direct Link</TabsTrigger>
            <TabsTrigger value="qr">QR Code</TabsTrigger>
            <TabsTrigger value="embed">Embed Code</TabsTrigger>
            <TabsTrigger value="share">Share Options</TabsTrigger>
          </TabsList>

          <TabsContent value="link" className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Survey URL</Label>
              <div className="flex space-x-2 mt-2">
                <Input
                  value={surveyUrl}
                  readOnly
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  onClick={() => copyToClipboard(surveyUrl, "Survey link")}
                  disabled={!isPublished}
                >
                  {copied === "Survey link" ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={openSurvey}
                  disabled={!isPublished}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Share this link to collect responses from anyone
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium mb-2">Survey Details</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Title:</span>
                  <span className="font-medium">{surveyTitle}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <Badge variant={isPublished ? "default" : "secondary"}>
                    {isPublished ? "Published" : "Draft"}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Access:</span>
                  <span>Public (Anonymous)</span>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="qr" className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">QR Code</h3>
              <p className="text-sm text-gray-600 mb-4">
                Let people scan this QR code with their phone to access your survey instantly
              </p>
              
              {isPublished ? (
                <div className="space-y-4">
                  {qrCodeUrl ? (
                    <div className="flex justify-center">
                      <div className="p-4 bg-white rounded-lg shadow-md border">
                        <img 
                          src={qrCodeUrl} 
                          alt="Survey QR Code" 
                          className="w-64 h-64"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-center items-center h-64 bg-gray-100 rounded-lg">
                      <div className="text-center">
                        <QrCode className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">Generating QR code...</p>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex justify-center space-x-3">
                    <Button
                      onClick={downloadQRCode}
                      disabled={!qrCodeUrl}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download QR Code
                    </Button>
                    
                    <Button
                      variant="outline"
                      onClick={() => copyToClipboard(surveyUrl, "Survey link")}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Link
                    </Button>
                  </div>
                  
                  <div className="bg-blue-50 rounded-lg p-4 text-left">
                    <h4 className="font-medium text-blue-900 mb-2">QR Code Tips</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Print on flyers, posters, or business cards</li>
                      <li>• Display on screens during presentations</li>
                      <li>• Share in social media posts</li>
                      <li>• Add to email signatures</li>
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="flex justify-center items-center h-64 bg-gray-100 rounded-lg">
                  <div className="text-center">
                    <QrCode className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">QR code not available</p>
                    <p className="text-sm text-gray-400">Publish your survey to generate a QR code</p>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="embed" className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Embed Code</Label>
              <div className="mt-2">
                <Textarea
                  value={embedCode}
                  readOnly
                  rows={4}
                  className="font-mono text-sm"
                />
                <div className="flex justify-between items-center mt-2">
                  <p className="text-xs text-gray-500">
                    Copy this code to embed the survey in your website
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(embedCode, "Embed code")}
                    disabled={!isPublished}
                  >
                    {copied === "Embed code" ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <Code className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-900">How to embed</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    Paste the embed code into your website's HTML where you want the survey to appear. 
                    The survey will be responsive and work on all devices.
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="share" className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              {/* Social Media Sharing */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium mb-3">Share on Social Media</h4>
                <div className="grid grid-cols-3 gap-3">
                  <Button
                    variant="outline"
                    className="justify-center h-auto p-3 bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
                    onClick={shareToFacebook}
                    disabled={!isPublished}
                  >
                    <div className="flex flex-col items-center space-y-1">
                      <SiFacebook className="h-5 w-5" />
                      <span className="text-xs">Facebook</span>
                    </div>
                  </Button>

                  <Button
                    variant="outline"
                    className="justify-center h-auto p-3 bg-black hover:bg-gray-800 text-white border-black"
                    onClick={shareToX}
                    disabled={!isPublished}
                  >
                    <div className="flex flex-col items-center space-y-1">
                      <SiX className="h-5 w-5" />
                      <span className="text-xs">X (Twitter)</span>
                    </div>
                  </Button>

                  <Button
                    variant="outline"
                    className="justify-center h-auto p-3 bg-blue-700 hover:bg-blue-800 text-white border-blue-700"
                    onClick={shareToLinkedIn}
                    disabled={!isPublished}
                  >
                    <div className="flex flex-col items-center space-y-1">
                      <SiLinkedin className="h-5 w-5" />
                      <span className="text-xs">LinkedIn</span>
                    </div>
                  </Button>
                </div>
              </div>

              {/* Other Sharing Options */}
              <Button
                variant="outline"
                className="justify-start h-auto p-4"
                onClick={shareViaEmail}
                disabled={!isPublished}
              >
                <div className="flex items-center space-x-3">
                  <Mail className="h-5 w-5 text-blue-600" />
                  <div className="text-left">
                    <div className="font-medium">Share via Email</div>
                    <div className="text-sm text-gray-500">Send survey link in an email</div>
                  </div>
                </div>
              </Button>

              <Button
                variant="outline"
                className="justify-start h-auto p-4"
                onClick={() => copyToClipboard(surveyUrl, "Survey link")}
                disabled={!isPublished}
              >
                <div className="flex items-center space-x-3">
                  <Link className="h-5 w-5 text-green-600" />
                  <div className="text-left">
                    <div className="font-medium">Copy Link</div>
                    <div className="text-sm text-gray-500">Copy survey URL to share anywhere</div>
                  </div>
                </div>
              </Button>

              <Button
                variant="outline"
                className="justify-start h-auto p-4"
                onClick={() => copyToClipboard(embedCode, "Embed code")}
                disabled={!isPublished}
              >
                <div className="flex items-center space-x-3">
                  <Code className="h-5 w-5 text-purple-600" />
                  <div className="text-left">
                    <div className="font-medium">Embed in Website</div>
                    <div className="text-sm text-gray-500">Get code to embed in your site</div>
                  </div>
                </div>
              </Button>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium mb-2">Sharing Tips</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Make sure your survey is published before sharing</li>
                <li>• Test the survey yourself before sending to others</li>
                <li>• Include context about why you're collecting feedback</li>
                <li>• Consider setting a deadline for responses</li>
              </ul>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}