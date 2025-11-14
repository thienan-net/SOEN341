import React, { useState, useEffect, useRef } from 'react';
import { Calendar, MapPin, Clock, Users, ArrowRight } from 'lucide-react';
import axios from 'axios';
import EventsFilters from '../ui/EventsFilters';
import { formatDate, formatTime } from '../helper/date';
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
interface Filters {
    search: string;
    category: string;
    dateRange?: [Date, Date];
}

const Events: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState<Filters>({
    search: '',
    category: '',
    dateRange: undefined // no default date filter
  });

  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalEvents: 0,
    hasNext: false,
    hasPrev: false
  });
  const prevFiltersRef = useRef<Filters | null>(null);

  useEffect(() => {
    if (!prevFiltersRef.current) {
      fetchEvents(); // first load
    } else {
      const filtersChanged =
        JSON.stringify(prevFiltersRef.current) !== JSON.stringify(filters);
      if (filtersChanged) fetchEvents();
    }
    prevFiltersRef.current = filters;
  }, [filters]);

  const fetchEvents = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams({
        page: pagination.currentPage.toString(),
        limit: '12'
      });

      const { search, category, dateRange } = filters;

      if (search) params.append('search', search);
      if (category) params.append('category', category);
      if (dateRange?.[0]) params.append('dateStart', dateRange[0].toISOString());
      if (dateRange?.[1]) params.append('dateEnd', dateRange[1].toISOString());

      const response = await axios.get(`/events?${params.toString()}`);
      const { events, pagination: newPagination } = response.data;

      setEvents(events);
      setPagination(newPagination);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Campus Events</h1>
        <p className="text-xl text-gray-600">Discover amazing events happening on campus</p>
      </div>

      {/* Filters */}
      <EventsFilters  filters={filters} setFilters={setFilters} />

      {/* Loading Spinner */}
      {loading ? (
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <>
          {/* Events Grid */}
          {events.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No events found</h3>
              <p className="text-gray-600">Try adjusting your search criteria or check back later.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {events.map(event => (
                <EventCard key={event._id} event={event} />
              ))}
            </div>
          )}
        </>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2">
          <button
            onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }))}
            disabled={!pagination.hasPrev}
            className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>

          {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(page => (
            <button
              key={page}
              onClick={() => setPagination(prev => ({ ...prev, currentPage: page }))}
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
            onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }))}
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