import express from 'express';
import { body, validationResult, query } from 'express-validator';
import Event from '../models/Event';
import Ticket from '../models/Ticket';
import { authenticate, AuthRequest, authorize, requireApproval } from '../middleware/auth';


const router = express.Router();

// @route   GET /api/events
// @desc    Get all published and approved events with filtering
// @access  Public
router.get('/', [
  query('category').optional().isIn(['academic', 'social', 'sports', 'cultural', 'career', 'volunteer', 'other']),
  query('dateStart').optional().isISO8601(),
  query('dateEnd').optional().isISO8601(),
  query('search').optional().isString(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 })
], async (req: express.Request, res: express.Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { category, dateStart, dateEnd, search, page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    // Build filter object
    const filter: any = {};

    // --- Date range filter ---
    if (dateStart || dateEnd) {
      const startDate = dateStart ? new Date(dateStart as string) : new Date();
      startDate.setHours(0, 0, 0, 0); 

      let endDate: Date | undefined;
      if (dateEnd) {
        endDate = new Date(dateEnd as string);
        endDate.setHours(23, 59, 59, 999); 
      }

      filter.date = endDate ? { $gte: startDate, $lte: endDate } : { $gte: startDate };
    } else {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      filter.date = { $gte: today };
    }

    // --- Category filter ---
    if (category) filter.category = category;

    // --- Search filter ---
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } }
      ];
    }

    console.log("events---", await Event.find()); // all events
    const events = await Event.find(filter)
      .populate('organization', 'name logo')
      .populate('createdBy', 'firstName lastName')
      .sort({ date: 1 })
      .skip(skip)
      .limit(Number(limit));
    console.log("events filter----", events);

    const total = await Event.countDocuments(filter);

    // Get ticket counts for each event
    const eventsWithTickets = await Promise.all(
      events.map(async (event) => {
        const ticketCount = await Ticket.countDocuments({ event: event._id, status: 'active' });
        return {
          ...event.toObject(),
          ticketsIssued: ticketCount,
          remainingCapacity: event.capacity - ticketCount
        };
      })
    );

    res.json({
      events: eventsWithTickets,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(total / Number(limit)),
        totalEvents: total,
        hasNext: skip + events.length < total,
        hasPrev: Number(page) > 1
      }
    });
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


// @route   GET /api/events/:id
// @desc    Get single event by ID
// @access  Public
router.get('/:id', async (req: express.Request, res: express.Response) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('organization', 'name logo website contactEmail')
      .populate('createdBy', 'firstName lastName');

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const ticketCount = await Ticket.countDocuments({ event: event._id, status: 'active' });

    res.json({
      ...event.toObject(),
      ticketsIssued: ticketCount,
      remainingCapacity: event.capacity - ticketCount
    });
  } catch (error) {
    console.error('Get event error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/events
// @desc    Create a new event
// @access  Private (Organizer)
router.post('/', authenticate, authorize('organizer'), requireApproval, [
  body('title').trim().notEmpty(),
  body('description').trim().notEmpty(),
  body('date').isISO8601(),
  body('startTime').isString(),
  body('endTime').isString(),
  body('location').trim().notEmpty(),
  body('category').isIn(['academic', 'social', 'sports', 'cultural', 'career', 'volunteer', 'other']),
  body('ticketType').isIn(['free', 'paid']),
  body('capacity').isInt({ min: 1 }),
  body('ticketPrice').optional().isFloat({ min: 0 }),
  body('tags').optional().isArray(),
  body('requirements').optional().isString(),
  body('contactInfo').optional().isString()
], async (req: AuthRequest, res: express.Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const eventData = {
      ...req.body,
      organization: req.user!.organization,
      createdBy: req.user!._id,
      status: 'draft'
    };

    const event = new Event(eventData);
    await event.save();

    res.status(201).json(event);
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/events/:id
// @desc    Update an event
// @access  Private (Organizer - owner only)
router.put('/:id', authenticate, authorize('organizer'), requireApproval, [
  body('title').optional().trim().notEmpty(),
  body('description').optional().trim().notEmpty(),
  body('date').optional().isISO8601(),
  body('startTime').optional().isString(),
  body('endTime').optional().isString(),
  body('location').optional().trim().notEmpty(),
  body('category').optional().isIn(['academic', 'social', 'sports', 'cultural', 'career', 'volunteer', 'other']),
  body('ticketType').optional().isIn(['free', 'paid']),
  body('capacity').optional().isInt({ min: 1 }),
  body('ticketPrice').optional().isFloat({ min: 0 }),
  body('tags').optional().isArray(),
  body('requirements').optional().isString(),
  body('contactInfo').optional().isString(),
  body('status').optional().isIn(['draft', 'published', 'cancelled'])
], async (req: AuthRequest, res: express.Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (event.createdBy.toString() !== (req.user!._id as any).toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    Object.assign(event, req.body);
    await event.save();

    res.json(event);
  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/events/:id
// @desc    Delete an event
// @access  Private (Organizer - owner only)
router.delete('/:id', authenticate, authorize('organizer'), requireApproval, async (req: AuthRequest, res: express.Response) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (event.createdBy.toString() !== (req.user!._id as any).toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await Event.findByIdAndDelete(req.params.id);
    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


export default router;
