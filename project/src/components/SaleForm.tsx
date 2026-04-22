import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Sale {
  id: string;
  customer_name: string;
  phone: string;
  course: string;
  enrollment_date: string;
  amount: number;
  seller: string;
  sale_type: string;
  campaign_name?: string;
  image_video_name?: string;
  conversation_starter?: string;
  lead_id?: string;
  child_name?: string;
  parent_name?: string;
  trial_class_date?: string;
  trial_class_attended?: boolean;
}

interface SaleFormData {
  customer_name: string;
  phone: string;
  course: string;
  enrollment_date: string;
  amount: number;
  seller: string;
  sale_type: string;
  campaign_name?: string;
  image_video_name?: string;
  conversation_starter?: string;
  lead_id?: string;
  child_name?: string;
  parent_name?: string;
  trial_class_date?: string;
  trial_class_attended?: boolean;
}

interface Seller {
  id: string;
  name: string;
  active: boolean;
}

interface Course {
  id: string;
  name: string;
  active: boolean;
}

interface SaleFormProps {
  sale?: Sale;
  onSubmit: (data: SaleFormData) => Promise<void>;
  onClose: () => void;
  sellers: Seller[];
  courses: Course[];
  existingSales?: Sale[];
}

export function SaleForm({ sale, onSubmit, onClose, sellers, courses, existingSales = [] }: SaleFormProps) {
  const [formData, setFormData] = useState<SaleFormData>({
    customer_name: sale?.customer_name || '',
    phone: sale?.phone || '',
    course: sale?.course || '',
    enrollment_date: sale?.enrollment_date || new Date().toISOString().split('T')[0],
    amount: sale?.amount || 0,
    seller: sale?.seller || '',
    sale_type: sale?.sale_type || 'INGRESO_CURSO',
    campaign_name: sale?.campaign_name || '',
    image_video_name: sale?.image_video_name || '',
    conversation_starter: sale?.conversation_starter || '',
    lead_id: sale?.lead_id || undefined,
    child_name: sale?.child_name || '',
    parent_name: sale?.parent_name || '',
    trial_class_date: sale?.trial_class_date || '',
    trial_class_attended: sale?.trial_class_attended || false,
  });

  const isKidsCourse = formData.course === 'INGLES PARA NIÑOS - PRESENCIAL';

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeCampaigns, setActiveCampaigns] = useState<string[]>([]);

  useEffect(() => {
    fetchActiveCampaigns();
  }, []);

  const fetchActiveCampaigns = async () => {
    try {
      const sixtyDaysAgo = new Date();
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
      
      const { data, error } = await supabase
        .from('unified_advertising_expenses')
        .select('campaign_name')
        .gte('date', sixtyDaysAgo.toISOString().split('T')[0])
        .order('date', { ascending: false });

      if (error) throw error;

      const uniqueCampaigns = Array.from(
        new Set(data?.map(e => e.campaign_name).filter(Boolean))
      ).sort();

      setActiveCampaigns(uniqueCampaigns as string[]);
    } catch (error) {
      console.error('Error fetching active campaigns:', error);
      const fallbackCampaigns = Array.from(new Set(
        existingSales.map(s => s.campaign_name).filter(Boolean)
      )).sort();
      setActiveCampaigns(fallbackCampaigns as string[]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      let finalData = { ...formData };

      // Aplicar mapeo de campañas si existe
      if (formData.campaign_name) {
        const { data: mapping } = await supabase
          .from('campaign_mappings')
          .select('new_campaign_name')
          .eq('old_campaign_name', formData.campaign_name)
          .maybeSingle();
        
        if (mapping) {
          finalData.campaign_name = mapping.new_campaign_name;
        }
      }

      // Limpiar strings vacíos a undefined para campos opcionales de fecha y texto
      const cleanFinalData: SaleFormData = {
        ...finalData,
        campaign_name: finalData.campaign_name || undefined,
        image_video_name: finalData.image_video_name || undefined,
        conversation_starter: finalData.conversation_starter || undefined,
        child_name: finalData.child_name || undefined,
        parent_name: finalData.parent_name || undefined,
        trial_class_date: finalData.trial_class_date || undefined,
      };

      await onSubmit(cleanFinalData);
      onClose();
    } catch (error) {
      console.error('Error en el formulario:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: keyof SaleFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const activeSellers = sellers.filter(s => s.active);
  const activeCourses = courses.filter(c => c.active);

  const uniqueAds = Array.from(new Set(
    existingSales.map(s => s.image_video_name).filter(Boolean)
  )) as string[];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-2xl font-bold text-gray-900">
            {sale ? 'Editar Venta' : 'Nueva Venta'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Cliente *</label>
            <input
              type="text"
              value={formData.customer_name}
              onChange={(e) => handleChange('customer_name', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              placeholder="Ej: Juan Pérez"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono *</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              placeholder="Ej: 8888-8888"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Curso *</label>
            <select
              value={formData.course}
              onChange={(e) => handleChange('course', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">Seleccione un curso</option>
              {activeCourses.map(course => (
                <option key={course.id} value={course.name}>{course.name}</option>
              ))}
            </select>
          </div>

          {/* Campos especiales para Inglés para Niños */}
          {isKidsCourse && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
              <p className="text-sm font-semibold text-blue-700 flex items-center gap-2">
                🧒 Información del Niño y Padre/Madre
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Niño *</label>
                <input
                  type="text"
                  value={formData.child_name || ''}
                  onChange={(e) => handleChange('child_name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ej: Sofía Pérez"
                  required={isKidsCourse}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Padre / Madre *</label>
                <input
                  type="text"
                  value={formData.parent_name || ''}
                  onChange={(e) => handleChange('parent_name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ej: María González"
                  required={isKidsCourse}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Clase de Prueba Gratuita</label>
                <input
                  type="date"
                  value={formData.trial_class_date || ''}
                  onChange={(e) => handleChange('trial_class_date', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="trial_attended"
                  checked={formData.trial_class_attended || false}
                  onChange={(e) => setFormData(prev => ({ ...prev, trial_class_attended: e.target.checked }))}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <label htmlFor="trial_attended" className="text-sm font-medium text-gray-700">
                  ¿Asistió a la clase de prueba?
                </label>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Matrícula *</label>
            <input
              type="date"
              value={formData.enrollment_date}
              onChange={(e) => handleChange('enrollment_date', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Monto (₡) *</label>
            <input
              type="text"
              inputMode="numeric"
              value={formData.amount === 0 ? '' : formData.amount}
              onChange={(e) => {
                const value = e.target.value;
                if (/^\d*\.?\d*$/.test(value)) {
                  handleChange('amount', value === '' ? 0 : parseFloat(value) || 0);
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              placeholder="2000"
            />
            <p className="mt-1 text-xs text-gray-500">Ej: 2000 o 2000.50</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Campaña</label>
            <select
              value={formData.campaign_name || ''}
              onChange={(e) => handleChange('campaign_name', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Selecciona una campaña (opcional)</option>
              {activeCampaigns.map((campaign, idx) => (
                <option key={idx} value={campaign}>{campaign}</option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500">Solo se muestran campañas activas (últimos 60 días)</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Anuncio / Imagen o Video</label>
            <input
              type="text"
              list="ads-list"
              value={formData.image_video_name || ''}
              onChange={(e) => handleChange('image_video_name', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Ej: Imag-6 (Steven)"
            />
            <datalist id="ads-list">
              {uniqueAds.map((ad, idx) => <option key={idx} value={ad} />)}
            </datalist>
            <p className="mt-1 text-xs text-gray-500">Nombre del anuncio o creatividad (opcional)</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Conversation Starter</label>
            <input
              type="text"
              value={formData.conversation_starter || ''}
              onChange={(e) => handleChange('conversation_starter', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Ej: Hola, vi su anuncio..."
            />
            <p className="mt-1 text-xs text-gray-500">Cómo inició la conversación (opcional)</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Venta *</label>
            <select
              value={formData.sale_type}
              onChange={(e) => handleChange('sale_type', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">Seleccione el tipo</option>
              <option value="INGRESO_CURSO">Ingreso Curso</option>
              <option value="INGRESO_TALLER">Ingreso Taller</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Vendedor *</label>
            <select
              value={formData.seller}
              onChange={(e) => handleChange('seller', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">Seleccione un vendedor</option>
              {activeSellers.map(seller => (
                <option key={seller.id} value={seller.name}>{seller.name}</option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Guardando...' : (sale ? 'Actualizar Venta' : 'Registrar Venta')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}