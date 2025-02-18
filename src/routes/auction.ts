import express, { Request, Response } from "express";
import { Document, FilterQuery, Types } from "mongoose";
import { Auction, IAuction } from "../models/Auction";
import { User } from "../models/User";
import { authenticate } from "../middleware/auth";
import { body, param, validationResult } from "express-validator";

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
  };
}

const router = express.Router();

router.get(
  "/",
  [
    param("status").optional().isIn(["active", "closed"]),
    param("category").optional().isString(),
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { status, category } = req.query;
      const filter: FilterQuery<IAuction> = {};

      if (status) filter.status = status as "active" | "closed";
      if (category) filter.category = category as string;

      const auctions = await Auction.find(filter)
        .populate("creator", "username")
        .sort({ endTime: 1 })
        .lean();

      res.json(auctions);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch auctions" });
    }
  }
);


router.post(
  "/",
  authenticate,
  [
    body("title").isLength({ min: 5 }),
    body("description").isLength({ min: 10 }),
    body("startPrice").isFloat({ min: 0 }),
    body("endTime").isISO8601(),
    body("category").isString(),
  ],
  async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    try {
      const userId = (req as AuthenticatedRequest).user?.userId;
      const auction = new Auction({
        ...req.body,
        creator: new Types.ObjectId(userId),
        currentPrice: req.body.startPrice,
        startTime: new Date(),
      });

      await auction.save();

      await User.findByIdAndUpdate(userId, {
        $push: { createdAuctions: auction._id },
      });

      res.status(201).json(auction);
    } catch (err) {
      res.status(400).json({ message: "Auction creation failed" });
    }
  }
);

router.get("/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const auction = await Auction.findById(req.params.id)
      .populate("creator", "username email")
      .populate({
        path: "bids",
        populate: { path: "bidder", select: "username" },
      });

    if (!auction) {
      res.status(404).json({ message: "Auction not found" });
      return;
    }

    res.json(auction);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch auction" });
  }
});

router.post(
  "/:id/close",
  authenticate,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as AuthenticatedRequest).user?.userId;
      const auction = (await Auction.findById(
        req.params.id
      )) as Document<Types.ObjectId> & IAuction;

      if (!auction) {
        res.status(404).json({ message: "Auction not found" });
        return;
      }

      if (auction.creator.toString() !== userId) {
        res.status(403).json({ message: "Not authorized" });
        return;
      }

      auction.status = "closed";
      auction.endTime = new Date();
      await auction.save();

      const io = req.app.get("io");
      io.to(auction._id.toString()).emit("auction_closed", auction);

      res.json(auction);
    } catch (err) {
      res.status(500).json({ message: "Failed to close auction" });
    }
  }
);

export default router;
