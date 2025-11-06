import express from 'express';
import { body, validationResult } from 'express-validator';
import Ticket from '../models/Ticket';
import Event from '../models/Event';
import { authenticate, AuthRequest, authorize, requireApproval } from '../middleware/auth';
import QRCode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// @route   POST /api/tickets/claim
// @desc    Claim a ticket for an event
// @access  Private (Student)
router.post('/claim', authenticate, authorize('student'), requireApproval, [
  body('eventId').isMongoId(),
  body('paymentMethod').optional().isString() // For future payment integration
], async (req: AuthRequest, res: express.Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { eventId, paymentMethod } = req.body;

    // Check if event exists and is published
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (event.status !== 'published' || !event.isApproved) {
      return res.status(400).json({ message: 'Event is not available for ticket claiming' });
    }

    // Check if event date is in the future
    if (event.date < new Date()) {
      return res.status(400).json({ message: 'Event has already passed' });
    }

    // Check if user already has a ticket for this event
    const existingTicket = await Ticket.findOne({
      event: eventId,
      user: req.user!._id,
      status: { $in: ['active', 'used'] }
    });

    if (existingTicket) {
      return res.status(400).json({ message: 'You already have a ticket for this event' });
    }

    // Check capacity
    const ticketCount = await Ticket.countDocuments({ event: eventId, status: 'active' });
    if (ticketCount >= event.capacity) {
      return res.status(400).json({ message: 'Event is sold out' });
    }

    // Generate unique ticket ID and QR code
    const ticketId = uuidv4();
    const qrData = JSON.stringify({
      ticketId,
      eventId,
      userId: (req.user!._id as any).toString(),
      timestamp: new Date().toISOString()
    });

    const qrCode = await QRCode.toDataURL(qrData, {
      width: 256,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    // Create ticket
    const ticket = new Ticket({
      ticketId,
      event: eventId,
      user: req.user!._id,
      qrCode: qrData,
      price: event.ticketType === 'paid' ? event.ticketPrice : 0
    });

    await ticket.save();

    // Populate event details for response
    await ticket.populate([
      { path: 'event', select: 'title date startTime endTime location organization' },
      { path: 'user', select: 'firstName lastName email' }
    ]);

    res.status(201).json({
      ticket: {
        id: ticket._id,
        ticketId: ticket.ticketId,
        event: ticket.event,
        user: ticket.user,
        qrCode,
        status: ticket.status,
        price: ticket.price,
        createdAt: ticket.createdAt
      }
    });
  } catch (error) {
    console.error('Claim ticket error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/tickets/my
// @desc    Get user's tickets
// @access  Private (Student)
router.get('/my', authenticate, authorize('student'), requireApproval, async (req: AuthRequest, res: express.Response) => {
  try {
    const tickets = await Ticket.find({ user: req.user!._id })
      .populate({
        path: 'event',
        select: 'title date startTime endTime location imageUrl organization',
        populate: {
          path: 'organization',
          select: 'name logo'
        }
      })
      .sort({ createdAt: -1 });

    // Generate QR codes for display
    const ticketsWithQR = await Promise.all(
      tickets.map(async (ticket) => {
        const qrCode = await QRCode.toDataURL(ticket.qrCode, {
          width: 128,
          margin: 1
        });
        return {
          ...ticket.toObject(),
          ticketId: ticket.ticketId,
          qrCodeImage: qrCode
        };
      })
    );

    res.json(ticketsWithQR);
  } catch (error) {
    console.error('Get tickets error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


// @route   GET /api/tickets/ticket-details/:id
// @desc    Get ticket info (student owner, admin, organizer)
// @access  Private (student own ticket, admin or organizer can access any ticket)
router.get('/ticket-details/:id', authenticate, requireApproval, async (req: AuthRequest, res: express.Response) => {
    try {
      console.log("ticket id", req.params.id);

      // Fetch ticket by UUID (ticketId)
      const ticket = await Ticket.findOne({ ticketId: req.params.id })
        .populate({
          path: 'event',
          select: 'title date startTime endTime location imageUrl organization',
          populate: { path: 'organization', select: 'name logo' },
        })
        .populate('user', 'firstName lastName email');

      if (!ticket) {
        return res.status(404).json({ message: 'Ticket not found' });
      }

      const userRole = req.user!.role;
      const isOwner = ticket.user && ticket.user._id.toString() === (req.user!._id as any).toString();

      // Only restrict students who are not the owner
      if (userRole === 'student' && !isOwner) {
        return res.status(403).json({ message: 'Access denied' });
      }
    // Check if ticket belongs to organizer's organization
      if ((ticket.event as any).organization._id.toString() !== req.user!.organization!.toString()) {
        return res.status(403).json({ message: 'Access denied' });
      }
      // Generate QR code if available
      let qrCodeImage = null;
      if (ticket.qrCode) {
        qrCodeImage = await QRCode.toDataURL(ticket.qrCode, { width: 256, margin: 2 });
      }

      res.json({ ...ticket.toObject(), qrCodeImage });
    } catch (error) {
      console.error('Get ticket error:', error);
      res.status(500).json({ message: 'Server error', error: (error as Error).message });
    }
  }
);


// @route   GET /api/tickets/:id
// @desc    Get single ticket by ID
// @access  Private (Student - owner only)
router.get('/:id', authenticate, authorize('student'), requireApproval, async (req: AuthRequest, res: express.Response) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate({
        path: 'event',
        select: 'title date startTime endTime location imageUrl organization',
        populate: {
          path: 'organization',
          select: 'name logo'
        }
      })
      .populate('user', 'firstName lastName email');

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    if (ticket.user._id.toString() !== (req.user!._id as any).toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const qrCode = await QRCode.toDataURL(ticket.qrCode, {
      width: 256,
      margin: 2
    });

    res.json({
      ...ticket.toObject(),
      qrCodeImage: qrCode
    });
  } catch (error) {
    console.error('Get ticket error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/tickets/validate
// @desc    Validate a ticket using QR code data
// @access  Private (Organizer)
router.post('/validate', authenticate, authorize('organizer'), requireApproval, [
  body('qrData').isString()
], async (req: AuthRequest, res: express.Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { qrData } = req.body;

    // Parse QR code data
    let qrInfo;
    try {
      qrInfo = JSON.parse(qrData);
    } catch (error) {
      return res.status(400).json({ message: 'Invalid QR code format' });
    }

    // Find ticket
    const ticket = await Ticket.findOne({ qrCode: qrData })
      .populate({
        path: 'event',
        select: 'title date startTime endTime location organization',
        populate: {
          path: 'organization',
          select: 'name'
        }
      })
      .populate('user', 'firstName lastName email');

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    // Check if ticket belongs to organizer's organization
    if ((ticket.event as any).organization._id.toString() !== req.user!.organization!.toString()) {
      return res.status(403).json({ message: 'Ticket does not belong to your organization' });
    }

    // Check if ticket is still valid
    if (ticket.status !== 'active') {
      return res.status(400).json({ 
        message: 'Ticket is not valid',
        status: ticket.status,
        usedAt: ticket.usedAt
      });
    }

    // Check if event date has passed
    if ((ticket.event as any).date < new Date()) {
      return res.status(400).json({ message: 'Event has already passed' });
    }

    res.json({
      valid: true,
      ticket: {
        id: ticket._id,
        ticketId: ticket.ticketId,
        event: ticket.event,
        user: ticket.user,
        status: ticket.status,
        createdAt: ticket.createdAt
      }
    });
  } catch (error) {
    console.error('Validate ticket error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/tickets/:id/use
// @desc    Mark ticket as used
// @access  Private (Organizer)
router.post('/:id/use', authenticate, authorize('organizer', 'admin'), requireApproval, async (req: AuthRequest, res: express.Response) => {
  try {
    const ticket = await Ticket.findOne({ticketId: req.params.id})
      .populate('event', 'organization');

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    // Check if ticket belongs to organizer's organization
    if ((ticket.event as any).organization._id.toString() !== req.user!.organization!.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (ticket.status !== 'active') {
      return res.status(400).json({ message: 'Ticket is not active' });
    }

    ticket.status = 'used';
    ticket.usedAt = new Date();
    ticket.usedBy = req.user!._id as any;

    await ticket.save();

    res.json({ message: 'Ticket marked as used successfully' });
  } catch (error) {
    console.error('Use ticket error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;