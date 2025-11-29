import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { listingsApi } from '../../services/api/listings';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

const FlightPriceCalendar = ({ selectedDate, onDateSelect, from, to, minDate }) => {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const date = selectedDate ? new Date(selectedDate + 'T00:00:00') : new Date();
    return new Date(date.getFullYear(), date.getMonth(), 1);
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const minDateObj = minDate ? new Date(minDate + 'T00:00:00') : today;

  // Calculate date range for API call (current month + next month)
  const getDateRange = () => {
    const start = new Date(currentMonth);
    const end = new Date(currentMonth);
    end.setMonth(end.getMonth() + 2);
    end.setDate(0); // Last day of next month
    
    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
    };
  };

  const { startDate, endDate } = getDateRange();

  // Fetch prices for the date range
  const { data: priceData, isLoading } = useQuery({
    queryKey: ['flight-prices', from, to, startDate, endDate],
    queryFn: async () => {
      if (!from || !to) {
        return { prices: {} };
      }
      try {
        const data = await listingsApi.getFlightPricesByDate({
          from,
          to,
          startDate,
          endDate,
        });
        return data || { prices: {} };
      } catch (error) {
        console.error('Failed to load flight prices:', error);
        return { prices: {} };
      }
    },
    enabled: !!from && !!to,
  });

  const prices = priceData?.prices || {};

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const formatDate = (year, month, day) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  const isDateDisabled = (dateStr) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date < minDateObj;
  };

  const isDateSelected = (dateStr) => {
    return dateStr === selectedDate;
  };

  const handleDateClick = (dateStr) => {
    if (!isDateDisabled(dateStr)) {
      onDateSelect(dateStr);
    }
  };

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const renderCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="aspect-square"></div>);
    }

    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = formatDate(year, month, day);
      const date = new Date(dateStr + 'T00:00:00');
      const disabled = isDateDisabled(dateStr);
      const selected = isDateSelected(dateStr);
      const price = prices[dateStr];
      const isToday = dateStr === today.toISOString().split('T')[0];

      days.push(
        <div
          key={dateStr}
          className={`
            aspect-square flex flex-col items-center justify-center p-1 rounded-lg transition-all border-2
            ${disabled 
              ? 'opacity-30 cursor-not-allowed border-transparent' 
              : 'cursor-pointer hover:bg-base-200 border-transparent'
            }
            ${selected 
              ? 'bg-primary text-primary-content border-primary' 
              : ''
            }
            ${isToday && !selected 
              ? 'border-primary' 
              : ''
            }
          `}
          onClick={() => !disabled && handleDateClick(dateStr)}
        >
          <div className="text-sm font-medium">{day}</div>
          {price !== undefined && price !== null && (
            <div className={`text-xs mt-0.5 font-semibold ${selected ? 'text-primary-content' : 'text-primary'}`}>
              ${price}
            </div>
          )}
        </div>
      );
    }

    return days;
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div className="bg-base-100 rounded-lg shadow-xl p-6 max-w-md min-w-[350px]">
      <div className="calendar-header flex items-center justify-between mb-4">
        <button
          onClick={handlePrevMonth}
          className="btn btn-ghost btn-sm"
          aria-label="Previous month"
        >
          <FaChevronLeft />
        </button>
        <h3 className="text-xl font-bold">
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </h3>
        <button
          onClick={handleNextMonth}
          className="btn btn-ghost btn-sm"
          aria-label="Next month"
        >
          <FaChevronRight />
        </button>
      </div>

      <div className="calendar-weekdays grid grid-cols-7 gap-1 mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="text-center text-sm font-semibold text-base-content/70 py-2">
            {day}
          </div>
        ))}
      </div>

      {isLoading && from && to ? (
        <div className="flex justify-center items-center py-8">
          <span className="loading loading-spinner loading-md"></span>
        </div>
      ) : (
        <div className="calendar-days grid grid-cols-7 gap-1">
          {renderCalendar()}
        </div>
      )}

      {(!from || !to) && (
        <div className="mt-4 text-sm text-base-content/70 text-center">
          Select origin and destination to see prices
        </div>
      )}
    </div>
  );
};

export default FlightPriceCalendar;

