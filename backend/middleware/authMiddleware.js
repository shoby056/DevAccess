
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const authMiddleware = async (req, res, next) => {
  // 1. Check authorization header
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Authentication required",
    });
  }

  // 2. Verify token
  let decoded;

  try {
    const token = authHeader.split(" ")[1];
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }

  // 3. Get user ID from token
  const userId = decoded.userId || decoded.id || decoded._id;

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: "Invalid token payload",
    });
  }

  // 4. Find actual user in MongoDB
  try {
    const user = await User.findById(userId).select("-password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.isActive === false) {
      return res.status(403).json({
        success: false,
        message: "Your account is inactive",
      });
    }

    // 5. Attach user information to request
    req.user = decoded;
    req.currentUser = user;

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = authMiddleware;
