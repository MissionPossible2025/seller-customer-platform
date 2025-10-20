import User from "../models/userModel.js";

// Register new user
export const registerUser = async (req, res) => {
  const { name, email, password, uniqueCode } = req.body;
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ error: "User already exists" });

    // Validate the one-time onboarding unique code for customers
    if (uniqueCode !== "123456") {
      return res.status(403).json({ error: "Invalid unique code" });
    }

    const newUser = await User.create({ name, email, password, role: "customer" });
    res.status(201).json(newUser);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Login user
export const loginUser = async (req, res) => {
  const { email, password, name } = req.body;
  try {
    let user;

    if (password) {
      // Standard email+password login (e.g., sellers or customers)
      user = await User.findOne({ email, password });
    } else {
      // Email-only login allowed for customers after initial registration
      user = await User.findOne({ email, role: "customer" });
    }

    if (!user) return res.status(404).json({ error: "Invalid credentials" });

    // If name provided, ensure it matches stored name to prevent mistaken sign-ins
    if (name && user.name !== name) {
      return res.status(400).json({ error: "Name does not match our records" });
    }

    res.json({ token: "dummy-token", user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
