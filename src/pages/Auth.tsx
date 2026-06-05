import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, Lock, Mail, User, Phone } from "lucide-react";
import { CRMService, Organisation } from "@/lib/crm-service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export default function Auth() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [organisations, setOrganisations] = useState<Organisation[]>([]);
  
  // Form fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [orgOption, setOrgOption] = useState<"create" | "join">("create");
  const [newOrgName, setNewOrgName] = useState("");
  const [selectedOrgId, setSelectedOrgId] = useState("");

  useEffect(() => {
    async function loadOrgs() {
      try {
        const data = await CRMService.getOrganisations();
        setOrganisations(data);
        if (data.length > 0) {
          setSelectedOrgId(data[0].id);
        }
      } catch (err) {
        console.error("Failed to load organisations", err);
      }
    }
    loadOrgs();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!email) {
      toast.error("Please enter your email or name");
      setLoading(false);
      return;
    }

    try {
      if (isLogin) {
        // Log in
        const user = await CRMService.login(email, password || undefined);
        toast.success(`Welcome back, ${user.name}!`);
        navigate("/");
      } else {
        // Sign up
        if (!name) {
          toast.error("Please enter your full name");
          setLoading(false);
          return;
        }

        if (orgOption === "create" && !newOrgName) {
          toast.error("Please enter a name for your new organization");
          setLoading(false);
          return;
        }

        const user = await CRMService.signup(
          name,
          email,
          password || undefined,
          orgOption === "create" ? newOrgName : undefined,
          orgOption === "join",
          orgOption === "join" ? selectedOrgId : undefined
        );

        toast.success(`Account created successfully! Welcome to ${orgOption === 'create' ? newOrgName : 'the CRM'}.`);
        navigate("/");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Authentication failed. Check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#020202] text-zinc-100 p-4 relative overflow-hidden">
      {/* Decorative background glow circles */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[35rem] h-[35rem] bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[30rem] h-[30rem] bg-purple-600/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-lg z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="p-3.5 bg-indigo-600 rounded-2xl shadow-xl shadow-indigo-600/30 mb-4 animate-bounce duration-1000">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
            Antigravity CRM Portal
          </h1>
          <p className="text-sm text-zinc-400 mt-2 font-medium">
            Multi-Tenant Enterprise Customer Pipeline Manager
          </p>
        </div>

        <Card className="border-zinc-800 bg-[#09090b]/80 backdrop-blur-md shadow-2xl">
          <CardHeader>
            <CardTitle className="text-2xl text-zinc-100">
              {isLogin ? "Welcome Back" : "Register Enterprise Account"}
            </CardTitle>
            <CardDescription className="text-zinc-400">
              {isLogin 
                ? "Enter your credentials or name to log in to your dashboard." 
                : "Create a user profile and configure your tenant organization space."}
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              
              {/* Name (Signup only) */}
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-zinc-300">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 w-4 h-4 text-zinc-500" />
                    <Input
                      id="name"
                      placeholder="e.g. Prince Jain"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="pl-10 bg-zinc-950 border-zinc-800 text-zinc-100 focus-visible:ring-indigo-600 focus-visible:ring-offset-0"
                    />
                  </div>
                </div>
              )}

              {/* Email / Username */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-zinc-300">
                  {isLogin ? "Email or Name" : "Email Address"}
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-4 h-4 text-zinc-500" />
                  <Input
                    id="email"
                    type="text"
                    placeholder="prince@crm.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 bg-zinc-950 border-zinc-800 text-zinc-100 focus-visible:ring-indigo-600 focus-visible:ring-offset-0"
                    required
                  />
                </div>
                {isLogin && (
                  <p className="text-[11px] text-zinc-500 mt-0.5">
                    *Tip: Offline mode allows signing in using name strings (e.g. &quot;prince&quot; or &quot;rajesh&quot;).
                  </p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-zinc-300">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-4 h-4 text-zinc-500" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 bg-zinc-950 border-zinc-800 text-zinc-100 focus-visible:ring-indigo-600 focus-visible:ring-offset-0"
                  />
                </div>
                {isLogin && (
                  <p className="text-[11px] text-zinc-500 mt-0.5">
                    *Tip: Leave password blank for instant offline guest login.
                  </p>
                )}
              </div>

              {/* Tenant Configurations (Signup only) */}
              {!isLogin && (
                <div className="space-y-4 pt-2 border-t border-zinc-800">
                  <Label className="text-sm font-semibold text-zinc-300 block mb-2">Organization Setup</Label>
                  <RadioGroup 
                    value={orgOption} 
                    onValueChange={(val) => setOrgOption(val as "create" | "join")}
                    className="flex gap-4 mb-3"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="create" id="create" className="border-zinc-700 text-indigo-600 focus:ring-indigo-600" />
                      <Label htmlFor="create" className="text-zinc-300 text-sm cursor-pointer">Create Brand New Org</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="join" id="join" className="border-zinc-700 text-indigo-600 focus:ring-indigo-600" />
                      <Label htmlFor="join" className="text-zinc-300 text-sm cursor-pointer">Join Existing Org</Label>
                    </div>
                  </RadioGroup>

                  {orgOption === "create" ? (
                    <div className="space-y-2">
                      <Label htmlFor="newOrg" className="text-zinc-300">New Organization Name</Label>
                      <Input
                        id="newOrg"
                        placeholder="e.g. Acme Corporations"
                        value={newOrgName}
                        onChange={(e) => setNewOrgName(e.target.value)}
                        className="bg-zinc-950 border-zinc-800 text-zinc-100 focus-visible:ring-indigo-600 focus-visible:ring-offset-0"
                      />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label htmlFor="selectOrg" className="text-zinc-300">Select Organization</Label>
                      <Select value={selectedOrgId} onValueChange={setSelectedOrgId}>
                        <SelectTrigger className="bg-zinc-950 border-zinc-800 text-zinc-100 focus:ring-indigo-600">
                          <SelectValue placeholder="Select an organization to join" />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-100">
                          {organisations.map((org) => (
                            <SelectItem key={org.id} value={org.id} className="focus:bg-zinc-800 focus:text-zinc-100">
                              {org.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              )}

            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button 
                type="submit" 
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 shadow-lg shadow-indigo-600/20 rounded-lg"
                disabled={loading}
              >
                {loading ? "Processing..." : isLogin ? "Log In" : "Register Account"}
              </Button>
              <div className="text-center text-xs">
                <span className="text-zinc-400">
                  {isLogin ? "Don't have an enterprise account?" : "Already have an account?"}
                </span>{" "}
                <button
                  type="button"
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-indigo-400 hover:underline hover:text-indigo-300 font-semibold focus:outline-none"
                >
                  {isLogin ? "Sign Up" : "Log In"}
                </button>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
