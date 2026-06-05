import { supabase } from "@/integrations/supabase/client";

// Core CRM Types matching Supabase Schema
export type AppRole = 'admin' | 'organisation_admin' | 'manager' | 'sales_person';
export type LeadStatus = 'new' | 'order_placed' | 'procurement_sent' | 'procurement_waiting' | 'procurement_approved' | 'bill_generated' | 'closed' | 'partial_procurement_sent' | 'partial_procurement_waiting' | 'partial_procurement_approved';
export type OrderItemStatus = 'procurement_sent' | 'procurement_waiting' | 'procurement_approved' | 'bill_generated' | 'closed';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'expired';
export type LeadSource = 'email' | 'whatsapp' | 'phone' | 'website' | 'referral' | 'social_media' | 'other';

export interface Organisation {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  gstin?: string;
  state?: string;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionType {
  id: string;
  name: string;
  no_of_leads: number;
  price: number;
  validity_days: number;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface OrganisationSubscription {
  id: string;
  organisation_id: string;
  subscription_type_id: string;
  user_id: string;
  start_date: string;
  expiry_date: string;
  no_of_leads: number;
  current_leads_count: number;
  total_price: number;
  payment_status: PaymentStatus;
  razorpay_payment_link?: string;
  razorpay_payment_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  organisation_id?: string;
  name: string;
  role: AppRole;
  dob?: string;
  address?: string;
  phone?: string;
  whatsapp_number?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Lead {
  id: string;
  lead_id: string;
  organisation_id: string;
  user_id: string;
  from_source: LeadSource;
  name: string;
  address?: string;
  gstin?: string;
  state?: string;
  phone?: string;
  email?: string;
  date_open: string;
  date_closed?: string;
  status: LeadStatus;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface LeadOrder {
  id: string;
  order_no: string;
  lead_id: string;
  total_value: number;
  total_items: number;
  total_gst: number;
  created_at: string;
  updated_at: string;
}

export interface LeadOrderItem {
  id: string;
  lead_order_id: string;
  product_sku: string;
  product_name: string;
  quantity: number;
  procurement_price?: number;
  bill_price?: number;
  total_value: number;
  total_gst: number;
  status: OrderItemStatus;
  created_at: string;
  updated_at: string;
}

export interface LeadLog {
  id: string;
  lead_id: string;
  lead_order_item_id?: string;
  user_id: string;
  from_status?: string;
  to_status?: string;
  note?: string;
  created_at: string;
}

// Mock Database Initial Seeding Data
const MOCK_ORGANISATIONS: Organisation[] = [
  {
    id: "org-111",
    name: "Jain Logistics & Trading",
    phone: "+91 98765 43210",
    email: "contact@jainlogistics.com",
    address: "12, MG Road, Bangalore",
    gstin: "29AABCJ1234D1Z2",
    state: "Karnataka",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

const MOCK_SUBSCRIPTION_TYPES: SubscriptionType[] = [
  { id: "sub-basic", name: "Basic", no_of_leads: 100, price: 999, validity_days: 30, description: "Basic plan with 100 leads per month", is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "sub-pro", name: "Professional", no_of_leads: 500, price: 2999, validity_days: 30, description: "Professional plan with 500 leads per month", is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "sub-enterprise", name: "Enterprise", no_of_leads: 2000, price: 9999, validity_days: 30, description: "Enterprise plan with 2000 leads per month", is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "sub-unlimited", name: "Unlimited", no_of_leads: -1, price: 19999, validity_days: 30, description: "Unlimited leads per month for large organizations", is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
];

const MOCK_ORG_SUBSCRIPTIONS: OrganisationSubscription[] = [
  {
    id: "orgsub-1",
    organisation_id: "org-111",
    subscription_type_id: "sub-pro",
    user_id: "user-admin",
    start_date: new Date().toISOString(),
    expiry_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    no_of_leads: 500,
    current_leads_count: 3,
    total_price: 2999,
    payment_status: "paid",
    razorpay_payment_id: "pay_xyz12345",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

const MOCK_PROFILES: Profile[] = [
  {
    id: "user-admin",
    organisation_id: "org-111",
    name: "Prince Jain (Admin)",
    role: "organisation_admin",
    dob: "1995-08-15",
    address: "Bangalore",
    phone: "+91 99999 88888",
    whatsapp_number: "+91 99999 88888",
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: "user-sales",
    organisation_id: "org-111",
    name: "Rajesh Kumar",
    role: "sales_person",
    phone: "+91 88888 77777",
    whatsapp_number: "+91 88888 77777",
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

const MOCK_LEADS: Lead[] = [
  {
    id: "lead-1",
    lead_id: "LD-20260605-001",
    organisation_id: "org-111",
    user_id: "user-admin",
    from_source: "whatsapp",
    name: "Sharma Electricals",
    phone: "+91 90000 11111",
    email: "sharma@electricals.com",
    address: "45, Electronic City, Bangalore",
    gstin: "29BBBCS4567A1Z4",
    state: "Karnataka",
    date_open: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    status: "new",
    notes: "Client reached out via WhatsApp catalog inquiring about bulk copper wire procurement.",
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "lead-2",
    lead_id: "LD-20260605-002",
    organisation_id: "org-111",
    user_id: "user-sales",
    from_source: "email",
    name: "Tata Power Solutions",
    phone: "+91 95555 66666",
    email: "procurement@tatapower.com",
    address: "Tata Centre, Mumbai",
    gstin: "27AABCT9999F1Z0",
    state: "Maharashtra",
    date_open: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    status: "procurement_waiting",
    notes: "Requires standard transformers. Quote sent, waiting for technical team approval.",
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "lead-3",
    lead_id: "LD-20260605-003",
    organisation_id: "org-111",
    user_id: "user-admin",
    from_source: "referral",
    name: "Apex Engineering Ltd",
    phone: "+91 92222 33333",
    email: "info@apexeng.in",
    address: "Phase II, GIDC, Ahmedabad",
    gstin: "24AACCA1111E2Z5",
    state: "Gujarat",
    date_open: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    date_closed: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    status: "bill_generated",
    notes: "Bill generated and shared with client. Delivery dispatched.",
    created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
  }
];

const MOCK_LEAD_ORDERS: LeadOrder[] = [
  {
    id: "order-1",
    order_no: "ORD-20260605-001",
    lead_id: "lead-3",
    total_value: 118000,
    total_items: 2,
    total_gst: 18000,
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
  }
];

const MOCK_LEAD_ORDER_ITEMS: LeadOrderItem[] = [
  {
    id: "item-1",
    lead_order_id: "order-1",
    product_sku: "TRANS-100KVA",
    product_name: "100kVA Distribution Transformer",
    quantity: 1,
    procurement_price: 75000,
    bill_price: 90000,
    total_value: 90000,
    total_gst: 16200,
    status: "bill_generated",
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "item-2",
    lead_order_id: "order-1",
    product_sku: "CABLE-COP-50",
    product_name: "Heavy Duty 50mm Copper Armoured Cable (100m)",
    quantity: 1,
    procurement_price: 8000,
    bill_price: 10000,
    total_value: 10000,
    total_gst: 1800,
    status: "bill_generated",
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
  }
];

const MOCK_LEAD_LOGS: LeadLog[] = [
  {
    id: "log-1",
    lead_id: "lead-1",
    user_id: "user-admin",
    from_status: undefined,
    to_status: "new",
    note: "Lead generated automatically via WhatsApp inquiry.",
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "log-2",
    lead_id: "lead-2",
    user_id: "user-sales",
    from_status: "new",
    to_status: "procurement_waiting",
    note: "Procurement documents sent to client technical board.",
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "log-3",
    lead_id: "lead-3",
    user_id: "user-admin",
    from_status: "order_placed",
    to_status: "bill_generated",
    note: "Sales order invoices generated. Dispatched order ORD-20260605-001.",
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
  }
];

// LocalStorage Persistence Helpers
class StorageDB {
  static get<T>(key: string, defaultValue: T): T {
    const data = localStorage.getItem(`crm_${key}`);
    return data ? JSON.parse(data) : defaultValue;
  }
  static set(key: string, value: any): void {
    localStorage.setItem(`crm_${key}`, JSON.stringify(value));
  }
}

export class CRMService {
  private static isUsingMock = true; // Auto fallback checked in init

  static init() {
    // If we have localstorage already seeded, don't overwrite
    if (!localStorage.getItem("crm_seeded")) {
      StorageDB.set("organisations", MOCK_ORGANISATIONS);
      StorageDB.set("subscription_types", MOCK_SUBSCRIPTION_TYPES);
      StorageDB.set("organisation_subscriptions", MOCK_ORG_SUBSCRIPTIONS);
      StorageDB.set("profiles", MOCK_PROFILES);
      StorageDB.set("leads", MOCK_LEADS);
      StorageDB.set("lead_orders", MOCK_LEAD_ORDERS);
      StorageDB.set("lead_order_items", MOCK_LEAD_ORDER_ITEMS);
      StorageDB.set("lead_logs", MOCK_LEAD_LOGS);
      
      // Setup default current user
      StorageDB.set("current_user", MOCK_PROFILES[0]);
      localStorage.setItem("crm_seeded", "true");
    }
    
    // Check if Supabase keys exist and project is reachable
    const url = supabase.supabaseUrl;
    const key = supabase.supabaseKey;
    if (url && url !== "" && key && key !== "" && !url.includes("placeholder")) {
      // Keys are set, we will attempt to query but fallback if it errors
      this.isUsingMock = false;
    } else {
      this.isUsingMock = true;
    }
  }

  // --- AUTH SERVICES ---
  static async getCurrentUser(): Promise<Profile | null> {
    this.init();
    if (this.isUsingMock) {
      return StorageDB.get<Profile | null>("current_user", null);
    }
    try {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) return null;
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single();
        
      return profile as Profile | null;
    } catch {
      return StorageDB.get<Profile | null>("current_user", null);
    }
  }

  static async login(email: string, password?: string): Promise<Profile> {
    this.init();
    if (this.isUsingMock || !password) {
      // Mock login matches by email prefix or name, default to Prince Jain
      const profiles = StorageDB.get<Profile[]>("profiles", MOCK_PROFILES);
      const user = profiles.find(p => p.phone?.includes(email) || p.name.toLowerCase().includes(email.split('@')[0].toLowerCase())) || profiles[0];
      StorageDB.set("current_user", user);
      return user;
    }
    
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    
    const { data: profile, error: profError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();
      
    if (profError) throw profError;
    return profile as Profile;
  }

  static async logout(): Promise<void> {
    this.init();
    if (this.isUsingMock) {
      localStorage.removeItem("crm_current_user");
      return;
    }
    await supabase.auth.signOut();
  }

  static async signup(name: string, email: string, password?: string, orgName?: string, isJoining = false, existingOrgId?: string): Promise<Profile> {
    this.init();
    
    let orgId = existingOrgId || "";
    
    if (this.isUsingMock || !password) {
      const orgs = StorageDB.get<Organisation[]>("organisations", MOCK_ORGANISATIONS);
      const profiles = StorageDB.get<Profile[]>("profiles", MOCK_PROFILES);
      
      if (!isJoining && orgName) {
        // Create new org
        orgId = `org-${Date.now()}`;
        const newOrg: Organisation = {
          id: orgId,
          name: orgName,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        orgs.push(newOrg);
        StorageDB.set("organisations", orgs);
        
        // Seed default subscription for new org
        const orgSubs = StorageDB.get<OrganisationSubscription[]>("organisation_subscriptions", MOCK_ORG_SUBSCRIPTIONS);
        orgSubs.push({
          id: `orgsub-${Date.now()}`,
          organisation_id: orgId,
          subscription_type_id: "sub-basic",
          user_id: `user-${Date.now()}`,
          start_date: new Date().toISOString(),
          expiry_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          no_of_leads: 100,
          current_leads_count: 0,
          total_price: 999,
          payment_status: "paid",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
        StorageDB.set("organisation_subscriptions", orgSubs);
      } else if (!orgId) {
        orgId = orgs[0].id;
      }
      
      const newProfile: Profile = {
        id: `user-${Date.now()}`,
        organisation_id: orgId,
        name,
        role: isJoining ? 'sales_person' : 'organisation_admin',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      profiles.push(newProfile);
      StorageDB.set("profiles", profiles);
      StorageDB.set("current_user", newProfile);
      return newProfile;
    }
    
    // Supabase Sign Up flow
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } }
    });
    if (authError) throw authError;
    if (!authData.user) throw new Error("Sign up failed");
    
    if (!isJoining && orgName) {
      // Create organisation via API
      const { data: newOrg, error: orgErr } = await supabase
        .from('organisations')
        .insert({ name: orgName })
        .select()
        .single();
        
      if (orgErr) throw orgErr;
      orgId = newOrg.id;
      
      // Add subscription
      await supabase.from('organisation_subscriptions').insert({
        organisation_id: orgId,
        subscription_type_id: (await supabase.from('subscription_types').select('id').eq('name', 'Basic').single()).data?.id,
        user_id: authData.user.id,
        expiry_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        no_of_leads: 100,
        payment_status: 'paid'
      });
    }
    
    // Update user profile with role and organization
    const { data: profile, error: profErr } = await supabase
      .from('profiles')
      .update({
        organisation_id: orgId || null,
        role: isJoining ? 'sales_person' : 'organisation_admin'
      })
      .eq('id', authData.user.id)
      .select()
      .single();
      
    if (profErr) throw profErr;
    return profile as Profile;
  }

  // --- LEADS SERVICES ---
  static async getLeads(): Promise<Lead[]> {
    this.init();
    if (this.isUsingMock) {
      const currentUser = await this.getCurrentUser();
      const leads = StorageDB.get<Lead[]>("leads", MOCK_LEADS);
      if (!currentUser) return [];
      // If admin, show all, otherwise show organization leads
      return leads.filter(l => l.organisation_id === currentUser.organisation_id);
    }
    const { data, error } = await supabase.from('leads').select('*');
    if (error) throw error;
    return data as Lead[];
  }

  static async createLead(lead: Omit<Lead, 'id' | 'lead_id' | 'created_at' | 'updated_at'>): Promise<Lead> {
    this.init();
    const currentUser = await this.getCurrentUser();
    if (!currentUser) throw new Error("Not logged in");

    if (this.isUsingMock) {
      const leads = StorageDB.get<Lead[]>("leads", MOCK_LEADS);
      
      // Auto-generate lead id format LD-YYYYMMDD-XXX
      const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
      const dailyCount = leads.filter(l => l.lead_id.includes(`LD-${today}`)).length + 1;
      const lead_id = `LD-${today}-${String(dailyCount).padStart(3, '0')}`;
      
      const newLead: Lead = {
        ...lead,
        id: `lead-${Date.now()}`,
        lead_id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      leads.push(newLead);
      StorageDB.set("leads", leads);
      
      // Log lead creation
      await this.createLog(newLead.id, undefined, newLead.status, "Lead created in system.");
      return newLead;
    }

    const { data, error } = await supabase
      .from('leads')
      .insert({
        ...lead,
        organisation_id: currentUser.organisation_id,
        user_id: currentUser.id
      })
      .select()
      .single();
      
    if (error) throw error;
    await this.createLog(data.id, undefined, data.status, "Lead created in system.");
    return data as Lead;
  }

  static async updateLead(id: string, updates: Partial<Lead>): Promise<Lead> {
    this.init();
    if (this.isUsingMock) {
      const leads = StorageDB.get<Lead[]>("leads", MOCK_LEADS);
      const idx = leads.findIndex(l => l.id === id);
      if (idx === -1) throw new Error("Lead not found");
      
      const oldStatus = leads[idx].status;
      const updated = {
        ...leads[idx],
        ...updates,
        updated_at: new Date().toISOString()
      };
      leads[idx] = updated;
      StorageDB.set("leads", leads);
      
      if (updates.status && updates.status !== oldStatus) {
        await this.createLog(id, oldStatus, updates.status, `Status updated to ${updates.status.replace(/_/g, ' ')}.`);
      }
      return updated;
    }

    const oldLeadRes = await supabase.from('leads').select('status').eq('id', id).single();
    const oldStatus = oldLeadRes.data?.status;

    const { data, error } = await supabase
      .from('leads')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
      
    if (error) throw error;
    if (updates.status && updates.status !== oldStatus) {
      await this.createLog(id, oldStatus, updates.status, `Status updated to ${updates.status.replace(/_/g, ' ')}.`);
    }
    return data as Lead;
  }

  static async deleteLead(id: string): Promise<void> {
    this.init();
    if (this.isUsingMock) {
      const leads = StorageDB.get<Lead[]>("leads", MOCK_LEADS);
      const filtered = leads.filter(l => l.id !== id);
      StorageDB.set("leads", filtered);
      return;
    }
    const { error } = await supabase.from('leads').delete().eq('id', id);
    if (error) throw error;
  }

  // --- ORDERS & ITEMS ---
  static async getOrders(): Promise<(LeadOrder & { lead_name?: string })[]> {
    this.init();
    if (this.isUsingMock) {
      const orders = StorageDB.get<LeadOrder[]>("lead_orders", MOCK_LEAD_ORDERS);
      const leads = StorageDB.get<Lead[]>("leads", MOCK_LEADS);
      return orders.map(o => {
        const lead = leads.find(l => l.id === o.lead_id);
        return {
          ...o,
          lead_name: lead?.name || "Unknown Lead"
        };
      });
    }
    const { data, error } = await supabase
      .from('lead_orders')
      .select(`
        *,
        leads (
          name
        )
      `);
      
    if (error) throw error;
    return data.map((d: any) => ({
      ...d,
      lead_name: d.leads?.name || "Unknown Lead"
    })) as (LeadOrder & { lead_name?: string })[];
  }

  static async getOrderItems(orderId: string): Promise<LeadOrderItem[]> {
    this.init();
    if (this.isUsingMock) {
      const items = StorageDB.get<LeadOrderItem[]>("lead_order_items", MOCK_LEAD_ORDER_ITEMS);
      return items.filter(i => i.lead_order_id === orderId);
    }
    const { data, error } = await supabase
      .from('lead_order_items')
      .select('*')
      .eq('lead_order_id', orderId);
      
    if (error) throw error;
    return data as LeadOrderItem[];
  }

  static async createOrder(leadId: string, items: Omit<LeadOrderItem, 'id' | 'lead_order_id' | 'created_at' | 'updated_at'>[]): Promise<LeadOrder> {
    this.init();
    
    // Live calculations
    const gstRate = 0.18; // 18% standard GST
    let totalValue = 0;
    let totalGst = 0;
    
    const formattedItems = items.map(item => {
      const billPrice = item.bill_price || 0;
      const val = billPrice * item.quantity;
      const gst = val * gstRate;
      totalValue += val;
      totalGst += gst;
      return {
        ...item,
        total_value: val,
        total_gst: gst
      };
    });

    if (this.isUsingMock) {
      const orders = StorageDB.get<LeadOrder[]>("lead_orders", MOCK_LEAD_ORDERS);
      const orderItems = StorageDB.get<LeadOrderItem[]>("lead_order_items", MOCK_LEAD_ORDER_ITEMS);
      
      const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
      const orderCount = orders.filter(o => o.order_no.includes(`ORD-${today}`)).length + 1;
      const order_no = `ORD-${today}-${String(orderCount).padStart(3, '0')}`;
      
      const newOrder: LeadOrder = {
        id: `order-${Date.now()}`,
        order_no,
        lead_id: leadId,
        total_value: totalValue + totalGst,
        total_items: items.length,
        total_gst: totalGst,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      orders.push(newOrder);
      StorageDB.set("lead_orders", orders);
      
      const newItems = formattedItems.map((item, idx) => ({
        ...item,
        id: `item-${Date.now()}-${idx}`,
        lead_order_id: newOrder.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })) as LeadOrderItem[];
      
      orderItems.push(...newItems);
      StorageDB.set("lead_order_items", orderItems);
      
      // Update lead status to order_placed
      await this.updateLead(leadId, { status: "order_placed" });
      
      return newOrder;
    }

    const { data: newOrder, error: orderErr } = await supabase
      .from('lead_orders')
      .insert({
        lead_id: leadId,
        total_value: totalValue + totalGst,
        total_items: items.length,
        total_gst: totalGst
      })
      .select()
      .single();
      
    if (orderErr) throw orderErr;
    
    const { error: itemsErr } = await supabase.from('lead_order_items').insert(
      formattedItems.map(item => ({
        ...item,
        lead_order_id: newOrder.id
      }))
    );
    if (itemsErr) throw itemsErr;
    
    await this.updateLead(leadId, { status: "order_placed" });
    return newOrder as LeadOrder;
  }

  static async updateOrderItemStatus(itemId: string, status: OrderItemStatus): Promise<LeadOrderItem> {
    this.init();
    if (this.isUsingMock) {
      const items = StorageDB.get<LeadOrderItem[]>("lead_order_items", MOCK_LEAD_ORDER_ITEMS);
      const idx = items.findIndex(i => i.id === itemId);
      if (idx === -1) throw new Error("Order item not found");
      
      const updated = {
        ...items[idx],
        status,
        updated_at: new Date().toISOString()
      };
      items[idx] = updated;
      StorageDB.set("lead_order_items", items);
      
      // Log the item state change
      const orders = StorageDB.get<LeadOrder[]>("lead_orders", MOCK_LEAD_ORDERS);
      const order = orders.find(o => o.id === updated.lead_order_id);
      if (order) {
        await this.createLog(order.lead_id, undefined, undefined, `Product "${updated.product_name}" status updated to ${status.replace(/_/g, ' ')}.`, itemId);
        
        // Auto reconcile overall lead status
        const leadItems = items.filter(i => i.lead_order_id === order.id);
        const allStatuses = leadItems.map(i => i.status);
        
        let leadStatus: LeadStatus = "order_placed";
        if (allStatuses.every(s => s === "closed")) {
          leadStatus = "closed";
        } else if (allStatuses.every(s => s === "bill_generated")) {
          leadStatus = "bill_generated";
        } else if (allStatuses.some(s => s === "procurement_approved")) {
          leadStatus = allStatuses.every(s => s === "procurement_approved") ? "procurement_approved" : "partial_procurement_approved";
        } else if (allStatuses.some(s => s === "procurement_waiting")) {
          leadStatus = allStatuses.every(s => s === "procurement_waiting") ? "procurement_waiting" : "partial_procurement_waiting";
        } else if (allStatuses.some(s => s === "procurement_sent")) {
          leadStatus = "procurement_sent";
        }
        await this.updateLead(order.lead_id, { status: leadStatus });
      }
      
      return updated;
    }

    const { data: updated, error } = await supabase
      .from('lead_order_items')
      .update({ status })
      .eq('id', itemId)
      .select()
      .single();
      
    if (error) throw error;
    
    // Fetch lead details to log activity
    const orderRes = await supabase.from('lead_orders').select('lead_id').eq('id', updated.lead_order_id).single();
    if (orderRes.data) {
      await this.createLog(orderRes.data.lead_id, undefined, undefined, `Product "${updated.product_name}" status updated to ${status.replace(/_/g, ' ')}.`, itemId);
    }
    
    return updated as LeadOrderItem;
  }

  // --- LOGS ---
  static async getLogs(leadId?: string): Promise<LeadLog[]> {
    this.init();
    if (this.isUsingMock) {
      const logs = StorageDB.get<LeadLog[]>("lead_logs", MOCK_LEAD_LOGS);
      const filtered = leadId ? logs.filter(l => l.lead_id === leadId) : logs;
      return filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
    
    let query = supabase.from('lead_logs').select('*');
    if (leadId) {
      query = query.eq('lead_id', leadId);
    }
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data as LeadLog[];
  }

  static async createLog(leadId: string, fromStatus?: string, toStatus?: string, note?: string, itemId?: string): Promise<LeadLog> {
    this.init();
    const currentUser = await this.getCurrentUser();
    const userId = currentUser?.id || "system";
    
    const newLog: Omit<LeadLog, 'id'> = {
      lead_id: leadId,
      lead_order_item_id: itemId,
      user_id: userId,
      from_status: fromStatus,
      to_status: toStatus,
      note: note || "",
      created_at: new Date().toISOString()
    };

    if (this.isUsingMock) {
      const logs = StorageDB.get<LeadLog[]>("lead_logs", MOCK_LEAD_LOGS);
      const fullLog: LeadLog = {
        ...newLog,
        id: `log-${Date.now()}`
      };
      logs.push(fullLog);
      StorageDB.set("lead_logs", logs);
      return fullLog;
    }

    const { data, error } = await supabase.from('lead_logs').insert(newLog).select().single();
    if (error) throw error;
    return data as LeadLog;
  }

  // --- ORGANISATIONS & SUBSCRIPTIONS ---
  static async getOrganisations(): Promise<Organisation[]> {
    this.init();
    if (this.isUsingMock) {
      return StorageDB.get<Organisation[]>("organisations", MOCK_ORGANISATIONS);
    }
    const { data, error } = await supabase.from('organisations').select('*');
    if (error) throw error;
    return data as Organisation[];
  }

  static async getSubscriptionTypes(): Promise<SubscriptionType[]> {
    this.init();
    if (this.isUsingMock) {
      return StorageDB.get<SubscriptionType[]>("subscription_types", MOCK_SUBSCRIPTION_TYPES);
    }
    const { data, error } = await supabase.from('subscription_types').select('*');
    if (error) throw error;
    return data as SubscriptionType[];
  }

  static async getOrganisationSubscription(): Promise<(OrganisationSubscription & { plan_name?: string }) | null> {
    this.init();
    const currentUser = await this.getCurrentUser();
    if (!currentUser || !currentUser.organisation_id) return null;

    if (this.isUsingMock) {
      const orgSubs = StorageDB.get<OrganisationSubscription[]>("organisation_subscriptions", MOCK_ORG_SUBSCRIPTIONS);
      const sub = orgSubs.find(s => s.organisation_id === currentUser.organisation_id) || null;
      if (!sub) return null;
      
      const plans = StorageDB.get<SubscriptionType[]>("subscription_types", MOCK_SUBSCRIPTION_TYPES);
      const plan = plans.find(p => p.id === sub.subscription_type_id);
      return {
        ...sub,
        plan_name: plan?.name || "Basic"
      };
    }

    const { data, error } = await supabase
      .from('organisation_subscriptions')
      .select(`
        *,
        subscription_types (
          name
        )
      `)
      .eq('organisation_id', currentUser.organisation_id)
      .single();
      
    if (error) return null;
    return {
      ...data,
      plan_name: data.subscription_types?.name || "Basic"
    } as any;
  }

  static async updateSubscriptionPlan(planId: string): Promise<void> {
    this.init();
    const currentUser = await this.getCurrentUser();
    if (!currentUser || !currentUser.organisation_id) throw new Error("No organization mapping");

    const plans = await this.getSubscriptionTypes();
    const plan = plans.find(p => p.id === planId);
    if (!plan) throw new Error("Plan not found");

    if (this.isUsingMock) {
      const orgSubs = StorageDB.get<OrganisationSubscription[]>("organisation_subscriptions", MOCK_ORG_SUBSCRIPTIONS);
      const idx = orgSubs.findIndex(s => s.organisation_id === currentUser.organisation_id);
      
      const updatedSub: OrganisationSubscription = {
        id: idx !== -1 ? orgSubs[idx].id : `orgsub-${Date.now()}`,
        organisation_id: currentUser.organisation_id,
        subscription_type_id: planId,
        user_id: currentUser.id,
        start_date: new Date().toISOString(),
        expiry_date: new Date(Date.now() + plan.validity_days * 24 * 60 * 60 * 1000).toISOString(),
        no_of_leads: plan.no_of_leads,
        current_leads_count: idx !== -1 ? orgSubs[idx].current_leads_count : 0,
        total_price: plan.price,
        payment_status: "paid",
        razorpay_payment_id: `pay_upg_${Date.now()}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      if (idx !== -1) {
        orgSubs[idx] = updatedSub;
      } else {
        orgSubs.push(updatedSub);
      }
      StorageDB.set("organisation_subscriptions", orgSubs);
      return;
    }

    // Attempt to upsert subscription in Supabase
    const subRes = await supabase
      .from('organisation_subscriptions')
      .select('id')
      .eq('organisation_id', currentUser.organisation_id)
      .maybeSingle();

    const subData = {
      organisation_id: currentUser.organisation_id,
      subscription_type_id: planId,
      user_id: currentUser.id,
      expiry_date: new Date(Date.now() + plan.validity_days * 24 * 60 * 60 * 1000).toISOString(),
      no_of_leads: plan.no_of_leads,
      total_price: plan.price,
      payment_status: 'paid' as PaymentStatus
    };

    if (subRes.data) {
      await supabase
        .from('organisation_subscriptions')
        .update(subData)
        .eq('id', subRes.data.id);
    } else {
      await supabase
        .from('organisation_subscriptions')
        .insert(subData);
    }
  }

  static async getProfiles(): Promise<Profile[]> {
    this.init();
    const currentUser = await this.getCurrentUser();
    if (!currentUser) return [];

    if (this.isUsingMock) {
      const profiles = StorageDB.get<Profile[]>("profiles", MOCK_PROFILES);
      return profiles.filter(p => p.organisation_id === currentUser.organisation_id);
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('organisation_id', currentUser.organisation_id);
      
    if (error) throw error;
    return data as Profile[];
  }
}
