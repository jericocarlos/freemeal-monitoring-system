/**
 * Constants for role permissions management
 */

export const ROLES = [
  { 
    value: 'superadmin', 
    label: 'Super Admin', 
    color: 'bg-red-500',
    description: 'Full system access with all privileges'
  },
  { 
    value: 'admin', 
    label: 'Admin', 
    color: 'bg-blue-500',
    description: 'Administrative access with most privileges'
  },
  { 
    value: 'recruitment', 
    label: 'Recruitment', 
    color: 'bg-green-500',
    description: 'Recruitment-focused access for monitoring'
  },
  { 
    value: 'hr', 
    label: 'HR', 
    color: 'bg-purple-500',
    description: 'Human resources focused access'
  }
];

export const MODULES = [
  { 
    value: 'employees_management', 
    label: 'Employees Management', 
    description: 'Manage employee records, profiles, and information',
    category: 'Core'
  },
  { 
    value: 'trainees_management', 
    label: 'Trainees Management', 
    description: 'Manage trainee records, profiles, and information',
    category: 'Core'
  },
  { 
    value: 'interns_management', 
    label: 'Interns Management', 
    description: 'Manage intern records, profiles, and information',
    category: 'Core'
  },
  { 
    value: 'data_management', 
    label: 'Data Management', 
    description: 'Manage departments, positions, and organizational data',
    category: 'Core'
  },
  { 
    value: 'account_logins', 
    label: 'Account Logins', 
    description: 'Manage admin user accounts and authentication',
    category: 'Admin'
  },
  { 
    value: 'role_permissions', 
    label: 'Role Permissions', 
    description: 'Configure role-based access control (Superadmin only)',
    category: 'Admin'
  }
];

export const PERMISSIONS = [
  { 
    key: 'access', 
    label: 'Access', 
    description: 'Can access and use this module'
  }
];

// Module icons mapping
export const MODULE_ICONS = {
  employees_management: 'UserCog',
  trainees_management: 'UserCog',
  interns_management: 'UserCog',
  data_management: 'Database', 
  account_logins: 'Users',
  role_permissions: 'Shield'
};

// Default new permission structure
export const DEFAULT_NEW_PERMISSION = {
  role: '',
  module: '',
  permission: { access: false }
};

// Protected permissions that cannot be modified
export const PROTECTED_PERMISSIONS = [
  { role: 'superadmin', module: 'role_permissions' }
];
