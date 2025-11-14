  import React, { useState, useEffect } from 'react';
  import { Ticket, Calendar, MapPin, Clock, Download, QrCode, Users } from 'lucide-react';
  import axios from 'axios';
  import { useAuth } from '../contexts/AuthContext';
  import { QRCode } from '../ui/QRCode';
  import { formatDate, formatTime } from '../helper/date';
  import { Link } from 'react-router-dom';
  import { TicketCard } from '../ui/TicketCard';

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
              <TicketCard ticket={ticket} />
            ))}
          </div>
        )}
      </div>
    );
  };

  export default MyTickets;