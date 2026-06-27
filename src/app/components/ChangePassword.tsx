import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { AlertCircle, Eye, EyeOff, Lock } from 'lucide-react';
import { toast } from 'sonner';

interface ChangePasswordLocationState {
  userId: number;
  email: string;
  userName?: string;
  message?: string;
}

export function ChangePassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const { completeFirstAccess } = useAuth();

  const state = location.state as ChangePasswordLocationState | null;
  const pendingRaw = sessionStorage.getItem('pendingFirstAccess');
  const pending = pendingRaw
    ? (JSON.parse(pendingRaw) as ChangePasswordLocationState)
    : null;

  const userId = state?.userId ?? pending?.userId;
  const email = state?.email ?? pending?.email ?? '';
  const userName = state?.userName ?? pending?.userName ?? email.split('@')[0];

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  if (!userId) {
    navigate('/login', { replace: true });
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword.length < 8) {
      toast.error('A senha deve ter no mínimo 8 caracteres');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }

    setIsLoading(true);
    try {
      await completeFirstAccess(userId, newPassword, email, userName);
      sessionStorage.removeItem('pendingFirstAccess');
      toast.success('Senha definida com sucesso!');
      navigate('/', { replace: true });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao definir senha';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mb-4 flex justify-center">
            <div className="rounded-full bg-blue-500 p-3">
              <Lock className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl">Defina sua Senha</CardTitle>
          <CardDescription>
            Este é seu primeiro acesso. Por favor, defina uma nova senha para sua conta.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="mb-6 border-amber-200 bg-amber-50 text-amber-900">
            <AlertCircle className="text-amber-600" />
            <AlertTitle className="text-amber-900">Bem-vindo, {userName}!</AlertTitle>
            <AlertDescription className="text-amber-800">
              Por segurança, defina uma senha pessoal antes de continuar.
            </AlertDescription>
          </Alert>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">Nova Senha</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Digite sua nova senha"
                  required
                  minLength={8}
                  disabled={isLoading}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                  aria-label={showNewPassword ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                A senha deve ter no mínimo 8 caracteres
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirmar Senha</Label>
              <div className="relative">
                <Input
                  id="confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Digite novamente sua senha"
                  required
                  minLength={8}
                  disabled={isLoading}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                  aria-label={showConfirmPassword ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-black text-white hover:bg-black/90"
              disabled={isLoading}
            >
              {isLoading ? 'Salvando...' : 'Definir Senha e Continuar'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
