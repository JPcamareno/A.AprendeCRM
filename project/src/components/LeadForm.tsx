import { useState } from 'react';
import { X } from 'lucide-react';
import type { Lead, LeadFormData, Seller, Course } from '../lib/types';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { Button } from './ui/Button';

interface LeadFormProps {
  lead?: Lead;
  onSubmit: (data: LeadFormData) => Promise<void>;
  onClose: () => void;
  sellers: Seller[];
  courses: Course[];
  campaigns?: string[];
}

// ¡¡¡IMPORTANTE!!! Esta línea debe tener 'export'
export function LeadForm({ lead, onSubmit, onClose, sellers, courses, campaigns = [] }: LeadFormProps) {
  const [formData, setFormData] = useState<LeadFormData>({
    customer_name: lead?.customer_name || '',
    phone: lead?.phone || '',
    email: lead?.email || '',
    interested_course: lead?.interested_course || '',
    campaign_name: lead?.campaign_name || '',
    image_video_name: lead?.image_video_name || '',
    notes: lead?.notes || '',
    status: lead?.status || 'NUEVO',
    assigned_seller: lead?.assigned_seller || '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: keyof LeadFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const activeSellers = sellers.filter(s => s.active);
  const activeCourses = courses.filter(c => c.active);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-2xl font-bold text-gray-900">
            {lead ? 'Editar Prospecto' : 'Nuevo Prospecto'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Información del Cliente */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
              Información del Cliente
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Nombre del Cliente"
                value={formData.customer_name}
                onChange={(e) => handleChange('customer_name', e.target.value)}
                required
                placeholder="Nombre completo"
              />

              <Input
                label="Teléfono"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                required
                placeholder="+506 1234-5678"
              />
            </div>

            <Input
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="cliente@email.com"
            />

            <Select
              label="Curso de Interés"
              value={formData.interested_course}
              onChange={(e) => handleChange('interested_course', e.target.value)}
              required
              options={[
                { value: '', label: 'Seleccione un curso' },
                ...activeCourses.map(c => ({ value: c.name, label: c.name }))
              ]}
            />
          </div>

          {/* Fuente del Lead */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
              Fuente del Lead
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Campaña"
                value={formData.campaign_name || ''}
                onChange={(e) => handleChange('campaign_name', e.target.value)}
                options={[
                  { value: '', label: campaigns.length > 0 ? 'Seleccione una campaña' : 'No hay campañas registradas' },
                  ...campaigns.map(c => ({ value: c, label: c }))
                ]}
              />

              <Input
                label="Anuncio / Imagen / Video"
                value={formData.image_video_name || ''}
                onChange={(e) => handleChange('image_video_name', e.target.value)}
                placeholder="Ej: Video 1 - Intro"
              />
            </div>
          </div>

          {/* Asignación y Estado */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
              Seguimiento
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Estado"
                value={formData.status}
                onChange={(e) => handleChange('status', e.target.value)}
                required
                options={[
                  { value: 'NUEVO', label: 'Nuevo' },
                  { value: 'CONTACTADO', label: 'Contactado' },
                  { value: 'INTERESADO', label: 'Interesado' },
                  { value: 'CONVERTIDO', label: 'Convertido' },
                  { value: 'NO_INTERESADO', label: 'No Interesado' }
                ]}
              />

              <Select
                label="Vendedor Asignado"
                value={formData.assigned_seller}
                onChange={(e) => handleChange('assigned_seller', e.target.value)}
                required
                options={[
                  { value: '', label: 'Seleccione un vendedor' },
                  ...activeSellers.map(s => ({ value: s.name, label: s.name }))
                ]}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notas
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                rows={3}
                placeholder="Notas sobre el prospecto..."
              />
            </div>
          </div>

          {/* Botones */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Guardando...' : (lead ? 'Actualizar' : 'Crear Prospecto')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}