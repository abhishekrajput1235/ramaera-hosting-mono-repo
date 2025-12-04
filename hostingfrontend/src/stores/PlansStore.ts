import { create } from "zustand";
import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL;

// Set axios base URL globally
axios.defaults.baseURL = BASE_URL;

// =============================
// 📌 Types
// =============================
export interface HostingPlan {
  id: number;
  name: string;
  description: string | null;
  plan_type: string;

  cpu_cores: number;
  ram_gb: number;
  storage_gb: number;
  bandwidth_gb: number;

  base_price: string;
  monthly_price: string;
  quarterly_price: string;
  semiannual_price?: string | null;
  annual_price: string;
  biennial_price: string;
  triennial_price: string;

  is_active: boolean;
  is_featured: boolean;

  features: string[];

  created_at: string;
  updated_at: string | null;
}

export interface HostingPlanCreate {
  name: string;
  description?: string;
  plan_type: string;

  cpu_cores: number;
  ram_gb: number;
  storage_gb: number;
  bandwidth_gb: number;

  base_price: number;
  monthly_price: number;
  quarterly_price: number;
  annual_price: number;
  biennial_price: number;
  triennial_price: number;

  is_featured?: boolean;
  features?: string[];
}

export interface HostingPlanUpdate extends Partial<HostingPlanCreate> {}

// =============================
// 📌 Store Interface
// =============================
interface HostingPlansStore {
  plans: HostingPlan[];
  activePlans: HostingPlan[];
  selectedPlan: HostingPlan | null;

  loading: boolean;
  error: string | null;

  fetchActivePlans: () => Promise<void>;
  fetchAllPlans: () => Promise<void>;
  fetchPlanById: (id: number) => Promise<void>;

  createPlan: (data: HostingPlanCreate) => Promise<boolean>;
  updatePlan: (id: number, data: HostingPlanUpdate) => Promise<boolean>;
  deletePlan: (id: number) => Promise<boolean>;

  toggleActive: (id: number) => Promise<boolean>;
  toggleFeatured: (id: number) => Promise<boolean>;

  getPlanFeatures: (id: number) => Promise<any>;
  getPricing: (id: number) => Promise<any>;
  getDiscount: (id: number, billingCycle: string) => Promise<number | null>;
}

// =============================
// 🚀 Zustand Store Implementation
// =============================
export const useHostingPlansStore = create<HostingPlansStore>((set, get) => ({
  plans: [],
  activePlans: [],
  selectedPlan: null,

  loading: false,
  error: null,

  // =============================
  // 🟢 Fetch Active Plans
  // =============================
  fetchActivePlans: async () => {
    set({ loading: true });

    try {
      const res = await axios.get("/api/v1/plans/");
      set({ activePlans: res.data, loading: false });
    } catch (error: any) {
      set({ loading: false, error: error.message });
    }
  },

  // =============================
  // 🔵 Fetch All Plans
  // =============================
  fetchAllPlans: async () => {
    set({ loading: true });

    try {
      const res = await axios.get("/api/v1/plans/all");
      set({ plans: res.data, loading: false });
    } catch (error: any) {
      set({ loading: false, error: error.message });
    }
  },

  // =============================
  // 🟣 Fetch Plan by ID
  // =============================
  fetchPlanById: async (id: number) => {
    set({ loading: true });

    try {
      const res = await axios.get(`/api/v1/plans/${id}`);
      set({ selectedPlan: res.data, loading: false });
    } catch (error: any) {
      set({ loading: false, error: error.message });
    }
  },

  // =============================
  // 🟠 Create Plan
  // =============================
  createPlan: async (data) => {
    try {
      const res = await axios.post("/api/v1/plans/", data);
      set({ plans: [...get().plans, res.data] });
      return true;
    } catch (error) {
      return false;
    }
  },

  // =============================
  // 🟡 Update Plan
  // =============================
  updatePlan: async (id, data) => {
    try {
      const res = await axios.put(`/api/v1/plans/${id}`, data);

      set({
        plans: get().plans.map((p) => (p.id === id ? res.data : p)),
        selectedPlan: res.data,
      });

      return true;
    } catch (error) {
      return false;
    }
  },

  // =============================
  // 🔴 Delete Plan
  // =============================
  deletePlan: async (id) => {
    try {
      await axios.delete(`/api/v1/plans/${id}`);

      set({
        plans: get().plans.filter((p) => p.id !== id),
      });

      return true;
    } catch (error) {
      return false;
    }
  },

  // =============================
  // 🟤 Toggle Active
  // =============================
  toggleActive: async (id) => {
    try {
      const res = await axios.post(`/api/v1/plans/${id}/toggle`);

      set({
        plans: get().plans.map((p) =>
          p.id === id ? { ...p, is_active: res.data.is_active } : p
        ),
      });

      return true;
    } catch (error) {
      return false;
    }
  },

  // =============================
  // 🔵 Toggle Featured
  // =============================
  toggleFeatured: async (id) => {
    try {
      const res = await axios.post(`/api/v1/plans/${id}/toggle-featured`);

      set({
        plans: get().plans.map((p) =>
          p.id === id ? { ...p, is_featured: res.data.is_featured } : p
        ),
      });

      return true;
    } catch (error) {
      return false;
    }
  },

  // =============================
  // 🔧 Plan Features
  // =============================
  getPlanFeatures: async (id) => {
    try {
      const res = await axios.get(`/api/v1/plans/${id}/features`);
      return res.data;
    } catch {
      return null;
    }
  },

  // =============================
  // 💰 Pricing
  // =============================
  getPricing: async (id) => {
    try {
      const res = await axios.get(`/api/v1/plans/${id}/pricing`);
      return res.data;
    } catch {
      return null;
    }
  },

  // =============================
  // 🔥 Discount
  // =============================
  getDiscount: async (id, cycle) => {
    try {
      const res = await axios.get(
        `/api/v1/plans/${id}/discount?billing_cycle=${cycle}`
      );
      return res.data.discount;
    } catch {
      return null;
    }
  },
}));
