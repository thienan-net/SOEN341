import express from 'express';
import { body, validationResult } from 'express-validator';
import User from '../models/User';
import Event from '../models/Event';
import Ticket from '../models/Ticket';
import { authenticate, AuthRequest, authorize, requireApproval } from '../middleware/auth';

const router = express.Router();

// @route   GET /api/users/:id
// @desc    Get user by ID
// @access  Public
router.get('/:id', authenticate, async (req: AuthRequest, res: express.Response) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('organization', 'name logo');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/users/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', authenticate, async (req: AuthRequest, res: express.Response) => {
  try {
    const user = await User.findById(req.user!._id)
      .select('-password')
      .populate('organization', 'name logo');

    res.json(user);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', authenticate, [
  body('firstName').optional().trim().notEmpty(),
  body('lastName').optional().trim().notEmpty(),
  body('phoneNumber').optional().trim(),
  body('profilePicture').optional().isURL()
], async (req: AuthRequest, res: express.Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const allowedUpdates = ['firstName', 'lastName', 'phoneNumber', 'profilePicture'];
    const updates = Object.keys(req.body).filter(key => allowedUpdates.includes(key));
    
    const updateData: any = {};
    updates.forEach(key => {
      updateData[key] = req.body[key];
    });

    const user = await User.findByIdAndUpdate(
      req.user!._id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password').populate('organization', 'name logo');

    res.json(user);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/users/organizer/dashboard
// @desc    Get organizer dashboard
// @access  Private (Organizer)
router.get(
  '/organizer/dashboard',
  authenticate,
  authorize('organizer'),
  requireApproval,
  async (req: AuthRequest, res: express.Response) => {
    try {
      // Fetch all organizer event IDs once
      const eventIds = await Event.find({
        createdBy: req.user!._id
      }).distinct('_id');

      const ticketCountsAgg = await Ticket.aggregate([
        { $match: { event: { $in: eventIds } } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);

      const activeTickets =
        (ticketCountsAgg.find(t => t._id === 'active')?.count || 0) +
        (ticketCountsAgg.find(t => t._id === 'used')?.count || 0);

      const cancelledTickets =
        ticketCountsAgg.find(t => t._id === 'cancelled')?.count || 0;
      // Cancelled ticket analytics by returnReason
      const cancelledAnalytics = await Ticket.aggregate([
          {
            $match: {
              event: { $in: eventIds },
              status: 'cancelled'
            }
          },
          {
            $group: {
              _id: '$returnReason',
              count: { $sum: 1 }
            }
          },
          {
            $project: {
              _id: 0,
              reason: '$_id',
              count: 1
            }
          }
      ]);
      const [
        totalEvents,
        publishedEvents,
        totalTickets,
        recentEvents,
        upcomingEvents
      ] = await Promise.all([
        Event.countDocuments({ createdBy: req.user!._id }),
        Event.countDocuments({
          createdBy: req.user!._id,
          status: 'published',
          isApproved: true
        }),
        Ticket.countDocuments({
          event: { $in: eventIds }
        }),
        Event.find({ createdBy: req.user!._id })
          .populate('organization', 'name')
          .sort({ createdAt: -1 })
          .limit(5)
          .lean(),
        Event.find({
          createdBy: req.user!._id,
          status: 'published',
          isApproved: true,
          date: { $gte: new Date() }
        })
          .populate('organization', 'name')
          .sort({ date: 1 })
          .limit(5)
      ]);

      const eventStats = await Event.aggregate([
        { $match: { createdBy: req.user!._id } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);

      const monthlyTickets = await Ticket.aggregate([
        {
          $lookup: {
            from: 'events',
            localField: 'event',
            foreignField: '_id',
            as: 'event'
          }
        },
        { $unwind: '$event' },
        { $match: { 'event.createdBy': req.user!._id } },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' }
            },
            ticketCount: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
        { $limit: 12 }
      ]);

      // Add ticket counts to recent events
      const recentEventsWithTickets = await Promise.all(
        recentEvents.map(async (event: any) => {
          const ticketCount = await Ticket.countDocuments({ 
            event: event._id, 
            status: { $in: ['active', 'used'] }
          });
          return {
            ...event,
            ticketsIssued: ticketCount,
            remainingCapacity: event.capacity - ticketCount
          };
        })
      );
      const returnedTickets = await Ticket.find({
        event: { $in: eventIds },
        status: 'cancelled',
        returnReason: { $exists: true, $ne: null }
      })
      .populate('event', 'title')
      .populate('user', 'name email')
      .lean();
      res.json({
        stats: {
          totalEvents,
          publishedEvents,
          totalTickets,
          pendingEvents: totalEvents - publishedEvents
        },
        ticketCounts: {
          active: activeTickets,
          cancelled: cancelledTickets
        },
        returnedTickets,
        cancelledTicketsAnalytics: cancelledAnalytics, 
        eventStatusBreakdown: eventStats,
        recentEvents: recentEventsWithTickets,
        upcomingEvents,
        monthlyTickets
      });
    } catch (error) {
      console.error('Organizer dashboard error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);


// @route   GET /api/users/organizer/events
// @desc    Get organizer's events
// @access  Private (Organizer)
router.get('/organizer/events', authenticate, authorize('organizer'), requireApproval, async (req: AuthRequest, res: express.Response) => {
  try {
    const events = await Event.find({ createdBy: req.user!._id })
      .populate('organization', 'name logo')
      .sort({ createdAt: -1 });

    // Get ticket counts for each event
    const eventsWithTickets = await Promise.all(
      events.map(async (event) => {
        const ticketCount = await Ticket.countDocuments({ event: event._id, status: 'active' });
        const usedTickets = await Ticket.countDocuments({ event: event._id, status: 'used' });
        
        return {
          ...event.toObject(),
          ticketsIssued: ticketCount,
          ticketsUsed: usedTickets,
          remainingCapacity: event.capacity - ticketCount
        };
      })
    );

    res.json(eventsWithTickets);
  } catch (error) {
    console.error('Get organizer events error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/users/organizer/events/:id/analytics
// @desc    Get event analytics
// @access  Private (Organizer - owner only)
router.get('/organizer/events/:id/analytics', authenticate, authorize('organizer'), requireApproval, async (req: AuthRequest, res: express.Response) => {
  try {
    const event = await Event.findById(req.params.id);
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
      cancelledTickets,
      ticketsByDay,
      ticketsByHour,
      revenueStats,
      attendeeDemographics
    ] = await Promise.all([
      Ticket.countDocuments({ event: req.params.id }),
      Ticket.countDocuments({ event: req.params.id, status: 'used' }),
      Ticket.countDocuments({ event: req.params.id, status: 'active' }),
      Ticket.countDocuments({ event: req.params.id, status: 'cancelled' }),
      Ticket.aggregate([
        { $match: { event: event._id } },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
              day: { $dayOfMonth: '$createdAt' }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
      ]),
      Ticket.aggregate([
        { $match: { event: event._id } },
        {
          $group: {
            _id: { $hour: '$createdAt' },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id': 1 } }
      ]),
      Ticket.aggregate([
        { $match: { event: event._id, price: { $gt: 0 } } },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$price' },
            averagePrice: { $avg: '$price' },
            maxPrice: { $max: '$price' },
            minPrice: { $min: '$price' }
          }
        }
      ]),
      Ticket.aggregate([
        { $match: { event: event._id } },
        {
          $lookup: {
            from: 'users',
            localField: 'user',
            foreignField: '_id',
            as: 'user'
          }
        },
        { $unwind: '$user' },
        {
          $group: {
            _id: '$user.role',
            count: { $sum: 1 }
          }
        }
      ])
    ]);

    res.json({
      event: {
        id: event._id,
        title: event.title,
        date: event.date,
        capacity: event.capacity,
        ticketType: event.ticketType,
        ticketPrice: event.ticketPrice
      },
      ticketStats: {
        totalTickets,
        usedTickets,
        activeTickets,
        cancelledTickets,
        attendanceRate: totalTickets > 0 ? (usedTickets / totalTickets) * 100 : 0,
        capacityUtilization: (totalTickets / event.capacity) * 100
      },
      revenue: revenueStats[0] || {
        totalRevenue: 0,
        averagePrice: 0,
        maxPrice: 0,
        minPrice: 0
      },
      charts: {
        ticketsByDay,
        ticketsByHour,
        attendeeDemographics
      }
    });
  } catch (error) {
    console.error('Get event analytics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/users/organizer/events/:id/attendees
// @desc    Get event attendees
// @access  Private (Organizer - owner only)
router.get('/organizer/events/:id/attendees', authenticate, authorize('organizer'), requireApproval, async (req: AuthRequest, res: express.Response) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (event.createdBy.toString() !== (req.user!._id as any).toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const tickets = await Ticket.find({ event: req.params.id })
      .populate('user', 'firstName lastName email studentId phoneNumber')
      .sort({ createdAt: -1 });

    res.json({
      event: {
        id: event._id,
        title: event.title,
        date: event.date
      },
      attendees: tickets.map(ticket => ({
        ticketId: ticket.ticketId,
        user: ticket.user,
        status: ticket.status,
        createdAt: ticket.createdAt,
        usedAt: ticket.usedAt
      })),
      totalAttendees: tickets.length
    });
  } catch (error) {
    console.error('Get event attendees error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;