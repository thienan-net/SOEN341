import express from 'express';
import { body, validationResult } from 'express-validator';
import Ticket from '../models/Ticket';
import Event from '../models/Event';
import { authenticate, AuthRequest, authorize, requireApproval } from '../middleware/auth';
import QRCode from 'qrcode';

const router = express.Router();

// @route   POST /api/qr/validate
// @desc    Validate a QR code
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
      .populate('user', 'firstName lastName email studentId');

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
        createdAt: ticket.createdAt,
        price: ticket.price
      }
    });
  } catch (error) {
    console.error('Validate QR code error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/qr/scan
// @desc    Scan and use a QR code
// @access  Private (Organizer)
router.post('/scan', authenticate, authorize('organizer'), requireApproval, [
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
      .populate('user', 'firstName lastName email studentId');

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

    // Mark ticket as used
    ticket.status = 'used';
    ticket.usedAt = new Date();
    ticket.usedBy = req.user!._id as any;

    await ticket.save();

    res.json({
      success: true,
      message: 'Ticket scanned and marked as used successfully',
      ticket: {
        id: ticket._id,
        ticketId: ticket.ticketId,
        event: ticket.event,
        user: ticket.user,
        status: ticket.status,
        usedAt: ticket.usedAt
      }
    });
  } catch (error) {
    console.error('Scan QR code error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/qr/events/:eventId/scan-stats
// @desc    Get QR scan statistics for an event
// @access  Private (Organizer)
router.get('/events/:eventId/scan-stats', authenticate, authorize('organizer'), requireApproval, async (req: AuthRequest, res: express.Response) => {
  try {
    const event = await Event.findById(req.params.eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (event.createdBy.toString() !== (req.user!._id as any).toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const [
      totalTickets,
      usedTickets,
      activeTickets,
      scanStats,
      recentScans
    ] = await Promise.all([
      Ticket.countDocuments({ event: req.params.eventId }),
      Ticket.countDocuments({ event: req.params.eventId, status: 'used' }),
      Ticket.countDocuments({ event: req.params.eventId, status: 'active' }),
      Ticket.aggregate([
        { $match: { event: event._id, status: 'used' } },
        {
          $group: {
            _id: {
              year: { $year: '$usedAt' },
              month: { $month: '$usedAt' },
              day: { $dayOfMonth: '$usedAt' },
              hour: { $hour: '$usedAt' }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1, '_id.hour': 1 } }
      ]),
      Ticket.find({ event: req.params.eventId, status: 'used' })
        .populate('user', 'firstName lastName email')
        .populate('usedBy', 'firstName lastName')
        .sort({ usedAt: -1 })
        .limit(20)
    ]);

    res.json({
      event: {
        id: event._id,
        title: event.title,
        date: event.date
      },
      stats: {
        totalTickets,
        usedTickets,
        activeTickets,
        attendanceRate: totalTickets > 0 ? (usedTickets / totalTickets) * 100 : 0
      },
      scanStats,
      recentScans
    });
  } catch (error) {
    console.error('Get scan stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/qr/generate-test
// @desc    Generate a test QR code for development
// @access  Private (Organizer)
router.post('/generate-test', authenticate, authorize('organizer'), requireApproval, [
  body('eventId').isMongoId(),
  body('userId').isMongoId()
], async (req: AuthRequest, res: express.Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { eventId, userId } = req.body;

    // Check if event belongs to organizer
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (event.createdBy.toString() !== (req.user!._id as any).toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Generate test QR data
    const qrData = JSON.stringify({
      eventId,
      userId,
      testMode: true,
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

    res.json({
      qrData,
      qrCode,
      message: 'Test QR code generated successfully'
    });
  } catch (error) {
    console.error('Generate test QR error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;