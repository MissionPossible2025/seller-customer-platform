import express from "express";
import { loginUser, registerUser, updateProfile, getUserProfile } from "../controllers/userController.js";

const router = express.Router();

// Register new user
router.post("/", registerUser);       // POST /api/users

// Login user
router.post("/login", loginUser);     // POST /api/users/login

// Get user profile
router.get("/:userId", getUserProfile);  // GET /api/users/:userId

// Update user profile
router.put("/:userId", updateProfile);   // PUT /api/users/:userId

export default router;
