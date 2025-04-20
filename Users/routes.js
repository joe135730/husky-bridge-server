import * as dao from "./dao.js";
export default function UserRoutes(app) {
  // Sign in
  const signin = async (req, res) => {
    try {
      const { email, password } = req.body;
      const currentUser = await dao.findUserByCredentials(email, password);
      if (currentUser) {
        // Ensure consistent role casing
        const formattedUser = {
          ...currentUser.toObject(),
          role: currentUser.role.toUpperCase()
        };
        
        // Set user in session - ensure we're not storing unnecessary data
        req.session.currentUser = {
          _id: formattedUser._id,
          firstName: formattedUser.firstName,
          lastName: formattedUser.lastName,
          email: formattedUser.email,
          role: formattedUser.role,
          profilePicture: formattedUser.profilePicture
        };
        
        // Save session explicitly and ensure it completes
        await new Promise((resolve, reject) => {
          req.session.save(err => {
            if (err) {
              console.error("Session save error:", err);
              reject(err);
            } else {
              resolve();
            }
          });
        });
        
        // Debug logging
        console.log("Signin successful:", { 
          userId: formattedUser._id,
          sessionID: req.sessionID,
          hasSession: !!req.session,
          sessionUser: !!req.session.currentUser
        });
        
        // Return user info to client
        res.json(formattedUser);
      } else {
        res.status(401).json({ message: "Invalid credentials" });
      }
    } catch (error) {
      console.error("Signin error:", error);
      res.status(500).json({ message: "Error during signin" });
    }
  };
  app.post("/api/users/signin", signin);

  // Sign up
  const signup = async (req, res) => {
    try {
      // Validate request body
      if (!req.body || !req.body.email || !req.body.password) {
        return res.status(400).json({ 
          message: "Email and password are required" 
        });
      }

      const user = await dao.findUserByEmail(req.body.email);
      if (user) {
        return res.status(400).json({ 
          message: "Email already registered" 
        });
      }

      const currentUser = await dao.createUser(req.body);
      req.session["currentUser"] = currentUser;
      res.json(currentUser);
    } catch (error) {
      console.error("Signup error:", error);
      res.status(500).json({ 
        message: "Error creating user" 
      });
    }
  };
  app.post("/api/users/signup", signup);

  // Profile - Get current user from session
  const profile = async (req, res) => {
    // Debug session information
    console.log("Profile check - Session info:", { 
      hasSession: !!req.session,
      sessionID: req.sessionID,
      hasUser: !!req.session?.currentUser,
      userData: req.session?.currentUser ? 
        { id: req.session.currentUser._id, role: req.session.currentUser.role } : 'none'
    });
    
    // Check if session exists and has user data
    if (req.session && req.session.currentUser && req.session.currentUser._id) {
      // Update user with latest data from database
      try {
        const user = await dao.findUserById(req.session.currentUser._id);
        
        if (!user) {
          console.error("User from session not found in database:", req.session.currentUser._id);
          return res.status(404).json({ message: "User not found" });
        }
        
        // Ensure consistent role casing and prepare a clean user object
        const formattedUser = {
          ...user.toObject(),
          role: user.role.toUpperCase()
        };
        
        // Don't update session unless there are actual changes
        // This avoids unnecessary session updates which can reset the session ID
        res.json(formattedUser);
      } catch (error) {
        console.error("Profile error:", error);
        res.status(404).json({ message: "User not found" });
      }
    } else {
      // Return 401 Unauthorized instead of 403 Forbidden
      console.log("No user in session for profile request");
      res.status(401).json({ message: "Not authenticated" });
    }
  };
  app.post("/api/users/profile", profile);

  // Sign out
  const signout = (req, res) => {
    req.session.destroy();
    res.sendStatus(200);
  };
  app.post("/api/users/signout", signout);

  // Get all users
  const findAllUsers = async (req, res) => {
    try {
      const currentUser = req.session["currentUser"];
      const allUsers = await dao.findAllUsers();
      
      const filteredUsers = currentUser
        ? allUsers.filter(user => user._id.toString() !== currentUser._id)
        : allUsers;
      
      res.json(filteredUsers || []);
    } catch (err) {
      console.error("Error fetching all users:", err);
      res.status(500).json({ message: "Error fetching users" });
    }
  };
  
  // 確保路由註冊
  app.get("/api/users", findAllUsers);

  // Create User
  const createUser = async (req, res) => {
    const user = await dao.createUser(req.body);
    res.json(user);
  };
  app.post("/api/users", createUser);

  // Update User
  const updateUser = async (req, res) => {
    try {
      const { id } = req.params;
      // Verify if the user exists first
      const existingUser = await dao.findUserById(id);
      if (!existingUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // If updating password, verify current password
      if (req.body.password) {
        const currentUser = await dao.findUserByCredentials(existingUser.email, req.body.currentPassword);
        if (!currentUser) {
          return res.status(401).json({ message: "Current password is incorrect" });
        }
      }

      const updatedUser = await dao.updateUser(id, req.body);
      if (updatedUser) {
        res.json(updatedUser);
      } else {
        res.status(500).json({ message: "Failed to update user" });
      }
    } catch (error) {
      console.error("Update user error:", error);
      res.status(500).json({ message: "Error updating user" });
    }
  };
  app.put("/api/users/:id", updateUser);

  // Delete User
  const deleteUser = async (req, res) => {
    try {
      const { id } = req.params;
      const status = await dao.deleteUser(id);
      if (status.deletedCount === 1) {
        res.json({ message: "User deleted successfully" });
      } else {
        res.status(404).json({ message: "User not found" });
      }
    } catch (error) {
      console.error("Delete user error:", error);
      res.status(500).json({ message: "Error deleting user" });
    }
  };
  app.delete("/api/users/:id", deleteUser);

  // Add a simple endpoint to check if user is authenticated
  const checkAuth = (req, res) => {
    // Debug logging
    console.log("Session in check-auth:", {
      hasSession: !!req.session,
      sessionID: req.sessionID,
      currentUser: req.session?.currentUser ? 
        { id: req.session.currentUser._id, role: req.session.currentUser.role } : 'none'
    });
    
    if (req.session && req.session.currentUser) {
      res.status(200).json({ 
        authenticated: true, 
        user: req.session.currentUser 
      });
    } else {
      res.status(401).json({ 
        authenticated: false, 
        message: "Not authenticated" 
      });
    }
  };
  app.get("/api/auth/current", checkAuth);
  app.get("/api/users/check-auth", checkAuth); // For backward compatibility
  
  // Add an admin check endpoint
  const checkAdmin = (req, res) => {
    // Debug logging
    console.log("Session in admin-check:", {
      hasSession: !!req.session,
      sessionID: req.sessionID,
      currentUser: req.session?.currentUser ? 
        { id: req.session.currentUser._id, role: req.session.currentUser.role } : 'none'
    });
    
    if (req.session && req.session.currentUser) {
      // Case-insensitive check for admin role
      const isAdmin = req.session.currentUser.role && 
                     req.session.currentUser.role.toUpperCase() === 'ADMIN';
                     
      if (isAdmin) {
        return res.status(200).json({ 
          isAdmin: true, 
          user: req.session.currentUser 
        });
      }
      
      // User is authenticated but not admin
      return res.status(403).json({ 
        isAdmin: false, 
        authenticated: true,
        message: "Not authorized as admin" 
      });
    }
    
    // Not authenticated at all
    res.status(401).json({ 
      isAdmin: false, 
      authenticated: false,
      message: "Not authenticated" 
    });
  };
  app.get("/api/auth/check-admin", checkAdmin);

  // Add a debug endpoint to check authentication
  const checkAuthDebug = (req, res) => {
    // First log the info before and the session ID
    const sessionID = req.sessionID;
    console.log(`Auth Debug Request - Session ID: ${sessionID}`);
    console.log("Session Cookie:", req.headers.cookie);
    
    // Then log the debug info
    console.log("Debug Auth Info:", {
      hasSession: !!req.session,
      sessionID: req.sessionID,
      hasCookie: !!req.headers.cookie,
      cookiesList: req.headers.cookie,
      currentUser: req.session?.currentUser ? 
        { id: req.session.currentUser._id, role: req.session.currentUser.role } : 'none',
      sessionData: req.session
    });
    
    // Send the response
    res.json({
      authenticated: !!req.session?.currentUser,
      sessionInfo: {
        id: req.sessionID,
        hasCookie: !!req.headers.cookie,
        hasSession: !!req.session,
        cookieData: req.headers.cookie
      },
      userInfo: req.session?.currentUser ? {
        id: req.session.currentUser._id,
        firstName: req.session.currentUser.firstName,
        role: req.session.currentUser.role
      } : null
    });
  };
  app.get("/api/auth/debug", checkAuthDebug);

  // Add a detailed session debug endpoint to diagnose session issues
  const sessionDebug = (req, res) => {
    const sessionID = req.sessionID;
    const cookies = req.headers.cookie;
    const userAgent = req.headers['user-agent'];
    
    // Get cookie info
    const cookieInfo = {};
    if (cookies) {
      const cookieArr = cookies.split(';');
      for (const cookie of cookieArr) {
        const [name, value] = cookie.trim().split('=');
        cookieInfo[name] = value;
      }
    }
    
    // Log for server-side debugging
    console.log("SESSION DEBUG:", {
      sessionID,
      hasSession: !!req.session,
      authenticated: !!req.session?.currentUser,
      cookies,
      parsedCookies: cookieInfo,
      userAgent
    });
    
    // Collect session store info if possible
    let storeInfo = "Not available";
    try {
      if (req.sessionStore) {
        storeInfo = {
          storeType: req.sessionStore.constructor.name,
          ttl: req.sessionStore.ttl,
          storeOptions: req.sessionStore.options
        };
      }
    } catch (err) {
      storeInfo = `Error getting store info: ${err.message}`;
    }
    
    // Return detailed information
    res.json({
      sessionState: {
        id: sessionID,
        hasSessionObject: !!req.session,
        cookie: req.session?.cookie || null,
        cookieHeaders: cookieInfo,
        store: storeInfo
      },
      authState: {
        isAuthenticated: !!req.session?.currentUser,
        userId: req.session?.currentUser?._id || null,
        userRole: req.session?.currentUser?.role || null
      },
      requestInfo: {
        ip: req.ip,
        userAgent,
        method: req.method,
        url: req.originalUrl
      },
      timestamps: {
        serverTime: new Date().toISOString(),
        sessionCreated: req.session?.cookie?.expires ? 
          new Date(req.session.cookie.expires.getTime() - req.session.cookie.maxAge).toISOString() : null,
        sessionExpires: req.session?.cookie?.expires ? 
          req.session.cookie.expires.toISOString() : null
      }
    });
  };
  app.get("/api/debug/session", sessionDebug);
}
