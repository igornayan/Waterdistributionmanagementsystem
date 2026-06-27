// Tipos baseados nos DTOs da API backend (Hydro Flow)

export type FamilyStatus = 'NORMAL' | 'URGENTE' | 'CRITICO';

export interface MemberDTO {
  id?: number;
  name: string;
  age: number;
  isBedridden: boolean;
}

export interface CisternDTO {
  id?: number;
  capacityLiters: number;
  currentLevelLiters: number;
}

export interface FamilyDTO {
  id?: number;
  name: string;
  active?: boolean;
  hasGutterSystem: boolean;
  gutterAreaM2: number | null;
  gutterEfficiencyCoefficient: number | null;
  latitude: number;
  longitude: number;
  familyStatus?: FamilyStatus;
  members: MemberDTO[];
  cisterns: CisternDTO[];
  dailyConsumption?: number;
  remainingDays?: number;
  nextDeliveryDate?: string;
}

export interface WaterDeliveryDTO {
  id?: number;
  deliveryDate: string; // Formato ISO yyyy-MM-dd
  requestedAmountLiters: number;
  deliveredAmountLiters: number;
  familyId: number;
}

export interface SystemSettingsDTO {
  id?: number;
  dailyWaterConsumption: number;
}

export interface MonthlyRainfallDTO {
  id?: number;
  year: number;
  month: number;
  rainfallMM: number;
}

export type UserRole = 'ADMIN' | 'USER';

export interface PermissionDTO {
  id?: number;
  name: string;
  label: string;
}

export interface RoleDTO {
  id?: number;
  name: string;
  permissions?: PermissionDTO[];
}

export interface CreateRoleDTO {
  name: string;
  permissionIds?: number[];
  permissions?: PermissionDTO[];
}

/** @deprecated Use RoleDTO */
export type CargoDTO = RoleDTO;

export interface UserDTO {
  id?: number;
  name: string;
  email: string;
  password?: string;
  role?: UserRole;
  roleId?: number;
  cargoId?: number;
  cargoName?: string;
  createdAt?: string;
  permissions?: string[];
}

export interface UpdateUserDTO {
  name: string;
  email: string;
}

export interface UpdateUserRoleDTO {
  roleId: number;
}

export interface LoginDTO {
  email: string;
  password?: string;
}

export interface TokenDTO {
  token: string;
}

export interface FirstAccessDTO {
  userId: number;
  message: string;
}

export interface ChangePasswordDTO {
  userId: number;
  currentPassword?: string | null;
  newPassword: string;
}

// Representação de resposta paginada do Spring Data (Page<T>)
export interface PageResponse<T> {
  content: T[];
  pageable: any;
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  sort: {
    empty: boolean;
    sorted: boolean;
    unsorted: boolean;
  };
  numberOfElements: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

// Aliases temporários para os componentes antigos (para mitigar quebra de compilação imediata, a serem gradualmente eliminados nas views)
// Esses nomes remetem às velhas interfaces locais.
export type Person = MemberDTO;
export type Cistern = CisternDTO;
export type Family = FamilyDTO;
export type WaterDelivery = WaterDeliveryDTO;
export type RainfallData = MonthlyRainfallDTO;
export type Settings = {
  dailyConsumptionPerPerson: number;
  rainfallData: RainfallData[];
};