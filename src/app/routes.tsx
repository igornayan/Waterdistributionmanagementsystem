import { createBrowserRouter, Outlet } from 'react-router';
import { AuthProvider } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Login } from './components/Login';
import { ChangePassword } from './components/ChangePassword';
import { ForgotPassword } from './components/ForgotPassword';
import { ResetPassword } from './components/ResetPassword';
import { FamilyList } from './components/FamilyList';
import { FamilyForm } from './components/FamilyForm';
import { FamilyDetails } from './components/FamilyDetails';
import { FamilyEdit } from './components/FamilyEdit';
import { Settings } from './components/Settings';
import { UserProfile } from './components/UserProfile';
import { UserManagement } from './components/UserManagement';
import { Header } from './components/Header';
import { Toaster } from './components/ui/sonner';

function RootLayout() {
  return (
    <AuthProvider>
      <Outlet />
    </AuthProvider>
  );
}

function AppLayout() {
  return (
    <DataProvider>
      <div className="min-h-screen bg-background">
        <Header />
        <Outlet />
      </div>
    </DataProvider>
  );
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      {
        path: '',
        element: <ProtectedRoute />,
        children: [
          {
            path: '',
            element: <AppLayout />,
            children: [
              { index: true, Component: FamilyList },
              { path: 'nova-familia', Component: FamilyForm },
              { path: 'familia/:id', Component: FamilyDetails },
              { path: 'familia/:id/editar', Component: FamilyEdit },
              { path: 'configuracoes', Component: Settings },
              { path: 'perfil', Component: UserProfile },
              { path: 'usuarios', Component: UserManagement },
            ],
          },
        ],
      },
      { path: 'login', Component: Login },
      { path: 'definir-senha', Component: ChangePassword },
      { path: 'esqueci-senha', Component: ForgotPassword },
      { path: 'redefinir-senha', Component: ResetPassword },
    ],
  },
]);
