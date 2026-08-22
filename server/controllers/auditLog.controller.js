const { AuditLog, User } = require("../models");

exports.getAll = async (req, res) => {
  try {
    const tenantId = req.tenantId || req.user?.tenantId || null;
    const environmentId = req.environmentId || null;
    
    // Support pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100;
    const offset = (page - 1) * limit;

    const where = {};
    if (tenantId) where.tenantId = tenantId;
    if (environmentId) where.environmentId = environmentId;

    const logs = await AuditLog.findAndCountAll({
      where,
      order: [["createdAt", "DESC"]],
      limit,
      offset,
    });

    // We can map the user names manually if they exist, or we can add an association.
    // Let's just fetch all unique users for this tenant and map them here to avoid complex joins if they are not setup.
    const userIds = [...new Set(logs.rows.map(l => l.userId).filter(Boolean))];
    const users = await User.findAll({ where: { id: userIds }, attributes: ["id", "name", "role", "email"] });
    const userMap = users.reduce((acc, u) => {
      acc[u.id] = u.toJSON();
      return acc;
    }, {});

    const mappedLogs = logs.rows.map(log => {
      const logData = log.toJSON();
      logData.User = userMap[log.userId] || null;
      return logData;
    });

    res.json({
      success: true,
      data: mappedLogs,
      total: logs.count,
      page,
      totalPages: Math.ceil(logs.count / limit)
    });
  } catch (error) {
    console.error("Fetch audit logs error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch activity logs" });
  }
};

exports.clearAll = async (req, res) => {
  try {
    const tenantId = req.tenantId || req.user?.tenantId || null;
    const environmentId = req.environmentId || null;
    
    if (!tenantId) return res.status(400).json({ success: false, message: "Tenant ID required" });

    const where = { tenantId };
    if (environmentId) where.environmentId = environmentId;

    await AuditLog.destroy({ where });

    res.json({ success: true, message: "Activity logs cleared successfully" });
  } catch (error) {
    console.error("Clear audit logs error:", error);
    res.status(500).json({ success: false, message: "Failed to clear activity logs" });
  }
};
