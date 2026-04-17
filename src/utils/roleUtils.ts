export type UserRole = 'ADMIN' | 'PROJECT_MANAGER' | 'MEMBER';

export const rolePermissions = {
  ADMIN: {
    canViewDashboard: true,
    canViewProjects: true,
    canCreateProject: true,
    canEditProject: true,
    canDeleteProject: true,
    canViewTasks: true,
    canCreateTask: true,
    canEditTask: true,
    canDeleteTask: true,
    canViewAlerts: true,
    canResolveAlert: true,
    canViewReports: true,
    canManageUsers: true,
  },
  PROJECT_MANAGER: {
    canViewDashboard: true,
    canViewProjects: true,
    canCreateProject: true,
    canEditProject: true,
    canDeleteProject: false,
    canViewTasks: true,
    canCreateTask: true,
    canEditTask: true,
    canDeleteTask: false,
    canViewAlerts: true,
    canResolveAlert: true,
    canViewReports: true,
    canManageUsers: false,
  },
  MEMBER: {
    canViewDashboard: true,
    canViewProjects: true,
    canCreateProject: false,
    canEditProject: false,
    canDeleteProject: false,
    canViewTasks: true,
    canCreateTask: false,
    canEditTask: true,
    canDeleteTask: false,
    canViewAlerts: true,
    canResolveAlert: false,
    canViewReports: false,
    canManageUsers: false,
  },
};

export const getRolePermissions = (role: UserRole) => {
  return rolePermissions[role] || rolePermissions.MEMBER;
};

export const canAccess = (role: UserRole, permission: keyof typeof rolePermissions['ADMIN']) => {
  const permissions = getRolePermissions(role);
  return (permissions as any)[permission] || false;
};

export const getRoleLabel = (role: UserRole) => {
  const labels: Record<UserRole, string> = {
    ADMIN: 'Quản Trị Viên',
    PROJECT_MANAGER: 'Quản Lý Dự Án',
    MEMBER: 'Thành Viên',
  };
  return labels[role] || role;
};
