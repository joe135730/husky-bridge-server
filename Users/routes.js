import * as dao from "./dao.js";
export default function UserRoutes(app) {
  // Sign in
  const signin = async (req, res) => {
    try {
      const { email, password } = req.body;
      const currentUser = await dao.findUserByCredentials(email, password);
      if (currentUser) {
        req.session["currentUser"] = currentUser;
        res.json(currentUser);
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
    const currentUser = req.session["currentUser"];
    if (currentUser) {
      // Update user with latest data from database
      try {
        const user = await dao.findUserById(currentUser._id);
        res.json(user);
      } catch (error) {
        console.error("Profile error:", error);
        res.status(404).json({ message: "User not found" });
      }
    } else {
      res.sendStatus(403);
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
      console.log("GET /api/users 請求已收到");
      const currentUser = req.session["currentUser"];
      const allUsers = await dao.findAllUsers();
      
      console.log("獲取到的用戶列表:", allUsers);
  
      const filteredUsers = currentUser
        ? allUsers.filter(user => user._id.toString() !== currentUser._id)
        : allUsers;
      
      console.log("過濾後的用戶列表:", filteredUsers);
  
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
}
