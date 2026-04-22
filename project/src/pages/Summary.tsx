import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Select } from '../components/ui/Select';
import { Input } from '../components/ui/Input';
import { TrendingUp, TrendingDown, DollarSign, Target, Info, Users } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { formatCurrency } from '../lib/utils';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import type { Sale, AdvertisingExpense, Seller, Course } from '../lib/types';
import { format, parseISO, isWithinInterval, isToday, isThisWeek, isThisMonth, startOfDay, endOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LineChart,
  Line,
  Legend,
} from 'recharts';

type DateFilterMode = 'all' | 'today' | 'week' | 'month' | 'specific' | 'custom';

export function Summary() {
  // Estados de datos
  const [sales, setSales] = useState<Sale[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [dailyExpenses, setDailyExpenses] = useState<any[]>([]); // ✅ NUEVO: Gastos diarios unificados
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filtros (IGUAL QUE ANALYTICS)
  const [cycle, setCycle] = useState('2025');
  const [filterCampaign, setFilterCampaign] = useState('');
  const [filterAd, setFilterAd] = useState('');
  const [filterCourse, setFilterCourse] = useState('');
  const [filterSeller, setFilterSeller] = useState('');
  const [dateFilterMode, setDateFilterMode] = useState<DateFilterMode>('all');
  const [specificDate, setSpecificDate] = useState('');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  
  // Estado para controlar qué campañas están expandidas
  const [expandedCampaigns, setExpandedCampaigns] = useState<Set<string>>(new Set());
  const [evolutionMode, setEvolutionMode] = useState<'week' | 'month'>('week');

  useEffect(() => {
    fetchData();
  }, [cycle]);

  // ✅ NUEVO: Validación de rangos de fecha
  useEffect(() => {
    if (dateFilterMode === 'custom' && customStartDate && customEndDate) {
      const start = new Date(customStartDate);
      const end = new Date(customEndDate);
      
      if (start > end) {
        toast.error('La fecha de inicio no puede ser mayor que la fecha final');
        setCustomEndDate(''); // Limpiar fecha final inválida
      }
    }
  }, [customStartDate, customEndDate, dateFilterMode]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const year = parseInt(cycle);
      
      // Fetch sales
      const { data: salesData, error: salesError } = await supabase
        .from('sales')
        .select('*')
        .order('enrollment_date', { ascending: false });

      if (salesError) throw salesError;

      // Fetch leads
      const { data: leadsData } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      // ✅ NUEVO: Fetch unified advertising expenses (daily + weekly)
      const { data: expensesData, error: expensesError } = await supabase
        .from('unified_advertising_expenses')
        .select('*')
        .order('date', { ascending: false });

      if (expensesError) throw expensesError;

      // Fetch sellers
      const { data: sellersData, error: sellersError } = await supabase
        .from('sellers')
        .select('*')
        .eq('active', true);

      if (sellersError) throw sellersError;

      // Fetch courses
      const { data: coursesData, error: coursesError } = await supabase
        .from('courses_catalog')
        .select('*')
        .eq('active', true);

      if (coursesError) throw coursesError;

      setSales(salesData || []);
      setLeads(leadsData || []);
      setDailyExpenses(expensesData || []); // ✅ Guardar gastos diarios
      setSellers(sellersData || []);
      setCourses(coursesData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  // Funciones de filtrado de fechas
  const matchesDateFilter = (date: string | null) => {
    if (!date) return false;
    
    const saleDate = parseISO(date);
    
    switch (dateFilterMode) {
      case 'all':
        return true;
      case 'today':
        // ✅ FIX: Filtrar por AYER (ya que el label dice "Ayer")
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStart = startOfDay(yesterday);
        const yesterdayEnd = endOfDay(yesterday);
        return saleDate >= yesterdayStart && saleDate <= yesterdayEnd;
      case 'week':
        return isThisWeek(saleDate, { locale: es });
      case 'month':
        return isThisMonth(saleDate);
      case 'specific':
        if (!specificDate) return true;
        const specific = startOfDay(parseISO(specificDate));
        const saleDay = startOfDay(saleDate);
        return specific.getTime() === saleDay.getTime();
      case 'custom':
        if (!customStartDate || !customEndDate) return true;
        const start = startOfDay(parseISO(customStartDate));
        const end = endOfDay(parseISO(customEndDate));
        return isWithinInterval(saleDate, { start, end });
      default:
        return true;
    }
  };

  // ✅ NUEVA FUNCIÓN SIMPLE: Calcular gastos de una campaña en un rango de fechas
  const calculateExpensesInDateRange = (campaignName: string): number => {
    // Si no hay filtro de fecha, retornar todos los gastos
    if (dateFilterMode === 'all') {
      return dailyExpenses
        .filter(e => e.campaign_name === campaignName)
        .reduce((sum, e) => sum + Number(e.amount || 0), 0);
    }

    // Filtrar gastos por rango de fechas
    return dailyExpenses
      .filter(e => e.campaign_name === campaignName && matchesDateFilter(e.date))
      .reduce((sum, e) => sum + Number(e.amount || 0), 0);
  };

  // Filtrar ventas
  const filteredSales = sales.filter(sale => {
    const matchesCampaign = !filterCampaign || sale.campaign_name === filterCampaign;
    const matchesAd = !filterAd || sale.image_video_name === filterAd;
    const matchesCourse = !filterCourse || sale.course === filterCourse; // ✅ FIX: course en vez de course_name
    const matchesSeller = !filterSeller || sale.seller === filterSeller; // ✅ FIX: seller en vez de seller_name
    const matchesDate = matchesDateFilter(sale.enrollment_date);
    
    return matchesCampaign && matchesAd && matchesCourse && matchesSeller && matchesDate;
  });

  // Funciones para expandir/colapsar campañas
  const toggleCampaign = (campaignName: string) => {
    const newExpanded = new Set(expandedCampaigns);
    if (newExpanded.has(campaignName)) {
      newExpanded.delete(campaignName);
    } else {
      newExpanded.add(campaignName);
    }
    setExpandedCampaigns(newExpanded);
  };

  const expandAll = () => {
    const allCampaigns = Array.from(new Set(sales.map(s => s.campaign_name).filter(Boolean)));
    setExpandedCampaigns(new Set(allCampaigns as string[]));
  };

  const collapseAll = () => {
    setExpandedCampaigns(new Set());
  };

  // Calcular métricas por campaña y anuncio
  const campaignGroups: any[] = [];
  
  // ✅ FIX: Obtener campañas según filtros aplicados
  const allCampaignNamesSet = new Set<string>();
  
  // Campañas con ventas (siempre se incluyen)
  filteredSales.forEach(s => {
    if (s.campaign_name) allCampaignNamesSet.add(s.campaign_name);
  });
  
  // ✅ NUEVO: Campañas con gastos solo si NO hay filtro de curso/vendedor
  // Si hay filtro de curso, solo mostramos campañas que tienen ventas de ese curso
  if (!filterCourse && !filterSeller) {
    dailyExpenses.forEach(e => {
      if (e.campaign_name && matchesDateFilter(e.date)) {
        allCampaignNamesSet.add(e.campaign_name);
      }
    });
  }
  
  const campaignNames = Array.from(allCampaignNamesSet);

  campaignNames.forEach(campaign => {
    const campaignSales = filteredSales.filter(s => s.campaign_name === campaign);
    
    // ✅ FIX: Usar función que calcula gastos en el rango de fechas filtrado
    const campaignTotalExpenses = calculateExpensesInDateRange(campaign);
    
    // Obtener anuncios únicos
    const ads = Array.from(new Set(campaignSales.map(s => s.image_video_name).filter(Boolean)));

    // PRIMERO: Calcular ingresos totales de la campaña
    const campaignTotalRevenue = campaignSales.reduce((sum, s) => sum + Number(s.amount), 0);

    const adMetrics: any[] = [];

    ads.forEach(ad => {
      const adSales = campaignSales.filter(s => s.image_video_name === ad);
      const totalRevenue = adSales.reduce((sum, s) => sum + Number(s.amount), 0);
      
      // Distribuir gastos proporcionalmente según el ingreso
      // Si esta imagen generó el X% de ingresos, recibe X% de los gastos
      const adExpenses = campaignTotalRevenue > 0 
        ? (totalRevenue / campaignTotalRevenue) * campaignTotalExpenses 
        : 0;

      const ganancia = totalRevenue - adExpenses;
      
      // Calcular ROI solo si hay gastos
      let roi_porcentaje: number | null = null;
      if (adExpenses > 0) {
        roi_porcentaje = (ganancia / adExpenses) * 100;
      }

      adMetrics.push({
        ad_name: ad!,
        gastos: adExpenses,
        ingresos: totalRevenue,
        num_ventas: adSales.length,
        ganancia,
        roi_porcentaje
      });
    });

    const campaignGanancia = campaignTotalRevenue - campaignTotalExpenses;
    
    // 🔧 AJUSTE #4: Mejorar cálculo de ROI global de campaña
    let campaignROI: number | null = null;
    if (campaignTotalExpenses > 0) {
      campaignROI = (campaignGanancia / campaignTotalExpenses) * 100;
    }
    
    // ✅ Calcular semanas activas desde dailyExpenses
    const campaignDailyExpenses = dailyExpenses.filter(e => e.campaign_name === campaign);
    const uniqueWeeks = new Set(
      campaignDailyExpenses.map(e => {
        const date = parseISO(e.date);
        const weekNumber = Math.ceil((date.getDate() + 6 - date.getDay()) / 7);
        return `${date.getFullYear()}-W${weekNumber}`;
      })
    );
    const semanasActivas = uniqueWeeks.size;

    campaignGroups.push({
      campaign_name: campaign!,
      semanas_activas: semanasActivas,
      ads: adMetrics,
      totals: {
        gastos: campaignTotalExpenses,
        ingresos: campaignTotalRevenue,
        num_ventas: campaignSales.length,
        ganancia: campaignGanancia,
        roi_porcentaje: campaignROI
      },
      isExpanded: expandedCampaigns.has(campaign!)
    });
  });

  // KPIs globales
  // ✅ FIX: Calcular gastos filtrados por rango de fechas
  const filteredCampaignNames = Array.from(new Set(filteredSales.map(s => s.campaign_name).filter(Boolean))) as string[];
  
  const totalGastos = filteredCampaignNames.reduce((sum, campaignName) => {
    return sum + calculateExpensesInDateRange(campaignName);
  }, 0);
  
  const totalIngresos = filteredSales.reduce((sum, s) => sum + Number(s.amount), 0);
  const totalVentas = filteredSales.length;
  const totalGanancia = totalIngresos - totalGastos;
  const roiGlobal = totalGastos > 0 ? ((totalGanancia / totalGastos) * 100) : 0;

  const campañasRentables = campaignGroups.filter(c => c.totals.ganancia > 0);
  const campañasPerdida = campaignGroups.filter(c => c.totals.ganancia < 0);

  // Datos para gráfico
  const chartData = campaignGroups.map(c => ({
    name: c.campaign_name.length > 20 ? c.campaign_name.substring(0, 20) + '...' : c.campaign_name,
    ganancia: c.totals.ganancia,
    fullName: c.campaign_name,
  }));

  // Opciones para filtros
  const campaignOptions = Array.from(new Set(sales.map(s => s.campaign_name).filter(Boolean)))
    .map(name => ({ value: name as string, label: name as string }));

  const adOptions = filterCampaign
    ? Array.from(new Set(sales.filter(s => s.campaign_name === filterCampaign)
        .map(s => s.image_video_name).filter(Boolean)))
        .map(name => ({ value: name as string, label: name as string }))
    : [];

  const getROIColor = (roi: number | null) => {
    if (roi === null) return 'text-gray-500';
    if (roi >= 100) return 'text-green-600';
    if (roi >= 0) return 'text-green-500';
    if (roi >= -50) return 'text-orange-500';
    return 'text-red-600';
  };

  const getROIBadge = (roi: number | null) => {
    if (roi === null) return { text: 'Sin gastos', class: 'bg-gray-100 text-gray-700' };
    if (roi >= 100) return { text: '🔥 Excelente', class: 'bg-green-100 text-green-700' };
    if (roi >= 0) return { text: '✅ Rentable', class: 'bg-green-50 text-green-600' };
    if (roi >= -50) return { text: '⚠️ Baja', class: 'bg-orange-100 text-orange-700' };
    return { text: '🔴 Pérdida', class: 'bg-red-100 text-red-700' };
  };

  const handleClearFilters = () => {
    setFilterCampaign('');
    setFilterAd('');
    setFilterCourse('');
    setFilterSeller('');
    setDateFilterMode('all');
    setSpecificDate('');
    setCustomStartDate('');
    setCustomEndDate('');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary-500"></div>
      </div>
    );
  }

  // ---- KPIs de Leads ----
  const filteredLeads = leads.filter(lead => {
    const matchesCampaign = !filterCampaign || lead.campaign_name === filterCampaign;
    const matchesDate = matchesDateFilter(lead.created_at);
    return matchesCampaign && matchesDate;
  });
  const totalLeads = filteredLeads.length;
  const CPL = totalLeads > 0 ? totalGastos / totalLeads : 0;
  const CAC = totalVentas > 0 ? totalGastos / totalVentas : 0;

  // ---- Lógica de Sugerencias ----
  const getSuggestion = (group: any): { emoji: string; label: string; reason: string } => {
    const { totals, semanas_activas } = group;
    const { gastos, ingresos, roi_porcentaje, num_ventas } = totals;
    const MAX_CAC = 8000;
    const MAX_CPL = 2000;
    const MIN_LEADS_FOR_LOOKALIKE = 50;
    const campaignLeads = filteredLeads.filter((l: any) => l.campaign_name === group.campaign_name).length;
    const campaignCAC = num_ventas > 0 ? gastos / num_ventas : Infinity;
    const campaignCPL = campaignLeads > 0 ? gastos / campaignLeads : Infinity;

    if ((gastos > ingresos && num_ventas === 0) || (campaignCPL > MAX_CPL && campaignLeads > 0)) {
      return {
        emoji: '🛑',
        label: 'Apagar',
        reason: campaignCPL > MAX_CPL
          ? `CPL de ${formatCurrency(campaignCPL)} supera el límite de ${formatCurrency(MAX_CPL)}.`
          : `Se han gastado ${formatCurrency(gastos)} sin ninguna venta.`
      };
    }
    if (roi_porcentaje !== null && roi_porcentaje > 300 && campaignCAC < MAX_CAC) {
      return {
        emoji: '🚀',
        label: 'Escalar',
        reason: `ROI del ${roi_porcentaje.toFixed(1)}% supera el 300% y CAC (${formatCurrency(campaignCAC)}) está bajo el límite óptimo.`
      };
    }
    if (roi_porcentaje !== null && roi_porcentaje > 200 && semanas_activas >= 1) {
      return {
        emoji: '🔄',
        label: 'Duplicar',
        reason: `ROI del ${roi_porcentaje.toFixed(1)}% es ganador y lleva ${semanas_activas} semana(s) activo. Duplicar para escalar horizontalmente sin tocar el original.`
      };
    }
    if (campaignLeads >= MIN_LEADS_FOR_LOOKALIKE && roi_porcentaje !== null && roi_porcentaje > 0) {
      return {
        emoji: '👯',
        label: 'Crear Lookalike',
        reason: `${campaignLeads} leads con ROI positivo. Hay suficiente data para crear una audiencia similar al 1% basada en estos compradores.`
      };
    }
    return { emoji: '📊', label: 'Observar', reason: 'Aún no hay suficiente data para una recomendación específica. Deja correr la campaña.' };
  };

  // ---- Evolución de Ventas ----
  const buildEvolutionWeekData = () => {
    const grouped: Record<string, { periodo: string; ventas: number; ingresos: number; sortKey: string }> = {};
    filteredSales.forEach(sale => {
      if (!sale.enrollment_date) return;
      const d = parseISO(sale.enrollment_date);
      // Calculate start of week (Monday) and end of week (Sunday)
      const dayOfWeek = d.getDay() === 0 ? 6 : d.getDay() - 1; // Monday = 0
      const weekStart = new Date(d);
      weekStart.setDate(d.getDate() - dayOfWeek);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      // Format: "2 feb - 8 feb"
      const startDay = weekStart.getDate();
      const endDay = weekEnd.getDate();
      const startMonth = format(weekStart, 'MMM', { locale: es });
      const endMonth = format(weekEnd, 'MMM', { locale: es });
      const label = startMonth === endMonth
        ? `${startDay}-${endDay} ${startMonth}`
        : `${startDay} ${startMonth} - ${endDay} ${endMonth}`;
      const sortKey = format(weekStart, 'yyyy-MM-dd');
      if (!grouped[sortKey]) grouped[sortKey] = { periodo: label, ventas: 0, ingresos: 0, sortKey };
      grouped[sortKey].ventas += 1;
      grouped[sortKey].ingresos += Number(sale.amount);
    });
    return Object.values(grouped).sort((a, b) => a.sortKey.localeCompare(b.sortKey));
  };

  const buildEvolutionMonthData = () => {
    const grouped: Record<string, { periodo: string; ventas: number; ingresos: number }> = {};
    filteredSales.forEach(sale => {
      if (!sale.enrollment_date) return;
      const d = parseISO(sale.enrollment_date);
      const key = format(d, 'MMM yyyy', { locale: es });
      if (!grouped[key]) grouped[key] = { periodo: key, ventas: 0, ingresos: 0 };
      grouped[key].ventas += 1;
      grouped[key].ingresos += Number(sale.amount);
    });
    return Object.values(grouped);
  };

  const evolutionTitle = `Evolución de ventas${filterCourse ? ` · ${filterCourse}` : ''}${filterSeller ? ` · ${filterSeller}` : ''}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Resumen y Análisis</h1>
          <p className="text-gray-600 mt-1">ROI y rentabilidad por campaña publicitaria</p>
        </div>
        <Button variant="secondary" onClick={fetchData}>
          <TrendingUp className="w-4 h-4 mr-2" />
          Actualizar
        </Button>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Filtros Avanzados</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select
            label="Ciclo Académico"
            value={cycle}
            onChange={(e) => setCycle(e.target.value)}
            options={[
              { value: '2024', label: 'Ciclo 2024' },
              { value: '2025', label: 'Ciclo 2025' },
              { value: '2026', label: 'Ciclo 2026' },
            ]}
          />

          <Select
            value={filterCampaign}
            onChange={(e) => {
              setFilterCampaign(e.target.value);
              setFilterAd('');
            }}
            label="Campaña"
            options={[
              { value: '', label: 'Todas las campañas' },
              ...campaignOptions
            ]}
          />

          {/* 🔧 AJUSTE #2: Filtro por anuncio ya existía, solo mejorado */}
          <Select
            value={filterAd}
            onChange={(e) => setFilterAd(e.target.value)}
            label="Anuncio / Imagen / Video"
            disabled={!filterCampaign}
            options={[
              { 
                value: '', 
                label: !filterCampaign 
                  ? '⚠️ Selecciona primero una campaña' 
                  : adOptions.length > 0 
                    ? 'Todos los anuncios de esta campaña' 
                    : 'No hay anuncios en esta campaña'
              },
              ...adOptions
            ]}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Select
            value={dateFilterMode}
            onChange={(e) => {
              setDateFilterMode(e.target.value as DateFilterMode);
              setSpecificDate('');
              setCustomStartDate('');
              setCustomEndDate('');
            }}
            label="Filtro de Fecha"
            options={[
              { value: 'all', label: '📅 Todas las fechas' },
              { value: 'today', label: '📆 Ayer' }, // ✅ CAMBIADO: "Hoy" a "Ayer"
              { value: 'week', label: '📅 Esta semana' },
              { value: 'month', label: '🗓️ Este mes' },
              { value: 'specific', label: '📌 Fecha específica' },
              { value: 'custom', label: '🔍 Rango personalizado' }
            ]}
          />

          <Select
            value={filterCourse}
            onChange={(e) => setFilterCourse(e.target.value)}
            label="Curso"
            options={[
              { value: '', label: 'Todos los cursos' },
              ...courses.map(c => ({ value: c.name, label: c.name }))
            ]}
          />

          <Select
            value={filterSeller}
            onChange={(e) => setFilterSeller(e.target.value)}
            label="Vendedor"
            options={[
              { value: '', label: 'Todos los vendedores' },
              ...sellers.map(s => ({ value: s.name, label: s.name }))
            ]}
          />

          <Button variant="outline" onClick={handleClearFilters}>
            Limpiar filtros
          </Button>
        </div>

        {dateFilterMode === 'specific' && (
          <Input
            type="date"
            label="Fecha específica"
            value={specificDate}
            onChange={(e) => setSpecificDate(e.target.value)}
          />
        )}

        {dateFilterMode === 'custom' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              type="date"
              label="Fecha inicio"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
            />
            <Input
              type="date"
              label="Fecha fin"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
            />
          </div>
        )}
      </div>

      {/* KPIs Principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 🔧 AJUSTE #1: Agregado número de ventas */}
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-500 font-medium">Ingresos Totales</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalIngresos)}</p>
              <p className="text-xs text-gray-500 mt-1">
                {totalVentas} venta{totalVentas !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Gastos Publicidad</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalGastos)}</p>
            </div>
          </div>
        </Card>

        <Card className={`p-6 ${totalGanancia >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl shadow-lg ${totalGanancia >= 0 ? 'bg-green-500' : 'bg-red-500'}`}>
              {totalGanancia >= 0 ? (
                <TrendingUp className="w-6 h-6 text-white" />
              ) : (
                <TrendingDown className="w-6 h-6 text-white" />
              )}
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Ganancia Neta</p>
              <p className={`text-2xl font-bold ${totalGanancia >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                {formatCurrency(totalGanancia)}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg">
              <Target className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">ROI Global</p>
              <p className={`text-2xl font-bold ${getROIColor(roiGlobal)}`}>
                {roiGlobal.toFixed(1)}%
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* KPIs de Leads */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl shadow-lg">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Total Leads</p>
              <p className="text-2xl font-bold text-gray-900">{totalLeads}</p>
              <p className="text-xs text-gray-400 mt-1">Prospectos captados</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl shadow-lg">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">CPL</p>
              <p className="text-2xl font-bold text-gray-900">{CPL > 0 ? formatCurrency(CPL) : '—'}</p>
              <p className="text-xs text-gray-400 mt-1">Costo por Lead</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl shadow-lg">
              <Target className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">CAC</p>
              <p className="text-2xl font-bold text-gray-900">{CAC > 0 ? formatCurrency(CAC) : '—'}</p>
              <p className="text-xs text-gray-400 mt-1">Costo de Adquisición</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Gráfico Evolución de Ventas */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <h3 className="text-lg font-semibold text-gray-900">{evolutionTitle}</h3>
          <div className="flex gap-2">
            <label className={`px-3 py-1.5 text-sm rounded-lg font-medium cursor-pointer transition-colors border ${
              evolutionMode === 'week' ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
            }`}>
              <input type="radio" className="hidden" onChange={() => setEvolutionMode('week')} checked={evolutionMode === 'week'} readOnly />
              Por semana
            </label>
            <label className={`px-3 py-1.5 text-sm rounded-lg font-medium cursor-pointer transition-colors border ${
              evolutionMode === 'month' ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
            }`}>
              <input type="radio" className="hidden" onChange={() => setEvolutionMode('month')} checked={evolutionMode === 'month'} readOnly />
              Por mes
            </label>
          </div>
        </div>
        <div className="h-72">
          {(evolutionMode === 'week' ? buildEvolutionWeekData() : buildEvolutionMonthData()).length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={evolutionMode === 'week' ? buildEvolutionWeekData() : buildEvolutionMonthData()}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="periodo" tick={{ fontSize: 12 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 12 }} tickFormatter={(v) => `${v}`} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} tickFormatter={(v) => `₡${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  formatter={(value: number, name: string) =>
                    name === 'ingresos' ? [formatCurrency(value), 'Ingresos'] : [value, 'Ventas']
                  }
                  contentStyle={{ borderRadius: '8px' }}
                />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="ventas" stroke="#0d9488" strokeWidth={2} dot={{ r: 4 }} name="Ventas" />
                <Line yAxisId="right" type="monotone" dataKey="ingresos" stroke="#6366f1" strokeWidth={2} dot={{ r: 4 }} name="Ingresos" strokeDasharray="5 5" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500">
              No hay datos para mostrar con los filtros actuales
            </div>
          )}
        </div>
      </Card>

      {/* Gráfico de Ganancia */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Ganancia por Campaña</h3>
        <div className="h-80">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={100}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => `₡${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(value: number, name, props) => [
                    formatCurrency(value),
                    props.payload.fullName
                  ]}
                  contentStyle={{ borderRadius: '8px' }}
                />
                <Bar dataKey="ganancia" radius={[8, 8, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.ganancia >= 0 ? '#10b981' : '#ef4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500">
              No hay datos para mostrar
            </div>
          )}
        </div>
      </Card>

      {/* Tabla Detallada - AGRUPADA Y EXPANDIBLE */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Detalle por Campaña y Anuncio</h3>
          <div className="flex gap-2">
            <button
              onClick={expandAll}
              className="px-3 py-1 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded font-medium"
            >
              Expandir todas
            </button>
            <button
              onClick={collapseAll}
              className="px-3 py-1 text-sm text-gray-600 hover:text-gray-700 hover:bg-gray-100 rounded font-medium"
            >
              Colapsar todas
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Campaña / Anuncio</th>
                {/* 🔧 AJUSTE #3: Clarificar columna "Semanas" */}
                <th className="text-center py-3 px-4 font-semibold text-gray-700">
                  <div className="flex items-center justify-center gap-1">
                    Semanas Activas
                    <span 
                      className="text-xs text-gray-400 cursor-help inline-flex items-center" 
                      title="Número de semanas con gastos registrados en esta campaña"
                    >
                      <Info className="w-4 h-4" />
                    </span>
                  </div>
                </th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">Gastos</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">Ingresos</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-700">Ventas</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">Ganancia</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">ROI</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-700">Estado</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-700">Sugerencia</th>
              </tr>
            </thead>
            <tbody>
              {campaignGroups.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-500">
                    No hay datos con los filtros aplicados
                  </td>
                </tr>
              ) : (
                campaignGroups.map((group, idx) => {
                  const badge = getROIBadge(group.totals.roi_porcentaje);
                  const isExpanded = group.isExpanded;
                  
                  return (
                    <React.Fragment key={idx}>
                      {/* Fila de Campaña (Total) */}
                      <tr 
                        className="border-b border-gray-100 bg-teal-50 hover:bg-teal-100 transition-colors cursor-pointer"
                        onClick={() => toggleCampaign(group.campaign_name)}
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span className="text-teal-600 font-bold">
                              {isExpanded ? '▼' : '▶'}
                            </span>
                            <span className="font-bold text-teal-900">{group.campaign_name}</span>
                            <span className="ml-2 px-2 py-0.5 bg-teal-200 text-teal-800 rounded-full text-xs font-semibold">
                              {group.ads.length} anuncio{group.ads.length !== 1 ? 's' : ''}
                            </span>
                          </div>
                        </td>
                        <td className="text-center py-3 px-4 text-teal-900 font-bold">
                          {group.semanas_activas}
                        </td>
                        <td className="text-right py-3 px-4 text-teal-900 font-bold">
                          {formatCurrency(group.totals.gastos)}
                        </td>
                        <td className="text-right py-3 px-4 text-teal-900 font-bold">
                          {formatCurrency(group.totals.ingresos)}
                        </td>
                        <td className="text-center py-3 px-4 text-teal-900 font-bold">
                          {group.totals.num_ventas}
                        </td>
                        <td className={`text-right py-3 px-4 font-bold ${group.totals.ganancia >= 0 ? 'text-teal-700' : 'text-red-600'}`}>
                          {formatCurrency(group.totals.ganancia)}
                        </td>
                        <td className={`text-right py-3 px-4 font-bold ${getROIColor(group.totals.roi_porcentaje)}`}>
                          {/* 🔧 AJUSTE #4: Mejor manejo de "Sin Gastos" */}
                          {group.totals.gastos === 0 && group.totals.ingresos > 0 ? (
                            <span className="text-xs text-blue-600 font-semibold">Sin gastos</span>
                          ) : group.totals.roi_porcentaje !== null ? (
                            `${group.totals.roi_porcentaje.toFixed(1)}%`
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="text-center py-3 px-4">
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${badge.class}`}>
                            {badge.text}
                          </span>
                        </td>
                        {/* Columna Sugerencia */}
                        {(() => {
                          const suggestion = getSuggestion(group);
                          return (
                            <td className="text-center py-3 px-4">
                              <div className="relative group/tip inline-block">
                                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 cursor-help whitespace-nowrap">
                                  {suggestion.emoji} {suggestion.label}
                                </span>
                                <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-gray-900 text-white text-xs rounded-lg p-3 shadow-xl opacity-0 group-hover/tip:opacity-100 transition-opacity pointer-events-none">
                                  <p className="font-semibold mb-1">¿Por qué?</p>
                                  <p>{suggestion.reason}</p>
                                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
                                </div>
                              </div>
                            </td>
                          );
                        })()}
                      </tr>

                      {/* Filas de Anuncios (Expandibles) */}
                      {isExpanded && group.ads.map((ad: any, adIdx: number) => {
                        const adBadge = getROIBadge(ad.roi_porcentaje);
                        return (
                          <tr key={`${idx}-${adIdx}`} className="border-b border-gray-100 hover:bg-gray-50 transition-colors bg-white">
                            <td className="py-3 px-4 pl-12">
                              <div className="flex items-center gap-2">
                                <span className="text-gray-400">└─</span>
                                <span className="font-medium text-gray-700">{ad.ad_name}</span>
                              </div>
                            </td>
                            <td className="text-center py-3 px-4 text-gray-500">—</td>
                            <td className="text-right py-3 px-4 text-gray-900">
                              {formatCurrency(ad.gastos)}
                            </td>
                            <td className="text-right py-3 px-4 text-gray-900 font-semibold">
                              {formatCurrency(ad.ingresos)}
                            </td>
                            <td className="text-center py-3 px-4 text-gray-600">
                              {ad.num_ventas}
                            </td>
                            <td className={`text-right py-3 px-4 font-semibold ${ad.ganancia >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {formatCurrency(ad.ganancia)}
                            </td>
                            <td className={`text-right py-3 px-4 font-semibold ${getROIColor(ad.roi_porcentaje)}`}>
                              {/* 🔧 AJUSTE #4: Mejor manejo de "Sin Gastos" para anuncios */}
                              {ad.gastos === 0 && ad.ingresos > 0 ? (
                                <span className="text-xs text-blue-600 font-medium">Sin gastos</span>
                              ) : ad.roi_porcentaje !== null ? (
                                `${ad.roi_porcentaje.toFixed(1)}%`
                              ) : (
                                '—'
                              )}
                            </td>
                            <td className="text-center py-3 px-4">
                              <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${adBadge.class}`}>
                                {adBadge.text}
                              </span>
                            </td>
                            <td className="text-center py-3 px-4 text-gray-300 text-xs">—</td>
                          </tr>
                        );
                      })}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ✨ NUEVO: Sistema de Consejos Inteligentes Avanzados */}
      <Card className="p-6">
        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
          <Info className="w-5 h-5 text-blue-500" />
          Análisis Inteligente y Recomendaciones
        </h3>
        
        {(() => {
          // Generar insights inteligentes
          const insights: Array<{
            type: 'success' | 'warning' | 'danger' | 'info';
            title: string;
            message: string;
            action: string;
            campaign?: string;
          }> = [];

          campaignGroups.forEach(campaign => {
            const { campaign_name, totals, semanas_activas } = campaign;
            const { gastos, ingresos, ganancia, roi_porcentaje, num_ventas } = totals;

            // 1. 🚀 ROI Excelente + Bajo Volumen (OPORTUNIDAD DE ESCALAR)
            if (roi_porcentaje && roi_porcentaje > 150 && num_ventas < 15 && num_ventas > 0) {
              insights.push({
                type: 'success',
                title: `${campaign_name}: Oportunidad de Escalar 🚀`,
                message: `ROI excepcional del ${roi_porcentaje.toFixed(1)}% pero solo ${num_ventas} venta${num_ventas !== 1 ? 's' : ''}.`,
                action: `Aumenta presupuesto 50-100% (de ${formatCurrency(gastos)} a ${formatCurrency(gastos * 1.75)}) para maximizar ganancias.`,
                campaign: campaign_name
              });
            }

            // 2. ⚠️ Alto Volumen + ROI Bajo (OPTIMIZAR COSTOS)
            if (num_ventas > 20 && roi_porcentaje && roi_porcentaje < 50 && roi_porcentaje > 0) {
              insights.push({
                type: 'warning',
                title: `${campaign_name}: Optimizar Rentabilidad ⚠️`,
                message: `${num_ventas} ventas generadas pero ROI solo del ${roi_porcentaje.toFixed(1)}%.`,
                action: 'Reduce costo por lead optimizando segmentación, creativos o pujas. Objetivo: ROI >100%.',
                campaign: campaign_name
              });
            }

            // 3. 🔴 PÉRDIDAS SIGNIFICATIVAS (ACCIÓN URGENTE)
            if (ganancia < -50000) {
              insights.push({
                type: 'danger',
                title: `${campaign_name}: ¡ACCIÓN URGENTE! 🔴`,
                message: `Pérdida de ${formatCurrency(Math.abs(ganancia))} (${roi_porcentaje?.toFixed(1)}% ROI).`,
                action: 'PAUSA INMEDIATAMENTE la campaña. Analiza embudo completo: anuncios, landing page, oferta y seguimiento.',
                campaign: campaign_name
              });
            } 
            // 3b. Pérdidas moderadas
            else if (ganancia < 0 && ganancia >= -50000) {
              insights.push({
                type: 'danger',
                title: `${campaign_name}: En Pérdidas 🔴`,
                message: `Pérdida de ${formatCurrency(Math.abs(ganancia))} con ${num_ventas} venta${num_ventas !== 1 ? 's' : ''}.`,
                action: 'Pausa temporalmente y revisa: targeting, creativos y proceso de conversión.',
                campaign: campaign_name
              });
            }

            // 4. 🛑 Gasto Alto Sin Conversiones (CRÍTICO)
            if (gastos > 80000 && num_ventas === 0) {
              insights.push({
                type: 'danger',
                title: `${campaign_name}: Sin Conversiones 🛑`,
                message: `${formatCurrency(gastos)} invertidos sin ninguna venta.`,
                action: 'PAUSA YA. Problema crítico en el embudo: verifica tracking, landing page o calidad del tráfico.',
                campaign: campaign_name
              });
            }

            // 5. 🟢 Campaña Ganadora Consistente (MANTENER Y REPLICAR)
            if (roi_porcentaje && roi_porcentaje > 100 && num_ventas > 15 && semanas_activas > 3) {
              insights.push({
                type: 'success',
                title: `${campaign_name}: Ganadora Consistente 🟢`,
                message: `ROI del ${roi_porcentaje.toFixed(1)}% con ${num_ventas} ventas en ${semanas_activas} semanas activas.`,
                action: 'Mantén presupuesto estable. Replica esta estrategia (creativos, copy, targeting) en nuevas campañas.',
                campaign: campaign_name
              });
            }

            // 6. 💎 Tráfico Orgánico/Sin Gastos (AMPLIFICAR)
            if (ingresos > 30000 && gastos === 0 && num_ventas > 0) {
              insights.push({
                type: 'info',
                title: `${campaign_name}: Tráfico Orgánico 💎`,
                message: `${formatCurrency(ingresos)} en ventas (${num_ventas}) sin inversión publicitaria.`,
                action: 'Considera activar con presupuesto bajo (₡20,000-₡30,000) para amplificar resultados orgánicos.',
                campaign: campaign_name
              });
            }

            // 7. ⚡ ROI Medio con Buen Volumen (ESTABLE)
            if (roi_porcentaje && roi_porcentaje >= 50 && roi_porcentaje < 100 && num_ventas > 10) {
              insights.push({
                type: 'info',
                title: `${campaign_name}: Rendimiento Estable ⚡`,
                message: `ROI del ${roi_porcentaje.toFixed(1)}% con ${num_ventas} ventas. Rentable pero mejorable.`,
                action: 'Estable. Experimenta con nuevos creativos o audiences similares para mejorar ROI a >100%.',
                campaign: campaign_name
              });
            }

            // 8. 🟡 ROI Bajo pero Positivo (EN OBSERVACIÓN)
            if (roi_porcentaje && roi_porcentaje > 0 && roi_porcentaje < 50 && num_ventas <= 20 && num_ventas > 0) {
              insights.push({
                type: 'warning',
                title: `${campaign_name}: ROI Bajo 🟡`,
                message: `ROI del ${roi_porcentaje.toFixed(1)}% con ${num_ventas} venta${num_ventas !== 1 ? 's' : ''}. Apenas rentable.`,
                action: 'Optimiza urgente: mejora copy, prueba nuevos creativos o ajusta targeting. Si no mejora en 2 semanas, pausa.',
                campaign: campaign_name
              });
            }
          });

          // Ordenar por prioridad (danger > warning > success > info)
          const priority = { danger: 0, warning: 1, success: 2, info: 3 };
          const sortedInsights = insights.sort((a, b) => priority[a.type] - priority[b.type]);

          if (sortedInsights.length === 0) {
            return (
              <p className="text-gray-500 text-center py-8">
                No hay suficientes datos para generar recomendaciones. Aplica filtros o espera más actividad.
              </p>
            );
          }

          return (
            <div className="space-y-3">
              {sortedInsights.map((insight, idx) => {
                const config = {
                  success: {
                    icon: TrendingUp,
                    iconColor: 'text-green-600',
                    bg: 'bg-green-50',
                    border: 'border-green-200'
                  },
                  warning: {
                    icon: Info,
                    iconColor: 'text-yellow-600',
                    bg: 'bg-yellow-50',
                    border: 'border-yellow-200'
                  },
                  danger: {
                    icon: TrendingDown,
                    iconColor: 'text-red-600',
                    bg: 'bg-red-50',
                    border: 'border-red-200'
                  },
                  info: {
                    icon: DollarSign,
                    iconColor: 'text-blue-600',
                    bg: 'bg-blue-50',
                    border: 'border-blue-200'
                  }
                }[insight.type];

                const Icon = config.icon;

                return (
                  <div key={idx} className={`p-4 rounded-lg border-2 ${config.bg} ${config.border}`}>
                    <div className="flex items-start gap-3">
                      <Icon className={`w-5 h-5 ${config.iconColor} flex-shrink-0 mt-0.5`} />
                      <div className="flex-1">
                        <h4 className={`font-semibold ${config.iconColor} mb-1`}>
                          {insight.title}
                        </h4>
                        <p className="text-sm text-gray-700 mb-2">
                          {insight.message}
                        </p>
                        <p className="text-sm font-medium text-gray-900">
                          💡 <span className="font-semibold">Acción:</span> {insight.action}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}
      </Card>
    </div>
  );
}