import express from 'express';
import Event from '../models/Event';
import User from '../models/User';
import { authenticate, authorize, requireApproval, AuthRequest } from '../middleware/auth'; // Add AuthRequest import

const router = express.Router();

// GET /api/analytics/events - Get event analytics
router.get('/events', authenticate, authorize('organizer', 'admin'), requireApproval, async (req: AuthRequest, res) => { // Add AuthRequest type
  try {
    const { timeRange = '6months', category } = req.query;
    const userId = req.user!._id; // Add ! to assert user exists
    const userRole = req.user!.role; // Add ! to assert user exists

    // Calculate date range
    let startDate = new Date();
    switch (timeRange) {
      case '1month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case '3months':
        startDate.setMonth(startDate.getMonth() - 3);
        break;
      case '6months':
        startDate.setMonth(startDate.getMonth() - 6);
        break;
      case '1year':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      case 'all':
      default:
        startDate = new Date('2020-01-01');
        break;
    }

    // Build base filter
    let baseFilter: any = {
      createdAt: { $gte: startDate }
    };

    // If organizer, only show their organization's events
    if (userRole === 'organizer') {
      baseFilter.organization = req.user!.organization; // Add ! to assert user exists
    }

    // Add category filter if specified
    if (category && category !== 'all') {
      baseFilter.category = category;
    }

    // Get all events for calculations
    const events = await Event.find(baseFilter).populate('organization', 'name');

    // Calculate metrics
    const totalEvents = events.length;
    const totalRegistrations = events.reduce((sum, event: any) => sum + (event.registrations || 0), 0); // Cast to any
    const totalRevenue = events.reduce((sum, event: any) => { // Cast to any
      if (event.ticketType === 'paid' && event.ticketPrice && event.registrations) {
        return sum + (event.ticketPrice * event.registrations);
      }
      return sum;
    }, 0);
    
    const averageAttendance = events.length > 0 
      ? events.reduce((sum, event: any) => { // Cast to any
          const attendanceRate = event.capacity > 0 ? (event.registrations || 0) / event.capacity : 0;
          return sum + attendanceRate;
        }, 0) / events.length * 100
      : 0;

    // Events by category
    const eventsByCategory = events.reduce((acc, event) => {
      acc[event.category] = (acc[event.category] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });

    // Events by month
    const eventsByMonth = events.reduce((acc, event) => {
      const month = new Date(event.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      acc[month] = (acc[month] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });

    // Registration trends (last 30 days)
    const registrationTrends = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      registrationTrends.push({
        date: date.toISOString(),
        registrations: Math.floor(Math.random() * 20) // Mock data for now
      });
    }

    // Top performing events
    const topEvents = events
      .filter(event => event.capacity > 0)
      .map((event: any) => ({ // Cast to any
        _id: event._id,
        title: event.title,
        category: event.category,
        capacity: event.capacity,
        registrations: event.registrations || 0,
        date: event.date,
        status: event.status,
        ticketType: event.ticketType,
        ticketPrice: event.ticketPrice
      }))
      .sort((a, b) => (b.registrations / b.capacity) - (a.registrations / a.capacity))
      .slice(0, 5);

    // Upcoming events
    const now = new Date();
    const upcomingEvents = events
      .filter(event => new Date(event.date) > now)
      .map((event: any) => ({ // Cast to any for safety
        _id: event._id,
        title: event.title,
        category: event.category,
        capacity: event.capacity,
        registrations: event.registrations || 0,
        date: event.date,
        status: event.status,
        ticketType: event.ticketType
      }))
      .slice(0, 5);

    res.json({
      totalEvents,
      totalRegistrations,
      totalRevenue,
      averageAttendance,
      eventsByCategory,
      eventsByMonth,
      registrationTrends,
      topEvents,
      upcomingEvents
    });

  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ message: 'Failed to fetch analytics data' });
  }
});

export default router;