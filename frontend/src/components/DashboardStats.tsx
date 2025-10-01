import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Cell } from 'recharts';
import { 
  Users, 
  Mail, 
  Package, 
  TrendingUp, 
  Send, 
  Heart, 
  MessageSquare,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

const DashboardStats = () => {
  const [analytics, setAnalytics] = useState({
    total_influencers: 0,
    reached_out: 0,
    responded: 0,
    agreed: 0,
    shipped: 0,
    posted: 0,
    response_rate: 0,
    agreement_rate: 0,
    shipping_rate: 0,
    posting_rate: 0,
    daily_activity: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`${API_BASE}/api/dashboard/analytics`, {
          method: 'GET',
          signal: AbortSignal.timeout(5000)
        });
        
        if (response.ok) {
          const data = await response.json();
          setAnalytics({
            total_influencers: data.total_influencers || 0,
            reached_out: data.reached_out || 0,
            responded: data.responded || 0,
            agreed: data.agreed || 0,
            shipped: data.shipped || 0,
            posted: data.posted || 0,
            response_rate: data.response_rate || 0,
            agreement_rate: data.agreement_rate || 0,
            shipping_rate: data.shipping_rate || 0,
            posting_rate: data.posting_rate || 0,
            daily_activity: data.daily_activity || []
          });
          setIsConnected(true);
        } else {
          setIsConnected(false);
        }
      } catch (error) {
        console.log('Failed to fetch analytics:', error.message);
        setIsConnected(false);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  const StatCard = ({ 
    icon: Icon, 
    title, 
    value, 
    description, 
    color, 
    isLoading 
  }: {
    icon: any;
    title: string;
    value: number | string;
    description: string;
    color: string;
    isLoading: boolean;
  }) => (
    <Card className="relative overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${color}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {isLoading ? "..." : value}
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {description}
        </p>
      </CardContent>
    </Card>
  );

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  // Prepare journey data for the main chart
  const journeyData = [
    { 
      stage: 'Discovered', 
      count: analytics.total_influencers, 
      rate: 100,
      color: '#6366F1' // Indigo
    },
    { 
      stage: 'Reached Out', 
      count: analytics.reached_out, 
      rate: analytics.total_influencers > 0 ? Math.round((analytics.reached_out / analytics.total_influencers) * 100) : 0,
      color: '#F59E0B' // Amber
    },
    { 
      stage: 'Responded', 
      count: analytics.responded, 
      rate: analytics.reached_out > 0 ? Math.round((analytics.responded / analytics.reached_out) * 100) : 0,
      color: '#10B981' // Emerald
    },
    { 
      stage: 'Agreed', 
      count: analytics.agreed, 
      rate: analytics.responded > 0 ? Math.round((analytics.agreed / analytics.responded) * 100) : 0,
      color: '#8B5CF6' // Violet
    },
    { 
      stage: 'Shipped', 
      count: analytics.shipped, 
      rate: analytics.agreed > 0 ? Math.round((analytics.shipped / analytics.agreed) * 100) : 0,
      color: '#06B6D4' // Cyan
    },
    { 
      stage: 'Posted', 
      count: analytics.posted, 
      rate: analytics.shipped > 0 ? Math.round((analytics.posted / analytics.shipped) * 100) : 0,
      color: '#EC4899' // Pink
    }
  ];

  // Prepare daily activity data for the last 7 days
  const recentActivityData = analytics.daily_activity.slice(-7).map(day => ({
    date: new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    discovered: day.discoveries || 0,
    reached_out: day.reached_out || 0,
    responded: day.responded || 0,
    agreed: day.agreed || 0,
    shipped: day.shipped || 0,
    posted: day.posted || 0
  }));

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-3 bg-gray-200 rounded animate-pulse mt-2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="h-96 bg-gray-200 rounded animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Journey Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard
          icon={Users}
          title="Discovered"
          value={formatNumber(analytics.total_influencers)}
          description="Total influencers found"
          color="text-blue-600"
          isLoading={isLoading}
        />
        <StatCard
          icon={Send}
          title="Reached Out"
          value={analytics.reached_out}
          description="Outreach messages sent"
          color="text-orange-600"
          isLoading={isLoading}
        />
        <StatCard
          icon={MessageSquare}
          title="Responded"
          value={analytics.responded}
          description="Influencers who responded"
          color="text-green-600"
          isLoading={isLoading}
        />
        <StatCard
          icon={CheckCircle}
          title="Agreed"
          value={analytics.agreed}
          description="Partnerships agreed"
          color="text-purple-600"
          isLoading={isLoading}
        />
        <StatCard
          icon={Package}
          title="Shipped"
          value={analytics.shipped}
          description="Products shipped"
          color="text-cyan-600"
          isLoading={isLoading}
        />
        <StatCard
          icon={Heart}
          title="Posted"
          value={analytics.posted}
          description="Content posted"
          color="text-red-600"
          isLoading={isLoading}
        />
      </div>

      {/* Journey Funnel Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Influencer Journey Funnel</CardTitle>
          <CardDescription>Complete journey from discovery to content posting</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={journeyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="stage" />
              <YAxis />
              <Tooltip 
                formatter={(value, name) => [value, name === 'count' ? 'Count' : 'Rate']}
                labelFormatter={(label) => `Stage: ${label}`}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {journeyData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          
          {/* Conversion Rates */}
          <div className="mt-6 space-y-3">
            <h4 className="text-sm font-medium text-gray-700">Conversion Rates</h4>
            {journeyData.slice(1).map((stage, index) => (
              <div key={stage.stage} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: stage.color }}
                  ></div>
                  <span className="text-sm font-medium">{stage.stage}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Progress value={stage.rate} className="w-32" />
                  <span className="text-sm text-muted-foreground w-12 text-right">{stage.rate}%</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity (Last 7 Days)</CardTitle>
          <CardDescription>Daily activity breakdown by journey stage</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={recentActivityData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey="discovered" 
                stroke="#3B82F6" 
                strokeWidth={3}
                name="Discovered"
              />
              <Line 
                type="monotone" 
                dataKey="reached_out" 
                stroke="#F59E0B" 
                strokeWidth={3}
                name="Reached Out"
              />
              <Line 
                type="monotone" 
                dataKey="responded" 
                stroke="#10B981" 
                strokeWidth={3}
                name="Responded"
              />
              <Line 
                type="monotone" 
                dataKey="agreed" 
                stroke="#8B5CF6" 
                strokeWidth={3}
                name="Agreed"
              />
              <Line 
                type="monotone" 
                dataKey="shipped" 
                stroke="#06B6D4" 
                strokeWidth={3}
                name="Shipped"
              />
              <Line 
                type="monotone" 
                dataKey="posted" 
                stroke="#EF4444" 
                strokeWidth={3}
                name="Posted"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Connection Status */}
      {!isConnected && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center text-red-800">
              <AlertCircle className="h-5 w-5 mr-2" />
              Backend Disconnected
            </CardTitle>
            <CardDescription className="text-red-600">
              Unable to connect to the backend. Analytics data may not be up to date.
            </CardDescription>
          </CardHeader>
        </Card>
      )}
    </div>
  );
};

export default DashboardStats;