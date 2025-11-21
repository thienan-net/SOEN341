import express from 'express';
import Event from '../models/Event';
import User from '../models/User';
import Ticket from '../models/Ticket';
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
    const eventIds = events.map(event => event._id);

    // Get actual ticket counts from Ticket model
    const tickets = await Ticket.find({ 
      event: { $in: eventIds },
      status: { $in: ['active', 'used'] } // Only count active and used tickets, not cancelled
    });

    // Create a map of event ID to ticket count
    const ticketCountByEvent = tickets.reduce((acc, ticket) => {
      const eventId = ticket.event.toString();
      acc[eventId] = (acc[eventId] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });

    // Calculate metrics using actual ticket data
    const totalEvents = events.length;
    const totalRegistrations = Object.values(ticketCountByEvent).reduce((sum, count) => sum + count, 0);
    
    const totalRevenue = events.reduce((sum, event: any) => { // Cast to any
      const eventTicketCount = ticketCountByEvent[event._id.toString()] || 0;
      if (event.ticketType === 'paid' && event.ticketPrice && eventTicketCount > 0) {
        return sum + (event.ticketPrice * eventTicketCount);
      }
      return sum;
    }, 0);
    
    const averageAttendance = events.length > 0 
      ? events.reduce((sum, event: any) => { // Cast to any
          const eventTicketCount = ticketCountByEvent[event._id.toString()] || 0;
          const attendanceRate = event.capacity > 0 ? eventTicketCount / event.capacity : 0;
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

    // Registration trends (last 30 days) - use real ticket creation data
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const dailyTickets = await Ticket.aggregate([
      {
        $match: {
          event: { $in: eventIds },
          createdAt: { $gte: thirtyDaysAgo },
          status: { $in: ['active', 'used'] }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Create a complete 30-day range with actual ticket data
    const registrationTrends = [];
    const ticketsByDate = dailyTickets.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {} as { [key: string]: number });

    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      registrationTrends.push({
        date: date.toISOString(),
        registrations: ticketsByDate[dateStr] || 0
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
        registrations: ticketCountByEvent[event._id.toString()] || 0,
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
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()) // ascending by date
      .map((event: any) => ({
        _id: event._id,
        title: event.title,
        category: event.category,
        capacity: event.capacity,
        registrations: ticketCountByEvent[event._id.toString()] || 0,
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