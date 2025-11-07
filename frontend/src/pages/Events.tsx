import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Clock, Users, Search, Filter, ArrowRight, LogIn, ArrowUp, ImageIcon } from 'lucide-react';
import axios from 'axios';
import { formatDate, formatTime } from '../helper/date';
import { saveToCalendar } from '../helper/calendar';
import SaveToCalendarButton from '../ui/SaveToCalendarButton';
import { EventCard } from '../ui/EventCard';

export interface Event {
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
const Events: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("")
  const [filters, setFilters] = useState(
  {
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


  //fetch events
  const fetchEvents = async () => 
    {
    try 
    {
      setLoading(true);

      // build query parameters for filter
      const params = new URLSearchParams(
      {
        page: pagination.currentPage.toString(),
        limit: '12'
      });

      // filter options if present
      const { search, category, date } = filters;
      if (search) params.append('search', search);
      if (category) params.append('category', category);
      if (date) params.append('date', date);

      // fetch events from API
      const response = await axios.get(`/events?${params.toString()}`);
      const { events, pagination: newPagination } = response.data;
      setEvents(events);
      setPagination(newPagination);
    } 
    catch (error) {
      console.error('Error fetching events:', error);
    } 
    finally {
      setLoading(false);
    }
  };

  //handle for filter changes
  const onFilterSubmit = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, currentPage: page }));
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
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if(e.key === "Enter" ) {
                  onFilterSubmit('search', search)
                }
              }}
            />
            <div style={{cursor: "pointer"}} onClick={() => onFilterSubmit('search', search)} className="absolute inset-y-0 right-3 pl-3 flex items-center">
              <ArrowUp  className="h-5 w-5 text-gray-400" />
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Filter className="h-5 w-5 text-gray-400" />
            </div>
            <select
              className="input-field pl-10"
              value={filters.category}
              onChange={(e) => onFilterSubmit('category', e.target.value)}
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
              onChange={(e) => onFilterSubmit('date', e.target.value)}
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
              <EventCard event={event}/>
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
