import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, 
  Users, 
  ReceiptText, 
  Settings, 
  LogOut, 
  Menu, 
  X, 
  Building2, 
  UserCircle 
} from "lucide-react";
import { CRMService, Profile, Organisation } from "@/lib/crm-service";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface SidebarLayoutProps {
  children: React.ReactNode;
}

export default function SidebarLayout({ children }: SidebarLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [org, setOrg] = useState<Organisation | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    async function loadUser() {
      try {
        const user = await CRMService.getCurrentUser();
        if (!user) {
          navigate("/auth");
          return;
        }
        setCurrentUser(user);

        const orgs = await CRMService.getOrganisations();
        const userOrg = orgs.find(o => o.id === user.organisation_id);
        if (userOrg) {
          setOrg(userOrg);
        }
      } catch (err) {
        console.error("Failed to load user in Layout", err);
      } finally {
        setLoading(false);
      }
    }
    loadUser();
  }, [navigate]);

  const handleLogout = async () => {
    await CRMService.logout();
    navigate("/auth");
  };

  const navItems = [
    { name: "Dashboard", path: "/", icon: LayoutDashboard },
    { name: "Leads Manager", path: "/leads", icon: Users },
    { name: "Orders & Billing", path: "/orders", icon: ReceiptText },
    { name: "Settings", path: "/settings", icon: Settings },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#09090b] text-white">
        <div className="relative flex flex-col items-center">
          <div className="w-12 h-12 rounded-full border-2 border-t-indigo-500 border-indigo-900 animate-spin"></div>
          <span className="mt-4 text-muted-foreground text-sm font-medium tracking-wide">Loading CRM Panel...</span>
        </div>
      </div>
    );
  }

  const roleLabels: Record<string, { label: string; color: string }> = {
    admin: { label: "Super Admin", color: "bg-red-500/15 text-red-400 border-red-500/30" },
    organisation_admin: { label: "Org Admin", color: "bg-indigo-500/15 text-indigo-400 border-indigo-500/30" },
    manager: { label: "Manager", color: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
    sales_person: { label: "Sales Rep", color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
  };

  const currentRole = currentUser ? roleLabels[currentUser.role] || { label: currentUser.role, color: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30" } : null;

  return (
    <div className="min-h-screen flex bg-[#030303] text-zinc-100 font-sans selection:bg-indigo-500 selection:text-white">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 border-r border-zinc-800 bg-[#09090b]/80 backdrop-blur-md sticky top-0 h-screen">
        {/* Brand Logo */}
        <div className="p-6 border-b border-zinc-800 flex items-center gap-3">
          <div className="p-2 bg-indigo-600 rounded-lg shadow-lg shadow-indigo-600/35">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">Antigravity CRM</h1>
            <span className="text-xs text-indigo-400 font-medium">Enterprise Portal</span>
          </div>
        </div>

        {/* Tenant/Org Switcher Card */}
        {org && (
          <div className="mx-4 my-4 p-3 bg-zinc-900/60 border border-zinc-800/80 rounded-xl flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-400 font-semibold text-sm">
              {org.name.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs text-zinc-500 font-semibold uppercase tracking-wider">Active Tenant</p>
              <p className="text-sm font-semibold text-zinc-200 truncate">{org.name}</p>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-4 py-4 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 group ${
                  isActive
                    ? "bg-indigo-600/10 text-indigo-400 border border-indigo-500/20"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40 border border-transparent"
                }`}
              >
                <Icon className={`w-4 h-4 transition-transform duration-200 ${
                  isActive ? "text-indigo-400" : "text-zinc-500 group-hover:text-zinc-300 group-hover:scale-110"
                }`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Profile Footer */}
        {currentUser && (
          <div className="p-4 border-t border-zinc-800 bg-zinc-950/40">
            <div className="flex items-center gap-3 mb-4">
              <UserCircle className="w-9 h-9 text-zinc-500" />
              <div className="overflow-hidden">
                <p className="text-sm font-semibold text-zinc-200 truncate">{currentUser.name}</p>
                {currentRole && (
                  <Badge variant="outline" className={`mt-0.5 text-[10px] px-1.5 py-0 ${currentRole.color}`}>
                    {currentRole.label}
                  </Badge>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 text-zinc-400 hover:text-red-400 hover:bg-red-950/20 py-2 border border-zinc-800 hover:border-red-900/30 rounded-lg text-xs"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </Button>
          </div>
        )}
      </aside>

      {/* Mobile Sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden bg-black/60 backdrop-blur-sm">
          <aside className="w-64 max-w-xs bg-[#09090b] border-r border-zinc-850 p-6 flex flex-col h-full animate-in slide-in-from-left duration-200">
            <div className="flex items-center justify-between pb-6 border-b border-zinc-800">
              <div className="flex items-center gap-3">
                <Building2 className="w-6 h-6 text-indigo-500" />
                <span className="font-bold text-base text-zinc-200">CRM Portal</span>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setMobileOpen(false)}>
                <X className="w-5 h-5 text-zinc-400" />
              </Button>
            </div>

            <nav className="flex-1 py-6 space-y-1.5">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? "bg-indigo-600/10 text-indigo-400 border border-indigo-500/20"
                        : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40 border border-transparent"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            {currentUser && (
              <div className="border-t border-zinc-800 pt-6">
                <div className="flex items-center gap-3 mb-4">
                  <UserCircle className="w-9 h-9 text-zinc-500" />
                  <div>
                    <p className="text-sm font-semibold text-zinc-200 truncate">{currentUser.name}</p>
                    {currentRole && (
                      <Badge variant="outline" className={`mt-0.5 text-[10px] px-1.5 py-0 ${currentRole.color}`}>
                        {currentRole.label}
                      </Badge>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 text-zinc-400 hover:text-red-400 hover:bg-red-950/20 py-2 border border-zinc-800 rounded-lg text-xs"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out
                </Button>
              </div>
            )}
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-x-hidden min-w-0">
        {/* Mobile Header Bar */}
        <header className="flex md:hidden items-center justify-between px-6 py-4 border-b border-zinc-800 bg-[#09090b]/80 backdrop-blur-md sticky top-0 z-40">
          <div className="flex items-center gap-3">
            <Building2 className="w-6 h-6 text-indigo-500" />
            <span className="font-bold text-base text-zinc-200">CRM Portal</span>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setMobileOpen(true)}>
            <Menu className="w-6 h-6 text-zinc-400" />
          </Button>
        </header>

        {/* Content Wrapper */}
        <main className="flex-1 p-6 md:p-10 max-w-7xl w-full mx-auto animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  );
}
