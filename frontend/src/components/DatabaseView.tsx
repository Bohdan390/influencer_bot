import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search, 
  Filter, 
  Download, 
  Eye, 
  MessageSquare, 
  Package, 
  Heart, 
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  Mail,
  Instagram,
  TrendingUp,
  User,
  BanIcon
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import DMModal from "./DMModal";
import BulkEmailModal from "./BulkEmailModal";
import { useToast } from "@/hooks/use-toast";

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

const DatabaseView = () => {
  const [influencers, setInfluencers] = useState([]);
  const [dashboardStats, setDashboardStats] = useState({
    total: 0,
    reached_out: 0,
    responded: 0,
    agreed: 0,
    shipped: 0,
    posted: 0,
    completed: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [dmModalOpen, setDmModalOpen] = useState(false);
  const [bulkEmailModalOpen, setBulkEmailModalOpen] = useState(false);
  const [statusUpdateModalOpen, setStatusUpdateModalOpen] = useState(false);
  const [selectedInfluencer, setSelectedInfluencer] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load CRM dashboard stats with timeout
      try {
        const statsResponse = await fetch(`${API_BASE}/api/dashboard/crm`, {
          method: 'GET',
          signal: AbortSignal.timeout(3000)
        });
        if (statsResponse.ok) {
          const stats = await statsResponse.json();
          setDashboardStats(stats);
        }
      } catch (statsError) {
        console.log('Stats API not available:', statsError.message);
      }

      // Load influencer list with timeout
      try {
        const influencersResponse = await fetch(`${API_BASE}/api/dashboard/crm/list`, {
          method: 'GET',
          signal: AbortSignal.timeout(3000)
        });
        if (influencersResponse.ok) {
          const data = await influencersResponse.json();
          var stats = {
            total: data.influencers.length,
            reached_out: 0,
            responded: 0,
            agreed: 0,
            shipped: 0,
            posted: 0,
            completed: 0
          }
          data.influencers.forEach(influencer => {
              if (influencer.journey_stage == 'reached_out') {
                stats.reached_out++;
              }
              if (influencer.journey_stage == 'responded') {
                stats.responded++;
              }
              if (influencer.journey_stage == 'agreed_to_deal') {
                stats.agreed++;
              }
              if (influencer.journey_stage == 'product_shipped') {
                stats.shipped++;
              }
              if (influencer.journey_stage == 'content_posted') {
                stats.posted++;
              }
              if (influencer.journey_stage == 'completed') {
                stats.completed++;
              }
          });
          setDashboardStats(stats);
          setInfluencers(data.influencers || []);
        }
      } catch (influencersError) {
        console.log('Influencers API not available:', influencersError.message);
        setInfluencers([]);
      }
      
    } catch (error) {
      console.log('Failed to load data:', error.message);
      setInfluencers([]);
      setDashboardStats({
        total: 0,
        reached_out: 0,
        responded: 0,
        agreed: 0,
        shipped: 0,
        posted: 0,
        completed: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDMModal = (influencer) => {
    setSelectedInfluencer(influencer);
    setDmModalOpen(true);
  };

  const handleOpenStatusUpdateModal = (influencer) => {
    setSelectedInfluencer(influencer);
    setStatusUpdateModalOpen(true);
  };

  const handleStatusUpdate = async (newStatus) => {
    if (!selectedInfluencer) return;

    try {
      setUpdatingStatus(true);
      const response = await fetch(`${API_BASE}/api/campaigns/influencers/${selectedInfluencer.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          journey_stage: newStatus,
          updated_at: new Date().toISOString()
        })
      });

      if (response.ok) {
        // Update the local state
        setInfluencers(prev => prev.map(inf => 
          inf.id === selectedInfluencer.id 
            ? { ...inf, journey_stage: newStatus }
            : inf
        ));
        
        toast({
          title: "Status Updated",
          description: `Influencer status updated to ${newStatus}`,
        });
        
        setStatusUpdateModalOpen(false);
        setSelectedInfluencer(null);
      } else {
        throw new Error('Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update influencer status. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleSendDM = async (data) => {
    try {
      const response = await fetch(`${API_BASE}/api/dm/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send message');
      }

      const result = await response.json();
      
      // Update local state
      setInfluencers(prev => 
        prev.map(inf => 
          inf.id === data.influencer.id 
            ? { 
                ...inf, 
                journey_stage: data.dmType === 'email' ? 'reached_out' : 'dm_sent',
              }
            : inf
        )
      );

      return result;
    } catch (error) {
      console.error('Error sending DM:', error);
      throw error;
    }
  };

  const handleSendBulkEmail = async (data) => {
    try {
      const response = await fetch(`${API_BASE}/api/dm/send-bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send bulk emails');
      }

      const result = await response.json();
      
      // Update local state for all sent influencers
      setInfluencers(prev => 
        prev.map(inf => 
          data.influencers.some(sentInf => sentInf.id === inf.id)
            ? { 
                ...inf, 
                journey_stage: 'reached_out',
                journey: {
                  ...inf.journey,
                  reached_out: true,
                  reached_out_at: new Date().toISOString()
                }
              }
            : inf
        )
      );

      setBulkEmailModalOpen(false);
      // Refresh dashboard stats
      await loadData();

      return result;
    } catch (error) {
      console.error('Error sending bulk emails:', error);
      throw error;
    }
  };

  const getStatusBadge = (journey, status) => {
    if (journey == 'content_posted') {
      return <Badge className="bg-green-100 text-green-800">Posted Content</Badge>;
    }
    if (journey == 'product_shipped') {
      return <Badge className="bg-blue-100 text-blue-800">Product Shipped</Badge>;
    }
    if (journey == 'agreed_to_deal') {
      return <Badge className="bg-purple-100 text-purple-800">Agreed to Deal</Badge>;
    }
    if (journey == 'responded') {
      return <Badge className="bg-yellow-100 text-yellow-800">Responded</Badge>;
    }
    if (journey == 'reached_out') {
      return <Badge className="bg-orange-100 text-orange-800">Reached Out</Badge>;
    }
    return <Badge variant="outline">Discovered</Badge>;
  };

  const getJourneyProgress = (journey) => {
    const milestones = {
      'reached_out': 10,
      'responded': 20,
      'agreed_to_deal': 50,
      'product_shipped': 70,
      'content_posted': 100,
    }
     
    
    const completed = milestones[journey];
    return completed ? completed : 0;
  };

  const formatDate = (date) => {
    if (!date) return '-';
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleDateString();
  };

  const formatNumber = (num) => {
    if (!num) return '-';
    return new Intl.NumberFormat().format(num);
  };

  const filteredInfluencers = influencers.filter(influencer => {
    const matchesSearch = !searchTerm || 
      influencer.instagram_handle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      influencer.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      influencer.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterStatus === 'all') return matchesSearch;
    
    // Map filter status to journey_stage values
    const statusMap = {
      'contacted': 'reached_out',
      'responded': 'responded', 
      'agreed': 'agreed_to_deal',
      'shipped': 'product_shipped',
      'posted': 'content_posted'
    };
    
    const targetStage = statusMap[filterStatus];
    return matchesSearch && influencer.journey_stage === targetStage;
  });

  const StatsCard = ({ title, value, icon: Icon, color }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${color}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );

  if (loading) {
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
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <StatsCard 
          title="Influencers" 
          value={dashboardStats.total || 0} 
          icon={Instagram} 
          color="text-blue-600"
        />
        <StatsCard 
          title="Reached Out" 
          value={dashboardStats.reached_out || 0} 
          icon={Mail} 
          color="text-orange-600"
        />
        <StatsCard 
          title="Responded" 
          value={dashboardStats.responded || 0} 
          icon={MessageSquare} 
          color="text-yellow-600"
        />
        <StatsCard 
          title="Agreed" 
          value={dashboardStats.agreed || 0} 
          icon={CheckCircle} 
          color="text-purple-600"
        />
        <StatsCard 
          title="Shipped" 
          value={dashboardStats.shipped || 0} 
          icon={Package} 
          color="text-blue-600"
        />
        <StatsCard 
          title="Posted" 
          value={dashboardStats.posted || 0} 
          icon={Heart} 
          color="text-green-600"
        />
        <StatsCard 
          title="Completed" 
          value={dashboardStats.completed || 0} 
          icon={TrendingUp} 
          color="text-emerald-600"
        />
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Influencer Database</CardTitle>
          <CardDescription>Complete CRM view of all influencer interactions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by handle, name, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <select 
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="all">All Status</option>
                <option value="contacted">Contacted</option>
                <option value="responded">Responded</option>
                <option value="agreed">Agreed</option>
                <option value="shipped">Shipped</option>
                <option value="posted">Posted</option>
              </select>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setBulkEmailModalOpen(true)}
                disabled={influencers.filter(inf => inf.email && inf.journey_stage === 'discovered' && !inf.journey?.reached_out).length === 0}
              >
                <Mail className="h-4 w-4 mr-2" />
                Send Bulk Email
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>

          {/* Influencer Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-medium">Influencer</th>
                  <th className="text-left p-3 font-medium">Followers</th>
                  <th className="text-left p-3 font-medium">Status</th>
                  <th className="text-left p-3 font-medium">Progress</th>
                  <th className="text-left p-3 font-medium">Reached Out</th>
                  <th className="text-left p-3 font-medium">Responded</th>
                  <th className="text-left p-3 font-medium">Shipped</th>
                  <th className="text-left p-3 font-medium">Posted</th>
                  <th className="text-left p-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInfluencers.map((influencer) => (
                  <tr key={influencer.id} className="border-b hover:bg-gray-50">
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12 flex-shrink-0">
                          <AvatarImage 
                            src={influencer.profile_image || influencer.profile_picture} 
                            alt={influencer.full_name || influencer.instagram_handle}
                          />
                          <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                            {influencer.full_name ? 
                              influencer.full_name.split(' ').map(n => n[0]).join('').toUpperCase() :
                              influencer.instagram_handle ? 
                                influencer.instagram_handle.replace('@', '').substring(0, 2).toUpperCase() :
                                <User className="h-6 w-6" />
                            }
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col min-w-0">
                          <span className="font-medium truncate">{influencer.instagram_handle}</span>
                          <span className="text-sm text-gray-500 truncate">{influencer.full_name}</span>
                          <span className="text-xs text-gray-400 truncate">{influencer.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      <span className="font-medium">{formatNumber(influencer.followers)}</span>
                    </td>
                    <td className="p-3">
                      {getStatusBadge(influencer.journey_stage, influencer.status)}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all"
                            style={{ width: `${getJourneyProgress(influencer.journey_stage)}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-gray-500">
                          {Math.round(getJourneyProgress(influencer.journey_stage))}%
                        </span>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1">
                        {['reached_out', 'responded', 'agreed_to_deal', 'product_shipped', 'content_posted'].includes(influencer.journey_stage) ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-gray-300" />
                        )}
                        <span className="text-xs">
                          {formatDate(influencer.journey_reached_out_at)}
                        </span>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1">
                        {['responded', 'agreed_to_deal', 'product_shipped', 'content_posted'].includes(influencer.journey_stage) ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-gray-300" />
                        )}
                        <span className="text-xs">
                          {formatDate(influencer.journey_responded_at)}
                        </span>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1">
                        {['product_shipped', 'content_posted'].includes(influencer.journey_stage) ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-gray-300" />
                        )}
                        <span className="text-xs">
                          {formatDate(influencer.journey_shipped_at)}
                        </span>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1">
                        {influencer.journey_stage === 'content_posted' ? (
                          <div className="flex items-center gap-1">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            {influencer.journey_post_likes && (
                              <span className="text-xs text-gray-500">
                                {formatNumber(influencer.journey_post_likes)} ❤️
                              </span>
                            )}
                          </div>
                        ) : (
                          <XCircle className="h-4 w-4 text-gray-300" />
                        )}
                        <span className="text-xs">
                          {formatDate(influencer.journey_posted_at)}
                        </span>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex gap-1">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleOpenStatusUpdateModal(influencer)}
                          title="Update Status"
                        >
                          <Clock className="h-4 w-4 text-purple-600" />
                        </Button>
                        {
                          influencer.journey_stage != 'discovered' ? 
                          <Button variant="ghost" size="sm"
                          onClick={() => handleOpenDMModal(influencer)}
                          
                          >
                              <CheckCircle className="h-4 w-4 text-blue-800" />
                            </Button>
                            : (
                              influencer.email ? <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleOpenDMModal(influencer)}
                              disabled={!influencer.email && !influencer.instagram_handle}
                              title="Send DM"
                            >
                              <MessageSquare className="h-4 w-4" />
                            </Button> :
                            <Button variant="ghost" size="sm" disabled>
                              <BanIcon className="h-4 w-4" />
                            </Button>
                          ) 
                        }
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredInfluencers.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No influencers found matching your criteria.
            </div>
          )}
        </CardContent>
      </Card>

      {/* DM Modal */}
      <DMModal
        isOpen={dmModalOpen}
        onClose={() => setDmModalOpen(false)}
        influencer={selectedInfluencer}
        onSend={handleSendDM}
      />

      {/* Bulk Email Modal */}
      <BulkEmailModal
        isOpen={bulkEmailModalOpen}
        onClose={() => setBulkEmailModalOpen(false)}
        influencers={influencers}
        onSendBulk={handleSendBulkEmail}
      />

      {/* Status Update Modal */}
      {statusUpdateModalOpen && selectedInfluencer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Update Status</CardTitle>
              <CardDescription>
                Update the journey stage for {selectedInfluencer.instagram_handle}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Current Status</label>
                <div className="p-2 bg-gray-100 rounded-md">
                  {getStatusBadge(selectedInfluencer.journey_stage, selectedInfluencer.status)}
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">New Status</label>
                <Select onValueChange={handleStatusUpdate} disabled={updatingStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select new status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="discovered">Discovered</SelectItem>
                    <SelectItem value="reached_out">Reached Out</SelectItem>
                    <SelectItem value="responded">Responded</SelectItem>
                    <SelectItem value="agreed_to_deal">Agreed to Deal</SelectItem>
                    <SelectItem value="product_shipped">Product Shipped</SelectItem>
                    <SelectItem value="content_posted">Content Posted</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setStatusUpdateModalOpen(false)}
                  disabled={updatingStatus}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default DatabaseView; 