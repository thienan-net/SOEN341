import React from 'react';
import { Calendar, Search, Filter } from 'lucide-react';
import { DateRangePicker } from 'rsuite';
import 'rsuite/dist/rsuite.min.css';
import { format, addDays, startOfWeek, endOfWeek, startOfMonth, addMonths, endOfMonth } from 'date-fns';

interface EventsFiltersProps {
  filters: { search: string; dateRange: [Date, Date], category: string };
  setFilters: React.Dispatch<React.SetStateAction<{ search: string; dateRange: [Date, Date], category: string }>>;
}

const EventsFilters: React.FC<EventsFiltersProps> = ({
  filters,
  setFilters
}) => {
  const categories : { value: string; label: string}[] = [
    { value: '', label: 'All Categories' },
    { value: 'academic', label: 'Academic' },
    { value: 'social', label: 'Social' },
    { value: 'sports', label: 'Sports' },
    { value: 'cultural', label: 'Cultural' },
    { value: 'career', label: 'Career' },
    { value: 'volunteer', label: 'Volunteer' },
    { value: 'other', label: 'Other' }
  ];
  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div
      style={{ alignItems: 'center', display: 'flex', flexDirection: 'column' }}
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search events..."
            className="input-field pl-10"
            value={filters.search}
            onChange={e => handleFilterChange('search', e.target.value)}
          />
        </div>

        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <Calendar className="h-5 w-5 text-gray-400" />
          </div>
          <DateRangePicker
            appearance="default"
            value={filters.dateRange}
            onChange={(range: [Date, Date] | null) => {
              if (range) setFilters({...filters, dateRange: range});
              else setFilters({...filters, dateRange: [new Date(), new Date()]});
            }}
            placeholder="Select date range"
            format="MMM dd, yyyy"
            character="→"
            renderValue={(value) => {
              if (!value) return 'Select date range';
              const [start, end] = value;
              return `${format(start, 'MMM dd, yyyy')} → ${format(end, 'MMM dd, yyyy')}`;
            }}
            style={{
              width: '100%',
              paddingLeft: '2.5rem',
              background: '#fafafa',
              border: '1px solid #ccc',
              borderRadius: '8px',
              height: '42px',
              display: 'flex',
              alignItems: 'center',
              fontWeight: 600,
              color: '#1a1a1a'
            }}
            shouldDisableDate={(date: Date) => {
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              return date < today;
            }}
            ranges={[
              {
                label: 'Tomorrow',
                value: [addDays(new Date(), 1), addDays(new Date(), 1)],
              },
              {
                label: 'Next Week',
                value: [
                  startOfWeek(addDays(new Date(), 7), { weekStartsOn: 1 }),
                  endOfWeek(addDays(new Date(), 7), { weekStartsOn: 1 }),
                ],
              },
              {
                label: 'Next Month',
                value: [
                  startOfMonth(addMonths(new Date(), 1)),
                  endOfMonth(addMonths(new Date(), 1))
                ]
              }
            ]}
          />
        </div>

        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Filter className="h-5 w-5 text-gray-400" />
          </div>
          <select
            className="input-field pl-10"
            value={filters.category}
            onChange={e => handleFilterChange('category', e.target.value)}
          >
            {categories.map((category) => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <button
        onClick={() => {
          setFilters({ search: '', dateRange: [new Date(), new Date()], category: '' });
        }}
        className="btn-secondary mt-5"
      >
        Clear Filters
      </button>
    </div>
  );
};

export default EventsFilters;
