const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Role = require("../models/Role");
const Permission = require("../models/Permission");

const authenticateToken = (req, res, next) => {
  const token = req.header("Authorization")?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ error: "Access denied, token missing" });
  }

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    
    req.user = verified;
    next();
  } catch (error) {
    console.error("Token verification error:", error);
    res.status(400).json({ error: "Invalid token" });
  }
};

async function authorizeRolesAndPermissions(req, res, next) {
  try {
    const user = await User.findByPk(req.user.userId, {
      include: [
        {
          model: Role,
          as: "role",
        },
      ],
    });
    if (!user) {
      return res.status(403).json({ message: "Access denied. User not found.", code: "USER_NOT_FOUND" });
    }
    const role = user.role;
    if (!role) {
      return res.status(403).json({
        message: "Access denied. User does not have a role assigned.",
        code: "NO_ROLE_ASSIGNED",
      });
    }
    const requestedRoute = req.originalUrl;
    const cleanRoute = requestedRoute.replace(/\/\d+$/, "");

    const permission = await Permission.findOne({
      where: { permission_name: cleanRoute },
    });

    if (!permission) {
      return res.status(403).json({
        message: `Access denied. No permission assigned for the route: ${cleanRoute}`,
        code: "NO_PERMISSION_ASSIGNED",
      });
    }

    const rolePermissions = role.permissions
      .replace(/['"]+/g, '')  
      .split(',')
      .map(Number)
      .filter(id => !isNaN(id));

    if (!rolePermissions.includes(permission.id)) {
      return res
        .status(403)
        .json({ message: "Access denied. Insufficient permissions.", code: "403" });
    }

    next();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}





module.exports = {
  authenticateToken,
  authorizeRolesAndPermissions,
};
