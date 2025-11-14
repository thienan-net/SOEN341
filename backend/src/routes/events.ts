import express from 'express';
import { body, validationResult, query } from 'express-validator';
import Event from '../models/Event';
import Ticket from '../models/Ticket';
import { authenticate, AuthRequest, authorize, requireApproval } from '../middleware/auth';
import SavedEvent from '../models/SavedEvent';


const router = express.Router();
// @route   GET /api/events/organizer
// @desc    Get all published and approved events for organization
// @access  Private
router.get("/organizer", [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 })
], authenticate, authorize('organizer'), requireApproval, async (req: AuthRequest, res: express.Response) => {
  try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      const { page = 1, limit = 10 } = req.query;
      const skip = (Number(page) - 1) * Number(limit);
      const events = await Event.find({organization: req.user?.organization})
        .populate('organization', 'name logo')
        .populate('createdBy', 'firstName lastName')
        .sort({ date: 1 })
        .skip(skip)
        .limit(Number(limit));
      const total = await Event.countDocuments();
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
  }
  catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({ message: 'Server error' });
  }
})
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
      // Parse input date strings as local dates
      const startDate = dateStart ? new Date(dateStart as string) : new Date();
      startDate.setHours(0, 0, 0, 0); // start of day local
      const startUTC = new Date(startDate.getTime() - startDate.getTimezoneOffset() * 60000);

      let endUTC: Date | undefined;
      if (dateEnd) {
        const endDate = new Date(dateEnd as string);
        endDate.setHours(23, 59, 59, 999); // end of day local
        endUTC = new Date(endDate.getTime() - endDate.getTimezoneOffset() * 60000);
      }

      filter.date = endUTC ? { $gte: startUTC, $lte: endUTC } : { $gte: startUTC };
    } else {
      // Default: today onwards
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayUTC = new Date(today.getTime() - today.getTimezoneOffset() * 60000);
      filter.date = { $gte: todayUTC };
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

    const events = await Event.find(filter)
      .populate('organization', 'name logo')
      .populate('createdBy', 'firstName lastName')
      .sort({ date: 1 })
      .skip(skip)
      .limit(Number(limit));

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

// @route   GET /api/events/attendees/:id
// @desc    Get full attendee list (name, email, ticket info) for an event
// @access  Private (Organizer - owner only)
router.get(
  '/attendees/:id',
  authenticate,
  authorize('organizer'),
  requireApproval,
  async (req: AuthRequest, res: express.Response) => {
    try {
      const event = await Event.findById(req.params.id);
      if (!event) {
        return res.status(404).json({ message: 'Event not found' });
      }

      // Only event organizer can access attendees
      if (event.organization.toString() !== (req.user!.organization as any).toString()) {
        return res.status(403).json({ message: 'Access denied' });
      }

      // Fetch tickets linked to the event and populate user info
      const tickets = await Ticket.find({ event: event._id, status: 'active' })
        .populate({ path: 'user', select: 'firstName lastName email' });

      const attendees = tickets
        .filter(t => t.user) // skip tickets missing user reference
        .map(t => ({
          ticketId: t.ticketId,
          name: `${(t.user as any).firstName} ${(t.user as any).lastName}`.trim(),
          email: (t.user as any).email,
          status: t.status,
          purchasedAt: t.createdAt,
        }));

      res.json({
        eventId: event._id,
        eventTitle: event.title,
        totalAttendees: attendees.length,
        attendees,
      });
    } catch (error) {
      console.error('Get attendees error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

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

// @route   POST /api/events/:id/save
// @desc    Save event to user's calendar
// @access  Private (Student)
router.post('/:id/save', authenticate, authorize('student'), async (req: AuthRequest, res: express.Response) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const existingSavedEvent = await SavedEvent.findOne({
      user: req.user!._id,
      event: req.params.id
    });

    if (existingSavedEvent) {
      return res.status(400).json({ message: 'Event already saved' });
    }

    const savedEvent = new SavedEvent({
      user: req.user!._id,
      event: req.params.id
    });

    await savedEvent.save();
    res.json({ message: 'Event saved successfully' });
  } catch (error) {
    console.error('Save event error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/events/:id/save
// @desc    Remove event from user's calendar
// @access  Private (Student)
router.delete('/:id/save', authenticate, authorize('student'), async (req: AuthRequest, res: express.Response) => {
  try {
    await SavedEvent.findOneAndDelete({
      user: req.user!._id,
      event: req.params.id
    });

    res.json({ message: 'Event removed from calendar' });
  } catch (error) {
    console.error('Remove saved event error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/events/saved/my
// @desc    Get user's saved events
// @access  Private (Student)
router.get('/saved/my', authenticate, authorize('student'), async (req: AuthRequest, res: express.Response) => {
  try {
    const userId = req.user!._id;

    const savedEvents = await SavedEvent.find({ user: userId })
      .populate({
        path: 'event',
        populate: { path: 'organization', select: 'name logo' },
      })
      .sort({ createdAt: -1 });

    const eventsWithDetails = await Promise.all(
      savedEvents.map(async (saved) => {
        const eventDoc = saved.event as any; // cast to populated Event
        if (!eventDoc) return null;

        const ticketsIssued = await Ticket.countDocuments({
          event: eventDoc._id,
          status: 'active',
        });

        const remainingCapacity = eventDoc.capacity
          ? eventDoc.capacity - ticketsIssued
          : null;

        return {
          ...eventDoc.toObject(), // works because we casted it
          ticketsIssued,
          remainingCapacity,
        };
      })
    );

    res.json(eventsWithDetails.filter(Boolean));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});


export default router;
