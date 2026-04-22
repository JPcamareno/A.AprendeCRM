import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Lead, LeadFormData } from '../lib/types';
import toast from 'react-hot-toast';

export function useLeads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeads();

    const subscription = supabase
      .channel('leads_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, () => {
        fetchLeads();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchLeads = async () => {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLeads(data || []);
    } catch (error) {
      console.error('Error fetching leads:', error);
      toast.error('Error al cargar prospectos');
    } finally {
      setLoading(false);
    }
  };

  const addLead = async (leadData: LeadFormData) => {
    try {
      const { error } = await supabase.from('leads').insert([leadData]);

      if (error) throw error;
      toast.success('Prospecto registrado exitosamente');
      await fetchLeads();
    } catch (error: any) {
      console.error('Error adding lead:', error);
      toast.error('Error al registrar prospecto');
      throw error;
    }
  };

  const updateLead = async (id: string, leadData: Partial<LeadFormData>) => {
    try {
      const { error } = await supabase
        .from('leads')
        .update(leadData)
        .eq('id', id);

      if (error) throw error;
      toast.success('Prospecto actualizado exitosamente');
      await fetchLeads();
    } catch (error: any) {
      console.error('Error updating lead:', error);
      toast.error('Error al actualizar prospecto');
      throw error;
    }
  };

  const deleteLead = async (id: string) => {
    try {
      const { error } = await supabase.from('leads').delete().eq('id', id);

      if (error) throw error;
      toast.success('Prospecto eliminado exitosamente');
      await fetchLeads();
    } catch (error: any) {
      console.error('Error deleting lead:', error);
      toast.error('Error al eliminar prospecto');
      throw error;
    }
  };

  const convertToSale = async (leadId: string) => {
    try {
      const { error } = await supabase
        .from('leads')
        .update({ status: 'CONVERTIDO' })
        .eq('id', leadId);

      if (error) throw error;
      toast.success('Lead marcado como convertido');
      await fetchLeads();
    } catch (error: any) {
      console.error('Error converting lead:', error);
      toast.error('Error al convertir lead');
      throw error;
    }
  };

  return { leads, loading, addLead, updateLead, deleteLead, convertToSale, refresh: fetchLeads };
}