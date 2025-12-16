// Authentication middleware
export const authenticateUser = (req, res, next) => {
  // Check if session exists
  if (!req.session) {
    return res.status(500).json({ message: "Session middleware not properly configured" });
  }
  
  // If the user is not authenticated from the session
  if (!req.session.currentUser) {
    return res.status(401).json({ message: "Unauthorized - please log in" });
  }
  
  // Attach the user to the request
  req.user = req.session.currentUser;
  next();
};

// Admin authorization middleware
export const isAdmin = (req, res, next) => {
  if (!req.user) {
    console.error("Admin middleware - No user object found in request");
    return res.status(403).json({ message: "Forbidden - admin access only" });
  }
  
  const userRole = req.user?.role || '';
  
  // Case-insensitive check for "admin" role - also accept "ADMIN" and "admin"
  if (userRole.toUpperCase() !== "ADMIN") {
    console.error("Admin middleware - User is not admin:", userRole);
    return res.status(403).json({ 
      message: "Forbidden - admin access only",
      currentRole: userRole
    });
  }
  
  next();
}; 