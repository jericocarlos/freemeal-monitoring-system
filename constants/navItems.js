import { Users, Clipboard, UserCog, Calendar, Database, Shield } from "lucide-react";

export const NAV_ITEMS = {
  // Super Admin can access everything
  superadmin: [
    {
      name: 'Employees Management',
      href: '/admin/employees-management',
      icon: <Users className="h-[18px] w-[18px]" />,
    },
    {
      name: 'Trainees Management',
      href: '/admin/trainees-management',
      icon: <Users className="h-[18px] w-[18px]" />,
    },
    {
      name: 'Data Management',
      href: '/admin/lists',
      icon: <Database className="h-[18px] w-[18px]" />,
    },
    {
      name: 'Account Logins',
      href: '/admin/account-logins',
      icon: <UserCog className="h-[18px] w-[18px]" />,
    },
    {
      name: 'Free Meal Logs',
      href: '/admin/attendance-logs',
      icon: <Calendar className="h-[18px] w-[18px]" />,
    },
    {
      name: 'Role Permissions',
      href: '/admin/role-permissions',
      icon: <Shield className="h-[18px] w-[18px]" />,
    },
  ],
  // Admin can access everything except Role Permissions
  admin: [
    {
      name: 'Employees Management',
      href: '/admin/employees-management',
      icon: <Users className="h-[18px] w-[18px]" />,
    },
    {
      name: 'Trainees Management',
      href: '/admin/trainees-management',
      icon: <Users className="h-[18px] w-[18px]" />,
    },
    {
      name: 'Data Management',
      href: '/admin/lists',
      icon: <Database className="h-[18px] w-[18px]" />,
    },
    {
      name: 'Account Logins',
      href: '/admin/account-logins',
      icon: <UserCog className="h-[18px] w-[18px]" />,
    },
    {
      name: 'Free Meal Logs',
      href: '/admin/attendance-logs',
      icon: <Calendar className="h-[18px] w-[18px]" />,
    },
  ],
  // HR only gets Free Meal Logs and Employees Management
  hr: [
    {
      name: 'Employees Management',
      href: '/admin/employees-management',
      icon: <Users className="h-[18px] w-[18px]" />,
    },
    {
      name: 'Free Meal Logs',
      href: '/admin/attendance-logs',
      icon: <Calendar className="h-[18px] w-[18px]" />,
    },
  ],
  // Recruitment only gets Trainees Management
  recruitment: [
    {
      name: 'Trainees Management',
      href: '/admin/trainees-management',
      icon: <Users className="h-[18px] w-[18px]" />,
    },
  ],
};