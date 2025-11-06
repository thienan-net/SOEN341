import React, { useState, useEffect } from 'react';
import { Ticket, Calendar, MapPin, Clock, Download, QrCode } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { QRCode } from '../ui/QRCode';
import { formatDate, formatTime } from '../helper/date';

export const DefaultTIcket: TicketData = {
  _id: "",
  ticketId: "",
  event: {
    _id: "",
    title: "",
    date: "", // convert MongoDB timestamp to JS Date
    startTime: "",
    endTime: "",
    location: "",
    organization: {
      name: "", // You'll need to fetch organization name separately if not included
      logo: ""  // Same for logo
    }
  },
  user: {
    _id: "",
    email: "",
    firstName: "",
    lastName: ""
  },
  qrCodeImage: "",
  status: "active",
  price: 0,
  createdAt: ""
};
export interface TicketData {
  _id: string;
  ticketId: string;
  event: {
    _id: string;
    title: string;
    date: string;
    startTime: string;
    endTime: string;
    location: string;
    organization: {
      name: string;
      logo?: string;
    };
  };
  user: {
    email: string;
    firstName: string;
    lastName: string;
    _id: string;
  };
  status: 'active' | 'used' | 'cancelled' | 'expired';
  price: number;
  createdAt: string;
  qrCodeImage: string;
}

const MyTickets: React.FC = () => {
  const [tickets, setTickets] = useState<TicketData[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const response = await axios.get('/tickets/my');
      setTickets(response.data);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
    }
  };


  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      active: 'bg-green-100 text-green-800',
      used: 'bg-blue-100 text-blue-800',
      cancelled: 'bg-red-100 text-red-800',
      expired: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const downloadQRCode = (ticket: TicketData) => {
    const link = document.createElement('a');
    link.download = `ticket-${ticket.ticketId}.png`;
    link.href = ticket.qrCodeImage;
    link.click();
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
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">My Tickets</h1>
        <p className="text-gray-600">Manage your event tickets and QR codes</p>
      </div>
      {tickets.length === 0 ? (
        <div className="text-center py-12">
          <Ticket className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No tickets yet</h3>
          <p className="text-gray-600">Start by claiming tickets for events you're interested in!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tickets.map((ticket) => (
            <div id={ticket.ticketId} key={ticket._id} className="card">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                    {ticket.status}
                  </span>
                  <span className="text-sm text-gray-500">
                    {ticket.price === 0 ? 'Free' : `$${ticket.price}`}
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {ticket.event.title}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {ticket.event.organization.name}
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-500">
                    <Calendar className="w-4 h-4 mr-2" />
                    {formatDate(ticket.event.date)}
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <Clock className="w-4 h-4 mr-2" />
                    {formatTime(ticket.event.startTime)}
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <MapPin className="w-4 h-4 mr-2" />
                    {ticket.event.location}
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <div className="text-center">
                    <QRCode 
                      ticketID={ticket.ticketId}
                    />
                    {/* <img
                      src={ticket.qrCodeImage}
                      alt="QR Code"
                      className="w-24 h-24 mx-auto mb-2"
                    /> */}
                    <p className="text-xs text-gray-500 mb-3">
                      Ticket ID: {ticket.ticketId}
                    </p>
                    <button
                      onClick={() => downloadQRCode(ticket)}
                      className="btn-outline text-sm"
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Download QR
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyTickets;