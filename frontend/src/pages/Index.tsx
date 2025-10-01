import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Users, Rocket, Instagram, Check, X } from "lucide-react";
import DashboardStats from "@/components/DashboardStats";
import CampaignManager from "@/components/CampaignManager";
import CampaignLauncher from "@/components/CampaignLauncher";
import DatabaseView from "@/components/DatabaseView";
import InstagramConversations from "@/components/InstagramConversations";
import CampaignsPage from "./CampaignsPage";

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

const Index = () => {
  const [activeTab, setActiveTab] = useState("launch");
  const [replyStats, setReplyStats] = useState({
    totalGoodReplies: 0,
    totalBadReplies: 0,
    totalReplies: 0,
    unreadCampaigns: 0
  });

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
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Dermao Influencer Hub
                </h1>
                <p className="text-sm text-muted-foreground">AI-Powered Influencer Marketing Platform</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 lg:w-[600px] mx-auto">
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
            <TabsTrigger value="instagram" className="flex items-center gap-2">
              <Instagram className="w-4 h-4" />
              Instagram
            </TabsTrigger>
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Dashboard
            </TabsTrigger>
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

          <TabsContent value="instagram" className="space-y-6">
            <InstagramConversations />
          </TabsContent>

          <TabsContent value="dashboard" className="space-y-6">
            <DashboardStats />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;
