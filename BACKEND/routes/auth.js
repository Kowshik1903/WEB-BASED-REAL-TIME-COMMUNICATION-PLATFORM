
const router = require("express").Router();
const User = require("../models/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const auth = require("../middleware/auth");

function cleanUsername(value) {
  return typeof value === "string" ? value.trim() : "";
}


router.get("/users", auth, async (req, res) => {
  try {
    const users = await User.find({
      username: { $ne: req.user.username },
    })
      .select("username")
      .sort({ username: 1 });

    res.json({ users });
  } catch (err) {
    console.error("users.error", err.message);
    res.status(500).json({ error: err.message });
  }
});


router.post("/register", async (req, res) => {
  try {
    const username = cleanUsername(req.body.username);
    const { password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        error: "Username and password are required",
      });
    }
    if (!/^[a-zA-Z0-9_.-]{3,24}$/.test(username)) {
      return res.status(400).json({ error: "Use 3–24 letters, numbers, dots, dashes, or underscores for your username." });
    }
    if (typeof password !== "string" || password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters." });
    }

    const hashed = await bcrypt.hash(password, 10);

    await User.create({
      username,
      password: hashed,
    });

    res.status(201).json({ message: "User created successfully" });
  } catch (err) {
    console.error("register.error", err.message);

    if (err.code === 11000) {
      return res.status(409).json({ error: "Username already taken" });
    }

    res.status(500).json({ error: "Failed to register user" });
  }
});

// Login an existing user
router.post("/login", async (req, res) => {
  try {
    const username = cleanUsername(req.body.username);
    const { password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        error: "Username and password are required",
      });
    }

    const user = await User.findOne({ username });

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
      { userId: user._id.toString(), username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({ token });
  } catch (err) {
    console.error("login.error", err.message);
    res.status(500).json({ error: "Login failed" });
  }
});

module.exports = router;
