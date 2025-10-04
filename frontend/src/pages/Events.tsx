import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Clock, Users, Search, Filter, ArrowRight } from 'lucide-react';
import axios from 'axios';

interface Event {
  _id: string;
  title: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  category: string;
  ticketType: 'free' | 'paid';
  ticketPrice?: number;
  imageUrl?: string;
  organization: {
    name: string;
    logo?: string;
  };
  ticketsIssued: number;
  remainingCapacity: number;
  capacity: number;
}
// 
const mockEvents: Event[] = [
  {
    _id: "1",
    title: "Campus Music Festival",
    description: "A day filled with live music performances from student bands.",
    date: "2025-10-15",
    startTime: "12:00",
    endTime: "22:00",
    location: "Main Quad",
    category: "sports",
    ticketType: "free",
    organization: {
      name: "Student Union",
      logo: "https://cdn.logojoy.com/wp-content/uploads/2018/05/30163918/1241-768x591.png"
    },
    ticketsIssued: 150,
    remainingCapacity: 350,
    capacity: 500,
    imageUrl: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?fm=jpg&q=60&w=3000&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8ZXZlbnR8ZW58MHx8MHx8fDA%3D"
  },
  {
    _id: "2",
    title: "Tech Workshop: AI in 2025",
    description: "Hands-on workshop exploring the latest AI trends and tools.",
    date: "2025-10-20",
    startTime: "10:00",
    endTime: "16:00",
    location: "Engineering Building, Room 101",
    category: "sports",
    ticketType: "paid",
    ticketPrice: 25,
    organization: {
      name: "Tech Society",
      logo: "https://www.shutterstock.com/image-vector/team-event-logos-design-modern-260nw-2200221513.jpg"
    },
    ticketsIssued: 40,
    remainingCapacity: 10,
    capacity: 50,
    imageUrl: "https://media.istockphoto.com/id/501030755/photo/these-fans-rock-as-much-as-the-band.jpg?s=612x612&w=0&k=20&c=QpDZ4OiObCjqg6gL-0dMDBPX-ZV0nUqsTNYQ45m0he0="
  },
  {
    _id: "3",
    title: "Campus Yoga Session",
    description: "Relax and unwind with an outdoor yoga session.",
    date: "2025-10-18",
    startTime: "08:00",
    endTime: "09:30",
    location: "Sports Field",
    category: "volunteer",
    ticketType: "free",
    organization: {
      name: "Wellness Club",
      logo: "https://www.shutterstock.com/image-vector/event-tent-logo-design-concept-260nw-2401083613.jpg"
    },
    ticketsIssued: 20,
    remainingCapacity: 80,
    capacity: 100,
    imageUrl: "https://static.vecteezy.com/system/resources/thumbnails/024/308/240/small/summer-fest-event-party-with-people-blurred-background-illustration-ai-generative-free-photo.jpg"
  },
  {
    _id: "4",
    title: "Art & Culture Night",
    description: "Experience student art exhibits and cultural performances.",
    date: "2025-10-25",
    startTime: "18:00",
    endTime: "23:00",
    location: "Arts Center",
    category: "social",
    ticketType: "paid",
    ticketPrice: 10,
    organization: {
      name: "Arts Society",
      logo: "https://cdn.logojoy.com/wp-content/uploads/2018/05/30163918/1241-768x591.png"
    },
    ticketsIssued: 75,
    remainingCapacity: 25,
    capacity: 100,
    imageUrl: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?fm=jpg&q=60&w=3000&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8ZXZlbnR8ZW58MHx8MHx8fDA%3D"
  },
  {
    _id: "5",
    title: "Entrepreneurship Meetup",
    description: "Connect with local entrepreneurs and startup enthusiasts.",
    date: "2025-11-01",
    startTime: "14:00",
    endTime: "17:00",
    location: "Business Hall, Room 210",
    category: "academic",
    ticketType: "free",
    organization: {
      name: "Entrepreneur Club",
      logo: "https://www.shutterstock.com/image-vector/team-event-logos-design-modern-260nw-2200221513.jpg"
    },
    ticketsIssued: 30,
    remainingCapacity: 70,
    capacity: 100,
    imageUrl: "https://media.istockphoto.com/id/501030755/photo/these-fans-rock-as-much-as-the-band.jpg?s=612x612&w=0&k=20&c=QpDZ4OiObCjqg6gL-0dMDBPX-ZV0nUqsTNYQ45m0he0="
  }
];

const Events: React.FC = () => {
  const [events, setEvents] = useState<Event[]>(mockEvents);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    date: ''
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalEvents: 0,
    hasNext: false,
    hasPrev: false
  });

  const categories = [
    { value: '', label: 'All Categories' },
    { value: 'academic', label: 'Academic' },
    { value: 'social', label: 'Social' },
    { value: 'sports', label: 'Sports' },
    { value: 'cultural', label: 'Cultural' },
    { value: 'career', label: 'Career' },
    { value: 'volunteer', label: 'Volunteer' },
    { value: 'other', label: 'Other' }
  ];

  useEffect(() => {
    fetchEvents();
  }, [filters, pagination.currentPage]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.currentPage.toString(),
        limit: '12'
      });

      if (filters.search) params.append('search', filters.search);
      if (filters.category) params.append('category', filters.category);
      if (filters.date) params.append('date', filters.date);

      const response = await axios.get(`/events?${params}`);
      setEvents(response.data.events);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, currentPage: page }));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      academic: 'bg-blue-100 text-blue-800',
      social: 'bg-pink-100 text-pink-800',
      sports: 'bg-green-100 text-green-800',
      cultural: 'bg-purple-100 text-purple-800',
      career: 'bg-yellow-100 text-yellow-800',
      volunteer: 'bg-orange-100 text-orange-800',
      other: 'bg-gray-100 text-gray-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

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
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Campus Events</h1>
        <p className="text-xl text-gray-600">Discover amazing events happening on campus</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search events..."
              className="input-field pl-10"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Filter className="h-5 w-5 text-gray-400" />
            </div>
            <select
              className="input-field pl-10"
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
            >
              {categories.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Calendar className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="date"
              className="input-field pl-10"
              value={filters.date}
              onChange={(e) => handleFilterChange('date', e.target.value)}
            />
          </div>

          <button
            onClick={() => setFilters({ search: '', category: '', date: '' })}
            className="btn-secondary"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Events Grid */}
      {events.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No events found</h3>
          <p className="text-gray-600">Try adjusting your search criteria or check back later.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {events.map((event) => (
            <div key={event._id} className="card hover:shadow-lg transition-shadow">
              {event.imageUrl && (
                <img
                  src={event.imageUrl}
                  alt={event.title}
                  className="w-full h-48 object-cover rounded-lg mb-4"
                />
              )}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(event.category)}`}>
                    {event.category}
                  </span>
                  <span className="text-sm text-gray-500">
                    {event.ticketType === 'free' ? 'Free' : `$${event.ticketPrice}`}
                  </span>
                </div>
                
                <h3 className="text-xl font-semibold text-gray-900 line-clamp-2">
                  {event.title}
                </h3>
                
                <p className="text-gray-600 line-clamp-3">
                  {event.description}
                </p>
                
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-500">
                    <Calendar className="w-4 h-4 mr-2" />
                    {formatDate(event.date)}
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <Clock className="w-4 h-4 mr-2" />
                    {formatTime(event.startTime)} - {formatTime(event.endTime)}
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <MapPin className="w-4 h-4 mr-2" />
                    {event.location}
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <Users className="w-4 h-4 mr-2" />
                    {event.organization.name}
                  </div>
                </div>
                
                <div className="pt-4">
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                    <span>{event.ticketsIssued} tickets issued</span>
                    <span>{event.remainingCapacity} remaining</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary-600 h-2 rounded-full"
                      style={{
                        width: `${(event.ticketsIssued / event.capacity) * 100}%`
                      }}
                    ></div>
                  </div>
                </div>
                
                <Link
                  to={`/events/${event._id}`}
                  className="w-full btn-primary flex items-center justify-center"
                >
                  View Details
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2">
          <button
            onClick={() => handlePageChange(pagination.currentPage - 1)}
            disabled={!pagination.hasPrev}
            className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          
          {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => handlePageChange(page)}
              className={`px-3 py-2 text-sm font-medium rounded-md ${
                page === pagination.currentPage
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {page}
            </button>
          ))}
          
          <button
            onClick={() => handlePageChange(pagination.currentPage + 1)}
            disabled={!pagination.hasNext}
            className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default Events;
