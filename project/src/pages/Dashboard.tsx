import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DollarSign,
  Users,
  TrendingUp,
  Award,
  Megaphone,
  Plus,
  BarChart3,
  Wallet,
  Calendar,
  Baby,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card, MetricCard } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Table } from '../components/ui/Table';
import { Select } from '../components/ui/Select';
import { useSales } from '../hooks/useSales';
import { useExpenses } from '../hooks/useExpenses';
import { formatCurrency, formatDate } from '../lib/utils';
import type { Sale } from '../lib/types';
import { startOfMonth, endOfMonth, subWeeks, subMonths, format, parseISO, startOfWeek, endOfWeek, startOfDay, endOfDay, subDays } from 'date-fns';
import { es } from 'date-fns/locale';

// Paleta de colores minimalista y viva
const COLORS = [
  '#007991', // Teal principal
  '#78ffd6', // Turquesa brillante
  '#00d4aa', // Mint
  '#00a896', // Ocean
  '#33bfcf', // Teal claro
  '#4dffcb', // Turquesa medio
];

type ViewMode = 'week' | 'month' | 'day';

export function Dashboard() {
  const navigate = useNavigate();
  const { sales, loading: salesLoading } = useSales();
  const { loading: expensesLoading } = useExpenses();
  const [viewMode, setViewMode] = useState<ViewMode>('week');

  const metrics = useMemo(() => {
    const now = new Date();
    // Últimos 30 días (más útil que el mes calendario cuando estamos a inicio de mes)
    const last30Start = startOfDay(subDays(now, 29));
    const last30End = endOfDay(now);

    const monthSales = sales.filter((s) => {
      const date = parseISO(s.enrollment_date);
      return date >= last30Start && date <= last30End;
    });

    const totalSalesMonth = monthSales.reduce((sum, s) => sum + s.amount, 0);
    const newCustomersMonth = monthSales.length;
    const averagePerSale = newCustomersMonth > 0 ? totalSalesMonth / newCustomersMonth : 0;

    const sellerCounts = monthSales.reduce((acc, s) => {
      acc[s.seller] = (acc[s.seller] || 0) + s.amount;
      return acc;
    }, {} as Record<string, number>);

    const bestSeller = Object.entries(sellerCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
    const weekSales = sales.filter((s) => {
      const date = parseISO(s.enrollment_date);
      return date >= weekStart && date <= weekEnd;
    });

    const campaignCounts = weekSales.reduce((acc, s) => {
      if (s.image_video_name) {
        acc[s.image_video_name] = (acc[s.image_video_name] || 0) + s.amount;
      }
      return acc;
    }, {} as Record<string, number>);

    const bestCampaign = Object.entries(campaignCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

    return { totalSalesMonth, newCustomersMonth, averagePerSale, bestSeller, bestCampaign };
  }, [sales]);

  const timeSeriesData = useMemo(() => {
    const now = new Date();
    const data: { label: string; ventas: number }[] = [];

    if (viewMode === 'week') {
      for (let i = 7; i >= 0; i--) {
        const weekStart = startOfWeek(subWeeks(now, i), { weekStartsOn: 1 });
        const weekEnd = endOfWeek(subWeeks(now, i), { weekStartsOn: 1 });
        const weekLabel = format(weekStart, 'd MMM', { locale: es });

        const weekTotal = sales
          .filter((s) => {
            const date = parseISO(s.enrollment_date);
            return date >= weekStart && date <= weekEnd;
          })
          .reduce((sum, s) => sum + s.amount, 0);

        data.push({ label: weekLabel, ventas: weekTotal });
      }
    } else if (viewMode === 'month') {
      for (let i = 5; i >= 0; i--) {
        const monthStart = startOfMonth(subMonths(now, i));
        const monthEnd = endOfMonth(subMonths(now, i));
        const monthLabel = format(monthStart, 'MMM', { locale: es });

        const monthTotal = sales
          .filter((s) => {
            const date = parseISO(s.enrollment_date);
            return date >= monthStart && date <= monthEnd;
          })
          .reduce((sum, s) => sum + s.amount, 0);

        data.push({ label: monthLabel, ventas: monthTotal });
      }
    } else {
      for (let i = 13; i >= 0; i--) {
        const dayStart = startOfDay(subDays(now, i));
        const dayEnd = endOfDay(subDays(now, i));
        const dayLabel = format(dayStart, 'd MMM', { locale: es });

        const dayTotal = sales
          .filter((s) => {
            const date = parseISO(s.enrollment_date);
            return date >= dayStart && date <= dayEnd;
          })
          .reduce((sum, s) => sum + s.amount, 0);

        data.push({ label: dayLabel, ventas: dayTotal });
      }
    }

    return data;
  }, [sales, viewMode]);

  const courseData = useMemo(() => {
    const courseGroups = sales.reduce((acc, s) => {
      acc[s.course] = (acc[s.course] || 0) + s.amount;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(courseGroups)
      .map(([name, value]) => ({ name: name.split(' ').slice(0, 2).join(' '), value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [sales]);

  const sellerData = useMemo(() => {
    const sellerGroups = sales.reduce((acc, s) => {
      acc[s.seller] = (acc[s.seller] || 0) + s.amount;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(sellerGroups).map(([name, value]) => ({ 
      name: name.split(' ')[0], 
      value 
    }));
  }, [sales]);

  const recentSales = useMemo(() => {
    return sales.slice(0, 10);
  }, [sales]);

  const columns = [
    {
      key: 'enrollment_date',
      header: 'Fecha',
      render: (sale: Sale) => formatDate(sale.enrollment_date),
    },
    { key: 'customer_name', header: 'Cliente' },
    {
      key: 'course',
      header: 'Curso',
      render: (sale: Sale) => (
        <span className="text-xs bg-primary-50 text-primary-700 px-2 py-1 rounded-full font-medium">
          {sale.course.split(' ')[0]}
        </span>
      ),
    },
    {
      key: 'amount',
      header: 'Monto',
      render: (sale: Sale) => (
        <span className="font-semibold text-secondary-600">{formatCurrency(sale.amount)}</span>
      ),
    },
    { 
      key: 'seller', 
      header: 'Vendedor',
      render: (sale: Sale) => (
        <span className="text-sm text-gray-700">{sale.seller}</span>
      ),
    },
    {
      key: 'image_video_name',
      header: 'Campaña',
      render: (sale: Sale) => sale.image_video_name || '-',
    },
  ];

  const loading = salesLoading || expensesLoading;

  const viewModeOptions = [
    { value: 'day', label: 'Últimos 14 Días' },
    { value: 'week', label: 'Últimas 8 Semanas' },
    { value: 'month', label: 'Últimos 6 Meses' },
  ];

  const getChartTitle = () => {
    if (viewMode === 'day') return 'Evolución de Ventas (Últimos 14 Días)';
    if (viewMode === 'month') return 'Evolución de Ventas (Últimos 6 Meses)';
    return 'Evolución de Ventas (Últimas 8 Semanas)';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Resumen general de ventas y métricas</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => navigate('/ventas?new=true')} className="bg-primary-500 hover:bg-primary-600">
            <Plus className="w-4 h-4 mr-2" />
            Nueva Venta
          </Button>
          <Button variant="secondary" onClick={() => navigate('/resumen')}>
            <BarChart3 className="w-4 h-4 mr-2" />
            Ver Reporte
          </Button>
          <Button variant="secondary" onClick={() => navigate('/gastos')}>
            <Wallet className="w-4 h-4 mr-2" />
            Registrar Gasto
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricCard
          title="Ventas (Últ. 30 días)"
          value={formatCurrency(metrics.totalSalesMonth)}
          subtitle={`${metrics.newCustomersMonth} venta${metrics.newCustomersMonth !== 1 ? 's' : ''}`}
          icon={<DollarSign className="w-5 h-5" />}
          color="green"
        />
        <MetricCard
          title="Clientes (Últ. 30 días)"
          value={metrics.newCustomersMonth}
          icon={<Users className="w-5 h-5" />}
          color="blue"
        />
        <MetricCard
          title="Promedio por Venta"
          value={formatCurrency(metrics.averagePerSale)}
          icon={<TrendingUp className="w-5 h-5" />}
          color="orange"
        />
        <MetricCard
          title="Mejor Vendedor"
          value={metrics.bestSeller}
          icon={<Award className="w-5 h-5" />}
          color="blue"
        />
        <MetricCard
          title="Mejor Campaña"
          value={metrics.bestCampaign}
          icon={<Megaphone className="w-5 h-5" />}
          color="green"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        <Card className="p-6 lg:col-span-2 xl:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">{getChartTitle()}</h3>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <Select
                value={viewMode}
                onChange={(e) => setViewMode(e.target.value as ViewMode)}
                options={viewModeOptions}
                className="text-sm"
              />
            </div>
          </div>
          <div className="h-72">
            {timeSeriesData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timeSeriesData}>
                  <defs>
                    <linearGradient id="colorVentas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#007991" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#007991" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                  <XAxis 
                    dataKey="label" 
                    tick={{ fontSize: 12, fill: '#6b7280' }} 
                    axisLine={{ stroke: '#e5e7eb' }}
                    tickLine={false}
                  />
                  <YAxis 
                    tick={{ fontSize: 12, fill: '#6b7280' }} 
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `₡${(v / 1000).toFixed(0)}k`} 
                  />
                  <Tooltip
                    formatter={(value: number) => [formatCurrency(value), 'Ventas']}
                    contentStyle={{ 
                      borderRadius: '12px', 
                      border: '1px solid #e5e7eb',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="ventas"
                    stroke="#007991"
                    strokeWidth={3}
                    dot={{ fill: '#007991', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, fill: '#78ffd6', stroke: '#007991', strokeWidth: 2 }}
                    fill="url(#colorVentas)"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                No hay datos de ventas disponibles
              </div>
            )}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Por Vendedor</h3>
          <div className="h-72">
            {sellerData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <defs>
                    {COLORS.map((color, index) => (
                      <linearGradient key={`gradient-${index}`} id={`pieGradient${index}`} x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity={1}/>
                        <stop offset="100%" stopColor={color} stopOpacity={0.7}/>
                      </linearGradient>
                    ))}
                  </defs>
                  <Pie
                    data={sellerData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {sellerData.map((_, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={`url(#pieGradient${index % COLORS.length})`}
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                No hay datos de vendedores disponibles
              </div>
            )}
          </div>
        </Card>

        <Card className="p-6 lg:col-span-2 xl:col-span-3">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Ingresos por Curso</h3>
          <div className="h-72">
            {courseData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={courseData} layout="vertical">
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#007991" stopOpacity={1}/>
                      <stop offset="100%" stopColor="#78ffd6" stopOpacity={0.8}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={true} vertical={false} />
                  <XAxis 
                    type="number" 
                    tick={{ fontSize: 12, fill: '#6b7280' }} 
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `₡${(v / 1000).toFixed(0)}k`} 
                  />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    tick={{ fontSize: 12, fill: '#374151' }} 
                    axisLine={false}
                    tickLine={false}
                    width={120} 
                  />
                  <Tooltip
                    formatter={(value: number) => [formatCurrency(value), 'Ingresos']}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb' }}
                  />
                  <Bar 
                    dataKey="value" 
                    fill="url(#barGradient)" 
                    radius={[0, 8, 8, 0]} 
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                No hay datos de cursos disponibles
              </div>
            )}
          </div>
        </Card>
      </div>

      <Card>
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">Últimas 10 Ventas</h3>
        </div>
        <Table columns={columns} data={recentSales} loading={loading} />
        <div className="px-6 py-3 border-t border-gray-100">
          <Button variant="ghost" onClick={() => navigate('/ventas')}>
            Ver todas las ventas
          </Button>
        </div>
      </Card>

      {/* Sección Inglés para Niños */}
      {(() => {
        const kidsSales = sales.filter(s => s.course === 'INGLES PARA NIÑOS - PRESENCIAL' && (s.child_name || s.parent_name));
        if (kidsSales.length === 0) return null;
        return (
          <Card>
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
              <Baby className="w-5 h-5 text-blue-500" />
              <h3 className="text-lg font-semibold text-gray-900">Inglés para Niños — Registros</h3>
              <span className="ml-auto text-sm text-gray-500">{kidsSales.length} registro{kidsSales.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-blue-50">
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Fecha</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Niño/a</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Padre / Madre</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Teléfono</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Clase de Prueba</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Asistió</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Vendedor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {kidsSales.slice(0, 10).map(sale => (
                    <tr key={sale.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-3 text-gray-600">{formatDate(sale.enrollment_date)}</td>
                      <td className="px-6 py-3 font-medium text-gray-900">{sale.child_name || '—'}</td>
                      <td className="px-6 py-3 text-gray-700">{sale.parent_name || '—'}</td>
                      <td className="px-6 py-3 text-gray-600">{sale.phone}</td>
                      <td className="px-6 py-3 text-gray-600">{sale.trial_class_date ? formatDate(sale.trial_class_date) : '—'}</td>
                      <td className="px-6 py-3">
                        {sale.trial_class_date ? (
                          sale.trial_class_attended
                            ? <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">✅ Sí</span>
                            : <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">❌ No</span>
                        ) : '—'}
                      </td>
                      <td className="px-6 py-3 text-gray-600">{sale.seller}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        );
      })()}
    </div>
  );
}