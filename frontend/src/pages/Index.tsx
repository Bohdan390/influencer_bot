import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Users, Rocket, Instagram, Check, X, TestTube, Globe } from "lucide-react";
import DashboardStats from "@/components/DashboardStats";
import CampaignManager from "@/components/CampaignManager";
import CampaignLauncher from "@/components/CampaignLauncher";
import DatabaseView from "@/components/DatabaseView";
import InstagramConversations from "@/components/InstagramConversations";
import CampaignsPage from "./CampaignsPage";
import MessageManager from "@/components/MessageManager";

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

const Index = () => {
  const [activeTab, setActiveTab] = useState("launch");
  const [replyStats, setReplyStats] = useState({
    totalGoodReplies: 0,
    totalBadReplies: 0,
    totalReplies: 0,
    unreadCampaigns: 0
  });
  
  // Test scraping state
  const [testUrl, setTestUrl] = useState("https://cosara.com");
  const [testResult, setTestResult] = useState(null);
  const [isTesting, setIsTesting] = useState(false);

  // Test web scraping function
  const testWebScraping = async () => {
    if (!testUrl.trim()) return;
    
    setIsTesting(true);
    setTestResult(null);
    
    try {
      const response = await fetch(`${API_BASE}/api/test/scraping`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: testUrl }),
      });
      
      const data = await response.json();
      setTestResult(data);
    } catch (error) {
      setTestResult({
        success: false,
        error: error.message,
        message: 'Failed to test web scraping'
      });
    } finally {
      setIsTesting(false);
    }
  };

  const fetchReplyStats = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/email-campaigns`);
      const data = await response.json();
      
      if (data.success && data.campaigns) {
        // Calculate reply statistics (only for unread campaigns)
        const stats = data.campaigns.reduce((acc, campaign) => {
          if (!campaign.is_read) {
            acc.totalGoodReplies += campaign.good_reply_count || 0;
            acc.totalBadReplies += campaign.bad_reply_count || 0;
            acc.totalReplies += campaign.total_replies || 0;
            acc.unreadCampaigns += 1;
          }
          return acc;
        }, { totalGoodReplies: 0, totalBadReplies: 0, totalReplies: 0, unreadCampaigns: 0 });
        
        setReplyStats(stats);
      }
    } catch (error) {
      console.error('Error fetching reply stats:', error);
    }
  };

  useEffect(() => {
    fetchReplyStats();
    
    // Refresh stats every 30 seconds
    const interval = setInterval(fetchReplyStats, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-100">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="maincontainer mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Cosara Influencer Hub
                </h1>
                <p className="text-sm text-muted-foreground">AI-Powered Influencer Marketing Platform</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="maincontainer mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 lg:w-[800px] mx-auto">
            <TabsTrigger value="launch" className="flex items-center gap-2">
              <Rocket className="w-4 h-4" />
              Launch
            </TabsTrigger>
            <TabsTrigger value="campaigns" className="flex items-center">
              <Users className="w-4 h-4" />
              <div style={{width: 10}}></div>
              <span>Campaigns</span>
              {replyStats.totalReplies > 0 && (
                <div className="flex items-center gap-0.5">
                  {replyStats.totalGoodReplies > 0 && (
                    <span className="bg-green-500 text-white text-xs px-1 py-0.5 rounded-full text-center min-w-[18px] h-[18px] flex items-center justify-center">
                      {replyStats.totalGoodReplies}
                    </span>
                  )}
                  {replyStats.totalBadReplies > 0 && (
                    <span className="bg-red-500 text-white text-xs px-1 py-0.5 rounded-full text-center min-w-[18px] h-[18px] flex items-center justify-center">
                      {replyStats.totalBadReplies}
                    </span>
                  )}
                </div>
              )}
              <div style={{width: 10}}></div>
            </TabsTrigger>
            <TabsTrigger value="database" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Database
            </TabsTrigger>
            <TabsTrigger value="messages" className="flex items-center gap-2">
              <Globe className="w-4 h-4" />
              Messages
            </TabsTrigger>
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Dashboard
            </TabsTrigger>
            {/* <TabsTrigger value="test" className="flex items-center gap-2">
              <TestTube className="w-4 h-4" />
              Test
            </TabsTrigger> */}
          </TabsList>

          <TabsContent value="launch" className="space-y-6">
            <CampaignLauncher />
          </TabsContent>


          <TabsContent value="campaigns" className="space-y-6">
            <CampaignManager onStatsUpdate={fetchReplyStats} />
          </TabsContent>

          <TabsContent value="database" className="space-y-6">
            <DatabaseView />
          </TabsContent>

          <TabsContent value="messages" className="space-y-6">
            <MessageManager />
          </TabsContent>

          <TabsContent value="instagram" className="space-y-6">
            <InstagramConversations />
          </TabsContent>

          <TabsContent value="dashboard" className="space-y-6">
            <DashboardStats />
          </TabsContent>

          <TabsContent value="test" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TestTube className="w-5 h-5" />
                  Web Scraping Test
                </CardTitle>
                <CardDescription>
                  Test the web scraping functionality on Digital Ocean
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    type="url"
                    placeholder="Enter URL to test (e.g., https://cosara.com)"
                    value={testUrl}
                    onChange={(e) => setTestUrl(e.target.value)}
                    className="flex-1"
                  />
                  <Button 
                    onClick={testWebScraping} 
                    disabled={isTesting || !testUrl.trim()}
                    className="flex items-center gap-2"
                  >
                    <Globe className="w-4 h-4" />
                    {isTesting ? "Testing..." : "Test Scraping"}
                  </Button>
                </div>

                {testResult && (
                  <Card className={testResult.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-2 mb-2">
                        {testResult.success ? (
                          <Check className="w-5 h-5 text-green-600" />
                        ) : (
                          <X className="w-5 h-5 text-red-600" />
                        )}
                        <span className={`font-medium ${testResult.success ? "text-green-800" : "text-red-800"}`}>
                          {testResult.success ? "Success" : "Failed"}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-700 mb-3">
                        {testResult.message}
                      </p>

                      {testResult.success && testResult.emails && (
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-2">
                            Emails Found: {testResult.emails_found}
                          </p>
                          <div className="space-y-1">
                            {testResult.emails.map((email, index) => (
                              <Badge key={index} variant="secondary" className="mr-2">
                                {email}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {testResult.error && (
                        <div className="mt-2">
                          <p className="text-sm font-medium text-red-700">Error:</p>
                          <p className="text-sm text-red-600 font-mono bg-red-100 p-2 rounded">
                            {testResult.error}
                          </p>
                        </div>
                      )}

                      <p className="text-xs text-gray-500 mt-2">
                        Tested at: {new Date(testResult.timestamp).toLocaleString()}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;
