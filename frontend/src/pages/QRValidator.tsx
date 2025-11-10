import { ArrowLeft, Calendar, MapPin, Ticket, Users } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { DefaultTIcket, TicketData } from './MyTickets';
import { DefaultUser, useAuth, User } from '../contexts/AuthContext';
import { QRCode } from '../ui/QRCode';
import { formatDate, formatTime } from '../helper/date';
import axios from 'axios';
import { toast } from 'react-toastify';

const QRValidator: React.FC = () => {
  const { user } = useAuth();
  // const ticket: TicketData = {
  //   _id: "6904d3b049ba17e79bd9d505",
  //   ticketId: "278747e4-26f0-43d9-897b-8ad43fe16c7a",
  //   event: {
  //     _id: "6904d1bf49ba17e79bd9d461",
  //     title: "Halloween",
  //     date: new Date(1762128000000).toString(), // convert MongoDB timestamp to JS Date
  //     startTime: "01:11",
  //     endTime: "02:11",
  //     location: "Concordia University",
  //     organization: {
  //       name: "Some organization", // You'll need to fetch organization name separately if not included
  //       logo: ""  // Same for logo
  //     }
  //   },
  //   user: "6904d26d49ba17e79bd9d4cc",
  //   qrCodeImage: "{\"ticketId\":\"278747e4-26f0-43d9-897b-8ad43fe16c7a\",\"eventId\":\"6904d1bf49ba17e79bd9d461\",\"userId\":\"6904d26d49ba17e79bd9d4cc\",\"timestamp\":\"2025-10-31T15:20:16.362Z\"}",
  //   status: "active",
  //   price: 123,
  //   createdAt: new Date(1761924016403).toString()
  // };
  const navigate = useNavigate();
  const [ticketUsed, setTicketUsed] = useState(false);
  const [validatingTicket, setValidatingTicket] = useState(false);
  const [attendee, setAttende] = useState<User>(DefaultUser);
  const [ticket, setTicket] = useState<TicketData>(DefaultTIcket);
  const { ticketId } = useParams<{ticketId: string}>();
  const isEventPassed = new Date(ticket.event.date) < new Date();

  const handleValidateTicket = async () => {
    try {
      setValidatingTicket(true)
      const response = await axios.post(`tickets/${ticketId}/use`);
      console.log(response.data)
      toast.success(response.data.message)
      setTicketUsed(true);
      setValidatingTicket(false)
    }
    catch (error) {
      setValidatingTicket(false);
      toast.error("You are not permitted to validate this ticket.")
      console.log("Error: ", error)
    }
  }

  useEffect(() => {
    const fetchTicket = async () => {
      try {
        if (!ticketId) return;
        const response = await axios.get(`/tickets/ticket-details/${ticketId}`);
        setTicket(response.data);
      } catch (error : any) {
        console.error("Fetch ticket error:", error);
        if (error.response?.status === 403 || error.response?.status === 404) {
          navigate('/not-authorized');
        }
      }
    };

    fetchTicket();
  }, [ticketId]);

  useEffect(()=> {
    const fetchUser = async () => {
      try {
        if(!ticket.user) return;
        console.log("user ticket", ticket.user)
        const response = await axios.get("/users/" + ticket.user._id);
        setAttende(response.data)
      }
      catch(error) {
        console.log("error getting user profile: ", error)
      }
    }
    fetchUser()
  }, [ticket.user])

  return (
      <div className="max-w-4xl mx-auto space-y-8">
          {/* Back button */}
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go back
          </button>

          {/* Event Header */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="mt-10">
              <QRCode 
                size={190}
                ticketID={ticketId ?? ""}
                />
            </div>
            <div className="p-8">
              <div className="flex items-start justify-between mb-6">
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{ticket.event.title}</h1>
                  {/* <p className="text-lg text-gray-600 mb-4">{ticket.event.date}</p> */}
                  <div className="flex items-center space-x-4">
                    {/* <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-800">
                      {ticket.event.}
                    </span> */}
                    <span className="text-sm text-gray-500">
                      by {ticket.event.organization.name}
                    </span>
                  </div>
                </div>
                {/* <div className="flex space-x-2 ml-4">
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
                </div> */}
              </div>

              {/* Event Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="space-y-4">
                  <div className="flex items-center text-gray-700">
                    <Calendar className="w-5 h-5 mr-3 text-gray-400" />
                    <div>
                      <p className="font-medium">{formatDate(ticket.event.date)}</p>
                      <p className="text-sm text-gray-500">
                        {formatTime(ticket.event.startTime)} - {formatTime(ticket.event.endTime)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center text-gray-700">
                    <MapPin className="w-5 h-5 mr-3 text-gray-400" />
                    <p>{ticket.event.location}</p>
                  </div>
                  <div className="flex items-center text-gray-700">
                    <Users className="w-5 h-5 mr-3 text-gray-400" />
                    <p>{ticket.event.organization.name}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-2">Ticket Information</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Ticket ID:</span>
                        <small className="font-small">
                          {ticketId}
                        </small>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Attendee:</span>
                        <span className="font-medium">{attendee.firstName} {attendee.lastName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Atteendee Email:</span>
                        <span className="font-medium">{attendee.email}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Status:</span>
                        <span className="font-medium">{ticket.status}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Ticket creation date:</span>
                        <span className="font-medium">{formatDate(ticket.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              {/* {(event.tags.length > 0 || event.requirements || event.contactInfo) && (
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
              )} */}

              {/* Action Buttons */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                {(user?.role === 'admin' || user?.role === "organizer") && (
                  <button
                    onClick={handleValidateTicket}
                    disabled={ticket.status !== "active"}
                    className={`w-full py-3 px-4 rounded-lg font-semibold flex items-center justify-center ${
                      isEventPassed
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : (ticket.status === "used" || ticketUsed) || ticket.status === "cancelled"
                        ? 'bg-red-100 text-red-700 cursor-not-allowed'
                        : 'bg-primary-600 hover:bg-primary-700 text-white'
                    }`}
                  >
                    <Ticket className="w-5 h-5 mr-2" />
                    {validatingTicket
                      ? 'Validating Ticket...'
                      : isEventPassed
                      ? 'Event Has Passed'
                      : (ticket.status === "used" || ticketUsed)
                      ? 'Ticket already used'
                      : ticket.status === "cancelled" 
                      ? 'Ticket cancelled'
                      : `Validate & Use ticket`}
                  </button>
                )}
                <div className="text-center py-4">
                  {!user ? (
                    <>
                      <p className="text-gray-600 mb-2">Please log in to claim tickets</p>
                      <button
                        onClick={() => navigate('/login')}
                        className="btn-primary"
                      >
                        Log In
                      </button>
                    </>
                  ) : user.role === "student" ? (
                    <p className="text-gray-600 mb-2">Only admin or organizers can validate</p>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </div>
  );
};

export default QRValidator;