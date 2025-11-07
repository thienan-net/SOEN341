import React, { useState, useEffect } from 'react';
import { 
  Search, 
  CheckCircle, 
  XCircle, 
  Eye, 
  Trash2, 
  Calendar, 
  MapPin, 
  Clock, 
  Users, 
  DollarSign,
  Tag,
  Building
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';

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
  capacity: number;
  imageUrl?: string;
  status: 'draft' | 'published' | 'cancelled' | 'completed';
  isApproved: boolean;
  organization: {
    _id: string;
    name: string;
    logo?: string;
  };
  createdBy: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  tags: string[];
  requirements?: string;
  contactInfo?: string;
  createdAt: string;
  updatedAt: string;
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalEvents: number;
  hasNext: boolean;
  hasPrev: boolean;
}

const AdminEvents: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  // Filters
  const [filters, setFilters] = useState({
    status: '',
    isApproved: '',
    search: ''
  });
  
  // Pagination
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalEvents: 0,
    hasNext: false,
    hasPrev: false
  });

  useEffect(() => {
    fetchEvents();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, pagination.currentPage]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.currentPage.toString(),
        limit: '10'
      });

      if (filters.status) params.append('status', filters.status);
      if (filters.isApproved) params.append('isApproved', filters.isApproved);
      if (filters.search) params.append('search', filters.search);

      const response = await axios.get(`/admin/events?${params.toString()}`);
      setEvents(response.data.events);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Error fetching events:', error);
      toast.error('Failed to fetch events');
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (eventId: string, isApproved: boolean, reason?: string) => {
    try {
      await axios.put(`/admin/events/${eventId}/approve`, { isApproved, reason });
      toast.success(`Event ${isApproved ? 'approved' : 'rejected'} successfully`);
      fetchEvents();
    } catch (error) {
      console.error('Error updating event approval:', error);
      toast.error('Failed to update event approval');
    }
  };

  const handleStatusUpdate = async (eventId: string, status: string) => {
    try {
      await axios.put(`/admin/events/${eventId}/status`, { status });
      toast.success('Event status updated successfully');
      fetchEvents();
    } catch (error) {
      console.error('Error updating event status:', error);
      toast.error('Failed to update event status');
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    try {
      await axios.delete(`/admin/events/${eventId}`);
      toast.success('Event deleted successfully');
      setShowDeleteModal(false);
      setSelectedEvent(null);
      fetchEvents();
    } catch (error) {
      console.error('Error deleting event:', error);
      toast.error('Failed to delete event');
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, currentPage: page }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'published': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      academic: 'bg-blue-100 text-blue-800',
      social: 'bg-pink-100 text-pink-800',
      sports: 'bg-green-100 text-green-800',
      cultural: 'bg-purple-100 text-purple-800',
      career: 'bg-orange-100 text-orange-800',
      volunteer: 'bg-teal-100 text-teal-800',
      other: 'bg-gray-100 text-gray-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  if (loading && events.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Event Moderation</h1>
        <p className="text-gray-600">Review, approve, and manage events submitted by organizers</p>
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

          <select
            className="input-field"
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
          >
            <option value="">All Status</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="cancelled">Cancelled</option>
            <option value="completed">Completed</option>
          </select>

          <select
            className="input-field"
            value={filters.isApproved}
            onChange={(e) => handleFilterChange('isApproved', e.target.value)}
          >
            <option value="">All Approval Status</option>
            <option value="true">Approved</option>
            <option value="false">Pending</option>
          </select>

          <button
            onClick={() => setFilters({ status: '', isApproved: '', search: '' })}
            className="btn-secondary"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Events Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Event Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Organizer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Approval
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {events.map((event) => (
                <tr key={event._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-start">
                      {event.imageUrl && (
                        <img 
                          src={event.imageUrl} 
                          alt={event.title}
                          className="w-16 h-16 rounded-lg object-cover mr-4"
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {event.title}
                        </div>
                        <div className="text-sm text-gray-500 mb-2">
                          <div className="flex items-center space-x-4 text-xs">
                            <span className="flex items-center">
                              <Calendar className="w-3 h-3 mr-1" />
                              {new Date(event.date).toLocaleDateString()}
                            </span>
                            <span className="flex items-center">
                              <Clock className="w-3 h-3 mr-1" />
                              {event.startTime}
                            </span>
                            <span className="flex items-center">
                              <MapPin className="w-3 h-3 mr-1" />
                              {event.location}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getCategoryColor(event.category)}`}>
                            {event.category}
                          </span>
                          {event.ticketType === 'paid' && (
                            <span className="flex items-center text-xs text-gray-500">
                              <DollarSign className="w-3 h-3 mr-1" />
                              ${event.ticketPrice}
                            </span>
                          )}
                          <span className="flex items-center text-xs text-gray-500">
                            <Users className="w-3 h-3 mr-1" />
                            {event.capacity}
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {event.createdBy.firstName} {event.createdBy.lastName}
                      </div>
                      <div className="text-sm text-gray-500">{event.createdBy.email}</div>
                      <div className="text-xs text-gray-500 flex items-center">
                        <Building className="w-3 h-3 mr-1" />
                        {event.organization.name}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={event.status}
                      onChange={(e) => handleStatusUpdate(event._id, e.target.value)}
                      className={`text-xs px-2 py-1 rounded-full font-semibold border-0 ${getStatusColor(event.status)}`}
                    >
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                      <option value="cancelled">Cancelled</option>
                      <option value="completed">Completed</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      event.isApproved 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {event.isApproved ? 'Approved' : 'Pending'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(event.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    <button
                      onClick={() => {
                        setSelectedEvent(event);
                        setShowDetailsModal(true);
                      }}
                      className="text-blue-600 hover:text-blue-900"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    
                    {!event.isApproved && (
                      <>
                        <button
                          onClick={() => handleApproval(event._id, true)}
                          className="text-green-600 hover:text-green-900"
                          title="Approve Event"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleApproval(event._id, false)}
                          className="text-red-600 hover:text-red-900"
                          title="Reject Event"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </>
                    )}
                    
                    <button
                      onClick={() => {
                        setSelectedEvent(event);
                        setShowDeleteModal(true);
                      }}
                      className="text-red-600 hover:text-red-900"
                      title="Delete Event"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing {((pagination.currentPage - 1) * 10) + 1} to {Math.min(pagination.currentPage * 10, pagination.totalEvents)} of {pagination.totalEvents} events
            </div>
            <div className="flex space-x-1">
              <button
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={!pagination.hasPrev}
                className="px-3 py-1 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`px-3 py-1 text-sm border rounded ${
                    page === pagination.currentPage
                      ? 'bg-primary-600 text-white border-primary-600'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={!pagination.hasNext}
                className="px-3 py-1 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Event Details Modal */}
      {showDetailsModal && selectedEvent && (
        <EventDetailsModal
          event={selectedEvent}
          onApprove={(isApproved) => {
            handleApproval(selectedEvent._id, isApproved);
            setShowDetailsModal(false);
          }}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedEvent(null);
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedEvent && (
        <DeleteEventModal
          event={selectedEvent}
          onConfirm={() => handleDeleteEvent(selectedEvent._id)}
          onClose={() => {
            setShowDeleteModal(false);
            setSelectedEvent(null);
          }}
        />
      )}
    </div>
  );
};

// Event Details Modal Component
interface EventDetailsModalProps {
  event: Event;
  onApprove: (isApproved: boolean) => void;
  onClose: () => void;
}

const EventDetailsModal: React.FC<EventDetailsModalProps> = ({ event, onApprove, onClose }) => {
  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      academic: 'bg-blue-100 text-blue-800',
      social: 'bg-pink-100 text-pink-800',
      sports: 'bg-green-100 text-green-800',
      cultural: 'bg-purple-100 text-purple-800',
      career: 'bg-orange-100 text-orange-800',
      volunteer: 'bg-teal-100 text-teal-800',
      other: 'bg-gray-100 text-gray-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">Event Details</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
        </div>
        
        <div className="px-6 py-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Event Image */}
            {event.imageUrl && (
              <div className="lg:col-span-2">
                <img 
                  src={event.imageUrl} 
                  alt={event.title}
                  className="w-full h-64 object-cover rounded-lg"
                />
              </div>
            )}
            
            {/* Basic Info */}
            <div className="space-y-4">
              <div>
                <h4 className="text-lg font-semibold text-gray-900">{event.title}</h4>
                <p className="text-gray-600 mt-2">{event.description}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Date:</span>
                  <div className="flex items-center mt-1">
                    <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                    {new Date(event.date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                </div>
                
                <div>
                  <span className="font-medium text-gray-700">Time:</span>
                  <div className="flex items-center mt-1">
                    <Clock className="w-4 h-4 mr-2 text-gray-400" />
                    {event.startTime} - {event.endTime}
                  </div>
                </div>
                
                <div>
                  <span className="font-medium text-gray-700">Location:</span>
                  <div className="flex items-center mt-1">
                    <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                    {event.location}
                  </div>
                </div>
                
                <div>
                  <span className="font-medium text-gray-700">Category:</span>
                  <div className="mt-1">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getCategoryColor(event.category)}`}>
                      {event.category}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Event Details */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Ticket Type:</span>
                  <div className="flex items-center mt-1">
                    {event.ticketType === 'paid' ? (
                      <>
                        <DollarSign className="w-4 h-4 mr-2 text-gray-400" />
                        Paid - ${event.ticketPrice}
                      </>
                    ) : (
                      <>
                        <Tag className="w-4 h-4 mr-2 text-gray-400" />
                        Free
                      </>
                    )}
                  </div>
                </div>
                
                <div>
                  <span className="font-medium text-gray-700">Capacity:</span>
                  <div className="flex items-center mt-1">
                    <Users className="w-4 h-4 mr-2 text-gray-400" />
                    {event.capacity} attendees
                  </div>
                </div>
              </div>
              
              <div>
                <span className="font-medium text-gray-700">Organizer:</span>
                <div className="mt-1">
                  <div className="text-sm font-medium">{event.createdBy.firstName} {event.createdBy.lastName}</div>
                  <div className="text-sm text-gray-500">{event.createdBy.email}</div>
                  <div className="text-sm text-gray-500 flex items-center">
                    <Building className="w-4 h-4 mr-1" />
                    {event.organization.name}
                  </div>
                </div>
              </div>
              
              {event.tags.length > 0 && (
                <div>
                  <span className="font-medium text-gray-700">Tags:</span>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {event.tags.map((tag, index) => (
                      <span key={index} className="inline-flex px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {event.requirements && (
                <div>
                  <span className="font-medium text-gray-700">Requirements:</span>
                  <p className="text-sm text-gray-600 mt-1">{event.requirements}</p>
                </div>
              )}
              
              {event.contactInfo && (
                <div>
                  <span className="font-medium text-gray-700">Contact Info:</span>
                  <p className="text-sm text-gray-600 mt-1">{event.contactInfo}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="btn-secondary"
          >
            Close
          </button>
          {!event.isApproved && (
            <>
              <button
                onClick={() => onApprove(false)}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                Reject
              </button>
              <button
                onClick={() => onApprove(true)}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                Approve
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// Delete Event Modal Component
interface DeleteEventModalProps {
  event: Event;
  onConfirm: () => void;
  onClose: () => void;
}

const DeleteEventModal: React.FC<DeleteEventModalProps> = ({ event, onConfirm, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-medium text-gray-900">Confirm Delete</h3>
        </div>
        
        <div className="px-6 py-4">
          <p className="text-sm text-gray-600">
            Are you sure you want to delete <strong>"{event.title}"</strong>? 
            This action cannot be undone and will also delete all associated tickets and registrations.
          </p>
        </div>

        <div className="px-6 py-4 border-t flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Delete Event
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminEvents;
