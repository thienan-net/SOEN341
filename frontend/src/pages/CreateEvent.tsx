import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Clock, Users, DollarSign, Tag, FileText, Image } from 'lucide-react';
import { toast } from 'react-toastify';
import axios from 'axios';

const CreateEvent: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    startTime: '',
    endTime: '',
    location: '',
    category: 'academic',
    ticketType: 'free',
    ticketPrice: '',
    capacity: '',
    tags: '',
    requirements: '',
    contactInfo: ''
  });
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState<string>("");

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setImage(event.target.value); 
  };
  const categories = [
    { value: 'academic', label: 'Academic' },
    { value: 'social', label: 'Social' },
    { value: 'sports', label: 'Sports' },
    { value: 'cultural', label: 'Cultural' },
    { value: 'career', label: 'Career' },
    { value: 'volunteer', label: 'Volunteer' },
    { value: 'other', label: 'Other' }
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const eventData  = {
        ...formData,
        capacity: parseInt(formData.capacity),
        ticketPrice: formData.ticketType === 'paid' ? parseFloat(formData.ticketPrice) : undefined,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        imageUrl: image
      };

      await axios.post('/events', eventData);
      toast.success('Event created successfully!');
      navigate('/organizer/dashboard');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Create New Event</h1>
        <p className="text-gray-600">Fill in the details for your event</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="title" className="label">Event Title *</label>
              <input
                type="text"
                id="title"
                name="title"
                required
                className="input-field"
                placeholder="Enter event title"
                value={formData.title}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="description" className="label">Description *</label>
              <textarea
                id="description"
                name="description"
                required
                rows={4}
                className="input-field"
                placeholder="Describe your event"
                value={formData.description}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="imageUrl" className="label">
                Image URL:
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Image className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="url"
                  id="imageUrl"
                  name="imageUrl"
                  value={image}
                  onChange={handleImageChange}
                  placeholder="Enter image URL"
                  className="input-field pl-10"
                />
              </div>

              {/* Optional: preview */}
              {image && (
                <div className="mt-4">
                  <img src={image} alt="Preview" className="w-48 h-48 object-cover rounded-lg" />
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="date" className="label">Date *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="date"
                    id="date"
                    name="date"
                    required
                    className="input-field pl-10"
                    value={formData.date}
                    onChange={handleChange}
                    min={new Date().toISOString().split("T")[0]} 
                  />
                </div>
              </div>

              <div>
                <label htmlFor="category" className="label">Category *</label>
                <select
                  id="category"
                  name="category"
                  required
                  className="input-field"
                  value={formData.category}
                  onChange={handleChange}
                >
                  {categories.map((category) => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="startTime" className="label">Start Time *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Clock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="time"
                    id="startTime"
                    name="startTime"
                    required
                    className="input-field pl-10"
                    value={formData.startTime}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="endTime" className="label">End Time *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Clock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="time"
                    id="endTime"
                    name="endTime"
                    required
                    className="input-field pl-10"
                    value={formData.endTime}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="location" className="label">Location *</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MapPin className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  id="location"
                  name="location"
                  required
                  className="input-field pl-10"
                  placeholder="Enter event location"
                  value={formData.location}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Ticket Information</h2>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="ticketType" className="label">Ticket Type *</label>
              <select
                id="ticketType"
                name="ticketType"
                required
                className="input-field"
                value={formData.ticketType}
                onChange={handleChange}
              >
                <option value="free">Free</option>
                <option value="paid">Paid</option>
              </select>
            </div>

            {formData.ticketType === 'paid' && (
              <div>
                <label htmlFor="ticketPrice" className="label">Ticket Price *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <DollarSign className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="number"
                    id="ticketPrice"
                    name="ticketPrice"
                    min="0"
                    step="0.01"
                    required={formData.ticketType === 'paid'}
                    className="input-field pl-10"
                    placeholder="0.00"
                    value={formData.ticketPrice}
                    onChange={handleChange}
                  />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="capacity" className="label">Capacity *</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Users className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="number"
                  id="capacity"
                  name="capacity"
                  required
                  min="1"
                  className="input-field pl-10"
                  placeholder="Maximum number of attendees"
                  value={formData.capacity}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h2>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="tags" className="label">Tags</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Tag className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  id="tags"
                  name="tags"
                  className="input-field pl-10"
                  placeholder="Enter tags separated by commas"
                  value={formData.tags}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <label htmlFor="requirements" className="label">Requirements</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FileText className="h-5 w-5 text-gray-400" />
                </div>
                <textarea
                  id="requirements"
                  name="requirements"
                  rows={3}
                  className="input-field pl-10"
                  placeholder="Any special requirements for attendees"
                  value={formData.requirements}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <label htmlFor="contactInfo" className="label">Contact Information</label>
              <textarea
                id="contactInfo"
                name="contactInfo"
                rows={2}
                className="input-field"
                placeholder="How can attendees contact you?"
                value={formData.contactInfo}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/organizer/dashboard')}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
          >
            {loading ? 'Creating...' : 'Create Event'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateEvent;