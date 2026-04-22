import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Sales } from './pages/Sales';
import { Leads } from './pages/Leads';
import { Expenses } from './pages/Expenses';
import { Summary } from './pages/Summary';
import { Settings } from './pages/Settings';

// Componente ProtectedRoute definido aquí mismo
function ProtectedRoute({ children, requireAdmin = false }: { children: React.ReactNode; requireAdmin?: boolean }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-600 to-primary-800">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-white"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && user.role !== 'ADMIN') {
    return <Navigate to="/prospectos" replace />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route path="/" element={
            <ProtectedRoute requireAdmin>
              <Layout><Dashboard /></Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/ventas" element={
            <ProtectedRoute>
              <Layout><Sales /></Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/prospectos" element={
            <ProtectedRoute>
              <Layout><Leads /></Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/gastos" element={
            <ProtectedRoute requireAdmin>
              <Layout><Expenses /></Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/resumen" element={
            <ProtectedRoute requireAdmin>
              <Layout><Summary /></Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/configuracion" element={
            <ProtectedRoute requireAdmin>
              <Layout><Settings /></Layout>
            </ProtectedRoute>
          } />
        </Routes>
        <Toaster position="top-right" />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;