import React, { useState, useEffect } from 'react';
import { Calendar, Filter, TrendingUp, DollarSign, Search, Download, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/Button';
import toast from 'react-hot-toast';
import { format, subDays, startOfDay, endOfDay, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { MetaAdsSyncButton } from '../components/MetaAdsSyncButton';

interface DailyExpense {
  id: string;
  campaign_name: string;
  date: string;
  amount: number;
  created_at: string;
  updated_at: string;
}

type FilterType = 'today' | '7days' | '14days' | 'custom';

interface DateRange {
  start: string;
  end: string;
}

export function Expenses() {
  const [expenses, setExpenses] = useState<DailyExpense[]>([]);
  const [filteredExpenses, setFilteredExpenses] = useState<DailyExpense[]>([]);
  const [campaigns, setCampaigns] = useState<string[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<string>('all');
  const [filterType, setFilterType] = useState<FilterType>('today');
  const [dateRange, setDateRange] = useState<DateRange>({
    start: format(new Date(), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd'),
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchExpenses();
    fetchCampaigns();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [expenses, filterType, dateRange, selectedCampaign, searchTerm]);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      
      // Usar la vista unificada que prioriza datos daily sobre weekly
      const { data, error } = await supabase
        .from('unified_advertising_expenses')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;

      // Convertir los datos al formato esperado
      const dailyExpenses: DailyExpense[] = (data || []).map(item => ({
        id: item.id,
        campaign_name: item.campaign_name,
        date: item.date,
        amount: parseFloat(item.amount),
        created_at: item.created_at,
        updated_at: item.updated_at,
      }));

      setExpenses(dailyExpenses);
    } catch (error) {
      console.error('Error fetching expenses:', error);
      toast.error('Error al cargar gastos publicitarios');
    } finally {
      setLoading(false);
    }
  };

  const fetchCampaigns = async () => {
    try {
      // Traer campañas de AMBAS tablas: daily (Meta sync) + weekly (manual)
      const [{ data: dailyData }, { data: weeklyData }] = await Promise.all([
        supabase.from('daily_advertising_expenses').select('campaign_name'),
        supabase.from('advertising_expenses').select('campaign_name'),
      ]);

      const allCampaigns = [
        ...(dailyData?.map(d => d.campaign_name) || []),
        ...(weeklyData?.map(d => d.campaign_name) || []),
      ];
      const uniqueCampaigns = Array.from(new Set(allCampaigns)).sort();
      setCampaigns(uniqueCampaigns);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    }
  };

  const applyFilters = () => {
    let filtered = [...expenses];
    const today = new Date();
    let startDate: Date;
    let endDate: Date = endOfDay(today);

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
      case 'custom':
        startDate = parseISO(dateRange.start);
        endDate = endOfDay(parseISO(dateRange.end));
        break;
    }

    filtered = filtered.filter(expense => {
      const expenseDate = parseISO(expense.date);
      return expenseDate >= startDate && expenseDate <= endDate;
    });

    if (selectedCampaign !== 'all') {
      filtered = filtered.filter(expense => expense.campaign_name === selectedCampaign);
    }

    if (searchTerm) {
      filtered = filtered.filter(expense =>
        expense.campaign_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredExpenses(filtered);
  };

  const handleFilterChange = (type: FilterType) => {
    setFilterType(type);
    const today = new Date();
    switch (type) {
      case 'today':
        setDateRange({
          start: format(today, 'yyyy-MM-dd'),
          end: format(today, 'yyyy-MM-dd'),
        });
        break;
      case '7days':
        setDateRange({
          start: format(subDays(today, 6), 'yyyy-MM-dd'),
          end: format(today, 'yyyy-MM-dd'),
        });
        break;
      case '14days':
        setDateRange({
          start: format(subDays(today, 13), 'yyyy-MM-dd'),
          end: format(today, 'yyyy-MM-dd'),
        });
        break;
    }
  };

  const calculateTotal = () => {
    return filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  };

  const calculateDailyAverage = () => {
    if (filteredExpenses.length === 0) return 0;
    const uniqueDates = new Set(filteredExpenses.map(e => e.date));
    const total = calculateTotal();
    return uniqueDates.size > 0 ? total / uniqueDates.size : 0;
  };

  const getCampaignTotals = () => {
    const totals: Record<string, number> = {};
    filteredExpenses.forEach(expense => {
      if (!totals[expense.campaign_name]) {
        totals[expense.campaign_name] = 0;
      }
      totals[expense.campaign_name] += expense.amount;
    });
    return Object.entries(totals).sort((a, b) => b[1] - a[1]).slice(0, 5);
  };

  const exportToCSV = () => {
    const headers = ['Fecha', 'Campaña', 'Monto'];
    const rows = filteredExpenses.map(expense => [
      format(parseISO(expense.date), 'dd/MM/yyyy'),
      expense.campaign_name,
      expense.amount.toFixed(2),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `gastos_publicitarios_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const groupedByDate = filteredExpenses.reduce((acc, expense) => {
    if (!acc[expense.date]) {
      acc[expense.date] = [];
    }
    acc[expense.date].push(expense);
    return acc;
  }, {} as Record<string, DailyExpense[]>);

  const sortedDates = Object.keys(groupedByDate).sort((a, b) => b.localeCompare(a));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Cargando gastos publicitarios...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gastos Publicitarios</h1>
          <p className="text-gray-500 mt-1">Visualiza y analiza tus gastos diarios en publicidad</p>
        </div>
      </div>

      <div className="bg-teal-600 rounded-lg shadow p-6">
        <MetaAdsSyncButton 
          daysBack={7} 
          onSyncComplete={() => {
            fetchExpenses();
            fetchCampaigns();
          }}
        />
        <p className="text-xs text-white/70 mt-3 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          Sincroniza los gastos de los últimos 7 días desde Meta Ads. Los datos se actualizan automáticamente en tiempo real.
        </p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-5 w-5 text-gray-400" />
          <h2 className="text-lg font-semibold text-gray-900">Filtros</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Período</label>
            <div className="space-y-2">
              <Button variant={filterType === 'today' ? 'primary' : 'outline'} onClick={() => handleFilterChange('today')} className="w-full justify-start">Hoy</Button>
              <Button variant={filterType === '7days' ? 'primary' : 'outline'} onClick={() => handleFilterChange('7days')} className="w-full justify-start">Últimos 7 días</Button>
              <Button variant={filterType === '14days' ? 'primary' : 'outline'} onClick={() => handleFilterChange('14days')} className="w-full justify-start">Últimos 14 días</Button>
              <Button variant={filterType === 'custom' ? 'primary' : 'outline'} onClick={() => setFilterType('custom')} className="w-full justify-start">Rango personalizado</Button>
            </div>
          </div>

          {filterType === 'custom' && (
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Rango de fechas</label>
              <div className="grid grid-cols-2 gap-2">
                <input type="date" value={dateRange.start} onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500" />
                <input type="date" value={dateRange.end} onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500" />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Campaña</label>
            <select value={selectedCampaign} onChange={(e) => setSelectedCampaign(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500">
              <option value="all">Todas las campañas</option>
              {campaigns.map(campaign => (
                <option key={campaign} value={campaign}>{campaign}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Buscar</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Buscar campaña..." className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500" />
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3">
          <div className="flex justify-end">
            <Button variant="outline" onClick={exportToCSV} disabled={filteredExpenses.length === 0} className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Exportar CSV
            </Button>
          </div>
          
          {filterType !== 'today' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-blue-800">
                <strong>Nota:</strong> Estás viendo un rango de fechas de {filterType === '7days' ? '7 días' : filterType === '14days' ? '14 días' : 'múltiples días'}. 
                Para comparar con Meta Ads (que muestra un día específico), selecciona el filtro "Hoy" o usa "Rango personalizado" para elegir una fecha específica.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Gasto Total</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">₡{calculateTotal().toLocaleString('es-CR')}</p>
              <p className="text-xs text-gray-400 mt-1">{filteredExpenses.length} registro(s)</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <DollarSign className="h-8 w-8 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Promedio Diario</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">₡{calculateDailyAverage().toLocaleString('es-CR', { maximumFractionDigits: 0 })}</p>
              <p className="text-xs text-gray-400 mt-1">Por día en el período</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Campañas Activas</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{new Set(filteredExpenses.map(e => e.campaign_name)).size}</p>
              <p className="text-xs text-gray-400 mt-1">En el período seleccionado</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <Calendar className="h-8 w-8 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Top 5 Campañas por Gasto</h2>
        <div className="space-y-3">
          {getCampaignTotals().map(([campaign, total], index) => {
            const percentage = (total / calculateTotal()) * 100;
            return (
              <div key={campaign}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">{index + 1}. {campaign}</span>
                  <span className="text-sm font-bold text-gray-900">₡{total.toLocaleString('es-CR')}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full transition-all duration-300" style={{ width: `${percentage}%` }} />
                </div>
                <div className="text-xs text-gray-500 mt-1">{percentage.toFixed(1)}% del total</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Detalle de Gastos Diarios</h2>
        </div>

        <div className="overflow-x-auto">
          {sortedDates.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-500">No hay gastos registrados para el período seleccionado.</div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Campaña</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Monto</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedDates.map((date) => {
                  const dateExpenses = groupedByDate[date];
                  const dateTotal = dateExpenses.reduce((sum, e) => sum + e.amount, 0);
                  return (
                    <React.Fragment key={date}>
                      <tr className="bg-gray-50">
                        <td colSpan={2} className="px-6 py-3 text-sm font-semibold text-gray-900">{format(parseISO(date), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}</td>
                        <td className="px-6 py-3 text-sm font-bold text-right text-blue-600">₡{dateTotal.toLocaleString('es-CR')}</td>
                      </tr>
                      {dateExpenses.sort((a, b) => b.amount - a.amount).map((expense) => (
                        <tr key={expense.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm text-gray-500"></td>
                          <td className="px-6 py-4 text-sm text-gray-900">{expense.campaign_name}</td>
                          <td className="px-6 py-4 text-sm text-right text-gray-900">₡{expense.amount.toLocaleString('es-CR')}</td>
                        </tr>
                      ))}
                    </React.Fragment>
                  );
                })}
              </tbody>
              <tfoot className="bg-blue-50">
                <tr>
                  <td colSpan={2} className="px-6 py-4 text-sm font-bold text-gray-900 uppercase">Total General</td>
                  <td className="px-6 py-4 text-lg font-bold text-right text-blue-700">₡{calculateTotal().toLocaleString('es-CR')}</td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}