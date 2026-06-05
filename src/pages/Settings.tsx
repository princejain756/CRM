import { useEffect, useState } from "react";
import { 
  Building, 
  Users, 
  CreditCard, 
  Check, 
  Sparkles,
  Save,
  ShieldAlert
} from "lucide-react";
import { CRMService, Organisation, Profile, OrganisationSubscription, SubscriptionType } from "@/lib/crm-service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";

export default function Settings() {
  const [organisation, setOrganisation] = useState<Organisation | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [subscription, setSubscription] = useState<(OrganisationSubscription & { plan_name?: string }) | null>(null);
  const [plans, setPlans] = useState<SubscriptionType[]>([]);
  const [loading, setLoading] = useState(true);

  // Form Fields for Org
  const [orgName, setOrgName] = useState("");
  const [orgPhone, setOrgPhone] = useState("");
  const [orgEmail, setOrgEmail] = useState("");
  const [orgAddress, setOrgAddress] = useState("");
  const [orgGstin, setOrgGstin] = useState("");
  const [orgState, setOrgState] = useState("");

  const loadData = async () => {
    try {
      const currentUser = await CRMService.getCurrentUser();
      if (!currentUser) return;

      const orgs = await CRMService.getOrganisations();
      const org = orgs.find(o => o.id === currentUser.organisation_id) || null;
      if (org) {
        setOrganisation(org);
        setOrgName(org.name);
        setOrgPhone(org.phone || "");
        setOrgEmail(org.email || "");
        setOrgAddress(org.address || "");
        setOrgGstin(org.gstin || "");
        setOrgState(org.state || "");
      }

      const team = await CRMService.getProfiles();
      setProfiles(team);

      const sub = await CRMService.getOrganisationSubscription();
      setSubscription(sub);

      const allPlans = await CRMService.getSubscriptionTypes();
      setPlans(allPlans);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load settings data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organisation) return;

    try {
      // For simplicity in mock layer or Supabase, we update our local state/DB
      // We simulate or update the Organisation
      const orgs = JSON.parse(localStorage.getItem("crm_organisations") || "[]");
      const idx = orgs.findIndex((o: any) => o.id === organisation.id);
      if (idx !== -1) {
        orgs[idx] = {
          ...orgs[idx],
          name: orgName,
          phone: orgPhone,
          email: orgEmail,
          address: orgAddress,
          gstin: orgGstin,
          state: orgState,
          updated_at: new Date().toISOString()
        };
        localStorage.setItem("crm_organisations", JSON.stringify(orgs));
        toast.success("Organization profile saved successfully.");
        loadData();
      } else {
        toast.error("Organization profile could not be located.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to save organization profile.");
    }
  };

  const handleUpgradePlan = async (planId: string) => {
    try {
      await CRMService.updateSubscriptionPlan(planId);
      toast.success("Subscription updated successfully! Billing sync complete.");
      loadData();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update subscription plan.");
    }
  };

  const getRoleBadge = (role: string) => {
    const roles: Record<string, { label: string; style: string }> = {
      admin: { label: "Super Admin", style: "bg-red-500/10 text-red-400 border-red-500/20" },
      organisation_admin: { label: "Org Admin", style: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" },
      manager: { label: "Manager", style: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
      sales_person: { label: "Sales Rep", style: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" }
    };
    const config = roles[role] || { label: role, style: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20" };
    return <Badge variant="outline" className={`text-[10px] ${config.style}`}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-zinc-400">
        <div className="w-8 h-8 rounded-full border border-t-indigo-500 border-indigo-900 animate-spin"></div>
        <span className="mt-3 text-xs tracking-wider">Loading System Parameters...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-3xl font-extrabold tracking-tight text-zinc-100">System Settings</h2>
        <p className="text-sm text-zinc-400 mt-1">Configure company profiles, manage users, and subscription tiers.</p>
      </div>

      <Tabs defaultValue="company" className="space-y-6">
        <TabsList className="bg-zinc-950 border border-zinc-850 p-1 rounded-xl">
          <TabsTrigger value="company" className="rounded-lg text-sm px-4 py-2 gap-2 text-zinc-400 data-[state=active]:bg-zinc-900 data-[state=active]:text-indigo-400">
            <Building className="w-4 h-4" />
            Company profile
          </TabsTrigger>
          <TabsTrigger value="team" className="rounded-lg text-sm px-4 py-2 gap-2 text-zinc-400 data-[state=active]:bg-zinc-900 data-[state=active]:text-indigo-400">
            <Users className="w-4 h-4" />
            Team Directory
          </TabsTrigger>
          <TabsTrigger value="billing" className="rounded-lg text-sm px-4 py-2 gap-2 text-zinc-400 data-[state=active]:bg-zinc-900 data-[state=active]:text-indigo-400">
            <CreditCard className="w-4 h-4" />
            Billing & Plans
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Organization Settings */}
        <TabsContent value="company">
          <Card className="bg-[#09090b]/40 border-zinc-800 shadow-md max-w-2xl">
            <CardHeader>
              <CardTitle className="text-zinc-200">Organization Settings</CardTitle>
              <CardDescription className="text-zinc-500">Modify organization details and GST configurations.</CardDescription>
            </CardHeader>
            <form onSubmit={handleSaveOrg}>
              <CardContent className="space-y-4">
                
                {/* Org Name */}
                <div className="space-y-1.5">
                  <Label htmlFor="orgName">Organization Name</Label>
                  <Input
                    id="orgName"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    className="bg-zinc-950 border-zinc-800 text-zinc-100 focus-visible:ring-indigo-600"
                    required
                  />
                </div>

                {/* Grid: Phone / Email */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="orgPhone">Support Line</Label>
                    <Input
                      id="orgPhone"
                      value={orgPhone}
                      onChange={(e) => setOrgPhone(e.target.value)}
                      className="bg-zinc-950 border-zinc-800 text-zinc-100"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="orgEmail">Billing Email</Label>
                    <Input
                      id="orgEmail"
                      type="email"
                      value={orgEmail}
                      onChange={(e) => setOrgEmail(e.target.value)}
                      className="bg-zinc-950 border-zinc-800 text-zinc-100"
                    />
                  </div>
                </div>

                {/* Grid: State / GST */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="orgState">Billing Region / State</Label>
                    <Input
                      id="orgState"
                      value={orgState}
                      onChange={(e) => setOrgState(e.target.value)}
                      className="bg-zinc-950 border-zinc-800 text-zinc-100"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="orgGstin">Corporate GSTIN No.</Label>
                    <Input
                      id="orgGstin"
                      value={orgGstin}
                      onChange={(e) => setOrgGstin(e.target.value)}
                      className="bg-zinc-950 border-zinc-800 text-zinc-100 font-mono text-sm uppercase"
                    />
                  </div>
                </div>

                {/* Address */}
                <div className="space-y-1.5">
                  <Label htmlFor="orgAddress">Physical Address</Label>
                  <Input
                    id="orgAddress"
                    value={orgAddress}
                    onChange={(e) => setOrgAddress(e.target.value)}
                    className="bg-zinc-950 border-zinc-800 text-zinc-100"
                  />
                </div>

              </CardContent>
              <CardFooter className="border-t border-zinc-850 pt-4 flex justify-end">
                <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
                  <Save className="w-4 h-4" />
                  Save Company Profile
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>

        {/* Tab 2: Team Directory */}
        <TabsContent value="team">
          <Card className="bg-[#09090b]/40 border-zinc-800 shadow-md">
            <CardHeader>
              <CardTitle className="text-zinc-200">Team Members Directory</CardTitle>
              <CardDescription className="text-zinc-500">Active users associated with this tenant workspace.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-zinc-900/40 border-zinc-850">
                  <TableRow className="border-zinc-850 hover:bg-transparent">
                    <TableHead className="text-zinc-400 font-semibold">Name</TableHead>
                    <TableHead className="text-zinc-400 font-semibold w-40">Role Badge</TableHead>
                    <TableHead className="text-zinc-400 font-semibold">Contact Phone</TableHead>
                    <TableHead className="text-zinc-400 font-semibold">Whatsapp</TableHead>
                    <TableHead className="text-zinc-400 font-semibold w-32">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {profiles.map((profile) => (
                    <TableRow key={profile.id} className="border-zinc-850 hover:bg-zinc-900/10 text-zinc-300">
                      <TableCell className="font-semibold text-zinc-200">{profile.name}</TableCell>
                      <TableCell>{getRoleBadge(profile.role)}</TableCell>
                      <TableCell>{profile.phone || "-"}</TableCell>
                      <TableCell>{profile.whatsapp_number || "-"}</TableCell>
                      <TableCell>
                        <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0 text-[10px]">
                          Active
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: SaaS Subscription Plans */}
        <TabsContent value="billing" className="space-y-6">
          {/* Active plan summary */}
          {subscription && (
            <Card className="bg-[#09090b]/40 border-zinc-800 shadow-md max-w-lg border-l-4 border-l-indigo-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-zinc-200 text-lg font-bold">Active SaaS Subscription</CardTitle>
                <CardDescription className="text-zinc-550 text-xs">Plan details associated with your tenant organization.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between border-b border-zinc-900 pb-2">
                  <span className="text-sm text-zinc-400">Current Plan:</span>
                  <span className="text-sm font-bold text-indigo-400 capitalize">{subscription.plan_name}</span>
                </div>
                <div className="flex justify-between border-b border-zinc-900 pb-2">
                  <span className="text-sm text-zinc-400">Leads Capacity:</span>
                  <span className="text-sm font-bold text-zinc-200">
                    {subscription.no_of_leads === -1 ? "Unlimited" : `${subscription.no_of_leads} leads`}
                  </span>
                </div>
                <div className="flex justify-between border-b border-zinc-900 pb-2">
                  <span className="text-sm text-zinc-400">Subscription Cost:</span>
                  <span className="text-sm font-bold text-zinc-200">₹{Number(subscription.total_price).toLocaleString()} / month</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-zinc-400">Expiration Date:</span>
                  <span className="text-sm font-bold text-zinc-200">
                    {new Date(subscription.expiry_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Pricing Options */}
          <div>
            <h3 className="text-xl font-bold text-zinc-200 mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              Upgrade Enterprise Pipelines
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {plans.map((plan) => {
                const isActive = subscription?.subscription_type_id === plan.id;
                return (
                  <Card key={plan.id} className={`bg-[#09090b]/40 border-zinc-800 flex flex-col justify-between hover:border-zinc-700 transition-colors shadow-md relative ${
                    isActive ? "ring-1 ring-indigo-500 border-zinc-750" : ""
                  }`}>
                    {isActive && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white font-bold text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-md">
                        Active Tier
                      </span>
                    )}
                    <CardHeader className="pt-6">
                      <span className="text-xs text-zinc-500 font-semibold tracking-wide uppercase">SaaS Pipeline</span>
                      <CardTitle className="text-xl font-black text-zinc-250 mt-1 capitalize">{plan.name}</CardTitle>
                      <CardDescription className="text-zinc-500 text-xs min-h-[40px] mt-2 leading-relaxed">
                        {plan.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="py-2">
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-black text-zinc-100">₹{Number(plan.price).toLocaleString()}</span>
                        <span className="text-zinc-500 text-xs font-semibold">/{plan.validity_days} days</span>
                      </div>
                      <div className="mt-4 pt-3 border-t border-zinc-900 space-y-2 text-xs text-zinc-400">
                        <p className="flex items-center gap-2">
                          <Check className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Limit: {plan.no_of_leads === -1 ? "Unlimited" : `${plan.no_of_leads} leads`}</span>
                        </p>
                        <p className="flex items-center gap-2">
                          <Check className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Multi-tenant Isolation</span>
                        </p>
                        <p className="flex items-center gap-2">
                          <Check className="w-3.5 h-3.5 text-indigo-400" />
                          <span>PostgreSQL RLS active</span>
                        </p>
                      </div>
                    </CardContent>
                    <CardFooter className="pt-4 pb-6">
                      <Button
                        onClick={() => handleUpgradePlan(plan.id)}
                        variant={isActive ? "secondary" : "default"}
                        className={`w-full py-2 ${
                          isActive 
                            ? "bg-indigo-600/10 hover:bg-indigo-600/15 text-indigo-400 border border-indigo-500/20 font-bold" 
                            : "bg-indigo-600 hover:bg-indigo-700 text-white font-medium"
                        }`}
                        disabled={isActive}
                      >
                        {isActive ? "Current Plan" : "Upgrade Plan"}
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
