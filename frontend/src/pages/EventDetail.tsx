import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Clock, Users, Ticket, Bookmark, Share2, ArrowLeft, ImageIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';
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
    contactEmail: string;
  };
  createdBy: {
    firstName: string;
    lastName: string;
  };
  ticketsIssued: number;
  remainingCapacity: number;
  capacity: number;
  tags: string[];
  requirements?: string;
  contactInfo?: string;
  isClaimable: boolean;
  userHasTicket: boolean;
  isApproved: boolean;
  status: 'draft' |'published' | 'cancelled' | 'completed'
}

const EventDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [claimingTicket, setClaimingTicket] = useState(false);
  const [savingEvent, setSavingEvent] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    fetchEvent();
    checkIfSaved();
  }, [id]);

  const fetchEvent = async () => {
    try {
      const response = await axios.get(`/events/${id}`);
      setEvent(response.data);
      console.log("res", response.data)
    } catch (error) {
      console.error('Error fetching event:', error);
      toast.error('Event not found');
      navigate('/events');
    } finally {
      setLoading(false);
    }
  };

  const checkIfSaved = async () => {
    if (!user || user.role !== 'student') return;
    
    try {
      const response = await axios.get('/events/saved/my');
      const savedEventIds = response.data.map((e: any) => e._id);
      setIsSaved(savedEventIds.includes(id));
    } catch (error) {
      console.error('Error checking saved status:', error);
    }
  };

  const handleClaimTicket = async () => {
    if (!user) {
      toast.error('Please log in to claim a ticket');
      navigate('/login');
      return;
    }

    if (user.role !== 'student') {
      toast.error('Only students can claim tickets');
      return;
    }

    setClaimingTicket(true);
    try {
      await axios.post('/tickets/claim', { eventId: id });
      toast.success('Ticket claimed successfully!');
      fetchEvent(); // Refresh event data
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to claim ticket');
    } finally {
      setClaimingTicket(false);
    }
  };

  const handleSaveEvent = async () => {
    if (!user) {
      toast.error('Please log in to save events');
      navigate('/login');
      return;
    }

    if (user.role !== 'student') {
      toast.error('Only students can save events');
      return;
    }

    setSavingEvent(true);
    try {
      if (isSaved) {
        await axios.delete(`/events/${id}/save`);
        setIsSaved(false);
        toast.success('Event removed from saved events');
      } else {
        await axios.post(`/events/${id}/save`);
        setIsSaved(true);
        toast.success('Event saved to your calendar');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save event');
    } finally {
      setSavingEvent(false);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: event?.title,
          text: event?.description,
          url: window.location.href
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Event link copied to clipboard');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Event not found</h1>
        <button
          onClick={() => navigate('/events')}
          className="btn-primary"
        >
          Back to Events
        </button>
      </div>
    );
  }

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

  const isEventPassed = new Date(event.date) < new Date();
  const isSoldOut = event.remainingCapacity <= 0;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Back button */}
      <button
        onClick={() => navigate('/events')}
        className="flex items-center text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Events
      </button>

      {/* Event Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
          {event.imageUrl ? (
            <img
              src={event.imageUrl}
              alt={event.title}
              className="max-w-full max-h-full object-contain"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-gray-400">
              <ImageIcon className="w-8 h-8 mb-2" />
              <span className="text-sm">No image available</span>
            </div>
          )}
        </div>
        <div className="p-8">
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{event.title}</h1>
              <p className="text-lg text-gray-600 mb-4">{event.description}</p>
              <div className="flex items-center space-x-4">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-800">
                  {event.category}
                </span>
                <span className="text-sm text-gray-500">
                  by {event.organization.name}
                </span>
              </div>
            </div>
            <div className="flex space-x-2 ml-4">
              {user?.role === 'student' && (
                <button
                  onClick={handleSaveEvent}
                  disabled={savingEvent}
                  className={`p-2 rounded-lg border ${
                    isSaved
                      ? 'bg-primary-100 border-primary-300 text-primary-700'
                      : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  <Bookmark className="w-5 h-5" />
                </button>
              )}
              <button
                onClick={handleShare}
                className="p-2 rounded-lg border border-gray-300 text-gray-500 hover:bg-gray-50"
              >
                <Share2 className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Event Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="space-y-4">
              <div className="flex items-center text-gray-700">
                <Calendar className="w-5 h-5 mr-3 text-gray-400" />
                <div>
                  <p className="font-medium">{formatDate(event.date)}</p>
                  <p className="text-sm text-gray-500">
                    {formatTime(event.startTime)} - {formatTime(event.endTime)}
                  </p>
                </div>
              </div>
              <div className="flex items-center text-gray-700">
                <MapPin className="w-5 h-5 mr-3 text-gray-400" />
                <p>{event.location}</p>
              </div>
              <div className="flex items-center text-gray-700">
                <Users className="w-5 h-5 mr-3 text-gray-400" />
                <p>{event.organization.name}</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Ticket Information</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Type:</span>
                    <span className="font-medium">
                      {event.ticketType === 'free' ? 'Free' : `$${event.ticketPrice}`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Capacity:</span>
                    <span className="font-medium">{event.capacity}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tickets Issued:</span>
                    <span className="font-medium">{event.ticketsIssued}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Remaining:</span>
                    <span className="font-medium">{event.remainingCapacity}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Information */}
          {(event.tags.length > 0 || event.requirements || event.contactInfo) && (
            <div className="space-y-4">
              {event.tags.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {event.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {event.requirements && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Requirements</h3>
                  <p className="text-gray-700">{event.requirements}</p>
                </div>
              )}
              {event.contactInfo && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Contact Information</h3>
                  <p className="text-gray-700">{event.contactInfo}</p>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            {user?.role === 'student' && (
                <button
                  onClick={handleClaimTicket}
                  disabled={claimingTicket || !event.isClaimable || isEventPassed || !event.isApproved}
                  className={`w-full py-3 px-4 rounded-lg font-semibold flex items-center justify-center ${
                    isEventPassed
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : !event.isApproved
                      ? 'bg-yellow-100 text-yellow-700 cursor-not-allowed'
                      : !event.isClaimable
                      ? 'bg-gray-200 text-gray-600 cursor-not-allowed'
                      : 'bg-primary-600 hover:bg-primary-700 text-white'
                  }`}
                >
                  <Ticket className="w-5 h-5 mr-2" />
                  {claimingTicket
                    ? 'Claiming Ticket...'
                    : isEventPassed
                    ? 'Event Has Passed'
                    : !event.isApproved
                    ? 'Event Not Approved'
                    : event.status === "draft" 
                    ? 'Ticket Unavailable'
                    : event.userHasTicket
                    ? 'Ticket Already Claimed'
                    : !event.isClaimable
                    ? 'Sold Out'
                    : `Claim ${event.ticketType === 'free' ? 'Free' : `$${event.ticketPrice}`} Ticket`}
                </button>
            )}
            {(!user || user.role !== 'student') && (
              <div className="text-center py-4">
                <p className="text-gray-600 mb-2">
                  {!user ? 'Please log in to claim tickets' : 'Only students can claim tickets'}
                </p>
                {!user && (
                  <button
                    onClick={() => navigate('/login')}
                    className="btn-primary"
                  >
                    Log In
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetail;