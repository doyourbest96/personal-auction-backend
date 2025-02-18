import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { User } from "../models/User.js";

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
  };
}

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      res.status(401).json({ message: "No token provided" });
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
    };
    (req as AuthenticatedRequest).user = { userId: decoded.userId };
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid token" });
    return;
  }
};

export const isAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = (req as AuthenticatedRequest).user?.userId;
    const user = await User.findById(userId);

    if (!user || user.role !== "admin") {
      res.status(403).json({ message: "Admin access required" });
      return;
    }

    next();
  } catch (err) {
    res.status(500).json({ message: "Authorization failed" });
    return;
  }
};
