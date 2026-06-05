import { useEffect, useState } from "react";
import { 
  Plus, 
  Receipt, 
  ShoppingCart, 
  Trash2, 
  Eye, 
  ChevronRight, 
  BadgePercent,
  CheckCircle,
  Clock,
  Send,
  PackageCheck
} from "lucide-react";
import { CRMService, Lead, LeadOrder, LeadOrderItem, OrderItemStatus } from "@/lib/crm-service";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface OrderFormItem {
  product_sku: string;
  product_name: string;
  quantity: number;
  bill_price: number;
}

export default function Orders() {
  const [orders, setOrders] = useState<(LeadOrder & { lead_name?: string })[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  // Selected Order details
  const [selectedOrder, setSelectedOrder] = useState<(LeadOrder & { lead_name?: string }) | null>(null);
  const [orderItems, setOrderItems] = useState<LeadOrderItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);

  // Create Order Dialog State
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState("");
  const [formItems, setFormItems] = useState<OrderFormItem[]>([
    { product_sku: "", product_name: "", quantity: 1, bill_price: 0 }
  ]);

  const loadData = async () => {
    try {
      const allOrders = await CRMService.getOrders();
      const allLeads = await CRMService.getLeads();
      setOrders(allOrders);
      // Only link orders to leads that are open for business (e.g. not closed won)
      setLeads(allLeads.filter(l => l.status !== "closed"));
      if (allOrders.length > 0 && !selectedOrder) {
        handleSelectOrder(allOrders[0]);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load orders billing system.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSelectOrder = async (order: (LeadOrder & { lead_name?: string })) => {
    setSelectedOrder(order);
    setLoadingItems(true);
    try {
      const items = await CRMService.getOrderItems(order.id);
      setOrderItems(items);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load items details.");
    } finally {
      setLoadingItems(false);
    }
  };

  // --- ITEM FORM HELPERS ---
  const handleAddItemRow = () => {
    setFormItems([...formItems, { product_sku: "", product_name: "", quantity: 1, bill_price: 0 }]);
  };

  const handleRemoveItemRow = (idx: number) => {
    if (formItems.length === 1) return;
    setFormItems(formItems.filter((_, i) => i !== idx));
  };

  const handleItemFieldChange = (idx: number, field: keyof OrderFormItem, value: any) => {
    const updated = [...formItems];
    updated[idx] = {
      ...updated[idx],
      [field]: value
    };
    setFormItems(updated);
  };

  // Live billing calculations
  const calculateTotals = () => {
    let subtotal = 0;
    formItems.forEach(item => {
      subtotal += (item.bill_price || 0) * (item.quantity || 0);
    });
    const gst = subtotal * 0.18; // 18% standard GST
    const total = subtotal + gst;
    return { subtotal, gst, total };
  };

  const { subtotal, gst, total } = calculateTotals();

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLeadId) {
      toast.error("Please associate this order with a Lead");
      return;
    }

    const invalidItem = formItems.some(i => !i.product_name || !i.product_sku || i.bill_price <= 0);
    if (invalidItem) {
      toast.error("All items must have a SKU, Name, and Price greater than 0");
      return;
    }

    try {
      const order = await CRMService.createOrder(
        selectedLeadId,
        formItems.map(item => ({
          ...item,
          status: "procurement_sent" // Default status
        }))
      );
      toast.success(`Sales invoice ${order.order_no} created successfully.`);
      setCreateDialogOpen(false);
      
      // Reset state
      setSelectedLeadId("");
      setFormItems([{ product_sku: "", product_name: "", quantity: 1, bill_price: 0 }]);
      
      // Reload and highlight the new order
      const allOrders = await CRMService.getOrders();
      setOrders(allOrders);
      const newlyCreated = allOrders.find(o => o.id === order.id);
      if (newlyCreated) {
        handleSelectOrder(newlyCreated);
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to create sales order.");
    }
  };

  const handleUpdateItemStatus = async (itemId: string, status: OrderItemStatus) => {
    try {
      await CRMService.updateOrderItemStatus(itemId, status);
      toast.success("Product procurement status updated.");
      if (selectedOrder) {
        handleSelectOrder(selectedOrder);
      }
      loadData(); // Re-fetch orders for subtotal changes
    } catch (err) {
      console.error(err);
      toast.error("Failed to update product state.");
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { label: string; style: string; icon: any }> = {
      procurement_sent: { label: "Procure Sent", style: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20", icon: Send },
      procurement_waiting: { label: "Procure Wait", style: "bg-amber-500/10 text-amber-400 border-amber-500/20", icon: Clock },
      procurement_approved: { label: "Procure Appr.", style: "bg-blue-500/10 text-blue-400 border-blue-500/20", icon: PackageCheck },
      bill_generated: { label: "Bill Invoiced", style: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", icon: Receipt },
      closed: { label: "Finished", style: "bg-zinc-500/15 text-zinc-400 border-zinc-500/20", icon: CheckCircle }
    };

    const conf = badges[status] || { label: status, style: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20", icon: Clock };
    const Icon = conf.icon;
    return (
      <Badge variant="outline" className={`flex items-center gap-1 w-max text-[10px] py-0 px-2 uppercase ${conf.style}`}>
        <Icon className="w-2.5 h-2.5" />
        {conf.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-zinc-400">
        <div className="w-8 h-8 rounded-full border border-t-indigo-500 border-indigo-900 animate-spin"></div>
        <span className="mt-3 text-xs tracking-wider">Opening Billing Books...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-zinc-100">Orders & Invoices</h2>
          <p className="text-sm text-zinc-400 mt-1">Manage procurement processes and calculate GST.</p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 h-10 shadow-lg shadow-indigo-600/15">
          <Plus className="w-4 h-4" />
          Generate Sales Order
        </Button>
      </div>

      {/* Main Grid: Orders on Left, Selected Details on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left Side: Orders list */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="bg-[#09090b]/40 border-zinc-800 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-zinc-200 text-base font-bold flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-indigo-400" />
                Sales Order Registry
              </CardTitle>
              <CardDescription className="text-zinc-550 text-xs">Registry of client billing invoices.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-zinc-850 max-h-[500px] overflow-y-auto">
                {orders.length > 0 ? (
                  orders.map((order) => {
                    const isSelected = selectedOrder?.id === order.id;
                    return (
                      <button
                        key={order.id}
                        onClick={() => handleSelectOrder(order)}
                        className={`w-full p-4 flex flex-col text-left transition-all ${
                          isSelected 
                            ? "bg-indigo-600/5 border-l-2 border-indigo-500" 
                            : "hover:bg-zinc-900/20 border-l-2 border-transparent"
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="font-mono text-xs font-semibold text-indigo-400">{order.order_no}</span>
                          <span className="text-[10px] text-zinc-500">
                            {new Date(order.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                        <h4 className="font-semibold text-sm text-zinc-200 mt-1 truncate w-full">{order.lead_name}</h4>
                        <div className="flex items-center justify-between w-full mt-2 pt-1 border-t border-zinc-900/60">
                          <span className="text-xs text-zinc-500">{order.total_items} product line items</span>
                          <span className="text-sm font-bold text-zinc-150">₹{Number(order.total_value).toLocaleString()}</span>
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <div className="p-8 text-center text-zinc-500 text-sm">No sales invoices recorded yet.</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Side: Order item details */}
        <div className="lg:col-span-2">
          {selectedOrder ? (
            <Card className="bg-[#09090b]/40 border-zinc-800 shadow-md">
              <CardHeader className="border-b border-zinc-850 pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-xs font-mono font-bold text-indigo-400 tracking-wider">SALES INVOICE SYSTEM</span>
                    <h3 className="text-2xl font-bold text-zinc-100 mt-1">{selectedOrder.order_no}</h3>
                    <p className="text-xs text-zinc-400 mt-1">
                      Associated with client: <span className="font-semibold text-zinc-300">{selectedOrder.lead_name}</span>
                    </p>
                  </div>
                  <div className="text-right sm:text-right">
                    <p className="text-xs text-zinc-550">Grand Billing Total</p>
                    <p className="text-2xl font-black text-indigo-400 mt-0.5">
                      ₹{Number(selectedOrder.total_value).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </p>
                    <span className="text-[10px] text-zinc-500 font-medium">Includes GST tax: ₹{Number(selectedOrder.total_gst).toLocaleString()}</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="py-6">
                <h4 className="font-bold text-zinc-200 text-sm mb-4">Invoice Line Items & Procurement Status</h4>
                
                {loadingItems ? (
                  <div className="text-center py-10 text-zinc-500 text-sm">Loading items detail...</div>
                ) : (
                  <div className="overflow-x-auto border border-zinc-850 rounded-xl bg-zinc-950/20">
                    <Table>
                      <TableHeader className="bg-zinc-900/50">
                        <TableRow className="border-zinc-850">
                          <TableHead className="text-zinc-400 text-xs font-bold w-36">Product SKU</TableHead>
                          <TableHead className="text-zinc-400 text-xs font-bold">Product / Service</TableHead>
                          <TableHead className="text-zinc-400 text-xs font-bold text-right w-16">Qty</TableHead>
                          <TableHead className="text-zinc-400 text-xs font-bold text-right">Price</TableHead>
                          <TableHead className="text-zinc-400 text-xs font-bold text-right">GST (18%)</TableHead>
                          <TableHead className="text-zinc-400 text-xs font-bold text-right">Total</TableHead>
                          <TableHead className="text-zinc-400 text-xs font-bold w-44">Workflow Stage</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {orderItems.map((item) => (
                          <TableRow key={item.id} className="border-zinc-850 hover:bg-zinc-900/10 text-zinc-300">
                            <TableCell className="font-mono text-xs text-indigo-300">{item.product_sku}</TableCell>
                            <TableCell className="font-semibold text-zinc-200">{item.product_name}</TableCell>
                            <TableCell className="text-right font-medium">{item.quantity}</TableCell>
                            <TableCell className="text-right">₹{Number(item.bill_price).toLocaleString()}</TableCell>
                            <TableCell className="text-right text-zinc-400">₹{Number(item.total_gst).toLocaleString()}</TableCell>
                            <TableCell className="text-right font-bold text-zinc-100">₹{Number(item.total_value).toLocaleString()}</TableCell>
                            <TableCell>
                              <div className="space-y-1.5">
                                {getStatusBadge(item.status)}
                                <Select 
                                  value={item.status} 
                                  onValueChange={(val) => handleUpdateItemStatus(item.id, val as OrderItemStatus)}
                                >
                                  <SelectTrigger className="w-full bg-zinc-950 border-zinc-850 text-zinc-350 text-[10px] h-7 px-2 focus:ring-indigo-600">
                                    <SelectValue placeholder="Status Switcher" />
                                  </SelectTrigger>
                                  <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-150">
                                    <SelectItem value="procurement_sent" className="text-xs">Procure Sent</SelectItem>
                                    <SelectItem value="procurement_waiting" className="text-xs">Procure Wait</SelectItem>
                                    <SelectItem value="procurement_approved" className="text-xs">Procure Approved</SelectItem>
                                    <SelectItem value="bill_generated" className="text-xs">Bill Invoiced</SelectItem>
                                    <SelectItem value="closed" className="text-xs">Closed Won</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="border border-dashed border-zinc-800 rounded-2xl h-80 flex flex-col items-center justify-center p-8 text-center text-zinc-550">
              <Eye className="w-8 h-8 mb-2 text-zinc-650" />
              <p className="font-semibold text-sm">No Invoice Selected</p>
              <p className="text-xs max-w-xs mt-1">Choose a sales order from the left panel registry to view and manage its items.</p>
            </div>
          )}
        </div>
      </div>

      {/* --- CREATE SALES ORDER INVOICE DIALOG --- */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100 max-w-3xl">
          <form onSubmit={handleCreateOrder}>
            <DialogHeader>
              <DialogTitle className="text-zinc-100 text-xl font-bold flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-indigo-400" />
                Generate Enterprise Sales Order
              </DialogTitle>
              <DialogDescription className="text-zinc-400">
                Bind an invoice and item list to an existing customer lead. Standard GST tax (18%) is applied.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4 max-h-[420px] overflow-y-auto pr-1">
              
              {/* Lead Selector */}
              <div className="space-y-1.5">
                <Label htmlFor="leadAssoc" className="text-zinc-300">Associate Customer Lead</Label>
                <Select value={selectedLeadId} onValueChange={setSelectedLeadId} required>
                  <SelectTrigger className="bg-zinc-950 border-zinc-800 text-zinc-150">
                    <SelectValue placeholder="Select an active customer lead" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-100">
                    {leads.map((lead) => (
                      <SelectItem key={lead.id} value={lead.id} className="focus:bg-zinc-850 cursor-pointer">
                        {lead.name} ({lead.lead_id})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Items List Builder */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                  <Label className="text-sm font-semibold text-zinc-250">Product Line Items</Label>
                  <Button type="button" size="sm" onClick={handleAddItemRow} className="bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 text-indigo-400 text-xs h-8">
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    Add Product
                  </Button>
                </div>

                <div className="space-y-3">
                  {formItems.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-3 items-center p-3 border border-zinc-850/60 rounded-xl bg-zinc-950/20">
                      
                      {/* SKU */}
                      <div className="col-span-3 space-y-1">
                        <Label className="text-[10px] text-zinc-400">SKU Code</Label>
                        <Input
                          placeholder="e.g. ELEC-01"
                          value={item.product_sku}
                          onChange={(e) => handleItemFieldChange(idx, "product_sku", e.target.value)}
                          className="bg-zinc-950 border-zinc-800 h-9 text-xs"
                          required
                        />
                      </div>

                      {/* Name */}
                      <div className="col-span-4 space-y-1">
                        <Label className="text-[10px] text-zinc-400">Product / Service Name</Label>
                        <Input
                          placeholder="e.g. Copper Wire reels"
                          value={item.product_name}
                          onChange={(e) => handleItemFieldChange(idx, "product_name", e.target.value)}
                          className="bg-zinc-950 border-zinc-800 h-9 text-xs"
                          required
                        />
                      </div>

                      {/* Qty */}
                      <div className="col-span-2 space-y-1">
                        <Label className="text-[10px] text-zinc-400">Quantity</Label>
                        <Input
                          type="number"
                          min={1}
                          placeholder="1"
                          value={item.quantity}
                          onChange={(e) => handleItemFieldChange(idx, "quantity", parseInt(e.target.value) || 1)}
                          className="bg-zinc-950 border-zinc-800 h-9 text-xs"
                          required
                        />
                      </div>

                      {/* Price */}
                      <div className="col-span-2 space-y-1">
                        <Label className="text-[10px] text-zinc-400">Bill Price (₹)</Label>
                        <Input
                          type="number"
                          min={0}
                          placeholder="0"
                          value={item.bill_price || ""}
                          onChange={(e) => handleItemFieldChange(idx, "bill_price", parseFloat(e.target.value) || 0)}
                          className="bg-zinc-950 border-zinc-800 h-9 text-xs"
                          required
                        />
                      </div>

                      {/* Delete Action */}
                      <div className="col-span-1 text-center pt-5">
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleRemoveItemRow(idx)}
                          className="h-8 w-8 hover:bg-red-950/20 text-zinc-550 hover:text-red-400 border border-transparent hover:border-red-900/30 rounded-lg disabled:opacity-20"
                          disabled={formItems.length === 1}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>

                    </div>
                  ))}
                </div>
              </div>

              {/* Billing Summary calculation panel */}
              <div className="mt-4 p-4 border border-zinc-800 rounded-xl bg-zinc-950/50 space-y-2">
                <div className="flex justify-between text-xs text-zinc-400">
                  <span>Subtotal Amount:</span>
                  <span className="font-semibold text-zinc-300">₹{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs text-zinc-400">
                  <span className="flex items-center gap-1.5">
                    <BadgePercent className="w-3.5 h-3.5 text-indigo-400" />
                    GST Tax (18% standard):
                  </span>
                  <span className="font-semibold text-zinc-300">₹{gst.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-zinc-200 border-t border-zinc-850 pt-2 mt-2">
                  <span>Total Payable:</span>
                  <span className="text-indigo-400">₹{total.toLocaleString()}</span>
                </div>
              </div>

            </div>

            <DialogFooter className="border-t border-zinc-800 pt-4">
              <Button type="button" variant="ghost" onClick={() => setCreateDialogOpen(false)} className="text-zinc-400 hover:bg-zinc-900">
                Cancel
              </Button>
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium">
                Create Sales Order
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
