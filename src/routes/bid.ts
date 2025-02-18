import express, { Request, Response } from "express";
import { Document, Types } from "mongoose";
import { Bid } from "../models/Bid.js";
import { Auction, IAuction } from "../models/Auction.js";
import { authenticate } from "../middleware/auth.js";
import { body, validationResult } from "express-validator";

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
  };
}

type AuctionDocument = Document<Types.ObjectId> & IAuction;

const router = express.Router();

router.post(
  "/",
  authenticate,
  [body("auctionId").isMongoId(), body("amount").isFloat({ min: 0 })],
  async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    try {
      const userId = (req as AuthenticatedRequest).user?.userId;
      const auction = (await Auction.findById(
        req.body.auctionId
      )) as AuctionDocument;

      if (!auction || auction.status !== "active") {
        res.status(400).json({ message: "Auction not available for bidding" });
        return;
      }

      if (auction.creator.toString() === userId) {
        res.status(403).json({ message: "Cannot bid on your own auction" });
        return;
      }

      if (req.body.amount <= auction.currentPrice) {
        res
          .status(400)
          .json({ message: "Bid must be higher than current price" });
        return;
      }

      const bid = new Bid({
        amount: req.body.amount,
        auction: auction._id,
        bidder: new Types.ObjectId(userId),
        history: [
          {
            amount: req.body.amount,
            modifiedAt: new Date(),
          },
        ],
      });

      await bid.save();

      auction.currentPrice = req.body.amount;
      await auction.save();

      const io = req.app.get("io");
      io.to(auction._id.toString()).emit("new_bid", bid);

      res.status(201).json(bid);
    } catch (err) {
      res.status(400).json({ message: "Bid placement failed" });
    }
  }
);

router.get(
  "/auction/:auctionId",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const bids = await Bid.find({
        auction: new Types.ObjectId(req.params.auctionId),
      })
        .sort("-amount")
        .populate("bidder", "username")
        .lean();

      res.json(bids);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch bids" });
    }
  }
);

export default router;
