import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import axios from 'axios';
import { MemoryRouter } from 'react-router-dom';
import EventList from '../components/EventList'; // adjust path if needed

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Integration Test — Event Filtering', () => 
    {
  const today = new Date().toISOString().split('T')[0];
  const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];
  const nextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];

  const mockEvents = [
    {
      _id: '1',
      title: 'AI Conference',
      category: 'Technology',
      location: 'SGW Campus',
      date: today, // today
      startTime: '09:00',
      endTime: '17:00',
      ticketType: 'free',
      organization: { name: 'Tech Club' },
      tags: ['AI'],
      capacity: 200,
      ticketsIssued: 50,
      remainingCapacity: 150,
    },

    {
      _id: '2',
      title: 'Music Night',
      category: 'Music',
      location: 'Loyola Campus',
      date: nextWeek, // next week
      startTime: '19:00',
      endTime: '22:00',
      ticketType: 'paid',
      ticketPrice: 10,
      organization: { name: 'Music Society' },
      tags: ['Concert'],
      capacity: 100,
      ticketsIssued: 30,
      remainingCapacity: 70,
    },

    {
      _id: '3',
      title: 'Career Fair',
      category: 'Career',
      location: 'SGW Campus',
      date: nextMonth, // future (upcoming)
      startTime: '10:00',
      endTime: '15:00',
      ticketType: 'free',
      organization: { name: 'Career Center' },
      tags: ['Jobs'],
      capacity: 100,
      ticketsIssued: 20,
      remainingCapacity: 80,
    },
  ];

  beforeEach(() => 
    {
    jest.clearAllMocks();
  });

  it('filters events correctly by campus, category, and date range', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: mockEvents });

    render(
      <MemoryRouter>
        <EventList />
      </MemoryRouter>
    );

    // wait
    await waitFor(() => 
        {
      expect(screen.getByText('AI Conference')).toBeInTheDocument();
      expect(screen.getByText('Music Night')).toBeInTheDocument();
      expect(screen.getByText('Career Fair')).toBeInTheDocument();
    });

    // campus filter
    const campusSelect = screen.getByLabelText(/Campus/i);
    fireEvent.change(campusSelect, { target: { value: 'SGW Campus' } });

    await waitFor(() => {
      expect(screen.getByText('AI Conference')).toBeInTheDocument();
      expect(screen.getByText('Career Fair')).toBeInTheDocument();
      expect(screen.queryByText('Music Night')).not.toBeInTheDocument();
    });

    // category
    const categorySelect = screen.getByLabelText(/Category/i);
    fireEvent.change(categorySelect, { target: { value: 'Technology' } });

    await waitFor(() => {
      expect(screen.getByText('AI Conference')).toBeInTheDocument();
      expect(screen.queryByText('Career Fair')).not.toBeInTheDocument();
      expect(screen.queryByText('Music Night')).not.toBeInTheDocument();
    });

    // Reset
    fireEvent.change(campusSelect, { target: { value: 'All' } });
    fireEvent.change(categorySelect, { target: { value: 'All' } });

    await waitFor(() => {
      expect(screen.getByText('AI Conference')).toBeInTheDocument();
      expect(screen.getByText('Music Night')).toBeInTheDocument();
      expect(screen.getByText('Career Fair')).toBeInTheDocument();
    });

    // date
    const dateSelect = screen.getByLabelText(/Date Range/i);

    // today
    fireEvent.change(dateSelect, { target: { value: 'Today' } });
    await waitFor(() => {
      expect(screen.getByText('AI Conference')).toBeInTheDocument();
      expect(screen.queryByText('Music Night')).not.toBeInTheDocument();
      expect(screen.queryByText('Career Fair')).not.toBeInTheDocument();
    });

    // this week
    fireEvent.change(dateSelect, { target: { value: 'This Week' } });
    await waitFor(() => {
      expect(screen.getByText('AI Conference')).toBeInTheDocument();
      expect(screen.getByText('Music Night')).toBeInTheDocument();
      expect(screen.queryByText('Career Fair')).not.toBeInTheDocument();
    });

    // late
    fireEvent.change(dateSelect, { target: { value: 'Upcoming' } });
    await waitFor(() => {
      expect(screen.getByText('Career Fair')).toBeInTheDocument();
      expect(screen.queryByText('AI Conference')).not.toBeInTheDocument();
      expect(screen.queryByText('Music Night')).not.toBeInTheDocument();
    });
  });
});
