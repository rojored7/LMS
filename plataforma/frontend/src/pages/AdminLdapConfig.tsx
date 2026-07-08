import { useState, useEffect } from 'react';
import { useUiStore } from '../store/uiStore';
import ldapConfigService, {
  type LdapConfig,
  type LdapConfigUpdate,
} from '../services/api/ldap-config.service';

const DEFAULT_FORM: LdapConfigUpdate = {
  serverUrl: '',
  useSsl: false,
  timeout: 10,
  bindDn: '',
  bindPassword: '',
  baseDn: '',
  searchFilter: '(sAMAccountName={username})',
  emailAttr: 'mail',
  nameAttr: 'cn',
  groupAttr: 'memberOf',
  roleMapping: '{}',
};

export default function AdminLdapConfig() {
  const addToast = useUiStore((s) => s.addToast);
  const [form, setForm] = useState<LdapConfigUpdate>(DEFAULT_FORM);
  const [passwordSet, setPasswordSet] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; details?: string | null } | null>(null);

  useEffect(() => {
    ldapConfigService.getConfig()
      .then((res) => {
        const data = (res as unknown as { data: LdapConfig }).data ?? res as unknown as LdapConfig;
        setPasswordSet(data.bindPasswordSet);
        setForm({
          serverUrl: data.serverUrl,
          useSsl: data.useSsl,
          timeout: data.timeout,
          bindDn: data.bindDn,
          bindPassword: '',
          baseDn: data.baseDn,
          searchFilter: data.searchFilter,
          emailAttr: data.emailAttr,
          nameAttr: data.nameAttr,
          groupAttr: data.groupAttr,
          roleMapping: data.roleMapping,
        });
      })
      .catch(() => {
        addToast({ type: 'error', message: 'No se pudo cargar la configuracion LDAP' });
      });
  }, [addToast]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload: LdapConfigUpdate = { ...form };
      if (!payload.bindPassword) payload.bindPassword = null;
      const res = await ldapConfigService.saveConfig(payload);
      const data = (res as unknown as { data: LdapConfig }).data ?? res as unknown as LdapConfig;
      setPasswordSet(data.bindPasswordSet);
      addToast({ type: 'success', message: 'Configuracion LDAP guardada' });
    } catch {
      addToast({ type: 'error', message: 'Error al guardar la configuracion LDAP' });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleTestConnection() {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await ldapConfigService.testConnection({
        serverUrl: form.serverUrl,
        useSsl: form.useSsl,
        timeout: form.timeout,
        bindDn: form.bindDn,
        bindPassword: form.bindPassword ?? '',
      });
      const data = (res as unknown as { data: { success: boolean; message: string; details?: string | null } }).data ?? res;
      setTestResult(data as { success: boolean; message: string; details?: string | null });
    } catch {
      setTestResult({ success: false, message: 'Error al conectar con el servidor LDAP' });
    } finally {
      setIsTesting(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Configuracion LDAP</h1>

      <form onSubmit={handleSave} className="space-y-6 bg-white dark:bg-gray-800 rounded-xl shadow p-6">

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              URL del servidor
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                name="serverUrl"
                value={form.serverUrl}
                onChange={handleChange}
                placeholder="ldap://192.168.1.10:389"
                className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isTesting || !form.serverUrl}
                className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {isTesting ? 'Probando...' : 'Probar conexion'}
              </button>
            </div>
            {testResult && (
              <div className={`mt-2 text-sm px-3 py-2 rounded-lg ${testResult.success ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                {testResult.message}
                {testResult.details && <span className="block text-xs opacity-70">{testResult.details}</span>}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bind DN</label>
            <input type="text" name="bindDn" value={form.bindDn} onChange={handleChange}
              placeholder="CN=svc_ldap,DC=empresa,DC=com"
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Contrasena Bind {passwordSet && <span className="text-xs text-gray-500">(dejar en blanco para no cambiar)</span>}
            </label>
            <input type="password" name="bindPassword" value={form.bindPassword ?? ''} onChange={handleChange}
              placeholder={passwordSet ? '••••••••' : 'Contrasena del servicio'}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Base DN</label>
            <input type="text" name="baseDn" value={form.baseDn} onChange={handleChange}
              placeholder="DC=empresa,DC=com"
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Filtro de busqueda</label>
            <input type="text" name="searchFilter" value={form.searchFilter} onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Atributo email</label>
            <input type="text" name="emailAttr" value={form.emailAttr} onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Atributo nombre</label>
            <input type="text" name="nameAttr" value={form.nameAttr} onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Atributo grupo</label>
            <input type="text" name="groupAttr" value={form.groupAttr} onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Timeout (seg)</label>
            <input type="number" name="timeout" value={form.timeout} onChange={handleChange} min={1} max={120}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Mapeo de roles (JSON)
            </label>
            <textarea name="roleMapping" value={form.roleMapping} onChange={handleChange} rows={3}
              placeholder='{"instructores": "INSTRUCTOR", "admins": "ADMIN"}'
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div className="flex items-center gap-2">
            <input type="checkbox" id="useSsl" name="useSsl" checked={form.useSsl}
              onChange={handleChange} className="h-4 w-4 rounded border-gray-300 text-blue-600" />
            <label htmlFor="useSsl" className="text-sm text-gray-700 dark:text-gray-300">Usar SSL (ldaps://)</label>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50 text-sm"
          >
            {isSaving ? 'Guardando...' : 'Guardar configuracion'}
          </button>
        </div>
      </form>
    </div>
  );
}
