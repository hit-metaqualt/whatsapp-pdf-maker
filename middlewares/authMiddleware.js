const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  const authHeader = req.header("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Access denied. No token provided." });
  }

  const token = authHeader.split(" ")[1]; // Extract token after 'Bearer '

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // Verify token
    req.adminId = decoded.adminId; // Attach admin ID to request object
    next(); // Continue to the next middleware or controller
  } catch (error) {
    return res.status(401).json({ message: "Invalid token." });
  }
};
