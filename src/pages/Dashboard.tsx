import { useEffect, useState } from "react";
import { 
  Users, 
  TrendingUp, 
  CreditCard, 
  Activity, 
  ArrowUpRight, 
  CheckCircle2, 
  FolderPlus, 
  RefreshCw 
} from "lucide-react";
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  BarChart, 
  Bar, 
  Cell 
} from "recharts";
import { CRMService, Lead, LeadOrder, LeadLog, OrganisationSubscription } from "@/lib/crm-service";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [orders, setOrders] = useState<LeadOrder[]>([]);
  const [logs, setLogs] = useState<LeadLog[]>([]);
  const [subscription, setSubscription] = useState<OrganisationSubscription & { plan_name?: string } | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const allLeads = await CRMService.getLeads();
      const allOrders = await CRMService.getOrders();
      const allLogs = await CRMService.getLogs();
      const sub = await CRMService.getOrganisationSubscription();

      setLeads(allLeads);
      setOrders(allOrders);
      setLogs(allLogs.slice(0, 5)); // Keep top 5 latest activities
      setSubscription(sub);
    } catch (err) {
      console.error("Failed to load dashboard data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-zinc-400">
        <div className="w-8 h-8 rounded-full border border-t-indigo-500 border-indigo-900 animate-spin"></div>
        <span className="mt-3 text-xs tracking-wider">Compiling Analytics Data...</span>
      </div>
    );
  }

  // --- ANALYTICS CALCULATIONS ---
  const totalLeads = leads.length;
  
  // Conversion Rate = Converted (not new) / Total leads
  const convertedLeads = leads.filter(l => l.status !== "new").length;
  const conversionRate = totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) : 0;

  // Total invoice values (revenue)
  const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total_value), 0);

  // Lead Funnel States Count
  const statusCounts = leads.reduce((acc, lead) => {
    acc[lead.status] = (acc[lead.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const funnelData = [
    { name: "New", value: statusCounts["new"] || 0, color: "#6366f1" },
    { name: "Ordered", value: statusCounts["order_placed"] || 0, color: "#3b82f6" },
    { 
      name: "Procuring", 
      value: (statusCounts["procurement_sent"] || 0) + 
             (statusCounts["procurement_waiting"] || 0) + 
             (statusCounts["procurement_approved"] || 0) +
             (statusCounts["partial_procurement_sent"] || 0) +
             (statusCounts["partial_procurement_waiting"] || 0) +
             (statusCounts["partial_procurement_approved"] || 0), 
      color: "#f59e0b" 
    },
    { name: "Invoiced", value: statusCounts["bill_generated"] || 0, color: "#10b981" },
    { name: "Closed", value: statusCounts["closed"] || 0, color: "#a1a1aa" }
  ];

  // Revenue Over Time data formatted for AreaChart
  const revenueTrendData = orders
    .slice()
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    .map(o => ({
      date: new Date(o.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      amount: Number(o.total_value)
    }));

  // Fallback if no order history
  const chartTrendData = revenueTrendData.length > 0 ? revenueTrendData : [
    { date: "Jun 1", amount: 0 },
    { date: "Jun 2", amount: 20000 },
    { date: "Jun 3", amount: 45000 },
    { date: "Jun 4", amount: 85000 },
    { date: "Jun 5", amount: totalRevenue || 118000 }
  ];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-zinc-100">Executive Dashboard</h2>
          <p className="text-sm text-zinc-400 mt-1">Real-time pipeline monitoring and sales analytics.</p>
        </div>
        <Button onClick={loadData} variant="outline" className="border-zinc-800 text-zinc-300 hover:bg-zinc-900 gap-2">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Metric 1 */}
        <Card className="bg-[#09090b]/40 border-zinc-800 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-zinc-400">Total Leads</CardTitle>
            <Users className="w-4 h-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-zinc-100">{totalLeads}</div>
            <p className="text-xs text-zinc-500 mt-1">Active customer inquiries</p>
          </CardContent>
        </Card>

        {/* Metric 2 */}
        <Card className="bg-[#09090b]/40 border-zinc-800 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-zinc-400">Pipeline Conversion</CardTitle>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-zinc-100">{conversionRate}%</div>
            <p className="text-xs text-zinc-500 mt-1">Leads advanced past stage New</p>
          </CardContent>
        </Card>

        {/* Metric 3 */}
        <Card className="bg-[#09090b]/40 border-zinc-800 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-zinc-400">Total Sales Value</CardTitle>
            <CreditCard className="w-4 h-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-zinc-100">
              ₹{totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-zinc-500 mt-1">Invoiced + Procuring orders</p>
          </CardContent>
        </Card>

        {/* Metric 4 */}
        <Card className="bg-[#09090b]/40 border-zinc-800 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-zinc-400">Subscription Tier</CardTitle>
            <Activity className="w-4 h-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-100 capitalize">
              {subscription?.plan_name || "Free Trial"}
            </div>
            <p className="text-xs text-zinc-500 mt-1.5 flex items-center gap-1.5">
              <span>Leads Limit: {subscription?.no_of_leads === -1 ? "Unlimited" : subscription?.no_of_leads}</span>
              {subscription?.payment_status === "paid" && (
                <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 px-1 py-0 text-[10px]">
                  Active
                </Badge>
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Chart Layout */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Funnel Chart */}
        <Card className="bg-[#09090b]/40 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-zinc-200 font-bold">Leads Pipeline Funnel</CardTitle>
            <CardDescription className="text-zinc-500">Distribution of leads across workflow stages</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnelData} margin={{ top: 20, right: 10, left: -20, bottom: 5 }}>
                <XAxis dataKey="name" stroke="#52525b" fontSize={12} tickLine={false} />
                <YAxis stroke="#52525b" fontSize={12} tickLine={false} />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.03)' }} 
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px' }}
                  labelStyle={{ color: '#a1a1aa' }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {funnelData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Revenue Area Chart */}
        <Card className="bg-[#09090b]/40 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-zinc-200 font-bold">Revenue Growth Trend</CardTitle>
            <CardDescription className="text-zinc-500">Total invoice accumulation over sales timeline</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartTrendData} margin={{ top: 20, right: 10, left: 10, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorAmt" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="#52525b" fontSize={11} tickLine={false} />
                <YAxis 
                  stroke="#52525b" 
                  fontSize={11} 
                  tickLine={false} 
                  tickFormatter={(val) => `₹${val/1000}k`} 
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px' }}
                  labelStyle={{ color: '#a1a1aa' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="amount" 
                  stroke="#6366f1" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorAmt)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Activity Logs & Quick Stats */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Activity Logs */}
        <Card className="md:col-span-2 bg-[#09090b]/40 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-zinc-200 font-bold flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-500" />
              Recent System Transitions
            </CardTitle>
            <CardDescription className="text-zinc-500">Audit trail of lead status advancements</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {logs.length > 0 ? (
              logs.map((log) => (
                <div key={log.id} className="flex gap-4 p-3 border border-zinc-800/60 rounded-xl bg-zinc-950/20">
                  <div className="h-8 w-8 rounded-full bg-zinc-900 border border-zinc-850 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-zinc-300">
                      {log.note || "Lead workflow state changed"}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      {log.from_status && (
                        <Badge variant="outline" className="text-[10px] text-zinc-500 border-zinc-800">
                          {log.from_status.replace(/_/g, ' ')}
                        </Badge>
                      )}
                      {log.from_status && <span className="text-zinc-600 text-xs">→</span>}
                      {log.to_status && (
                        <Badge variant="secondary" className="text-[10px] bg-indigo-500/10 text-indigo-400 border-indigo-500/20">
                          {log.to_status.replace(/_/g, ' ')}
                        </Badge>
                      )}
                      <span className="text-[10px] text-zinc-500 ml-auto">
                        {new Date(log.created_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-zinc-500 text-sm">No activity logs recorded.</div>
            )}
          </CardContent>
        </Card>

        {/* Quick Links */}
        <Card className="bg-[#09090b]/40 border-zinc-800 flex flex-col justify-between">
          <CardHeader>
            <CardTitle className="text-zinc-200 font-bold">Quick Actions</CardTitle>
            <CardDescription className="text-zinc-500">Shortcuts to manage pipeline</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              variant="outline" 
              className="w-full border-zinc-800 hover:bg-zinc-900 text-zinc-300 flex justify-between items-center group py-6 rounded-xl"
              onClick={() => window.location.hash = "/leads"} // Simple hash or navigation routing trigger
            >
              <span className="flex items-center gap-3">
                <FolderPlus className="w-4 h-4 text-indigo-400" />
                Add New Lead
              </span>
              <ArrowUpRight className="w-4 h-4 text-zinc-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </Button>

            <Button 
              variant="outline" 
              className="w-full border-zinc-800 hover:bg-zinc-900 text-zinc-300 flex justify-between items-center group py-6 rounded-xl"
              onClick={() => window.location.hash = "/orders"}
            >
              <span className="flex items-center gap-3">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                Billing Center
              </span>
              <ArrowUpRight className="w-4 h-4 text-zinc-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </Button>
          </CardContent>
          <div className="p-6 pt-0 text-[10px] text-zinc-500">
            *Powered by Antigravity AI Engine. Multi-tenant workspace synchronization active.
          </div>
        </Card>
      </div>
    </div>
  );
}
