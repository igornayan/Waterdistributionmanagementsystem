import { apiFetch } from './api';
import { FamilyDTO, PageResponse } from '../types';

export interface FamilySearchParams {
  name?: string;
  status?: string;
  cisternLevelSort?: 'asc' | 'desc';
  page?: number;
  size?: number;
  nameSort?: 'asc' | 'desc';
}

export const familyService = {
  createFamily: (data: FamilyDTO): Promise<FamilyDTO> => {
    return apiFetch<FamilyDTO>('/families', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateFamily: (id: number, data: FamilyDTO): Promise<FamilyDTO> => {
    return apiFetch<FamilyDTO>(`/families/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  findFamilyById: (id: number): Promise<FamilyDTO> => {
    return apiFetch<FamilyDTO>(`/families/${id}`, {
      method: 'GET',
    });
  },

  findAllFamilies: (params?: FamilySearchParams): Promise<PageResponse<FamilyDTO>> => {
    const urlParams = new URLSearchParams();
    if (params) {
      if (params.name) urlParams.append('name', params.name);
      if (params.status) urlParams.append('status', params.status);
      if (params.cisternLevelSort) urlParams.append('cisternLevelSort', params.cisternLevelSort);
      if (params.page !== undefined) urlParams.append('page', params.page.toString());
      if (params.size !== undefined) urlParams.append('size', params.size.toString());
      if (params.nameSort) urlParams.append('nameSort', params.nameSort);
    }
    
    const queryString = urlParams.toString();
    const endpoint = queryString ? `/families?${queryString}` : '/families';
    
    return apiFetch<PageResponse<FamilyDTO>>(endpoint, {
      method: 'GET',
    });
  },

  activateFamily: (id: number): Promise<FamilyDTO> => {
    return apiFetch<FamilyDTO>(`/families/${id}/activate`, {
      method: 'PATCH',
    });
  },

  deactivateFamily: (id: number): Promise<FamilyDTO> => {
    return apiFetch<FamilyDTO>(`/families/${id}/deactivate`, {
      method: 'PATCH',
    });
  },
};
