const { AuditLog } = require("../models");

const auditLog = (action) => {
  return async (req, res, next) => {
    // We hook into the response finish event to ensure we log after the action completes
    res.on("finish", async () => {
      try {
        // Only log successful mutative actions (or specific important ones)
        if (res.statusCode >= 200 && res.statusCode < 400) {
          const tenantId = req.tenantId || req.user?.tenantId || null;
          const environmentId = req.environmentId || null;
          const userId = req.user?.id || null;
          const ipAddress = req.ip || req.connection.remoteAddress;
          
          await AuditLog.create({
            tenantId,
            environmentId,
            userId,
            ipAddress,
            action,
            resource: req.originalUrl,
            details: { method: req.method, body: req.body, query: req.query }
          });
        }
      } catch (err) {
        console.error("Failed to write audit log:", err);
      }
    });
    
    next();
  };
};

module.exports = { auditLog };
