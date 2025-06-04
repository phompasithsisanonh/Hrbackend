const JWT = require("jsonwebtoken");
const User = require("../models/auth");
const authMiddlewares = async (req, res, next) => {
  const { authToken } = req.cookies;
  if (!authToken) {
    return res.status(401).json({
      success: false,
      message: `please login to access this route`,
    });
  } else {
    try {
      const decode = JWT.verify(authToken, process.env.TOKEN_SECRET);

      const user = await User.findById(decode._id);
      req.role = user.role;
      req.id = user._id;
  
      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
};
module.exports.authMiddlewares = authMiddlewares;
