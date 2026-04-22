import { useState, useEffect } from 'react';
import { Plus, Search, Filter, Download, Edit2, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Lead, Seller, Course } from '../lib/types';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { LeadForm } from '../components/LeadForm';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { format, isToday, isThisWeek, isThisMonth, isWithinInterval, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

type DateFilterMode = 'all' | 'today' | 'week' | 'month' | 'custom' | 'specific';

export function Leads() {
  const { user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [campaigns, setCampaigns] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | undefined>();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterSeller, setFilterSeller] = useState('');
  const [filterCampaign, setFilterCampaign] = useState('');
  const [filterAd, setFilterAd] = useState('');
  const [filterCourse, setFilterCourse] = useState('');
  
  // Filtros de fecha
  const [dateFilterMode, setDateFilterMode] = useState<DateFilterMode>('all');
  const [specificDate, setSpecificDate] = useState('');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  useEffect(() => {
    fetchLeads();
    fetchSellers();
    fetchCourses();
    fetchCampaigns();
  }, []);

  const fetchLeads = async () => {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('contact_date', { ascending: false });

      if (error) throw error;
      setLeads(data || []);
    } catch (error) {
      console.error('Error fetching leads:', error);
      toast.error('Error al cargar prospectos');
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

  const fetchCampaigns = async () => {
    try {
      const { data, error } = await supabase
        .from('unified_advertising_expenses')
        .select('campaign_name')
        .not('campaign_name', 'is', null)
        .order('campaign_name');

      if (error) throw error;
      const unique = Array.from(new Set((data || []).map((r: any) => r.campaign_name as string)));
      setCampaigns(unique);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    }
  };

  const handleSubmit = async (formData: any) => {
    try {
      if (editingLead) {
        const { error } = await supabase
          .from('leads')
          .update(formData)
          .eq('id', editingLead.id);

        if (error) throw error;
        toast.success('Prospecto actualizado exitosamente');
      } else {
        const { error } = await supabase
          .from('leads')
          .insert([formData]);

        if (error) throw error;
        toast.success('Prospecto creado exitosamente');
      }

      setShowForm(false);
      setEditingLead(undefined);
      fetchLeads();
    } catch (error) {
      console.error('Error saving lead:', error);
      toast.error('Error al guardar prospecto');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Está seguro de eliminar este prospecto?')) return;

    try {
      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Prospecto eliminado');
      fetchLeads();
    } catch (error) {
      console.error('Error deleting lead:', error);
      toast.error('Error al eliminar prospecto');
    }
  };

  const handleEdit = (lead: Lead) => {
    setEditingLead(lead);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingLead(undefined);
  };

  // Función para verificar si una fecha cumple con el filtro
  const matchesDateFilter = (contactDate: string): boolean => {
    const date = parseISO(contactDate);

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
        return contactDate === specificDate;
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

  // Filtrado de leads
  const filteredLeads = (leads || []).filter(lead => {
    const matchesSearch = !searchTerm || 
      lead.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.phone.includes(searchTerm);
    
    const matchesStatus = !filterStatus || lead.status === filterStatus;
    const matchesSeller = !filterSeller || lead.assigned_to === filterSeller;
    const matchesCampaign = !filterCampaign || lead.campaign_name === filterCampaign;
    const matchesAd = !filterAd || lead.image_video_name === filterAd;
    const matchesCourse = !filterCourse || lead.interested_course === filterCourse;
    const matchesDate = matchesDateFilter(lead.contact_date);

    return matchesSearch && matchesStatus && matchesSeller && 
           matchesCampaign && matchesAd && matchesCourse && matchesDate;
  });

  // Obtener opciones únicas para filtros
  const campaignOptions = Array.from(new Set((leads || []).map(l => l.campaign_name).filter(Boolean)))
    .map(name => ({ value: name!, label: name! }));

  const adOptions = Array.from(new Set((leads || []).map(l => l.image_video_name).filter(Boolean)))
    .map(name => ({ value: name!, label: name! }));

  const courseOptions = Array.from(new Set((leads || []).map(l => l.interested_course)))
    .map(course => ({ value: course, label: course }));

  // Estadísticas
  const stats = {
    total: (filteredLeads || []).length,
    nuevo: (filteredLeads || []).filter(l => l.status === 'NUEVO').length,
    contactado: (filteredLeads || []).filter(l => l.status === 'CONTACTADO').length,
    interesado: (filteredLeads || []).filter(l => l.status === 'INTERESADO').length,
    convertido: (filteredLeads || []).filter(l => l.status === 'CONVERTIDO').length,
    noInteresado: (filteredLeads || []).filter(l => l.status === 'NO_INTERESADO').length,
  };

  const exportToCSV = () => {
    const headers = ['Fecha', 'Cliente', 'Teléfono', 'Curso', 'Campaña', 'Anuncio', 'Estado', 'Vendedor'];
    const rows = filteredLeads.map(lead => [
      format(parseISO(lead.contact_date), 'dd/MM/yyyy'),
      lead.customer_name,
      lead.phone,
      lead.interested_course,
      lead.campaign_name || 'N/A',
      lead.image_video_name || 'N/A',
      lead.status,
      lead.assigned_to
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prospectos-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  const getStatusBadge = (status: Lead['status']) => {
    const styles = {
      NUEVO: 'bg-blue-100 text-blue-800',
      CONTACTADO: 'bg-yellow-100 text-yellow-800',
      INTERESADO: 'bg-purple-100 text-purple-800',
      NO_INTERESADO: 'bg-red-100 text-red-800',
      CONVERTIDO: 'bg-green-100 text-green-800',
    };

    const labels = {
      NUEVO: '🆕 Nuevo',
      CONTACTADO: '📞 Contactado',
      INTERESADO: '⭐ Interesado',
      NO_INTERESADO: '❌ No Interesado',
      CONVERTIDO: '✅ Convertido',
    };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Cargando prospectos...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Prospectos</h1>
          <p className="text-gray-500 mt-1">Gestión de leads y seguimiento</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-5 w-5 mr-2" />
          Nuevo Prospecto
        </Button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          <div className="text-sm text-gray-500">Total</div>
        </div>
        <div className="bg-blue-50 rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-blue-600">{stats.nuevo}</div>
          <div className="text-sm text-blue-600">Nuevos</div>
        </div>
        <div className="bg-yellow-50 rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-yellow-600">{stats.contactado}</div>
          <div className="text-sm text-yellow-600">Contactados</div>
        </div>
        <div className="bg-purple-50 rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-purple-600">{stats.interesado}</div>
          <div className="text-sm text-purple-600">Interesados</div>
        </div>
        <div className="bg-green-50 rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-green-600">{stats.convertido}</div>
          <div className="text-sm text-green-600">Convertidos</div>
        </div>
        <div className="bg-red-50 rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-red-600">{stats.noInteresado}</div>
          <div className="text-sm text-red-600">No Interesados</div>
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
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            options={[
              { value: '', label: 'Todos los estados' },
              { value: 'NUEVO', label: '🆕 Nuevo' },
              { value: 'CONTACTADO', label: '📞 Contactado' },
              { value: 'INTERESADO', label: '⭐ Interesado' },
              { value: 'NO_INTERESADO', label: '❌ No Interesado' },
              { value: 'CONVERTIDO', label: '✅ Convertido' }
            ]}
          />

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
              ...courseOptions
            ]}
          />
        </div>

        {/* Fila 2: Filtros de campaña y fecha */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Select
            value={filterCampaign}
            onChange={(e) => {
              setFilterCampaign(e.target.value);
              setFilterAd(''); // Limpiar filtro de anuncio
            }}
            options={[
              { value: '', label: 'Todas las campañas' },
              ...campaignOptions
            ]}
          />

          <Select
            value={filterAd}
            onChange={(e) => setFilterAd(e.target.value)}
            options={[
              { value: '', label: 'Todos los anuncios' },
              ...adOptions
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
        {(searchTerm || filterStatus || filterSeller || filterCampaign || filterAd || filterCourse || dateFilterMode !== 'all') && (
          <div className="flex items-center gap-2 text-sm text-gray-600 pt-2 border-t">
            <span className="font-medium">Mostrando {filteredLeads.length} de {leads.length} prospectos</span>
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterStatus('');
                setFilterSeller('');
                setFilterCampaign('');
                setFilterAd('');
                setFilterCourse('');
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Campaña
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Anuncio
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
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
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    No se encontraron prospectos con los filtros aplicados
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {format(parseISO(lead.contact_date), 'dd MMM yyyy', { locale: es })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{lead.customer_name}</div>
                      <div className="text-sm text-gray-500">{lead.phone}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {lead.interested_course}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {lead.campaign_name || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {lead.image_video_name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(lead.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {lead.assigned_to}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEdit(lead)}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      {user?.role === 'ADMIN' && (
                        <button
                          onClick={() => handleDelete(lead.id)}
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
        <LeadForm
          lead={editingLead}
          onSubmit={handleSubmit}
          onClose={handleCloseForm}
          sellers={sellers}
          courses={courses}
          campaigns={campaigns}
        />
      )}
    </div>
  );
}