import { BASE_URL } from './api';
import {
  ChangePasswordDTO,
  FirstAccessDTO,
  ForgotPasswordDTO,
  LoginDTO,
  MessageDTO,
  ResetPasswordDTO,
  TokenDTO,
} from '../types';

export class FirstAccessRequiredError extends Error {
  readonly data: FirstAccessDTO;

  constructor(data: FirstAccessDTO) {
    super(data.message);
    this.name = 'FirstAccessRequiredError';
    this.data = data;
  }
}

async function parseResponseBody(response: Response): Promise<unknown> {
  const contentType = response.headers.get('content-type') ?? '';

  if (contentType.includes('application/json')) {
    return response.json();
  }

  const text = (await response.text()).trim();
  return text || null;
}

function extractErrorMessage(body: unknown, fallback: string): string {
  if (typeof body === 'string' && body) {
    return body;
  }

  if (body && typeof body === 'object') {
    const data = body as Record<string, unknown>;
    if (typeof data.message === 'string') return data.message;
    if (typeof data.detail === 'string') return data.detail;
    if (typeof data.error === 'string') return data.error;
  }

  return fallback;
}

export const authService = {
  login: async (data: LoginDTO): Promise<TokenDTO> => {
    const response = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });

    const body = await parseResponseBody(response);

    if (response.status === 403 && body && typeof body === 'object' && 'userId' in body) {
      throw new FirstAccessRequiredError(body as FirstAccessDTO);
    }

    if (!response.ok) {
      const errorMessage = extractErrorMessage(body, `Erro HTTP: ${response.status}`);
      if (response.status === 401) {
        document.dispatchEvent(new Event('auth:logout'));
      }
      throw new Error(errorMessage);
    }

    return body as TokenDTO;
  },

  changePassword: async (data: ChangePasswordDTO): Promise<TokenDTO> => {
    return sendChangePassword('/auth/change-password', data);
  },

  updatePassword: async (data: ChangePasswordDTO): Promise<TokenDTO> => {
    return sendChangePassword('/auth/update-password', data);
  },

  forgotPassword: async (data: ForgotPasswordDTO): Promise<MessageDTO> => {
    const response = await fetch(`${BASE_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });

    const body = await parseResponseBody(response);

    if (!response.ok) {
      throw new Error(extractErrorMessage(body, `Erro HTTP: ${response.status}`));
    }

    return body as MessageDTO;
  },

  resetPassword: async (data: ResetPasswordDTO): Promise<TokenDTO> => {
    const response = await fetch(`${BASE_URL}/auth/reset-password`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });

    const body = await parseResponseBody(response);

    if (!response.ok) {
      throw new Error(extractErrorMessage(body, `Erro HTTP: ${response.status}`));
    }

    return body as TokenDTO;
  },
};

async function sendChangePassword(
  endpoint: string,
  data: ChangePasswordDTO,
): Promise<TokenDTO> {
  const token = localStorage.getItem('hf_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method: 'PATCH',
    headers,
    credentials: 'include',
    body: JSON.stringify(data),
  });

  const body = await parseResponseBody(response);

  if (!response.ok) {
    const errorMessage = extractErrorMessage(body, `Erro HTTP: ${response.status}`);
    if (response.status === 401) {
      document.dispatchEvent(new Event('auth:logout'));
    }
    throw new Error(errorMessage);
  }

  return body as TokenDTO;
}
