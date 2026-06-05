import { useEffect, useState } from "react";
import { 
  Plus, 
  Search, 
  LayoutGrid, 
  List, 
  MoreVertical, 
  Edit2, 
  Trash2, 
  ChevronRight, 
  ChevronLeft,
  Building,
  Phone,
  Mail,
  Calendar
} from "lucide-react";
import { CRMService, Lead, LeadStatus, LeadSource } from "@/lib/crm-service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

// Grouping statuses for the Kanban columns
const KANBAN_STAGES: { id: LeadStatus; label: string; color: string }[] = [
  { id: "new", label: "New Leads", color: "border-t-indigo-500 bg-indigo-500/5" },
  { id: "order_placed", label: "Order Placed", color: "border-t-blue-500 bg-blue-500/5" },
  { id: "procurement_waiting", label: "Procuring", color: "border-t-amber-500 bg-amber-500/5" },
  { id: "bill_generated", label: "Bill Invoiced", color: "border-t-emerald-500 bg-emerald-500/5" },
  { id: "closed", label: "Closed Won", color: "border-t-zinc-650 bg-zinc-700/5" }
];

export default function Leads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");
  const [searchQuery, setSearchQuery] = useState("");
  const [sourceFilter, setSourceFilter] = useState<string>("all");

  // Dialog State
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);

  // Form Fields
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formSource, setFormSource] = useState<LeadSource>("other");
  const [formState, setFormState] = useState("");
  const [formGstin, setFormGstin] = useState("");
  const [formAddress, setFormAddress] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [formStatus, setFormStatus] = useState<LeadStatus>("new");

  const loadLeads = async () => {
    try {
      const data = await CRMService.getLeads();
      setLeads(data);
    } catch (err) {
      console.error("Failed to load leads", err);
      toast.error("Failed to retrieve leads list.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeads();
  }, []);

  const openCreateDialog = () => {
    setEditingLead(null);
    setFormName("");
    setFormEmail("");
    setFormPhone("");
    setFormSource("other");
    setFormState("");
    setFormGstin("");
    setFormAddress("");
    setFormNotes("");
    setFormStatus("new");
    setDialogOpen(true);
  };

  const openEditDialog = (lead: Lead) => {
    setEditingLead(lead);
    setFormName(lead.name);
    setFormEmail(lead.email || "");
    setFormPhone(lead.phone || "");
    setFormSource(lead.from_source);
    setFormState(lead.state || "");
    setFormGstin(lead.gstin || "");
    setFormAddress(lead.address || "");
    setFormNotes(lead.notes || "");
    setFormStatus(lead.status);
    setDialogOpen(true);
  };

  const handleSaveLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName) {
      toast.error("Lead name is required");
      return;
    }

    try {
      if (editingLead) {
        // Edit lead
        await CRMService.updateLead(editingLead.id, {
          name: formName,
          email: formEmail || undefined,
          phone: formPhone || undefined,
          from_source: formSource,
          state: formState || undefined,
          gstin: formGstin || undefined,
          address: formAddress || undefined,
          notes: formNotes || undefined,
          status: formStatus
        });
        toast.success("Lead details updated.");
      } else {
        // Create lead
        const user = await CRMService.getCurrentUser();
        if (!user) return;
        
        await CRMService.createLead({
          organisation_id: user.organisation_id || "",
          user_id: user.id,
          name: formName,
          email: formEmail || undefined,
          phone: formPhone || undefined,
          from_source: formSource,
          state: formState || undefined,
          gstin: formGstin || undefined,
          address: formAddress || undefined,
          notes: formNotes || undefined,
          status: formStatus,
          date_open: new Date().toISOString()
        });
        toast.success("New lead created.");
      }
      setDialogOpen(false);
      loadLeads();
    } catch (err) {
      console.error(err);
      toast.error("Failed to save lead.");
    }
  };

  const handleDeleteLead = async (id: string) => {
    if (!confirm("Are you sure you want to delete this lead?")) return;
    try {
      await CRMService.deleteLead(id);
      toast.success("Lead deleted successfully.");
      loadLeads();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete lead.");
    }
  };

  const handleMoveStatus = async (lead: Lead, direction: "next" | "prev") => {
    const currentIndex = KANBAN_STAGES.findIndex(s => s.id === lead.status);
    if (currentIndex === -1) return;

    let nextIndex = currentIndex;
    if (direction === "next" && currentIndex < KANBAN_STAGES.length - 1) {
      nextIndex = currentIndex + 1;
    } else if (direction === "prev" && currentIndex > 0) {
      nextIndex = currentIndex - 1;
    }

    if (nextIndex === currentIndex) return;
    const newStatus = KANBAN_STAGES[nextIndex].id;

    try {
      await CRMService.updateLead(lead.id, { 
        status: newStatus,
        date_closed: newStatus === "closed" ? new Date().toISOString() : undefined
      });
      toast.success(`Moved lead to ${KANBAN_STAGES[nextIndex].label}`);
      loadLeads();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update status.");
    }
  };

  // --- FILTER & SEARCH ---
  const filteredLeads = leads.filter((lead) => {
    const matchesSearch = 
      lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.lead_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (lead.phone && lead.phone.includes(searchQuery)) ||
      (lead.email && lead.email.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesSource = sourceFilter === "all" ? true : lead.from_source === sourceFilter;

    return matchesSearch && matchesSource;
  });

  const getSourceBadgeColor = (source: LeadSource) => {
    const styles: Record<LeadSource, string> = {
      whatsapp: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      email: "bg-blue-500/10 text-blue-400 border-blue-500/20",
      phone: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
      website: "bg-purple-500/10 text-purple-400 border-purple-500/20",
      referral: "bg-amber-500/10 text-amber-400 border-amber-500/20",
      social_media: "bg-pink-500/10 text-pink-400 border-pink-500/20",
      other: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
    };
    return styles[source] || styles.other;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-zinc-400">
        <div className="w-8 h-8 rounded-full border border-t-indigo-500 border-indigo-900 animate-spin"></div>
        <span className="mt-3 text-xs tracking-wider">Loading Leads database...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-zinc-100">Leads Manager</h2>
          <p className="text-sm text-zinc-400 mt-1">Manage and transition client pipelines.</p>
        </div>
        <Button onClick={openCreateDialog} className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 h-10 shadow-lg shadow-indigo-600/15">
          <Plus className="w-4 h-4" />
          Add Customer Lead
        </Button>
      </div>

      {/* Filter / View Toggles */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-zinc-900/40 border border-zinc-800 rounded-xl">
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          {/* Search Bar */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 w-4.5 h-4.5 text-zinc-500" />
            <Input
              placeholder="Search leads, ID, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-zinc-950 border-zinc-800 text-zinc-100 placeholder:text-zinc-550 h-10 focus-visible:ring-indigo-600"
            />
          </div>

          {/* Source Filter */}
          <Select value={sourceFilter} onValueChange={setSourceFilter}>
            <SelectTrigger className="w-full sm:w-44 bg-zinc-950 border-zinc-800 text-zinc-300 h-10">
              <SelectValue placeholder="Filter Source" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-zinc-850 text-zinc-100">
              <SelectItem value="all">All Sources</SelectItem>
              <SelectItem value="whatsapp">WhatsApp</SelectItem>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="phone">Phone Call</SelectItem>
              <SelectItem value="website">Website</SelectItem>
              <SelectItem value="referral">Referral</SelectItem>
              <SelectItem value="social_media">Social Media</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1.5 bg-zinc-950 p-1 border border-zinc-850 rounded-lg self-end sm:self-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setViewMode("kanban")}
            className={`px-3 py-1.5 h-8 gap-2 ${viewMode === "kanban" ? "bg-zinc-900 text-indigo-400 font-semibold" : "text-zinc-500 hover:text-zinc-300"}`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            Pipeline Board
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setViewMode("list")}
            className={`px-3 py-1.5 h-8 gap-2 ${viewMode === "list" ? "bg-zinc-900 text-indigo-400 font-semibold" : "text-zinc-500 hover:text-zinc-300"}`}
          >
            <List className="w-3.5 h-3.5" />
            Spreadsheet List
          </Button>
        </div>
      </div>

      {/* --- KANBAN BOARD VIEW --- */}
      {viewMode === "kanban" && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 items-start overflow-x-auto pb-4">
          {KANBAN_STAGES.map((stage) => {
            const stageLeads = filteredLeads.filter((l) => {
              if (stage.id === "procurement_waiting") {
                // Group all procurement related leads here
                return l.status.includes("procurement") || l.status === "partial_procurement_approved";
              }
              return l.status === stage.id;
            });
            return (
              <div 
                key={stage.id} 
                className={`flex flex-col border border-zinc-850 rounded-xl p-4 min-h-[500px] max-h-[700px] overflow-y-auto border-t-2 ${stage.color}`}
              >
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-zinc-800">
                  <h3 className="font-bold text-zinc-250 text-sm">{stage.label}</h3>
                  <Badge variant="secondary" className="bg-zinc-900 border-zinc-800 text-zinc-400 text-xs px-2 py-0">
                    {stageLeads.length}
                  </Badge>
                </div>

                <div className="flex-1 space-y-3">
                  {stageLeads.length > 0 ? (
                    stageLeads.map((lead) => (
                      <Card key={lead.id} className="bg-[#09090b]/80 border-zinc-800/80 hover:border-zinc-700 transition-colors shadow-md group relative">
                        <CardContent className="p-4 space-y-3">
                          {/* ID & Actions */}
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-zinc-500 font-mono font-semibold">{lead.lead_id}</span>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="w-6 h-6 hover:bg-zinc-900">
                                  <MoreVertical className="w-3.5 h-3.5 text-zinc-400" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent className="bg-zinc-900 border-zinc-800 text-zinc-200">
                                <DropdownMenuItem onClick={() => openEditDialog(lead)} className="gap-2 cursor-pointer focus:bg-zinc-850">
                                  <Edit2 className="w-3.5 h-3.5" /> Edit details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDeleteLead(lead.id)} className="gap-2 text-red-400 cursor-pointer focus:bg-zinc-850 focus:text-red-400">
                                  <Trash2 className="w-3.5 h-3.5" /> Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>

                          {/* Client Name */}
                          <div>
                            <h4 className="font-semibold text-sm text-zinc-250 leading-tight group-hover:text-indigo-400 transition-colors">
                              {lead.name}
                            </h4>
                          </div>

                          {/* Contact Info (Icons) */}
                          <div className="space-y-1 text-xs text-zinc-500">
                            {lead.phone && (
                              <div className="flex items-center gap-1.5">
                                <Phone className="w-3 h-3 text-zinc-650" />
                                <span>{lead.phone}</span>
                              </div>
                            )}
                            {lead.email && (
                              <div className="flex items-center gap-1.5 truncate">
                                <Mail className="w-3 h-3 text-zinc-650" />
                                <span>{lead.email}</span>
                              </div>
                            )}
                          </div>

                          {/* Source & Movement arrows */}
                          <div className="flex items-center justify-between pt-1 border-t border-zinc-900">
                            <Badge className={`text-[9px] px-2 py-0 border ${getSourceBadgeColor(lead.from_source)}`}>
                              {lead.from_source}
                            </Badge>

                            {/* Arrow advancement */}
                            <div className="flex gap-1">
                              <Button
                                size="icon"
                                variant="outline"
                                className="w-6 h-6 border-zinc-800 hover:bg-zinc-900 hover:text-zinc-200 text-zinc-500 disabled:opacity-20"
                                onClick={() => handleMoveStatus(lead, "prev")}
                                disabled={stage.id === "new"}
                              >
                                <ChevronLeft className="w-3 h-3" />
                              </Button>
                              <Button
                                size="icon"
                                variant="outline"
                                className="w-6 h-6 border-zinc-800 hover:bg-zinc-900 hover:text-zinc-200 text-zinc-500 disabled:opacity-20"
                                onClick={() => handleMoveStatus(lead, "next")}
                                disabled={stage.id === "closed"}
                              >
                                <ChevronRight className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <div className="h-full border border-dashed border-zinc-850 rounded-xl flex items-center justify-center py-12 text-xs text-zinc-600 font-medium">
                      No leads here
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* --- SPREADSHEET LIST VIEW --- */}
      {viewMode === "list" && (
        <Card className="bg-[#09090b]/40 border-zinc-800 shadow-md">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-zinc-900/50 border-zinc-800">
                <TableRow className="border-zinc-800 hover:bg-transparent">
                  <TableHead className="text-zinc-400 font-semibold w-32">Lead ID</TableHead>
                  <TableHead className="text-zinc-400 font-semibold">Client Name</TableHead>
                  <TableHead className="text-zinc-400 font-semibold w-24">Source</TableHead>
                  <TableHead className="text-zinc-400 font-semibold w-36">Status</TableHead>
                  <TableHead className="text-zinc-400 font-semibold">Phone</TableHead>
                  <TableHead className="text-zinc-400 font-semibold">State/GST</TableHead>
                  <TableHead className="text-zinc-400 font-semibold w-28">Date Open</TableHead>
                  <TableHead className="text-zinc-400 font-semibold text-right w-20">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLeads.length > 0 ? (
                  filteredLeads.map((lead) => (
                    <TableRow key={lead.id} className="border-zinc-800/80 hover:bg-zinc-900/20 text-zinc-300">
                      <TableCell className="font-mono text-xs font-semibold">{lead.lead_id}</TableCell>
                      <TableCell className="font-semibold text-zinc-200">{lead.name}</TableCell>
                      <TableCell>
                        <Badge className={`text-[10px] uppercase border ${getSourceBadgeColor(lead.from_source)}`}>
                          {lead.from_source}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className="capitalize text-[10px] bg-zinc-900 border border-zinc-800 text-indigo-400">
                          {lead.status.replace(/_/g, ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm font-medium">{lead.phone || "-"}</TableCell>
                      <TableCell className="text-xs space-y-0.5">
                        <p className="font-semibold text-zinc-400">{lead.state || "Not Specified"}</p>
                        {lead.gstin && <p className="font-mono text-zinc-550">{lead.gstin}</p>}
                      </TableCell>
                      <TableCell className="text-xs text-zinc-500">
                        {new Date(lead.date_open).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="w-8 h-8 hover:bg-zinc-900">
                              <MoreVertical className="w-4 h-4 text-zinc-400" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="bg-zinc-900 border-zinc-800 text-zinc-200" align="end">
                            <DropdownMenuItem onClick={() => openEditDialog(lead)} className="gap-2 cursor-pointer focus:bg-zinc-850">
                              <Edit2 className="w-3.5 h-3.5" /> Edit Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDeleteLead(lead.id)} className="gap-2 text-red-400 cursor-pointer focus:bg-zinc-850 focus:text-red-400">
                              <Trash2 className="w-3.5 h-3.5" /> Delete Lead
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-10 text-zinc-550 font-medium border-none">
                      No leads match your search criteria.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {/* --- LEAD CREATION / MODIFICATION DIALOG --- */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100 max-w-lg">
          <form onSubmit={handleSaveLead}>
            <DialogHeader>
              <DialogTitle className="text-zinc-100 text-xl font-bold">
                {editingLead ? "Edit Customer Lead" : "New Customer Lead Entry"}
              </DialogTitle>
              <DialogDescription className="text-zinc-400">
                Configure details for client and billing parameters.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4 max-h-[450px] overflow-y-auto pr-1">
              {/* Name */}
              <div className="space-y-1.5">
                <Label htmlFor="leadName" className="text-zinc-300">Client / Company Name</Label>
                <Input
                  id="leadName"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Reliance Energy"
                  className="bg-zinc-950 border-zinc-800 text-zinc-100"
                  required
                />
              </div>

              {/* Grid: Phone / Email */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="leadPhone" className="text-zinc-300">Contact Number</Label>
                  <Input
                    id="leadPhone"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="+91 XXXXX XXXXX"
                    className="bg-zinc-950 border-zinc-800 text-zinc-100"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="leadEmail" className="text-zinc-300">Email Address</Label>
                  <Input
                    id="leadEmail"
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="client@company.com"
                    className="bg-zinc-950 border-zinc-800 text-zinc-100"
                  />
                </div>
              </div>

              {/* Grid: State / GSTIN */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="leadState" className="text-zinc-300">State / Region</Label>
                  <Input
                    id="leadState"
                    value={formState}
                    onChange={(e) => setFormState(e.target.value)}
                    placeholder="e.g. Karnataka"
                    className="bg-zinc-950 border-zinc-800 text-zinc-100"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="leadGstin" className="text-zinc-300">GSTIN No.</Label>
                  <Input
                    id="leadGstin"
                    value={formGstin}
                    onChange={(e) => setFormGstin(e.target.value)}
                    placeholder="29AABCJ1234D1Z2"
                    className="bg-zinc-950 border-zinc-800 text-zinc-100 font-mono text-xs uppercase"
                  />
                </div>
              </div>

              {/* Grid: Source / Status */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="leadSource" className="text-zinc-300">Lead Source Channel</Label>
                  <Select value={formSource} onValueChange={(val) => setFormSource(val as LeadSource)}>
                    <SelectTrigger className="bg-zinc-950 border-zinc-800 text-zinc-150">
                      <SelectValue placeholder="Channel" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-100">
                      <SelectItem value="whatsapp">WhatsApp Inquiry</SelectItem>
                      <SelectItem value="email">Email Cold/Inbound</SelectItem>
                      <SelectItem value="phone">Direct Phone Call</SelectItem>
                      <SelectItem value="website">Website Form</SelectItem>
                      <SelectItem value="referral">Internal Referral</SelectItem>
                      <SelectItem value="social_media">Social Networks</SelectItem>
                      <SelectItem value="other">Other channels</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-1.5">
                  <Label htmlFor="leadStatus" className="text-zinc-300">Current Status</Label>
                  <Select value={formStatus} onValueChange={(val) => setFormStatus(val as LeadStatus)}>
                    <SelectTrigger className="bg-zinc-950 border-zinc-800 text-zinc-150">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-100">
                      <SelectItem value="new">New Lead</SelectItem>
                      <SelectItem value="order_placed">Sales Order Placed</SelectItem>
                      <SelectItem value="procurement_waiting">Procurement Waiting</SelectItem>
                      <SelectItem value="bill_generated">Invoices Generated</SelectItem>
                      <SelectItem value="closed">Closed / Finished</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Address */}
              <div className="space-y-1.5">
                <Label htmlFor="leadAddress" className="text-zinc-300">Physical Billing Address</Label>
                <Input
                  id="leadAddress"
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  placeholder="Street details, building number..."
                  className="bg-zinc-950 border-zinc-800 text-zinc-100"
                />
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <Label htmlFor="leadNotes" className="text-zinc-300">Detailed Notes / Requirements</Label>
                <textarea
                  id="leadNotes"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="List project requirements, technical descriptions, or log communication details here..."
                  className="w-full h-20 bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-zinc-100 text-sm focus-visible:ring-indigo-600 focus-visible:outline-none"
                />
              </div>
            </div>

            <DialogFooter className="border-t border-zinc-800 pt-4">
              <Button type="button" variant="ghost" onClick={() => setDialogOpen(false)} className="text-zinc-400 hover:bg-zinc-900">
                Cancel
              </Button>
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium">
                {editingLead ? "Save Changes" : "Create Lead"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
