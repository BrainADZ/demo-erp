const {
  ALL_PERMISSIONS,
  DEFAULT_ROLE_TEMPLATES,
  PERMISSION_CATEGORIES,
  PERMISSION_MODULES,
  ROLE_LABELS,
} = require('@/access/permissions');

const permissionsMeta = async (req, res) => {
  return res.status(200).json({
    success: true,
    result: {
      roles: ROLE_LABELS,
      roleTemplates: DEFAULT_ROLE_TEMPLATES,
      permissionCategories: PERMISSION_CATEGORIES,
      permissionModules: PERMISSION_MODULES,
      allPermissions: ALL_PERMISSIONS,
    },
    message: 'Permissions metadata fetched successfully',
  });
};

module.exports = permissionsMeta;
