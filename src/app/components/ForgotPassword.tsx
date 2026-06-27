import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { authService } from '../services/authService';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { ArrowLeft, Droplets, Mail, MailCheck } from 'lucide-react';
import { toast } from 'sonner';

export function ForgotPassword() {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [responseMessage, setResponseMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error('Informe seu email');
      return;
    }

    setIsLoading(true);
    try {
      const response = await authService.forgotPassword({ email: email.trim() });
      setResponseMessage(
        response.message ||
          'Se o email estiver cadastrado, você receberá um link com instruções para redefinir sua senha.',
      );
      setSubmitted(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao solicitar recuperação de senha';
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
              <Droplets className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl">Recuperar Senha</CardTitle>
          <CardDescription>
            Informe seu email para receber o token de redefinição de senha.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {submitted ? (
            <div className="space-y-4">
              <Alert className="border-green-200 bg-green-50 text-green-900">
                <MailCheck className="text-green-600" />
                <AlertTitle className="text-green-900">Solicitação enviada</AlertTitle>
                <AlertDescription className="text-green-800">{responseMessage}</AlertDescription>
              </Alert>

              <Button
                className="w-full bg-black text-white hover:bg-black/90"
                onClick={() => navigate('/redefinir-senha')}
              >
                Já tenho o token — Redefinir senha
              </Button>

              <Button variant="outline" className="w-full" onClick={() => navigate('/login')}>
                Voltar ao login
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                    className="pl-10"
                  />
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-black text-white hover:bg-black/90"
                disabled={isLoading}
              >
                {isLoading ? 'Enviando...' : 'Enviar instruções'}
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => navigate('/login')}
                disabled={isLoading}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar ao login
              </Button>
            </form>
          )}

          {!submitted && (
            <p className="mt-4 text-center text-sm text-muted-foreground">
              Já recebeu o token?{' '}
              <Link to="/redefinir-senha" className="font-medium text-blue-600 hover:underline">
                Redefinir senha
              </Link>
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
