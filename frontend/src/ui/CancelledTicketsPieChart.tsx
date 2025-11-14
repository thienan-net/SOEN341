import React from 'react';
import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  Title,
} from 'chart.js';
import { returnReasons } from './TicketCard';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend, Title);

interface CancelledTicket {
  reason: string;
  count: number;
}

interface Props {
  data: CancelledTicket[];
  title?: string;
}

const CancelledTicketsPieChart: React.FC<Props> = ({ data, title = 'Cancelled Tickets' }) => {
  // Prepare chart data
  const chartData = {
    labels: data.map(d => returnReasons.find(x=> x.value === d.reason)?.label),
    datasets: [
      {
        label: 'Cancelled Tickets',
        data: data.map(d => d.count),
        backgroundColor: [
          '#EF4444', // Red
          '#F59E0B', // Orange
          '#3B82F6', // Blue
          '#10B981', // Green
          '#8B5CF6', // Purple
          '#06B6D4', // Cyan
          '#FBBF24', // Yellow
        ],
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { position: 'top' as const },
      title: { display: true, text: title, font: { size: 18 } },
    },
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Cancelled Tickets Analytics</h2>
        <div style={{ height: '300px', width: '100%' }}>
            <Pie data={chartData} options={options} />
        </div>
    </div>
  );
};

export default CancelledTicketsPieChart;
