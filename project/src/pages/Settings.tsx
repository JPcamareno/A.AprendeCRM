import { useState } from 'react';
import { Plus, Trash2, BookOpen, Users } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { useCourses, useSellers } from '../hooks/useCatalog';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';

export function Settings() {
  const { courses, addCourse, removeCourse } = useCourses();
  const { sellers, addSeller, removeSeller } = useSellers();

  const [newCourseName, setNewCourseName] = useState('');
  const [newCourseType, setNewCourseType] = useState<'CURSO' | 'TALLER'>('CURSO');
  const [newSellerName, setNewSellerName] = useState('');
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; type: 'course' | 'seller'; name: string }>({
    open: false,
    type: 'course',
    name: '',
  });
  const [loadingCourse, setLoadingCourse] = useState(false);
  const [loadingSeller, setLoadingSeller] = useState(false);

  const handleAddCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourseName.trim()) return;

    setLoadingCourse(true);
    const result = await addCourse(newCourseName.trim(), newCourseType);
    setLoadingCourse(false);

    if (result.success) {
      setNewCourseName('');
      alert('✅ Curso agregado exitosamente');
    } else {
      alert('❌ Error al agregar curso: ' + (result.error || 'Error desconocido'));
    }
  };

  const handleAddSeller = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSellerName.trim()) return;

    setLoadingSeller(true);
    const result = await addSeller(newSellerName.trim());
    setLoadingSeller(false);

    if (result.success) {
      setNewSellerName('');
      alert('✅ Vendedor agregado exitosamente');
    } else {
      alert('❌ Error al agregar vendedor: ' + (result.error || 'Error desconocido'));
    }
  };

  const handleDeleteCourse = async () => {
    setLoadingCourse(true);
    const result = await removeCourse(deleteDialog.name);
    setLoadingCourse(false);
    setDeleteDialog({ open: false, type: 'course', name: '' });

    if (result.success) {
      alert('✅ Curso eliminado exitosamente');
    } else {
      alert('❌ Error al eliminar curso: ' + (result.error || 'Error desconocido'));
    }
  };

  const handleDeleteSeller = async () => {
    setLoadingSeller(true);
    const result = await removeSeller(deleteDialog.name);
    setLoadingSeller(false);
    setDeleteDialog({ open: false, type: 'seller', name: '' });

    if (result.success) {
      alert('✅ Vendedor eliminado exitosamente');
    } else {
      alert('❌ Error al eliminar vendedor: ' + (result.error || 'Error desconocido'));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>
        <p className="text-gray-500">Gestiona cursos y vendedores del sistema</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gestión de Cursos */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BookOpen className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Gestión de Cursos</h2>
              <p className="text-sm text-gray-500">Agregar o eliminar cursos y talleres</p>
            </div>
          </div>

          <form onSubmit={handleAddCourse} className="space-y-4 mb-6 pb-6 border-b border-gray-200">
            <Input
              label="Nombre del Curso/Taller"
              placeholder="Ej: INGLES AVANZADO"
              value={newCourseName}
              onChange={(e) => setNewCourseName(e.target.value)}
              required
            />

            <Select
              label="Tipo"
              value={newCourseType}
              onChange={(e) => setNewCourseType(e.target.value as 'CURSO' | 'TALLER')}
              options={[
                { value: 'CURSO', label: 'Curso' },
                { value: 'TALLER', label: 'Taller' },
              ]}
            />

            <Button type="submit" loading={loadingCourse} className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Agregar Curso
            </Button>
          </form>

          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Cursos Actuales ({courses.length})</h3>
            {courses.length === 0 ? (
              <p className="text-sm text-gray-500 py-4 text-center">No hay cursos registrados</p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {courses.map((course) => (
                  <div
                    key={course}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div>
                      <span className="font-medium text-gray-900">{course}</span>
                      <span className="ml-2 text-xs text-gray-500">
                        {course.includes('TALLER') ? '(Taller)' : '(Curso)'}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteDialog({ open: true, type: 'course', name: course })}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* Gestión de Vendedores */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-green-100 rounded-lg">
              <Users className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Gestión de Vendedores</h2>
              <p className="text-sm text-gray-500">Agregar o eliminar vendedores</p>
            </div>
          </div>

          <form onSubmit={handleAddSeller} className="space-y-4 mb-6 pb-6 border-b border-gray-200">
            <Input
              label="Nombre del Vendedor"
              placeholder="Ej: Juan Pérez"
              value={newSellerName}
              onChange={(e) => setNewSellerName(e.target.value)}
              required
            />

            <Button type="submit" loading={loadingSeller} className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Agregar Vendedor
            </Button>
          </form>

          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Vendedores Actuales ({sellers.length})</h3>
            {sellers.length === 0 ? (
              <p className="text-sm text-gray-500 py-4 text-center">No hay vendedores registrados</p>
            ) : (
              <div className="space-y-2">
                {sellers.map((seller) => (
                  <div
                    key={seller}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <span className="font-medium text-gray-900">{seller}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteDialog({ open: true, type: 'seller', name: seller })}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>

      <ConfirmDialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, type: 'course', name: '' })}
        onConfirm={deleteDialog.type === 'course' ? handleDeleteCourse : handleDeleteSeller}
        title={`Eliminar ${deleteDialog.type === 'course' ? 'Curso' : 'Vendedor'}`}
        message={`¿Estás seguro de que deseas eliminar "${deleteDialog.name}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        loading={loadingCourse || loadingSeller}
      />
    </div>
  );
}