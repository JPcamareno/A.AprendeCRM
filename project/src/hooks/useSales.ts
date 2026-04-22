import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { getSaleType } from '../lib/constants';
import type { Sale, SaleFormData } from '../lib/types';
import toast from 'react-hot-toast';

export function useSales() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSales();

    const subscription = supabase
      .channel('sales_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sales' }, () => {
        fetchSales();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchSales = async () => {
    try {
      const { data, error } = await supabase
        .from('sales')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSales(data || []);
    } catch (error) {
      console.error('Error fetching sales:', error);
      toast.error('Error al cargar ventas');
    } finally {
      setLoading(false);
    }
  };

  const buildCleanData = (saleData: SaleFormData) => {
    const amount = typeof saleData.amount === 'string'
      ? parseFloat((saleData.amount as string).replace(/,/g, ''))
      : saleData.amount;

    const saleType = getSaleType(saleData.course);

    return {
      customer_name: saleData.customer_name,
      phone: saleData.phone,
      course: saleData.course,
      enrollment_date: saleData.enrollment_date,
      amount,
      seller: saleData.seller,
      sale_type: saleType,
      campaign_name: saleData.campaign_name || null,
      image_video_name: saleData.image_video_name || null,
      conversation_starter: saleData.conversation_starter || null,
      lead_id: saleData.lead_id && saleData.lead_id.trim() !== '' ? saleData.lead_id : null,
      child_name: saleData.child_name || null,
      parent_name: saleData.parent_name || null,
      trial_class_date: saleData.trial_class_date || null,
      trial_class_attended: saleData.trial_class_attended ?? false,
    };
  };

  const addSale = async (saleData: SaleFormData) => {
    try {
      const cleanData = buildCleanData(saleData);
      const { error } = await supabase.from('sales').insert([cleanData]);
      if (error) throw error;
      toast.success('Venta registrada exitosamente');
      await fetchSales();
    } catch (error: any) {
      console.error('Error adding sale:', error);
      toast.error('Error al registrar venta');
      throw error;
    }
  };

  const updateSale = async (id: string, saleData: SaleFormData) => {
    try {
      const cleanData = buildCleanData(saleData);
      const { error } = await supabase
        .from('sales')
        .update(cleanData)
        .eq('id', id);
      if (error) throw error;
      toast.success('Venta actualizada exitosamente');
      await fetchSales();
    } catch (error: any) {
      console.error('Error updating sale:', error);
      toast.error('Error al actualizar venta');
      throw error;
    }
  };

  const deleteSale = async (id: string) => {
    try {
      const { error } = await supabase.from('sales').delete().eq('id', id);
      if (error) throw error;
      toast.success('Venta eliminada exitosamente');
      await fetchSales();
    } catch (error: any) {
      console.error('Error deleting sale:', error);
      toast.error('Error al eliminar venta');
      throw error;
    }
  };

  return { sales, loading, addSale, updateSale, deleteSale, refresh: fetchSales };
}