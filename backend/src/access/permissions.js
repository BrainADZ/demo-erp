const PERMISSION_CATEGORIES = {
  dashboard: ['view'],
  clients: ['create', 'read', 'update', 'delete', 'list', 'summary', 'search', 'filter'],
  enquiries: ['create', 'read', 'update', 'delete', 'list', 'summary', 'search', 'filter'],
  quotes: ['create', 'read', 'update', 'delete', 'list', 'summary', 'search', 'filter', 'mail', 'convert'],
  invoices: ['create', 'read', 'update', 'delete', 'list', 'summary', 'search', 'filter', 'mail'],
  payments: ['create', 'read', 'update', 'delete', 'list', 'summary', 'search', 'filter', 'mail'],
  taxes: ['create', 'read', 'update', 'delete', 'list', 'summary', 'search', 'filter'],
  payment_modes: ['create', 'read', 'update', 'delete', 'list', 'summary', 'search', 'filter'],
  attendances: ['create', 'read', 'update', 'delete', 'list', 'summary', 'search', 'filter'],
  settings: ['view', 'update', 'upload'],
  employees: ['create', 'read', 'update', 'delete', 'list', 'permissions'],
  profile: ['read', 'update', 'password'],
};

const ALL_PERMISSIONS = Object.entries(PERMISSION_CATEGORIES).flatMap(([resource, actions]) =>
  actions.map((action) => `${resource}.${action}`)
);

const PERMISSION_MODULES = {
  dashboard: {
    label: 'Dashboard',
    permissions: ['dashboard.view'],
  },
  customers: {
    label: 'Customers',
    permissions: PERMISSION_CATEGORIES.clients.map((action) => `clients.${action}`),
  },
  invoices: {
    label: 'Invoices',
    permissions: PERMISSION_CATEGORIES.invoices.map((action) => `invoices.${action}`),
  },
  quotes: {
    label: 'Quotes',
    permissions: PERMISSION_CATEGORIES.quotes.map((action) => `quotes.${action}`),
  },
  payments: {
    label: 'Payments',
    permissions: PERMISSION_CATEGORIES.payments.map((action) => `payments.${action}`),
  },
  attendance: {
    label: 'Attendance',
    permissions: PERMISSION_CATEGORIES.attendances.map((action) => `attendances.${action}`),
  },
  paymentModes: {
    label: 'Payment Mode',
    permissions: PERMISSION_CATEGORIES.payment_modes.map((action) => `payment_modes.${action}`),
  },
  taxes: {
    label: 'Taxes',
    permissions: PERMISSION_CATEGORIES.taxes.map((action) => `taxes.${action}`),
  },
  enquiries: {
    label: 'Enquiries',
    permissions: PERMISSION_CATEGORIES.enquiries.map((action) => `enquiries.${action}`),
  },
  settings: {
    label: 'Settings',
    permissions: [
      'settings.view',
      'settings.update',
      'settings.upload',
    ],
  },
  employees: {
    label: 'Employees',
    permissions: PERMISSION_CATEGORIES.employees.map((action) => `employees.${action}`),
  },
  profile: {
    label: 'Profile',
    permissions: PERMISSION_CATEGORIES.profile.map((action) => `profile.${action}`),
  },
  about: {
    label: 'About',
    permissions: [],
  },
};

const ALL_PERMISSION_MODULE_KEYS = Object.keys(PERMISSION_MODULES);

const SUPPORT_PERMISSION_GROUPS = {
  clientLookup: ['clients.read', 'clients.list', 'clients.search', 'clients.filter'],
  taxLookup: ['taxes.read', 'taxes.list', 'taxes.search', 'taxes.filter'],
  paymentModeLookup: [
    'payment_modes.read',
    'payment_modes.list',
    'payment_modes.search',
    'payment_modes.filter',
  ],
  invoiceLookup: ['invoices.read', 'invoices.list', 'invoices.search', 'invoices.filter'],
  quoteLookup: ['quotes.read', 'quotes.list', 'quotes.search', 'quotes.filter'],
  paymentLookup: ['payments.read', 'payments.list', 'payments.search', 'payments.filter'],
  employeeLookup: ['employees.read', 'employees.list', 'employees.permissions'],
};

const MODULE_DEPENDENCIES = {
  dashboard: ['clientLookup', 'quoteLookup', 'invoiceLookup', 'paymentLookup'],
  quotes: ['clientLookup', 'taxLookup'],
  invoices: ['clientLookup', 'taxLookup', 'paymentLookup'],
  payments: ['clientLookup', 'invoiceLookup', 'paymentModeLookup'],
  attendance: ['employeeLookup'],
};

const DEFAULT_ROLE_TEMPLATES = {
  owner: ALL_PERMISSIONS,
  admin: ALL_PERMISSIONS,
  manager: ALL_PERMISSIONS,
  sales: ALL_PERMISSIONS,
  finance: ALL_PERMISSIONS,
  employee: ALL_PERMISSIONS,
};

const ROLE_LABELS = {
  owner: 'Owner',
  admin: 'Admin',
  manager: 'Manager',
  sales: 'Sales',
  finance: 'Finance',
  employee: 'Employee',
};

const normalizePermissionList = (permissions = []) => {
  if (!Array.isArray(permissions)) return [];
  return Array.from(new Set(permissions.filter((permission) => ALL_PERMISSIONS.includes(permission))));
};

const normalizeModuleList = (modules = []) => {
  if (!Array.isArray(modules)) return [];
  return Array.from(new Set(modules.filter((moduleKey) => ALL_PERMISSION_MODULE_KEYS.includes(moduleKey))));
};

const expandModulesToPermissions = (modules = []) => {
  const normalizedModules = normalizeModuleList(modules);
  const modulePermissions = normalizedModules.flatMap(
    (moduleKey) => PERMISSION_MODULES[moduleKey]?.permissions || []
  );
  const dependencyPermissions = normalizedModules.flatMap((moduleKey) =>
    (MODULE_DEPENDENCIES[moduleKey] || []).flatMap((groupKey) => SUPPORT_PERMISSION_GROUPS[groupKey] || [])
  );
  return Array.from(
    new Set([...modulePermissions, ...dependencyPermissions])
  );
};

const getAllowedModulesFromPermissions = (permissions = []) => {
  const normalizedPermissions = normalizePermissionList(permissions);
  return ALL_PERMISSION_MODULE_KEYS.filter((moduleKey) => {
    const modulePermissions = PERMISSION_MODULES[moduleKey]?.permissions || [];
    if (modulePermissions.length === 0) return true;
    return modulePermissions.every((permission) => normalizedPermissions.includes(permission));
  });
};

const getDefaultPermissionsForRole = (role = 'employee') => {
  if (role === 'owner' || role === 'admin') return [...ALL_PERMISSIONS];
  return [...(DEFAULT_ROLE_TEMPLATES[role] || DEFAULT_ROLE_TEMPLATES.employee)];
};

const getResolvedPermissions = (user = {}) => {
  if (user.role === 'owner' || user.role === 'admin') {
    return Array.from(new Set([...ALL_PERMISSIONS, ...PERMISSION_CATEGORIES.profile.map((action) => `profile.${action}`)]));
  }

  const defaults = getDefaultPermissionsForRole(user.role);
  const customPermissions = normalizePermissionList(user.permissions);
  const modulePermissions = expandModulesToPermissions(user.permissionModules);
  const profilePermissions = PERMISSION_CATEGORIES.profile.map((action) => `profile.${action}`);
  if (user.permissionMode === 'custom' && customPermissions.length > 0) {
    if (modulePermissions.length > 0) {
      return Array.from(new Set([...modulePermissions, ...profilePermissions]));
    }
    return Array.from(new Set([...customPermissions, ...profilePermissions]));
  }
  return Array.from(new Set([...defaults, ...profilePermissions]));
};

module.exports = {
  ALL_PERMISSIONS,
  ALL_PERMISSION_MODULE_KEYS,
  DEFAULT_ROLE_TEMPLATES,
  MODULE_DEPENDENCIES,
  PERMISSION_CATEGORIES,
  PERMISSION_MODULES,
  ROLE_LABELS,
  SUPPORT_PERMISSION_GROUPS,
  expandModulesToPermissions,
  getDefaultPermissionsForRole,
  getAllowedModulesFromPermissions,
  getResolvedPermissions,
  normalizeModuleList,
  normalizePermissionList,
};
