import { apiFetch } from './api';
import {
  CreateRoleDTO,
  PageResponse,
  PermissionDTO,
  RoleDTO,
  UpdateUserDTO,
  UpdateUserRoleDTO,
  UserDTO,
} from '../types';

const USER_MANAGEMENT_BASE = '/user-management';
const USERS_BASE = '/users';
const ROLES_BASE = `${USER_MANAGEMENT_BASE}/roles`;

async function parseListResponse<T>(response: PageResponse<T> | T[]): Promise<T[]> {
  if (Array.isArray(response)) {
    return response;
  }
  return response.content;
}

export const userService = {
  findAllUsers: async (): Promise<UserDTO[]> => {
    const response = await apiFetch<PageResponse<UserDTO> | UserDTO[]>(USER_MANAGEMENT_BASE);
    return parseListResponse(response);
  },

  findAllCargos: async (): Promise<RoleDTO[]> => {
    const response = await apiFetch<PageResponse<RoleDTO> | RoleDTO[]>(ROLES_BASE);
    return parseListResponse(response);
  },

  findAllPermissions: (): Promise<PermissionDTO[]> => {
    return apiFetch<PermissionDTO[]>(`${USER_MANAGEMENT_BASE}/permissions`);
  },

  createCargo: (data: CreateRoleDTO): Promise<RoleDTO> => {
    return apiFetch<RoleDTO>(`${USER_MANAGEMENT_BASE}/create-role`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateCargo: (id: number, data: RoleDTO): Promise<RoleDTO> => {
    return apiFetch<RoleDTO>(`${ROLES_BASE}/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ ...data, id }),
    });
  },

  deleteCargo: (id: number): Promise<void> => {
    return apiFetch<void>(`${ROLES_BASE}/${id}`, {
      method: 'DELETE',
    });
  },

  createUser: (data: UserDTO): Promise<UserDTO> => {
    return apiFetch<UserDTO>(USERS_BASE, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateUser: (id: number, data: UpdateUserDTO): Promise<UserDTO> => {
    return apiFetch<UserDTO>(`${USERS_BASE}/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        name: data.name.trim(),
        email: data.email.trim(),
      }),
    });
  },

  updateUserRole: (id: number, data: UpdateUserRoleDTO): Promise<UserDTO> => {
    return apiFetch<UserDTO>(`${USER_MANAGEMENT_BASE}/users/${id}/role`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  deleteUser: (id: number): Promise<void> => {
    return apiFetch<void>(`${USER_MANAGEMENT_BASE}/users/${id}`, {
      method: 'DELETE',
    });
  },
};
