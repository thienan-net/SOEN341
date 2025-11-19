import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";

export interface Event {
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
  organization: string;
  createdBy: string;
  tags: string[];
  requirements?: string;
  contactInfo?: string;
  createdAt: Date;
  updatedAt: Date;
  registrations?: number; 
  policyNotes?: string;
}

const EditEventPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [eventData, setEventData] = useState<Partial<Event>>({});
  const [imagePreview, setImagePreview] = useState<string>("");

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const res = await axios.get<Event>(`/events/${id}`);
        const e = res.data;

        setEventData({
          title: e.title,
          description: e.description,
          category: e.category,
          date: e.date.split("T")[0],
          startTime: e.startTime,
          endTime: e.endTime,
          location: e.location,
          ticketType: e.ticketType,
          ticketPrice: e.ticketPrice,
          imageUrl: e.imageUrl,
          capacity: e.capacity,
          tags: e.tags || [],
          requirements: e.requirements || "",
          contactInfo: e.contactInfo || "",
          status: e.status || "draft",
          policyNotes: e.policyNotes || "",
        });

        setImagePreview(e.imageUrl || "");
      } catch (error: any) {
        toast.error(error.message || "Failed to load event details");
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [id]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setEventData({ ...eventData, [name]: value });

    if (name === "imageUrl") setImagePreview(value);
  };

  const handleTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEventData({ ...eventData, tags: e.target.value.split(",").map(t => t.trim()) });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.put(`/events/${id}`, eventData);
      toast.success("Event updated successfully");
      navigate("/organizer/events");
    } catch (error: any) {
      toast.error(error.message || "Failed to update event");
    }
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-xl shadow-md">
      <h2 className="text-2xl font-semibold mb-6">Edit Event</h2>

      <form onSubmit={handleSubmit} className="space-y-4">

        {/* Title */}
        <div>
          <label className="block text-sm font-medium">Title</label>
          <input
            type="text"
            name="title"
            value={eventData.title || ""}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md p-2"
            required
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium">Description</label>
          <textarea
            name="description"
            value={eventData.description || ""}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md p-2"
            rows={4}
            required
          />
        </div>

        {/* Category & Location */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">Category</label>
            <input
              type="text"
              name="category"
              value={eventData.category || ""}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md p-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Location</label>
            <input
              type="text"
              name="location"
              value={eventData.location || ""}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md p-2"
              required
            />
          </div>
        </div>

        {/* Date & Time */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium">Date</label>
            <input
              type="date"
              name="date"
              value={eventData.date || ""}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md p-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Start Time</label>
            <input
              type="time"
              name="startTime"
              value={eventData.startTime || ""}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md p-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium">End Time</label>
            <input
              type="time"
              name="endTime"
              value={eventData.endTime || ""}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md p-2"
              required
            />
          </div>
        </div>

        {/* Ticket Type & Price */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">Ticket Type</label>
            <select
              name="ticketType"
              value={eventData.ticketType || "free"}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md p-2"
            >
              <option value="free">Free</option>
              <option value="paid">Paid</option>
            </select>
          </div>

          {eventData.ticketType === "paid" && (
            <div>
              <label className="block text-sm font-medium">Ticket Price</label>
              <input
                type="number"
                name="ticketPrice"
                value={eventData.ticketPrice || ""}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md p-2"
                min={0}
              />
            </div>
          )}
        </div>

        {/* Capacity */}
        <div>
          <label className="block text-sm font-medium">Capacity</label>
          <input
            type="number"
            name="capacity"
            value={eventData.capacity || ""}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md p-2"
            min={1}
          />
        </div>

        {/* Image URL & Preview */}
        <div>
          <label className="block text-sm font-medium">Image URL</label>
          <input
            type="text"
            name="imageUrl"
            value={eventData.imageUrl || ""}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md p-2 mb-2"
          />
          {imagePreview && (
            <img
              src={imagePreview}
              alt="Event preview"
              className="w-full h-48 object-cover rounded-md border border-gray-200"
            />
          )}
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium">Tags (comma separated)</label>
          <input
            type="text"
            name="tags"
            value={(eventData.tags || []).join(", ")}
            onChange={e => setEventData({ ...eventData, tags: e.target.value.split(",").map(t => t.trim()) })}
            className="w-full border border-gray-300 rounded-md p-2"
          />
        </div>

        {/* Requirements */}
        <div>
          <label className="block text-sm font-medium">Requirements</label>
          <textarea
            name="requirements"
            value={eventData.requirements || ""}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md p-2"
            rows={2}
          />
        </div>

        {/* Contact Info */}
        <div>
          <label className="block text-sm font-medium">Contact Info</label>
          <input
            type="text"
            name="contactInfo"
            value={eventData.contactInfo || ""}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md p-2"
          />
        </div>

        {/* Policy Notes */}
        <div>
          <label className="block text-sm font-medium">Policy Notes</label>
          <textarea
            name="policyNotes"
            value={eventData.policyNotes || ""}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md p-2"
            rows={2}
          />
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium">Status</label>
          <select
            name="status"
            value={eventData.status || "draft"}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md p-2"
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="cancelled">Cancelled</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        <button
          type="submit"
          className="w-full bg-primary-600 text-white p-3 rounded-md hover:bg-primary-700 transition"
        >
          Update Event
        </button>
      </form>
    </div>
  );
};

export default EditEventPage;
