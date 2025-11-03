import express from 'express';
import { body, validationResult, query } from 'express-validator';
import User from '../models/User';
import Event from '../models/Event';
import Organization from '../models/Organization';
import Ticket from '../models/Ticket';
import SavedEvent from '../models/SavedEvent';
import { authenticate, AuthRequest, authorize } from '../middleware/auth';
import * as createCsvWriter from 'csv-writer';

const router = express.Router();

// @route   GET /api/admin/dashboard
// @desc    Get admin dashboard statistics
// @access  Private (Admin)
router.get('/dashboard', authenticate, authorize('admin'), async (req: AuthRequest, res: express.Response) => {
  try {
    const [
      totalUsers,
      totalEvents,
      totalTickets,
      pendingApprovals,
      recentEvents,
      topOrganizations,
      userRoleStats,
      eventStatusStats,
      monthlyStats,
      recentTickets,
      totalRevenue
    ] = await Promise.all([
      User.countDocuments(),
      Event.countDocuments(),
      Ticket.countDocuments(),
      User.countDocuments({ isApproved: false }),
      Event.find({ status: 'published' })
        .populate('organization', 'name logo')
        .populate('createdBy', 'firstName lastName')
        .sort({ createdAt: -1 })
        .limit(5),
      Event.aggregate([
        { $match: { status: 'published' } },
        { $group: { _id: '$organization', eventCount: { $sum: 1 } } },
        { $lookup: { from: 'organizations', localField: '_id', foreignField: '_id', as: 'organization' } },
        { $unwind: '$organization' },
        { $sort: { eventCount: -1 } },
        { $limit: 5 },
        { $project: { organization: '$organization.name', eventCount: 1 } }
      ]),
      User.aggregate([
        { $group: { _id: '$role', count: { $sum: 1 } } }
      ]),
      Event.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      Event.aggregate([
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' }
            },
            eventCount: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
        { $limit: 12 }
      ]),
      Ticket.find({ status: 'active' })
        .populate('event', 'title date')
        .populate('user', 'firstName lastName')
        .sort({ createdAt: -1 })
        .limit(10),
      Ticket.aggregate([
        { $match: { price: { $gt: 0 } } },
        { $group: { _id: null, total: { $sum: '$price' } } }
      ])
    ]);

    res.json({
      stats: {
        totalUsers,
        totalEvents,
        totalTickets,
        pendingApprovals,
        totalRevenue: totalRevenue[0]?.total || 0
      },
      charts: {
        userRoleStats,
        eventStatusStats,
        monthlyStats
      },
      recentEvents,
      topOrganizations,
      recentTickets
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/users
// @desc    Get all users with filtering and pagination
// @access  Private (Admin)
router.get('/users', authenticate, authorize('admin'), [
  query('role').optional().isIn(['student', 'organizer', 'admin']),
  query('isApproved').optional().isBoolean(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 })
], async (req: AuthRequest, res: express.Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { role, isApproved, page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const filter: any = {};
    if (role) filter.role = role;
    if (isApproved !== undefined) filter.isApproved = isApproved === 'true';

    const users = await User.find(filter)
      .select('-password')
      .populate('organization', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await User.countDocuments(filter);

    res.json({
      users,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(total / Number(limit)),
        totalUsers: total,
        hasNext: skip + users.length < total,
        hasPrev: Number(page) > 1
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/admin/users/:id/approve
// @desc    Approve or reject a user
// @access  Private (Admin)
router.put('/users/:id/approve', authenticate, authorize('admin'), [
  body('isApproved').isBoolean()
], async (req: AuthRequest, res: express.Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { isApproved } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isApproved },
      { new: true }
    ).select('-password').populate('organization', 'name');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: `User ${isApproved ? 'approved' : 'rejected'} successfully`,
      user
    });
  } catch (error) {
    console.error('Approve user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/admin/users/:id
// @desc    Delete a user
// @access  Private (Admin)
router.delete('/users/:id', authenticate, authorize('admin'), async (req: AuthRequest, res: express.Response) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Delete related data
    await Promise.all([
      Ticket.deleteMany({ user: req.params.id }),
      SavedEvent.deleteMany({ user: req.params.id }),
      Event.deleteMany({ createdBy: req.params.id })
    ]);

    await User.findByIdAndDelete(req.params.id);

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/admin/users/:id/role
// @desc    Update user role
// @access  Private (Admin)
router.put('/users/:id/role', authenticate, authorize('admin'), [
  body('role').isIn(['student', 'organizer', 'admin']),
  body('organizationId').optional().isMongoId()
], async (req: AuthRequest, res: express.Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { role, organizationId } = req.body;
    const updateData: any = { role };

    if (role === 'organizer' && organizationId) {
      updateData.organization = organizationId;
    } else if (role === 'student') {
      updateData.organization = undefined;
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).select('-password').populate('organization', 'name');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: 'User role updated successfully',
      user
    });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/events
// @desc    Get all events for moderation
// @access  Private (Admin)
router.get('/events', authenticate, authorize('admin'), [
  query('status').optional().isIn(['draft', 'published', 'cancelled', 'completed']),
  query('isApproved').optional().isBoolean(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 })
], async (req: AuthRequest, res: express.Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { status, isApproved, page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const filter: any = {};
    if (status) filter.status = status;
    if (isApproved !== undefined) filter.isApproved = isApproved === 'true';

    const events = await Event.find(filter)
      .populate('organization', 'name logo')
      .populate('createdBy', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Event.countDocuments(filter);

    res.json({
      events,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(total / Number(limit)),
        totalEvents: total,
        hasNext: skip + events.length < total,
        hasPrev: Number(page) > 1
      }
    });
  } catch (error) {
    console.error('Get events for moderation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/admin/events/:id/approve
// @desc    Approve or reject an event
// @access  Private (Admin)
router.put('/events/:id/approve', authenticate, authorize('admin'), [
  body('isApproved').isBoolean(),
  body('reason').optional().isString()
], async (req: AuthRequest, res: express.Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { isApproved, reason } = req.body;
    const event = await Event.findByIdAndUpdate(
      req.params.id,
      { isApproved },
      { new: true }
    ).populate('organization', 'name').populate('createdBy', 'firstName lastName email');

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    res.json({
      message: `Event ${isApproved ? 'approved' : 'rejected'} successfully`,
      event
    });
  } catch (error) {
    console.error('Approve event error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/admin/events/:id
// @desc    Delete an event
// @access  Private (Admin)
router.delete('/events/:id', authenticate, authorize('admin'), async (req: AuthRequest, res: express.Response) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Delete related data
    await Promise.all([
      Ticket.deleteMany({ event: req.params.id }),
      SavedEvent.deleteMany({ event: req.params.id })
    ]);

    await Event.findByIdAndDelete(req.params.id);

    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/admin/events/:id/status
// @desc    Update event status
// @access  Private (Admin)
router.put('/events/:id/status', authenticate, authorize('admin'), [
  body('status').isIn(['draft', 'published', 'cancelled', 'completed'])
], async (req: AuthRequest, res: express.Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { status } = req.body;
    const event = await Event.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate('organization', 'name').populate('createdBy', 'firstName lastName email');

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    res.json({
      message: 'Event status updated successfully',
      event
    });
  } catch (error) {
    console.error('Update event status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/events/:id/attendees
// @desc    Get event attendees and export as CSV
// @access  Private (Admin)
router.get('/events/:id/attendees', authenticate, authorize('admin'), [
  query('format').optional().isIn(['json', 'csv'])
], async (req: AuthRequest, res: express.Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { format = 'json' } = req.query;
    const event = await Event.findById(req.params.id).populate('organization', 'name');
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const tickets = await Ticket.find({ event: req.params.id })
      .populate('user', 'firstName lastName email studentId phoneNumber')
      .sort({ createdAt: -1 });

    if (format === 'csv') {
      const csvWriter = createCsvWriter.createObjectCsvWriter({
        path: 'attendees.csv',
        header: [
          { id: 'ticketId', title: 'Ticket ID' },
          { id: 'firstName', title: 'First Name' },
          { id: 'lastName', title: 'Last Name' },
          { id: 'email', title: 'Email' },
          { id: 'studentId', title: 'Student ID' },
          { id: 'phoneNumber', title: 'Phone Number' },
          { id: 'status', title: 'Status' },
          { id: 'createdAt', title: 'Ticket Created' }
        ]
      });

      const csvData = tickets.map(ticket => ({
        ticketId: ticket.ticketId,
        firstName: (ticket.user as any).firstName,
        lastName: (ticket.user as any).lastName,
        email: (ticket.user as any).email,
        studentId: (ticket.user as any).studentId || '',
        phoneNumber: (ticket.user as any).phoneNumber || '',
        status: ticket.status,
        createdAt: ticket.createdAt.toISOString()
      }));

      await csvWriter.writeRecords(csvData);

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${event.title}-attendees.csv"`);
      res.download('attendees.csv');
    } else {
      res.json({
        event: {
          id: event._id,
          title: event.title,
          date: event.date,
          organization: event.organization
        },
        attendees: tickets.map(ticket => ({
          ticketId: ticket.ticketId,
          user: ticket.user,
          status: ticket.status,
          createdAt: ticket.createdAt
        })),
        totalAttendees: tickets.length
      });
    }
  } catch (error) {
    console.error('Get attendees error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/organizations
// @desc    Get all organizations
// @access  Private (Admin)
router.get('/organizations', authenticate, authorize('admin'), async (req: AuthRequest, res: express.Response) => {
  try {
    const organizations = await Organization.find()
      .populate('createdBy', 'firstName lastName email')
      .sort({ createdAt: -1 });

    res.json(organizations);
  } catch (error) {
    console.error('Get organizations error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/admin/organizations/:id
// @desc    Update organization
// @access  Private (Admin)
router.put('/organizations/:id', authenticate, authorize('admin'), [
  body('name').optional().trim().notEmpty(),
  body('description').optional().trim().notEmpty(),
  body('contactEmail').optional().isEmail(),
  body('website').optional().isURL(),
  body('isActive').optional().isBoolean()
], async (req: AuthRequest, res: express.Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description, contactEmail, website, isActive } = req.body;
    const updateData: any = {};
    
    if (name) updateData.name = name;
    if (description) updateData.description = description;
    if (contactEmail) updateData.contactEmail = contactEmail;
    if (website) updateData.website = website;
    if (isActive !== undefined) updateData.isActive = isActive;

    const organization = await Organization.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate('createdBy', 'firstName lastName email');

    if (!organization) {
      return res.status(404).json({ message: 'Organization not found' });
    }

    res.json({
      message: 'Organization updated successfully',
      organization
    });
  } catch (error) {
    console.error('Update organization error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/admin/organizations/:id
// @desc    Delete an organization
// @access  Private (Admin)
router.delete('/organizations/:id', authenticate, authorize('admin'), async (req: AuthRequest, res: express.Response) => {
  try {
    const organization = await Organization.findById(req.params.id);
    if (!organization) {
      return res.status(404).json({ message: 'Organization not found' });
    }

    // Update users who belong to this organization
    await User.updateMany(
      { organization: req.params.id },
      { $unset: { organization: 1 } }
    );

    // Delete events created by this organization
    await Event.deleteMany({ organization: req.params.id });

    await Organization.findByIdAndDelete(req.params.id);

    res.json({ message: 'Organization deleted successfully' });
  } catch (error) {
    console.error('Delete organization error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/analytics
// @desc    Get comprehensive analytics
// @access  Private (Admin)
router.get('/analytics', authenticate, authorize('admin'), async (req: AuthRequest, res: express.Response) => {
  try {
    const [
      userGrowth,
      eventTrends,
      ticketSales,
      topCategories,
      organizationStats,
      revenueByMonth
    ] = await Promise.all([
      User.aggregate([
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
        { $limit: 12 }
      ]),
      Event.aggregate([
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' }
            },
            count: { $sum: 1 },
            published: {
              $sum: { $cond: [{ $eq: ['$status', 'published'] }, 1, 0] }
            }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
        { $limit: 12 }
      ]),
      Ticket.aggregate([
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' }
            },
            count: { $sum: 1 },
            revenue: { $sum: '$price' }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
        { $limit: 12 }
      ]),
      Event.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]),
      Organization.aggregate([
        {
          $lookup: {
            from: 'events',
            localField: '_id',
            foreignField: 'organization',
            as: 'events'
          }
        },
        {
          $project: {
            name: 1,
            eventCount: { $size: '$events' },
            isActive: 1
          }
        },
        { $sort: { eventCount: -1 } },
        { $limit: 10 }
      ]),
      Ticket.aggregate([
        { $match: { price: { $gt: 0 } } },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' }
            },
            revenue: { $sum: '$price' }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
        { $limit: 12 }
      ])
    ]);

    res.json({
      userGrowth,
      eventTrends,
      ticketSales,
      topCategories,
      organizationStats,
      revenueByMonth
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
