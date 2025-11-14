import React, { useState, useEffect } from 'react';
import { Calendar, Users, Ticket, TrendingUp, Plus, BarChart3 } from 'lucide-react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import CancelledTicketsPieChart from '../ui/CancelledTicketsPieChart';

interface DashboardStats {
  totalEvents: number;
  publishedEvents: number;
  totalTickets: number;
  pendingEvents: number;
}

interface RecentEvent {
  _id: string;
  title: string;
  date: string;
  status: string;
  ticketsIssued: number;
  remainingCapacity: number;
}

const OrganizerDashboard: React.FC = () => {
    const [stats, setStats] = useState<DashboardStats>({
      totalEvents: 0,
      publishedEvents: 0,
      totalTickets: 0,
      pendingEvents: 0
    });
    const [ticketCounts, setTicketCounts] = useState<{active: number, cancelled: number}>({active: -1, cancelled: -1})
    const [recentEvents, setRecentEvents] = useState<RecentEvent[]>([]);
    const [cancelledTicketsAnalytics, setCancelledTicketAnalytics] = useState<{reason: string, count: number}[]>([])
    const [loading, setLoading] = useState(true);
    const eventStatsBoxes = [
        { title: "Total Events", value: stats.totalEvents, bg: "bg-primary-100", color: "text-primary-600", icon: Calendar },
        { title: "Published Events", value: stats.publishedEvents, bg: "bg-green-100", color: "text-green-600", icon: BarChart3 },
        { title: "Pending Events", value: stats.pendingEvents, bg: "bg-orange-100", color: "text-orange-600", icon: TrendingUp }
    ]
    const titcketStatsBoxes = [
        { title: "Total Tickets", value: stats.totalTickets, bg: "bg-yellow-100", color: "text-yellow-600", icon: Ticket },
        { title: "Active Tickets", value: ticketCounts.active, bg: "bg-yellow-100", color: "text-yellow-600", icon: Ticket },
        { title: "Cancelled Tickets", value: ticketCounts.cancelled, bg: "bg-red-100", color: "text-red-600", icon: Ticket },
    ]
    useEffect(() => {
      fetchDashboardData();
    }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await axios.get('/users/organizer/dashboard');
      setStats(response.data.stats);
      setTicketCounts(response.data.ticketCounts);
      setRecentEvents(response.data.recentEvents);
      setCancelledTicketAnalytics(response.data.cancelledTicketsAnalytics);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };
  const StatsGrid = ({ title, items }: { title: string, items: any[] }) => (
      <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{title}</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((stat, idx) => (
              <div key={idx} className="card p-4 rounded-xl shadow hover:shadow-lg transition">
                <div className="flex items-center">
                  <div className={`${stat.bg} rounded-full w-12 h-12 flex items-center justify-center`}>
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  </div>

                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
  );
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Manage your events and track performance</p>
        </div>
        <Link
          to="/organizer/events/create"
          className="inline-flex items-center px-4 py-2 bg-primary-600 text-white font-medium rounded-lg shadow hover:bg-primary-700 transition-colors hover:text-white hover:no-underline"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Event
        </Link>
      </div>

      {/* Stats Grid */}
      <StatsGrid title='Event Stats' items={eventStatsBoxes} />
       {/* Recent Events */}
      <div className="card p-6 rounded-xl shadow">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Recent Events</h2>
          <Link
            to="/organizer/events"
            className="text-primary-600 hover:text-primary-700 font-medium transition"
          >
            View All
          </Link>
        </div>

        {recentEvents.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No events yet</h3>
            <p className="text-gray-600 mb-4">Create your first event to get started!</p>
            <Link
              to="/organizer/events/create"
              className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg shadow hover:bg-primary-700 transition-colors"
            >
              Create Event
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {recentEvents.map((event) => (
              <div
                key={event._id}
                className="flex flex-col md:flex-row md:items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-lg transition"
              >
                <div className="flex-1 mb-2 md:mb-0">
                  <h3 className="font-semibold text-gray-900 text-lg">{event.title}</h3>
                  <p className="text-sm text-gray-500">
                    {new Date(event.date).toLocaleDateString()} • {event.ticketsIssued} tickets issued
                  </p>
                </div>
                <div className="flex items-center">
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                      event.status === 'published'
                        ? 'bg-green-100 text-green-800'
                        : event.status === 'draft'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {event.status}
                  </span>
                </div>
              </div>
            ))}
              <div className="flex justify-end items-center mb-4">
                <Link
                  to="/organizer/events/analytics"
                  className="px-3 py-1.5 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 hover:text-white hover:no-underline transition-colors"
                >
                  View Analytics
                </Link>
              </div>

          </div>
        )}
      </div>
      <StatsGrid title='Ticket Stats' items={titcketStatsBoxes} />
      <CancelledTicketsPieChart data={cancelledTicketsAnalytics}/>
     
    </div>

  );
};

export default OrganizerDashboard;  
