import { useState } from "react";
import { Link } from "react-router-dom";
import { TicketData } from "../pages/MyTickets";
import { Calendar, Clock, Download, MapPin, Ticket } from "lucide-react";
import axios from "axios";
import { formatDate, formatTime } from "../helper/date";
import { QRCode } from "./QRCode";
import SaveToCalendarButton from "./SaveToCalendarButton";
import { Event } from "../pages/Events";
import { StyledSelect } from "./StyledSelect";
import { toast } from "react-toastify";

interface Props {
    ticket: TicketData;
    tickets: TicketData[];
    setTickets: React.Dispatch<React.SetStateAction<TicketData[]>>;
}

export const returnReasons = [
    { value: "unable_to_attend", label: "Unable to attend" },
    { value: "no_longer_interested", label: "No longer interested" },
    { value: "wrong_event", label: "Wrong event" },
    { value: "duplicate_ticket", label: "Duplicate ticket" },
    { value: "schedule_conflict", label: "Schedule conflict" },
    { value: "personal_reasons", label: "Personal reasons" },
    { value: "other", label: "Other" }
];

export const TicketCard = ({ ticket, tickets, setTickets }: Props) => {
    const [showReturnModal, setShowReturnModal] = useState(false);
    const [returnReason, setReturnReason] = useState("");
    const [returnComment, setReturnComment] = useState("");

    const getStatusColor = (status: string) => {
        const colors: { [key: string]: string } = {
            active: "bg-green-100 text-green-800",
            used: "bg-blue-100 text-blue-800",
            cancelled: "bg-red-100 text-red-800",
            expired: "bg-gray-100 text-gray-800"
        };
        return colors[status] || "bg-gray-100 text-gray-800";
    };

    const getCardColor = (status: string) => {
        const colors: { [key: string]: string } = {
            active: "bg-green-50",
            cancelled: "bg-red-50"
        };
        return colors[status] || "bg-white";
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
                reason: returnReason,
                comment: returnComment
            });

            const updated = [...tickets];
            const modified = updated.find((x) => x.ticketId === ticket.ticketId);
            if (modified) {
                modified.status = "cancelled";
                modified.returnReason = returnReason;
                modified.returnComment = returnComment;
            }
            setTickets(updated);

            setShowReturnModal(false);
            setReturnReason("");
            setReturnComment("");
            toast.success("Ticket returned successfully.");
        } catch (err) {
            console.error("Return ticket error:", err);
            toast.error("Could not return the ticket.");
        }
    };

    return (
        <div
            id={ticket.ticketId}
            key={ticket._id}
            className={`card rounded-lg shadow p-4 ${getCardColor(ticket.status)}`}
        >
            <div className="space-y-4">

                {/* Status + Price */}
                <div className="flex items-center justify-between">
                    <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                            ticket.status
                        )}`}
                    >
                        {ticket.status === "cancelled" ? "returned" : ticket.status}
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

                {/* QR + Buttons (Active only) */}
                {ticket.status === "active" && (
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

                                <button
                                    onClick={() => setShowReturnModal(true)}
                                    className="btn-outline text-sm flex items-center"
                                >
                                    <Ticket className="w-4 h-4 mr-1" />
                                    Return Ticket
                                </button>

                                <SaveToCalendarButton event={ticket.event as Event} />
                            </div>
                        </div>
                    </div>
                )}

                {/* Returned ticket details */}
                {ticket.status === "cancelled" && (
                    <div className="pt-4 border-t border-gray-200">
                        <p className="text-sm text-gray-700">
                            <strong>Return reason:</strong>{" "}
                            {returnReasons.find((x) => x.value === ticket.returnReason)?.label ||
                                ticket.returnReason}
                        </p>

                        {ticket.returnComment && (
                            <p className="text-sm text-gray-700">
                                <strong>Comments:</strong> {ticket.returnComment}
                            </p>
                        )}
                    </div>
                )}
            </div>

            {/* Return Modal */}
            {showReturnModal && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 flex flex-col justify-between">
                        <div>
                            <h2 className="text-lg font-semibold mb-4">Return Ticket</h2>

                            <label className="block mb-2 text-sm font-medium text-gray-700">
                                Reason
                            </label>
                            <StyledSelect
                                options={returnReasons}
                                value={returnReason}
                                onChange={setReturnReason}
                            />

                            <label className="block mt-4 mb-2 text-sm font-medium text-gray-700">
                                Additional Comments
                            </label>
                            <textarea
                                className="w-full border border-gray-300 rounded-md p-2 resize-none"
                                rows={3}
                                value={returnComment}
                                onChange={(e) => setReturnComment(e.target.value)}
                                placeholder="Optional comments..."
                            />
                        </div>

                        <div className="flex justify-end gap-2 mt-4">
                            <button
                                onClick={() => setShowReturnModal(false)}
                                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                            >
                                Close
                            </button>

                            <button
                                onClick={submitReturn}
                                disabled={!returnReason}
                                className={`px-4 py-2 rounded text-white ${
                                    returnReason
                                        ? "bg-red-600 hover:bg-red-700"
                                        : "bg-red-300 cursor-not-allowed"
                                }`}
                            >
                                Confirm Return
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
