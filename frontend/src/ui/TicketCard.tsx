import { useState } from "react";
import { Link } from "react-router-dom";
import { TicketData } from "../pages/MyTickets";
import { Calendar, Clock, Download, MapPin, Ticket } from "lucide-react";
import axios from "axios";
import { formatDate, formatTime } from "../helper/date";
import { QRCode } from "./QRCode";
import SaveToCalendarButton from "./SaveToCalendarButton";
import { Event } from "../pages/Events";

interface Props {
    ticket: TicketData;
}

export const TicketCard = ({ ticket }: Props) => {
    const [showModal, setShowModal] = useState(false);
    const [reason, setReason] = useState("");
    const [comment, setComment] = useState("");

    const getStatusColor = (status: string) => {
        const colors: { [key: string]: string } = {
            active: "bg-green-100 text-green-800",
            used: "bg-blue-100 text-blue-800",
            cancelled: "bg-red-100 text-red-800",
            expired: "bg-gray-100 text-gray-800"
        };
        return colors[status] || "bg-gray-100 text-gray-800";
    };

    const downloadQRCode = () => {
        const link = document.createElement("a");
        link.download = `ticket-${ticket.ticketId}.png`;
        link.href = ticket.qrCodeImage;
        link.click();
    };

    const submitReturn = async () => {
        try {
            await axios.post(`/tickets/${ticket.ticketId}/return`, {
                reason,
                comment
            });
            window.location.reload();
        } catch (err) {
            console.error("Return ticket error:", err);
            alert("Could not return the ticket.");
        }
    };

    return (
        <>
            {showModal && (
                <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg">
                        <h2 className="text-lg font-semibold mb-4">
                            Return Ticket
                        </h2>

                        <label className="block text-sm font-medium mb-1">
                            Reason *
                        </label>
                        <input
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="w-full border rounded p-2 mb-3"
                            placeholder="Why are you returning this ticket?"
                        />

                        <label className="block text-sm font-medium mb-1">
                            Additional comments
                        </label>
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            className="w-full border rounded p-2 h-20 mb-4"
                            placeholder="Optional"
                        />

                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setShowModal(false)}
                                className="px-4 py-2 bg-gray-200 rounded"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={submitReturn}
                                disabled={!reason.trim()}
                                className="px-4 py-2 bg-red-600 text-white rounded disabled:bg-red-300"
                            >
                                Submit
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div id={ticket.ticketId} key={ticket._id} className="card">
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}
                        >
                            {ticket.status}
                        </span>
                        <span className="text-sm text-gray-500">
                            {ticket.price === 0 ? "Free" : `$${ticket.price}`}
                        </span>
                    </div>

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
                        <div className="text-center flex flex-col items-center">
                            <QRCode ticketID={ticket.ticketId} />

                            <p className="text-xs text-gray-500 mb-3">
                                Ticket ID: {ticket.ticketId}
                            </p>

                            <div className="flex flex-wrap justify-center gap-2 mt-2">
                                <button
                                    onClick={downloadQRCode}
                                    className="btn-outline text-sm flex items-center"
                                >
                                    <Download className="w-4 h-4 mr-1" />
                                    Download QR
                                </button>

                                {ticket.status === "active" && (
                                    <button
                                        onClick={() => setShowModal(true)}
                                        className="btn-outline text-sm flex items-center"
                                    >
                                        <Ticket className="w-4 h-4 mr-1" />
                                        Return Ticket
                                    </button>
                                )}

                                <SaveToCalendarButton event={ticket.event as Event} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};
