export const ROLES = {
  admin: 'admin',
  hr: 'hr',
  manager: 'manager',
  employee: 'employee',
  agent: 'agent',
  intern: 'intern',
};

export const ROLE_LABELS = {
  admin: 'Admin',
  hr: 'HR',
  manager: 'Manager',
  employee: 'Employee',
  agent: 'Agent',
  intern: 'Intern',
};

export const ROLE_COLORS = {
  admin: 'bg-primary-100 text-primary-700',
  hr: 'bg-accent-100 text-accent-600',
  manager: 'bg-indigo-100 text-indigo-700',
  employee: 'bg-neutral-100 text-neutral-700',
  agent: 'bg-emerald-100 text-emerald-700',
  intern: 'bg-sky-100 text-sky-700',
};

export const PERMISSIONS = {
  dashboard: [ROLES.admin, ROLES.hr, ROLES.manager, ROLES.employee, ROLES.intern],
  employees: [ROLES.admin, ROLES.hr, ROLES.manager, ROLES.employee],
  departments: [ROLES.admin],
  attendance: [ROLES.admin, ROLES.hr, ROLES.manager, ROLES.employee, ROLES.intern],
  leave: [ROLES.admin, ROLES.hr, ROLES.manager, ROLES.employee, ROLES.intern],
  payroll: [ROLES.admin, ROLES.hr, ROLES.manager, ROLES.employee, ROLES.intern],
  documents: [ROLES.admin, ROLES.hr, ROLES.manager, ROLES.employee, ROLES.intern],
  reports: [ROLES.admin, ROLES.hr, ROLES.manager],
  profile: [ROLES.admin, ROLES.hr, ROLES.manager, ROLES.employee, ROLES.agent, ROLES.intern],
  settings: [ROLES.admin],
  sfmsAgent: [ROLES.admin, ROLES.agent],
};

export function canAccess(role, allowedRoles = []) {
  if (!role) {
    return false;
  }
  if (!allowedRoles.length) {
    return true;
  }
  return allowedRoles.includes(role);
}

export function isAdminLike(role) {
  return role === ROLES.admin || role === ROLES.hr;
}

export function isEmployee(role) {
  return role === ROLES.employee;
}

export function isAgent(role) {
  return role === ROLES.agent;
}

export function roleLabel(role) {
  return ROLE_LABELS[role] || 'User';
}
