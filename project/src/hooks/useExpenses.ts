import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { startOfDay, endOfDay, subDays } from 'date-fns';
import toast from 'react-hot-toast';

export interface DailyExpense {
  id: string;
  campaign_name: string;
  campaign_id?: string;
  ad_set_name?: string;
  ad_set_id?: string;
  date: string; // YYYY-MM-DD format
  amount: number;
  currency?: string;
  impressions?: number;
  clicks?: number;
  conversions?: number;
  meta_synced?: boolean;
  source?: 'daily' | 'weekly';
  created_at: string;
  updated_at: string;
}

export type FilterType = 'today' | '7days' | '14days' | 'custom';

export interface DateRange {
  start: string;
  end: string;
}

interface UseExpensesOptions {
  filterType?: FilterType;
  dateRange?: DateRange;
  campaignName?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function useExpenses(options: UseExpensesOptions = {}) {
  const {
    filterType = '7days',
    dateRange,
    campaignName,
    autoRefresh = false,
    refreshInterval = 60000, // 1 minute
  } = options;

  const [expenses, setExpenses] = useState<DailyExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      setError(null);

      // Calculate date range based on filter type
      const today = new Date();
      let startDate: Date;
      let endDate: Date = endOfDay(today);

      if (dateRange) {
        startDate = new Date(dateRange.start);
        endDate = endOfDay(new Date(dateRange.end));
      } else {
        switch (filterType) {
          case 'today':
            startDate = startOfDay(today);
            break;
          case '7days':
            startDate = startOfDay(subDays(today, 6));
            break;
          case '14days':
            startDate = startOfDay(subDays(today, 13));
            break;
          default:
            startDate = startOfDay(subDays(today, 6));
        }
      }

      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];

      // Fetch from unified view (sin filtrar por campaign_status para incluir campañas pausadas/archivadas)
      let query = supabase
        .from('unified_advertising_expenses')
        .select('*')
        .gte('date', startDateStr)
        .lte('date', endDateStr)
        .order('date', { ascending: false });

      // Apply campaign filter if provided
      if (campaignName && campaignName !== 'all') {
        query = query.eq('campaign_name', campaignName);
      }

      const { data, error: queryError } = await query;

      if (queryError) {
        throw queryError;
      }

      setExpenses((data as DailyExpense[]) || []);
    } catch (err: any) {
      console.error('Error fetching expenses:', err);
      setError(err.message || 'Error al cargar gastos publicitarios');
      toast.error('Error al cargar gastos publicitarios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();

    // Set up auto-refresh if enabled
    let intervalId: NodeJS.Timeout | null = null;
    
    if (autoRefresh) {
      intervalId = setInterval(fetchExpenses, refreshInterval);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [filterType, dateRange, campaignName, autoRefresh, refreshInterval]);

  const refetch = () => {
    fetchExpenses();
  };

  // Calculate statistics
  const calculateTotal = () => {
    return expenses.reduce((sum, expense) => sum + expense.amount, 0);
  };

  const calculateDailyAverage = () => {
    if (expenses.length === 0) return 0;
    const uniqueDates = new Set(expenses.map(e => e.date));
    return uniqueDates.size > 0 ? calculateTotal() / uniqueDates.size : 0;
  };

  const getCampaignTotals = () => {
    const totals: Record<string, number> = {};
    
    expenses.forEach(expense => {
      if (!totals[expense.campaign_name]) {
        totals[expense.campaign_name] = 0;
      }
      totals[expense.campaign_name] += expense.amount;
    });

    return Object.entries(totals)
      .sort((a, b) => b[1] - a[1]);
  };

  const getUniqueCampaigns = () => {
    return Array.from(new Set(expenses.map(e => e.campaign_name)));
  };

  const getExpensesByDate = () => {
    const grouped: Record<string, DailyExpense[]> = {};
    
    expenses.forEach(expense => {
      if (!grouped[expense.date]) {
        grouped[expense.date] = [];
      }
      grouped[expense.date].push(expense);
    });

    return grouped;
  };

  return {
    expenses,
    loading,
    error,
    refetch,
    calculateTotal,
    calculateDailyAverage,
    getCampaignTotals,
    getUniqueCampaigns,
    getExpensesByDate,
  };
}

// Hook to fetch all campaigns (for filters)
export function useCampaigns() {
  const [campaigns, setCampaigns] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        setLoading(true);

        // Fetch from daily expenses
        const { data: dailyData } = await supabase
          .from('daily_advertising_expenses')
          .select('campaign_name');

        // Fetch from weekly expenses
        const { data: weeklyData } = await supabase
          .from('advertising_expenses')
          .select('campaign_name');

        const allCampaigns = [
          ...(dailyData?.map(d => d.campaign_name) || []),
          ...(weeklyData?.map(d => d.campaign_name) || []),
        ];

        const uniqueCampaigns = Array.from(new Set(allCampaigns)).sort();
        setCampaigns(uniqueCampaigns);
      } catch (error) {
        console.error('Error fetching campaigns:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCampaigns();
  }, []);

  return { campaigns, loading };
}