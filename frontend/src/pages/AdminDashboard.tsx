import React, { useState, useEffect } from 'react';
import { Calendar, Ticket, TrendingUp, User2, DollarSign } from 'lucide-react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Bar, Line, Pie } from 'react-chartjs-2';
import { QRCode } from '../ui/QRCode';

interface DashboardStats {
  totalUsers: number;
  totalTickets: number;
  pendingApprovals: number;
  totalEvents: number;
  totalRevenue: number;
}

interface DashboardCharts {
  userRoleStats: any,
  eventStatusStats: any,
  monthlyStats: any
}

interface MostPopular {
  recentEvents: RecentEvent[],
  topOrganization: any,
  recentTickets: RecentTicket[],
}
interface RecentTicket {
  ticketId: string;
  event: {
    date: Date;
    title: string;
    _id: string;
  };
  user: string;
  qrCode: string;
  status: 'active' | 'used' | 'cancelled' | 'expired';
  usedAt?: Date;
  price?: number;
  createdAt: Date;
  updatedAt: Date;
}
interface RecentEvent {
  _id: string;
  title: string;
  date: string;
  status: string;
  ticketsIssued: number;
  remainingCapacity: number;
}

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalTickets: 0,
    pendingApprovals: 0,
    totalEvents: 0,
    totalRevenue: 0,
  });
  const [charts, setCharts] = useState<DashboardCharts>({
    eventStatusStats: "",
    monthlyStats: "",
    userRoleStats: ""
  })

  const [mostPopular, setMostPopular] = useState<MostPopular>({
    recentEvents: [],
    recentTickets: [],
    topOrganization: ""
  })
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await axios.get('/admin/dashboard');
      setStats(response.data.stats);
      setCharts(response.data.charts);
      setMostPopular({
        recentEvents: response.data.recentEvents,
        recentTickets: response.data.recentTickets,
        topOrganization: response.data.topOrganization
      })
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }
  interface Stat {
    _id: string;
    count: number;
  }
  interface MonthStat {
    _id: { 
        month: number; 
        year: number
    }, 
    eventCount: number
  }
  const userRoleChartData = {
    labels: charts.userRoleStats.map((stat : Stat) => stat._id),
    datasets: [
      {
        label: 'User Roles Distribution',
        data: charts.userRoleStats.map((stat : Stat) => stat.count),
        backgroundColor: [
          '#3B82F6',
          '#10B981',
          '#F59E0B',
          '#EF4444',
          '#8B5CF6',
          '#06B6D4',
          '#84CC16',
          '#F97316',
        ],
        borderWidth: 1,
      },
    ],
  };


  const eventStatusChartData = {
    labels: charts.eventStatusStats.map((stat : Stat) => stat._id),
    datasets: [
      {
        label: 'Events Created',
        data: charts.eventStatusStats.map((stat : Stat) => stat.count),
        backgroundColor: [
          '#3B82F6',
          '#10B981',
          '#F59E0B',
          '#EF4444',
          '#8B5CF6',
          '#06B6D4',
          '#84CC16',
          '#F97316',
        ],        
        borderColor: '#2563EB',
        borderWidth: 1,
      },
    ],
  };

  const eventsCreationTrendData = {
    labels: charts.monthlyStats.map((monthStat: MonthStat) => {
      const month = monthStat._id.month;
      const year = monthStat._id.year;
      const date = new Date(year, month - 1);
      return date.toLocaleString("en-US", { month: "short", year: "numeric"})
    }),
    datasets: [
      {
        label: "Events Created",
        data: charts.monthlyStats.map((monthStat : MonthStat) => monthStat.eventCount),
        borderColor: '#10B981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4,
        fill: true,
      }
    ]
  }

  // user roles stats 
  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      datalabels: {
        color: '#fff',
        font: { weight: 'bold', size: 14 },
        formatter: (value: number) => value, 
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          // Force integers on y-axis
          callback: (value: number | string) => {
            return Number.isInteger(Number(value)) ? value : null;
          },
        },
      },
    },
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600">Platform overview</p>
        </div>
        <Link
          to="/admin/events?status=pending"
          className="btn-primary flex items-center text-white hover:text-white"
        >
          <TrendingUp className="w-4 h-4 mr-2" />
          View Pending Events
        </Link>

      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card col-span-full">
          <div className="flex items-center">
            <div className="bg-green-100 rounded-full w-12 h-12 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">${stats.totalRevenue}</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center">
            <div className="bg-primary-100 rounded-full w-12 h-12 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-primary-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Events</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalEvents}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="bg-green-100 rounded-full w-12 h-12 flex items-center justify-center">
              <User2 className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="bg-yellow-100 rounded-full w-12 h-12 flex items-center justify-center">
              <Ticket className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Tickets</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalTickets}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="bg-orange-100 rounded-full w-12 h-12 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Events Pending Approval</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pendingApprovals}</p>
            </div>
          </div>
        </div>
      </div>
        {/* Charts */}
      {/*  usewr role stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">User Roles</h2>
          <div style={{ height: '300px' }}>
            <Bar data={userRoleChartData} options={chartOptions} />
          </div>
        </div>
        {/* event status */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Event Status</h2>
          <div style={{ height: '300px' }}>
            <Pie data={eventStatusChartData} options={chartOptions} />
          </div>
        </div>
      </div>

      {/* Monthly stats */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Events Creation Trends</h2>
        <div style={{ height: '300px' }}>
          <Line data={eventsCreationTrendData} options={chartOptions} />
        </div>
      </div>
      {/* Recent Events */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Recent Events</h2>
          <Link
            to="/events"
            className="text-primary-600 hover:text-primary-700 font-medium"
          >
            View All
          </Link>
        </div>

        {mostPopular.recentEvents.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No recent events yet</h3>
          </div>
        ) : (
          <div className="space-y-4">
            {mostPopular.recentEvents.map((event) => (
              <div key={event._id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex-1">
                  <Link to={`/events/${event._id}`}>
                    <h3 className="font-medium text-gray-900 hover:text-primary-500">{event.title}</h3>
                  </Link>
                  <p className="text-sm text-gray-600">
                    {new Date(event.date).toLocaleDateString()} • {event.ticketsIssued ?? 0} tickets issued
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    event.status === 'published' 
                      ? 'bg-green-100 text-green-800'
                      : event.status === 'draft'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {event.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Recent Tickets</h2>
          <Link
            to="/organizer/events"
            className="text-primary-600 hover:text-primary-700 font-medium"
          >
            View All
          </Link>
        </div>

        {mostPopular.recentTickets.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No recent tickets yet</h3>
          </div>
        ) : (
          <div className="space-y-4">
            {mostPopular.recentTickets.map((ticket) => (
              <div key={ticket.ticketId} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{ticket.event.title}</h3>
                  <p className="text-sm text-gray-600">
                    {new Date(ticket.createdAt).toLocaleDateString()} • Ticket price: ${ticket.price}
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  <QRCode 
                    size={40}
                    ticketID={ticket.ticketId}
                  />
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    ticket.status === 'active' 
                      ? 'bg-green-100 text-green-800'
                      : ticket.status === 'expired'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 
                      // ticket.status === "cancelled" || ticket.status === "used" 
                      'bg-red-100 text-red-800'
                  }`}>
                    {ticket.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;