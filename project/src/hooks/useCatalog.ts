import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { DEFAULT_COURSES, DEFAULT_SELLERS } from '../lib/constants';

export function useCourses() {
  const [courses, setCourses] = useState<string[]>(DEFAULT_COURSES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('courses_catalog')
        .select('name')
        .eq('active', true)
        .order('name');

      if (error) throw error;

      if (data && data.length > 0) {
        setCourses(data.map((c) => c.name));
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
      // Keep default courses if fetch fails
    } finally {
      setLoading(false);
    }
  };

  const addCourse = async (name: string, type: 'CURSO' | 'TALLER') => {
    try {
      const { error } = await supabase
        .from('courses_catalog')
        .insert([{ name, type }]);

      if (error) throw error;

      await fetchCourses();
      return { success: true };
    } catch (error: any) {
      console.error('Error adding course:', error);
      return { success: false, error: error.message };
    }
  };

  const removeCourse = async (name: string) => {
    try {
      const { error } = await supabase
        .from('courses_catalog')
        .update({ active: false })
        .eq('name', name);

      if (error) throw error;

      await fetchCourses();
      return { success: true };
    } catch (error: any) {
      console.error('Error removing course:', error);
      return { success: false, error: error.message };
    }
  };

  return { courses, loading, addCourse, removeCourse, refresh: fetchCourses };
}

export function useSellers() {
  const [sellers, setSellers] = useState<string[]>(DEFAULT_SELLERS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSellers();
  }, []);

  const fetchSellers = async () => {
    try {
      const { data, error } = await supabase
        .from('sellers')
        .select('name')
        .eq('active', true)
        .order('name');

      if (error) throw error;

      if (data && data.length > 0) {
        setSellers(data.map((s) => s.name));
      }
    } catch (error) {
      console.error('Error fetching sellers:', error);
      // Keep default sellers if fetch fails
    } finally {
      setLoading(false);
    }
  };

  const addSeller = async (name: string) => {
    try {
      const { error } = await supabase
        .from('sellers')
        .insert([{ name }]);

      if (error) throw error;

      await fetchSellers();
      return { success: true };
    } catch (error: any) {
      console.error('Error adding seller:', error);
      return { success: false, error: error.message };
    }
  };

  const removeSeller = async (name: string) => {
    try {
      const { error } = await supabase
        .from('sellers')
        .update({ active: false })
        .eq('name', name);

      if (error) throw error;

      await fetchSellers();
      return { success: true };
    } catch (error: any) {
      console.error('Error removing seller:', error);
      return { success: false, error: error.message };
    }
  };

  return { sellers, loading, addSeller, removeSeller, refresh: fetchSellers };
}