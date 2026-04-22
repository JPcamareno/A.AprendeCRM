import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { MonthlyHistory } from '../lib/types';
import toast from 'react-hot-toast';

export function useMonthlyHistory() {
  const [history, setHistory] = useState<MonthlyHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('monthly_history')
        .select('*')
        .order('year', { ascending: false })
        .order('month', { ascending: false });

      if (error) throw error;
      setHistory(data || []);
    } catch (error) {
      console.error('Error fetching monthly history:', error);
      toast.error('Error al cargar histórico mensual');
    } finally {
      setLoading(false);
    }
  };

  const calculateAndSaveHistory = async (month: number, year: number) => {
    try {
      const { error } = await supabase.rpc('calculate_monthly_history', {
        p_month: month,
        p_year: year,
      });

      if (error) throw error;
      
      await fetchHistory();
      toast.success('Histórico mensual calculado exitosamente');
    } catch (error) {
      console.error('Error calculating monthly history:', error);
      toast.error('Error al calcular histórico mensual');
    }
  };

  return {
    history,
    loading,
    calculateAndSaveHistory,
    refetch: fetchHistory,
  };
}