import { useState, useEffect } from 'react';
import { Plus, Search, Filter, Download, Edit2, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Sale, Seller, Course } from '../lib/types';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { Input } from '../components/ui/Input';
import { SaleForm } from '../components/SaleForm';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { format, isToday, isThisWeek, isThisMonth, isWithinInterval, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

type DateFilterMode = 'all' | 'today' | 'week' | 'month' | 'custom' | 'specific';

export function Sales() {
  const { user, isAdmin } = useAuth();
  const [sales, setSales] = useState<Sale[]>([]);
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | undefined>();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSeller, setFilterSeller] = useState('');
  const [filterCourse, setFilterCourse] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterCampaign, setFilterCampaign] = useState('');
  
  // Filtros de fecha
  const [dateFilterMode, setDateFilterMode] = useState<DateFilterMode>('all');
  const [specificDate, setSpecificDate] = useState('');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  useEffect(() => {
    fetchSales();
    fetchSellers();
    fetchCourses();
  }, []);

  const fetchSales = async () => {
    try {
      const { data, error } = await supabase
        .from('sales')
        .select('*')
        .order('enrollment_date', { ascending: false });

      if (error) throw error;
      setSales(data || []);
    } catch (error) {
      console.error('Error fetching sales:', error);
      toast.error('Error al cargar ventas');
    } finally {
      setLoading(false);
    }
  };

  const fetchSellers = async () => {
    try {
      const { data, error } = await supabase
        .from('sellers')
        .select('*')
        .eq('active', true)
        .order('name');

      if (error) throw error;
      setSellers(data || []);
    } catch (error) {
      console.error('Error fetching sellers:', error);
    }
  };

  const fetchCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('courses_catalog')
        .select('*')
        .eq('active', true)
        .order('name');

      if (error) throw error;
      setCourses(data || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  const handleSubmit = async (formData: any) => {
    try {
      // Validar que el amount sea un número válido mayor que 0
      const amount = parseFloat(formData.amount);
      if (isNaN(amount) || amount <= 0) {
        toast.error('El monto debe ser mayor que 0');
        return;
      }

      // Preparar datos limpiando campos vacíos
      const dataToSave = {
        ...formData,
        amount: amount,
        // Convertir strings vacíos a null para campos opcionales
        campaign_name: formData.campaign_name?.trim() || null,
        image_video_name: formData.image_video_name?.trim() || null,
        conversation_starter: formData.conversation_starter?.trim() || null,
        lead_id: formData.lead_id || null
      };

      if (editingSale) {
        const { error } = await supabase
          .from('sales')
          .update(dataToSave)
          .eq('id', editingSale.id);

        if (error) throw error;
        toast.success('Venta actualizada exitosamente');
      } else {
        const { error } = await supabase
          .from('sales')
          .insert([dataToSave]);

        if (error) throw error;
        toast.success('Venta registrada exitosamente');
      }

      setShowForm(false);
      setEditingSale(undefined);
      fetchSales();
    } catch (error) {
      console.error('Error saving sale:', error);
      toast.error('Error al guardar venta');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Está seguro de eliminar esta venta?')) return;

    try {
      const { error } = await supabase
        .from('sales')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Venta eliminada');
      fetchSales();
    } catch (error) {
      console.error('Error deleting sale:', error);
      toast.error('Error al eliminar venta');
    }
  };

  const handleEdit = (sale: Sale) => {
    setEditingSale(sale);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingSale(undefined);
  };

  // Función para verificar si una fecha cumple con el filtro
  const matchesDateFilter = (enrollmentDate: string): boolean => {
    const date = parseISO(enrollmentDate);

    switch (dateFilterMode) {
      case 'all':
        return true;
      case 'today':
        return isToday(date);
      case 'week':
        return isThisWeek(date, { weekStartsOn: 1 });
      case 'month':
        return isThisMonth(date);
      case 'specific':
        if (!specificDate) return true;
        return enrollmentDate === specificDate;
      case 'custom':
        if (!customStartDate || !customEndDate) return true;
        return isWithinInterval(date, {
          start: parseISO(customStartDate),
          end: parseISO(customEndDate)
        });
      default:
        return true;
    }
  };

  // Filtrado de ventas
  const filteredSales = sales.filter(sale => {
    const matchesSearch = !searchTerm || 
      sale.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.phone.includes(searchTerm);
    
    const matchesSeller = !filterSeller || sale.seller === filterSeller;
    const matchesCourse = !filterCourse || sale.course === filterCourse;
    const matchesType = !filterType || sale.sale_type === filterType;
    const matchesCampaign = !filterCampaign || sale.campaign_name === filterCampaign;
    const matchesDate = matchesDateFilter(sale.enrollment_date);

    return matchesSearch && matchesSeller && matchesCourse && matchesType && matchesCampaign && matchesDate;
  });

  // Obtener opciones únicas para filtros
  const campaignOptions = Array.from(new Set(sales.map(s => s.campaign_name).filter(Boolean)))
    .map(name => ({ value: name!, label: name! }));

  const saleTypes = Array.from(new Set(sales.map(s => s.sale_type)))
    .map(type => ({ value: type, label: type }));

  // Estadísticas
  const stats = {
    total: filteredSales.length,
    totalRevenue: filteredSales.reduce((sum, s) => sum + Number(s.amount), 0),
    avgTicket: filteredSales.length > 0 
      ? filteredSales.reduce((sum, s) => sum + Number(s.amount), 0) / filteredSales.length 
      : 0,
  };

  const exportToCSV = () => {
    const headers = ['Fecha', 'Cliente', 'Teléfono', 'Curso', 'Monto', 'Campaña', 'Anuncio', 'Tipo', 'Vendedor'];
    const rows = filteredSales.map(sale => [
      format(parseISO(sale.enrollment_date), 'dd/MM/yyyy'),
      sale.customer_name,
      sale.phone,
      sale.course,
      sale.amount,
      sale.campaign_name || 'N/A',
      sale.image_video_name || 'N/A',
      sale.sale_type,
      sale.seller
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ventas-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Cargando ventas...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Ventas</h1>
          <p className="text-gray-500 mt-1">Registro y seguimiento de matrículas</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-5 w-5 mr-2" />
          Nueva Venta
        </Button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-500 mb-1">Total Ventas</div>
          <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-500 mb-1">Ingresos Totales</div>
          <div className="text-3xl font-bold text-green-600">
            {isAdmin
              ? `₡${stats.totalRevenue.toLocaleString('es-CR')}`
              : <span className="tracking-widest text-gray-300">₡ ••••••</span>
            }
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-500 mb-1">Ticket Promedio</div>
          <div className="text-3xl font-bold text-blue-600">
            {isAdmin
              ? `₡${stats.avgTicket.toLocaleString('es-CR', { maximumFractionDigits: 0 })}`
              : <span className="tracking-widest text-gray-300">₡ ••••••</span>
            }
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-900">Filtros</h2>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={exportToCSV}
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
        </div>

        {/* Fila 1: Búsqueda y filtros básicos */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre o teléfono..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <Select
            value={filterSeller}
            onChange={(e) => setFilterSeller(e.target.value)}
            options={[
              { value: '', label: 'Todos los vendedores' },
              ...sellers.map(s => ({ value: s.name, label: s.name }))
            ]}
          />

          <Select
            value={filterCourse}
            onChange={(e) => setFilterCourse(e.target.value)}
            options={[
              { value: '', label: 'Todos los cursos' },
              ...courses.map(c => ({ value: c.name, label: c.name }))
            ]}
          />

          <Select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            options={[
              { value: '', label: 'Todos los tipos' },
              ...saleTypes
            ]}
          />
        </div>

        {/* Fila 2: Filtros de campaña y fecha */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Select
            value={filterCampaign}
            onChange={(e) => setFilterCampaign(e.target.value)}
            options={[
              { value: '', label: 'Todas las campañas' },
              ...campaignOptions
            ]}
          />

          <Select
            value={dateFilterMode}
            onChange={(e) => {
              setDateFilterMode(e.target.value as DateFilterMode);
              setSpecificDate('');
              setCustomStartDate('');
              setCustomEndDate('');
            }}
            options={[
              { value: 'all', label: '📅 Todas las fechas' },
              { value: 'today', label: '📆 Hoy' },
              { value: 'week', label: '📅 Esta semana' },
              { value: 'month', label: '🗓️ Este mes' },
              { value: 'specific', label: '📌 Fecha específica' },
              { value: 'custom', label: '🔍 Rango personalizado' }
            ]}
          />

          {dateFilterMode === 'specific' && (
            <Input
              type="date"
              value={specificDate}
              onChange={(e) => setSpecificDate(e.target.value)}
              placeholder="Seleccionar fecha"
            />
          )}

          {dateFilterMode === 'custom' && (
            <>
              <Input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                placeholder="Fecha inicio"
              />
              <Input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                placeholder="Fecha fin"
              />
            </>
          )}
        </div>

        {/* Resumen de filtros activos */}
        {(searchTerm || filterSeller || filterCourse || filterType || filterCampaign || dateFilterMode !== 'all') && (
          <div className="flex items-center gap-2 text-sm text-gray-600 pt-2 border-t">
            <span className="font-medium">Mostrando {filteredSales.length} de {sales.length} ventas</span>
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterSeller('');
                setFilterCourse('');
                setFilterType('');
                setFilterCampaign('');
                setDateFilterMode('all');
                setSpecificDate('');
                setCustomStartDate('');
                setCustomEndDate('');
              }}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Limpiar filtros
            </button>
          </div>
        )}
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Curso
                </th>
                {isAdmin && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Monto
                  </th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Campaña
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vendedor
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    No se encontraron ventas con los filtros aplicados
                  </td>
                </tr>
              ) : (
                filteredSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {format(parseISO(sale.enrollment_date), 'dd MMM yyyy', { locale: es })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{sale.customer_name}</div>
                      <div className="text-sm text-gray-500">{sale.phone}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {sale.course}
                    </td>
                    {isAdmin && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                        ₡{Number(sale.amount).toLocaleString('es-CR')}
                      </td>
                    )}
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <div>{sale.campaign_name || '-'}</div>
                      {sale.image_video_name && (
                        <div className="text-xs text-gray-400">{sale.image_video_name}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {sale.sale_type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {sale.seller}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEdit(sale)}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      {user?.role === 'ADMIN' && (
                        <button
                          onClick={() => handleDelete(sale.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de formulario */}
      {showForm && (
        <SaleForm
          sale={editingSale}
          onSubmit={handleSubmit}
          onClose={handleCloseForm}
          sellers={sellers}
          courses={courses}
          existingSales={sales}
        />
      )}
    </div>
  );
}