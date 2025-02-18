import express, { Request, Response } from "express";
import { Types } from "mongoose";
import { Notification } from "../models/Notification";
import { authenticate } from "../middleware/auth";

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    _id: string;
  };
}

const router = express.Router();

router.get(
  "/",
  authenticate,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as AuthenticatedRequest).user?._id;
      const notifications = await Notification.find({
        userId: userId,
      })
        .sort({ createdAt: -1 })
        .limit(50);

      res.json(notifications);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  }
);

router.post(
  "/",
  authenticate,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId, content, type } = req.body;
      const notification = new Notification({
        userId: new Types.ObjectId(userId),
        content,
        type,
        status: "unread",
      });

      await notification.save();

      req.io.to(userId.toString()).emit("new-notification", notification);

      res.status(201).json(notification);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  }
);

router.put(
  "/:id/read",
  authenticate,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const notification = await Notification.findByIdAndUpdate(
        req.params.id,
        { status: "read" },
        { new: true }
      );

      if (!notification) {
        res.status(404).json({ message: "Notification not found" });
        return;
      }

      res.json(notification);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  }
);

router.delete(
  "/:id",
  authenticate,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const notification = await Notification.findByIdAndDelete(req.params.id);

      if (!notification) {
        res.status(404).json({ message: "Notification not found" });
        return;
      }

      res.json({ message: "Notification deleted" });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  }
);

export default router;
