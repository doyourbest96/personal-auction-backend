import express, { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { User } from "../models/User";
import { AuditLog } from "../models/AuditLog";
import { body, validationResult } from "express-validator";
import bcrypt from "bcryptjs";

interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
  };
}

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

      res.status(201).json({ token });
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

    res.json({ token });
  } catch (err) {
    res.status(500).json({ message: "Login failed" });
  }
});

export default router;
