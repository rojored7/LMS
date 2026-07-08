import api from '../api';
import type { ApiResponse } from '../../types';

export interface LdapConfig {
  serverUrl: string;
  useSsl: boolean;
  timeout: number;
  bindDn: string;
  bindPasswordSet: boolean;
  baseDn: string;
  searchFilter: string;
  emailAttr: string;
  nameAttr: string;
  groupAttr: string;
  roleMapping: string;
  updatedAt: string | null;
}

export interface LdapConfigUpdate {
  serverUrl: string;
  useSsl: boolean;
  timeout: number;
  bindDn: string;
  bindPassword?: string | null;
  baseDn: string;
  searchFilter: string;
  emailAttr: string;
  nameAttr: string;
  groupAttr: string;
  roleMapping: string;
}

export interface LdapTestRequest {
  serverUrl: string;
  useSsl: boolean;
  timeout: number;
  bindDn: string;
  bindPassword: string;
}

export interface LdapTestResult {
  success: boolean;
  message: string;
  details?: string | null;
}

const ldapConfigService = {
  getConfig: (): Promise<ApiResponse<LdapConfig>> =>
    api.get('/admin/ldap/config'),

  saveConfig: (data: LdapConfigUpdate): Promise<ApiResponse<LdapConfig>> =>
    api.put('/admin/ldap/config', data),

  testConnection: (data: LdapTestRequest): Promise<ApiResponse<LdapTestResult>> =>
    api.post('/admin/ldap/test', data),
};

export default ldapConfigService;
