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

    const newUser = await User.create({ 
      name: name.trim(), // Trim whitespace from name during registration
      email, 
      password, 
      role: "customer" 
    });
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
    // Compare names case-insensitively and trim whitespace
    if (name && user.name.toLowerCase().trim() !== name.toLowerCase().trim()) {
      return res.status(400).json({ error: "Name does not match our records" });
    }

    res.json({ token: "dummy-token", user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update user profile
export const updateProfile = async (req, res) => {
  const { userId } = req.params;
  const { name, phone, address } = req.body;
  
  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    // Update fields if provided
    if (name) user.name = name.trim();
    if (phone) user.phone = phone;
    if (address) {
      user.address = {
        street: address.street || user.address.street,
        city: address.city || user.address.city,
        state: address.state || user.address.state,
        pincode: address.pincode || user.address.pincode,
        country: address.country || user.address.country
      };
    }

    // Check if profile is complete
    const isProfileComplete = Boolean(
      user.name && user.name.trim() &&
      user.phone && user.phone.trim() &&
      user.address.street && user.address.street.trim() &&
      user.address.city && user.address.city.trim() &&
      user.address.state && user.address.state.trim() &&
      user.address.pincode && user.address.pincode.trim()
    );
    
    user.profileComplete = isProfileComplete;

    await user.save();
    res.json({ message: "Profile updated successfully", user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get user profile
export const getUserProfile = async (req, res) => {
  const { userId } = req.params;
  
  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};