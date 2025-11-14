import { Link } from "react-router-dom";
import { TicketData } from "../pages/MyTickets";
import { Calendar, Clock, Download, MapPin, Ticket, Users } from "lucide-react";
import axios from "axios";
import { formatDate, formatTime } from "../helper/date";
import { QRCode } from "./QRCode";
import SaveToCalendarButton from "./SaveToCalendarButton";
import { Event } from "../pages/Events";

interface Props {
    ticket: TicketData;
}

export const TicketCard = ({ ticket }: Props) => {

    const getStatusColor = (status: string) => {
        const colors: { [key: string]: string } = {
            active: "bg-green-100 text-green-800",
            used: "bg-blue-100 text-blue-800",
            cancelled: "bg-red-100 text-red-800",
            expired: "bg-gray-100 text-gray-800",
        };
        return colors[status] || "bg-gray-100 text-gray-800";
    };

    const downloadQRCode = () => {
        const link = document.createElement("a");
        link.download = `ticket-${ticket.ticketId}.png`;
        link.href = ticket.qrCodeImage;
        link.click();
    };


    const returnTicket = async () => {
        try {
            await axios.post(`/tickets/${ticket.ticketId}/return`);
            window.location.reload();
        } catch (err) {
            console.error("Return ticket error:", err);
            alert("Could not return the ticket.");
        }
    };

    return (
        <div id={ticket.ticketId} key={ticket._id} className="card">
            <div className="space-y-4">

                {/* Status + Price */}
                <div className="flex items-center justify-between">
                    <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                            ticket.status
                        )}`}
                    >
                        {ticket.status}
                    </span>
                    <span className="text-sm text-gray-500">
                        {ticket.price === 0 ? "Free" : `$${ticket.price}`}
                    </span>
                </div>

                {/* Title + Organization */}
                <div>
                    <Link to={`/events/${ticket.event._id}`}>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            {ticket.event.title}
                        </h3>
                    </Link>
                    <p className="text-sm text-gray-600">
                        {ticket.event.organization.name}
                    </p>
                </div>

                {/* Event Info */}
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

                {/* QR + Buttons */}
                <div className="pt-4 border-t border-gray-200">
                    <div className="text-center flex flex-col items-center">
                        <QRCode ticketID={ticket.ticketId} />

                        <p className="text-xs text-gray-500 mb-3">
                            Ticket ID: {ticket.ticketId}
                        </p>

                        {/* Buttons */}
                        <div className="flex flex-wrap justify-center gap-2 mt-2">

                            {/* Download QR */}
                            <button
                                onClick={downloadQRCode}
                                className="btn-outline text-sm flex items-center"
                            >
                                <Download className="w-4 h-4 mr-1" />
                                Download QR
                            </button>

                            {/* Return Ticket */}
                            {ticket.status === "active" && (
                                <button
                                    onClick={returnTicket}
                                    className="btn-outline text-sm flex items-center"
                                >
                                    <Ticket className="w-4 h-4 mr-1" />
                                    Return Ticket
                                </button>
                            )}

                            {/* Add to Calendar */}
                            <SaveToCalendarButton event={ticket.event as Event} />
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};
