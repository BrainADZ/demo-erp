const {
  getAllowedModulesFromPermissions,
  getResolvedPermissions,
  normalizeModuleList,
} = require('./permissions');

const serializeAdmin = (user, token = null, maxAge = null) => {
  const permissionMode = user?.permissionMode || 'role';
  const resolvedPermissions = getResolvedPermissions(user);
  const storedModules = normalizeModuleList(user?.permissionModules);

  return {
    _id: user?._id,
    employeeId: user?.employeeId,
    name: user?.name,
    surname: user?.surname,
    role: user?.role,
    department: user?.department,
    jobTitle: user?.jobTitle,
    email: user?.email,
    photo: user?.photo,
    enabled: user?.enabled,
    permissionMode,
    permissions: resolvedPermissions,
    permissionModules:
      user?.role === 'owner' || user?.role === 'admin'
        ? getAllowedModulesFromPermissions(resolvedPermissions)
        : permissionMode === 'custom'
        ? storedModules
        : getAllowedModulesFromPermissions(resolvedPermissions),
    customPermissions:
      permissionMode === 'custom' && Array.isArray(user?.permissions) ? user.permissions : [],
    token,
    maxAge,
  };
};

module.exports = serializeAdmin;
