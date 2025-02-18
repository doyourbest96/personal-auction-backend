import express, { Request, Response } from "express";
import { body, validationResult } from "express-validator";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { authenticate, isAdmin } from "../middleware/auth.js";
import { User } from "../models/User.js";
import { AuditLog } from "../models/AuditLog.js";

const router = express.Router();
const saltRounds = 10;

router.post(
  "/signup",
  body("username").isLength({ min: 3 }),
  body("email").isEmail(),
  body("password").isLength({ min: 6 }),
  async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    try {
      const existingUser = await User.findOne({ email: req.body.email });
      if (existingUser) {
        res.status(409).json({ message: "Email already registered" });
        return;
      }

      const hashedPassword = await bcrypt.hash(req.body.password, saltRounds);
      const user = new User({
        username: req.body.username,
        email: req.body.email,
        password: hashedPassword,
      });

      await user.save();

      await AuditLog.create({
        action: "user_signup",
        userId: user._id,
      });

      const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET!, {
        expiresIn: "1h",
      });

      res.status(201).json({ token: "Bearer " + token });
    } catch (err) {
      res.status(400).json({ message: "Registration failed" });
    }
  }
);

router.post("/login", async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findOne({ email: req.body.email }).select(
      "+password"
    );

    if (!user || !(await bcrypt.compare(req.body.password, user.password))) {
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET!, {
      expiresIn: "1h",
    });

    res.json({ token: "Bearer " + token });
  } catch (err) {
    res.status(500).json({ message: "Login failed" });
  }
});

export default router;

router.get(
  "/users",
  authenticate,
  isAdmin,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const users = await User.find({}, "-password");

      await AuditLog.create({
        action: "users_list_viewed",
        userId: req.user.userId,
      });

      res.status(200).json(users);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  }
);

router.put(
  "/users/:userId",
  authenticate,
  isAdmin,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const updates = {
        username: req.body.username,
        email: req.body.email,
        role: req.body.role,
      };

      const user = await User.findByIdAndUpdate(
        req.params.userId,
        { $set: updates },
        { new: true }
      );

      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }

      await AuditLog.create({
        action: "user_update",
        userId: req.user.userId,
        targetUserId: req.params.userId,
      });

      res.json(user);
    } catch (err) {
      res.status(400).json({ message: "Update failed" });
    }
  }
);

// Delete user endpoint
router.delete(
  "/users/:userId",
  isAdmin,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const user = await User.findByIdAndDelete(req.params.userId);

      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }

      await AuditLog.create({
        action: "user_delete",
        userId: req.user.userId,
        targetUserId: req.params.userId,
      });

      res.status(200).json({ message: "User deleted successfully" });
    } catch (err) {
      res.status(400).json({ message: "Delete failed" });
    }
  }
);

router.get(
  "/me",
  authenticate,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const user = await User.findById(req.user.userId, "-password");

      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }

      await AuditLog.create({
        action: "profile_viewed",
        userId: req.user.userId,
      });

      res.status(200).json(user);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  }
);
