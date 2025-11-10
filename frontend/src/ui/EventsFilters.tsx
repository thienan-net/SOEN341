import React from 'react';
import { Calendar, Search, Filter, Box, HelpingHand, Briefcase, Globe, Users, School, Medal } from 'lucide-react';
import { DateRangePicker } from 'rsuite';
import 'rsuite/dist/rsuite.min.css';
import { format, addDays, startOfWeek, endOfWeek, startOfMonth, addMonths, endOfMonth } from 'date-fns';
import { StyledSelect } from './StyledSelect';

interface EventsFiltersProps {
  filters: { search: string; dateRange?: [Date, Date]; category: string };
  setFilters: React.Dispatch<React.SetStateAction<{ search: string; dateRange?: [Date, Date]; category: string }>>;
}

const EventsFilters: React.FC<EventsFiltersProps> = ({ filters, setFilters }) => {
  const categories: { value: string; label: string; icon: JSX.Element }[] = [
    { value: '', label: 'All Categories', icon: <Box /> },
    { value: 'academic', label: 'Academic', icon: <School /> },
    { value: 'social', label: 'Social', icon: <Users /> },
    { value: 'sports', label: 'Sports', icon: <Medal /> },
    { value: 'cultural', label: 'Cultural', icon: <Globe /> },
    { value: 'career', label: 'Career', icon: <Briefcase /> },
    { value: 'volunteer', label: 'Volunteer', icon: <HelpingHand /> },
    { value: 'other', label: 'Other', icon: <Box /> },
  ];

  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 flex flex-col items-center">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
        {/* Search */}
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

        {/* Date Range */}
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <Calendar className="h-5 w-5 text-gray-400" />
          </div>
          <DateRangePicker
            appearance="default"
            value={filters.dateRange || null}
            onChange={(range: [Date, Date] | null) => handleFilterChange('dateRange', range || undefined)}
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
                ],
              },
            ]}
          />
        </div>

        {/* Category */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Filter className="h-5 w-5 text-gray-400" />
          </div>
          <StyledSelect 
            options={categories}
            value={filters.category}
            onChange={(e) => handleFilterChange('category', e)}
          />
        </div>
      </div>

      {/* Clear Filters */}
      <button
        onClick={() => setFilters({ search: '', dateRange: undefined, category: '' })}
        className="btn-secondary mt-5"
      >
        Clear Filters
      </button>
    </div>
  );
};

export default EventsFilters;
