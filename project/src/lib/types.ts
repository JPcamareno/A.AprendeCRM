export interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'ADMIN' | 'VENDEDOR';
  active: boolean;
  created_at: string;
}

export interface Course {
  id: string;
  name: string;
  type: 'REGULAR' | 'CONVERSACIONAL';
  active: boolean;
  created_at: string;
}

export interface Seller {
  id: string;
  name: string;
  active: boolean;
  created_at: string;
}

export interface Lead {
  id: string;
  customer_name: string;
  phone: string;
  interested_course: string;
  contact_date: string;
  status: 'NUEVO' | 'CONTACTADO' | 'INTERESADO' | 'NO_INTERESADO' | 'CONVERTIDO';
  rejection_reason?: string;
  assigned_to: string;
  notes?: string;
  campaign_name?: string;
  image_video_name?: string;
  created_at: string;
  updated_at: string;
}

export interface LeadFormData {
  customer_name: string;
  phone: string;
  interested_course: string;
  contact_date: string;
  status: Lead['status'];
  rejection_reason?: string;
  assigned_to: string;
  notes?: string;
  campaign_name?: string;
  image_video_name?: string;
}

export interface Sale {
  id: string;
  customer_name: string;
  phone: string;
  course: string;
  enrollment_date: string;
  amount: number;
  campaign_name?: string;
  image_video_name?: string;
  seller: string;
  sale_type: string;
  conversation_starter?: string;
  lead_id?: string;
  child_name?: string;
  parent_name?: string;
  trial_class_date?: string;
  trial_class_attended?: boolean;
  created_at: string;
  updated_at: string;
}

export interface SaleFormData {
  customer_name: string;
  phone: string;
  course: string;
  enrollment_date: string;
  amount: number;
  campaign_name?: string;
  image_video_name?: string;
  seller: string;
  sale_type: string;
  conversation_starter?: string;
  lead_id?: string;
  child_name?: string;
  parent_name?: string;
  trial_class_date?: string;
  trial_class_attended?: boolean;
}

export interface AdvertisingExpense {
  id: string;
  campaign_name: string;
  week_number: number;
  year: number;
  day_1: number;
  day_2: number;
  day_3: number;
  day_4: number;
  day_5: number;
  day_6: number;
  day_7: number;
  created_at: string;
  updated_at: string;
}

export interface WeekPeriod {
  id: string;
  week_number: number;
  year: number;
  start_date: string;
  end_date: string;
}

export interface MonthlyHistory {
  id: string;
  month: number;
  year: number;
  total_sales: number;
  total_revenue: number;
  total_leads: number;
  converted_leads: number;
  conversion_rate: number;
  total_expenses: number;
  net_profit: number;
  roi: number;
  created_at: string;
  updated_at: string;
}

export interface CampaignPerformance {
  campaign_name: string;
  total_leads: number;
  converted_leads: number;
  conversion_rate: number;
  total_sales: number;
  total_revenue: number;
  total_expenses: number;
  roi: number;
}

export interface AdPerformance {
  image_video_name: string;
  campaign_name: string;
  total_leads: number;
  converted_leads: number;
  conversion_rate: number;
  total_sales: number;
  total_revenue: number;
}

export type DateFilterMode = 'all' | 'today' | 'week' | 'month' | 'custom' | 'specific';