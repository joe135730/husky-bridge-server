import * as dao from "./dao.js";
export default function UserRoutes(app) {
  // Sign in
  const signin = async (req, res) => {
    const { username, password } = req.body;
    const currentUser = await dao.findUserByCredentials(username, password);
    if (currentUser) {
      req.session["currentUser"] = currentUser;
      res.json(currentUser);
    } else {
      res.status(401).json({ message: "Unable to login. Try again later." });
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

  // Get all users
  const findAllUsers = async (req, res) => {
    const users = await dao.findAllUsers();
    res.json(users);
  };
  app.get("/api/users", findAllUsers);

  // Create User
  const createUser = async (req, res) => {
    const user = await dao.createUser(req.body);
    res.json(user);
  };
  app.post("/api/users", createUser);
}
