const { getResolvedPermissions } = require('@/access/permissions');

const hasPermission = (permission) => (req, res, next) => {
  const admin = req.admin;

  if (!admin) {
    return res.status(401).json({
      success: false,
      result: null,
      message: 'Authentication required.',
      jwtExpired: true,
    });
  }

  const resolvedPermissions = getResolvedPermissions(admin);
  if (!resolvedPermissions.includes(permission)) {
    return res.status(403).json({
      success: false,
      result: null,
      message: `Missing permission: ${permission}`,
    });
  }

  req.adminPermissions = resolvedPermissions;
  next();
};

module.exports = hasPermission;
