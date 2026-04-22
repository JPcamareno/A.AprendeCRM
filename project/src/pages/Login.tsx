import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { GraduationCap } from 'lucide-react';
import toast from 'react-hot-toast';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const loggedUser = await login(email, password);
      toast.success('Bienvenido!');
      // Redirigir según rol: ADMIN → Dashboard, VENDEDOR → Prospectos
      navigate(loggedUser.role === 'ADMIN' ? '/' : '/prospectos');
    } catch (error: any) {
      toast.error(error.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="flex justify-center mb-8">
            <div className="p-4 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl shadow-lg">
              <GraduationCap className="w-12 h-12 text-white" />
            </div>
          </div>

          <h1 className="text-3xl font-bold text-center text-gray-900 mb-2">
            Gestión de Ventas
          </h1>
          <p className="text-center text-gray-600 mb-8">
            Sistema Semanal
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Correo Electrónico"
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Input
              label="Contraseña"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <Button
              type="submit"
              loading={loading}
              className="w-full bg-gradient-to-r from-primary-500 to-primary-600"
            >
              Iniciar Sesión
            </Button>
          </form>

          <div className="mt-8 p-4 bg-gray-50 rounded-xl">
            <p className="text-xs text-gray-600 text-center font-medium mb-2">
              Usuarios de prueba:
            </p>
            <div className="text-xs text-gray-500 space-y-1">
              <p>• allan@academiaprende.com (Admin)</p>
              <p>• steven@academiaprende.com (Vendedor)</p>
              <p className="mt-2 font-medium">Contraseña: 123456</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}