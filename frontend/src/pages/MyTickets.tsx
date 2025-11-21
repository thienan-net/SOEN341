import React, { useState, useEffect } from 'react';
import { Ticket } from 'lucide-react';
import axios from 'axios';
import { TicketCard } from '../ui/TicketCard';

export const DefaultTIcket: TicketData = {
  _id: "",
  ticketId: "",
  event: {
    _id: "",
    title: "",
    date: "",
    startTime: "",
    endTime: "",
    location: "",
    organization: { name: "", logo: "" }
  },
  user: { _id: "", email: "", firstName: "", lastName: "" },
  qrCodeImage: "",
  status: "active",
  price: 0,
  createdAt: "",
  returnReason: "",
  returnComment: ""
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
    organization: { name: string; logo?: string };
  };
  user: { email: string; firstName: string; lastName: string; _id: string };
  status: 'active' | 'used' | 'cancelled' | 'expired';
  price: number;
  createdAt: string;
  qrCodeImage: string;
  returnReason: string;
  returnComment: string;
}

const MyTickets: React.FC = () => {
  const [tickets, setTickets] = useState<TicketData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"active" | "used" | "cancelled" | "all">("all");

  const filteredTickets =
    activeTab === "all"
      ? tickets
      : tickets.filter((ticket) => ticket.status === activeTab);

  // Sort active tickets first
  const sortedTickets = filteredTickets.sort((a, b) => {
    if (a.status === "active" && b.status !== "active") return -1;
    if (a.status !== "active" && b.status === "active") return 1;
    return 0;
  });

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
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">My Tickets</h1>
        <p className="text-gray-600">Manage your event tickets and QR codes</p>
      </div>

      {/* Tabs */}
      <div className="flex justify-center gap-4">
        {["active", "used", "cancelled", "all"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as "active" | "used" | "cancelled" | "all")}
            className={`px-4 py-2 rounded-lg font-medium ${
              activeTab === tab
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Tickets or empty state */}
      {sortedTickets.length === 0 ? (
        <div className="text-center py-12">
          <Ticket className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No tickets yet</h3>
          <p className="text-gray-600">Start by claiming tickets for events you're interested in!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-auto">
          {sortedTickets.map((ticket) => (
            <TicketCard tickets={tickets} setTickets={setTickets} ticket={ticket} key={ticket._id} />
          ))}
        </div>
      )}
    </div>
  );
};

export default MyTickets;
