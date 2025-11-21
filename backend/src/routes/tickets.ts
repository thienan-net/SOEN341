import express from "express";
import { body, validationResult } from "express-validator";
import Ticket from "../models/Ticket";
import Event from "../models/Event";
import { authenticate, authorize, requireApproval, AuthRequest } from "../middleware/auth";
import QRCode from "qrcode";
import { v4 as uuidv4 } from "uuid";

const router = express.Router();

router.post(
    "/claim",
    authenticate,
    authorize("student"),
    [body("eventId").isMongoId()],
    async (req: AuthRequest, res: express.Response) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({ errors: errors.array() });
        }

        const { eventId } = req.body;
        const event = await Event.findById(eventId);

        if (!event) return res.status(404).json({ message: "Event not found" });
        if (event.status !== "published" || !event.isApproved)
          return res.status(400).json({ message: "Event is not available for claiming" });

        if (event.date < new Date())
          return res.status(400).json({ message: "Event already passed" });

        const existingTicket = await Ticket.findOne({
          event: eventId,
          user: req.user!._id,
          status: { $in: ["active", "used"] }
        });

        if (existingTicket)
          return res.status(400).json({ message: "You already have a ticket for this event" });

        const activeTickets = await Ticket.countDocuments({
          event: eventId,
          status: "active"
        });

        if (activeTickets >= event.capacity)
          return res.status(400).json({ message: "Event is sold out" });

        const ticketId = uuidv4();

        const qrPayload = JSON.stringify({
          ticketId,
          eventId,
          userId: String(req.user!._id),
          timestamp: new Date().toISOString()
        });

        const qrCodeImage = await QRCode.toDataURL(qrPayload, {
          width: 256,
          margin: 2
        });

        const ticket = await Ticket.create({
          ticketId,
          event: eventId,
          user: req.user!._id,
          qrCode: qrPayload,
          price: event.ticketType === "paid" ? event.ticketPrice : 0
        });

        await ticket.populate([
          { path: "event", select: "title date location startTime endTime organization" },
          { path: "user", select: "firstName lastName email" }
        ]);

        res.status(201).json({
          ticket: {
            ...ticket.toObject(),
            qrCodeImage
          }
        });
      } catch (e) {
        console.error("Claim ticket error:", e);
        res.status(500).json({ message: "Server error" });
      }
    }
);

router.get(
    "/my",
    authenticate,
    authorize("student"),
    async (req: AuthRequest, res: express.Response) => {
      try {
        const tickets = await Ticket.find({ user: req.user!._id })
            .populate({
              path: "event",
              select: "title date startTime endTime location organization imageUrl",
              populate: { path: "organization", select: "name logo" }
            })
            .sort({ createdAt: -1 });

        const result = await Promise.all(
            tickets.map(async (t) => ({
              ...t.toObject(),
              qrCodeImage: await QRCode.toDataURL(t.qrCode, { width: 128 })
            }))
        );

        res.json(result);
      } catch (e) {
        console.error(e);
        res.status(500).json({ message: "Server error" });
      }
    }
);

router.post(
    "/validate",
    authenticate,
    authorize("organizer"),
    requireApproval,
    [body("qrData").isString()],
    async (req: AuthRequest, res: express.Response) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty())
          return res.status(400).json({ errors: errors.array() });

        const { qrData } = req.body;

        let payload: any;
        try {
          payload = JSON.parse(qrData);
        } catch {
          return res.status(400).json({ message: "Invalid QR format" });
        }

        const ticket = await Ticket.findOne({ qrCode: qrData })
            .populate({
              path: "event",
              select: "title date organization",
              populate: { path: "organization", select: "name" }
            })
            .populate("user", "firstName lastName email");

        if (!ticket) return res.status(404).json({ message: "Ticket not found" });

        if (
            (ticket.event as any).organization._id.toString() !==
            req.user!.organization!.toString()
        )
          return res.status(403).json({ message: "Ticket does not belong to your organization" });

        if (ticket.status !== "active")
          return res.status(400).json({
            message: "Ticket is not valid",
            status: ticket.status,
            usedAt: ticket.usedAt
          });

        return res.json({
          valid: true,
          ticket: {
            ticketId: ticket.ticketId,
            status: ticket.status
          }
        });
      } catch (e) {
        console.error(e);
        res.status(500).json({ message: "Server error" });
      }
    }
);
// POST /tickets/:ticketId/use
router.post(
  "/:ticketId/use",
  authenticate,
  authorize("organizer"),
  requireApproval, // ensures organizer is approved
  async (req: AuthRequest, res: express.Response) => {
    try {
      const { ticketId } = req.params;

      const ticket = await Ticket.findOne({ ticketId })
        .populate({
          path: "event",
          select: "title date organization",
          populate: { path: "organization", select: "name" },
        })
        .populate("user", "firstName lastName email");

      if (!ticket) return res.status(404).json({ message: "Ticket not found" });

      const organizerOrgId = req.user!.organization?.toString();
      const ticketOrgId = (ticket.event as any).organization._id.toString();

      if (organizerOrgId !== ticketOrgId) {
        return res.status(403).json({ message: "Ticket does not belong to your organization" });
      }

      if (ticket.status !== "active") {
        return res.status(400).json({
          message: "Ticket cannot be used",
          status: ticket.status,
          usedAt: ticket.usedAt,
        });
      }

      // Mark ticket as used
      ticket.status = "used";
      ticket.usedAt = new Date();

      await ticket.save();

      res.json({
        message: "Ticket marked as used",
        ticket: {
          ticketId: ticket.ticketId,
          status: ticket.status,
          usedAt: ticket.usedAt,
        },
      });
    } catch (error) {
      console.error("Use ticket error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

router.post(
    "/:id/return",
    authenticate,
    authorize("student"),
    async (req: AuthRequest, res: express.Response) => {
      try {
        const { reason, comment } = req.body;
        const ticket = await Ticket.findOne({ ticketId: req.params.id });

        if (!ticket)
          return res.status(404).json({ message: "Ticket not found" });

        if (String(ticket.user) !== String(req.user!._id))
          return res.status(403).json({ message: "Access denied" });

        if (ticket.status !== "active")
          return res.status(400).json({ message: "Ticket is not active" });
        
        const event = await Event.findById(ticket.event._id);
        if(!event) {
          return res.status(404).json({message: "Event not found"})
        }
        ticket.status = "cancelled";
        ticket.returnReason = reason;
        ticket.returnComment = comment;
        event.registrations = Math.max((event.registrations || 0) - 1, 0);

        await Promise.all([ticket.save(), event.save()])

        return res.json({ message: "Ticket returned successfully" });
      } catch (error) {
        console.error("Return ticket error:", error);
        res.status(500).json({ message: "Server error" });
      }
    }
);

// GET /ticket-details/:ticketId
router.get(
  "/ticket-details/:ticketId",
  authenticate,
  authorize("student", "organizer"), // adjust roles if needed
  async (req: AuthRequest, res: express.Response) => {
    try {
      const { ticketId } = req.params;

      const ticket = await Ticket.findOne({ ticketId })
        .populate({
          path: "event",
          select: "title date startTime endTime location organization imageUrl",
          populate: { path: "organization", select: "name logo" },
        })
        .populate("user", "firstName lastName email");

      if (!ticket)
        return res.status(404).json({ message: "Ticket not found" });

      // Optional: generate QR code image if needed
      const qrCodeImage = await QRCode.toDataURL(ticket.qrCode, { width: 128 });

      res.json({
        ...ticket.toObject(),
        qrCodeImage,
      });
    } catch (error) {
      console.error("Get ticket details error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

export default router;