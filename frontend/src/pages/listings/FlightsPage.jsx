import { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaPlane, FaBed, FaCar, FaClock, FaCalendar, FaTimes } from 'react-icons/fa';
import { listingsApi } from '../../services/api/listings';
import FlightPriceCalendar from '../../components/common/FlightPriceCalendar';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';

// Helper function to parse date string as local time (not UTC)
const parseLocalDate = (dateStr) => {
  if (!dateStr) return new Date();
  // Add T00:00:00 to force local timezone interpretation
  return new Date(dateStr + 'T00:00:00');
};

// Helper function to add days to a date string without timezone issues
const addDaysToDateString = (dateStr, days) => {
  const date = parseLocalDate(dateStr);
  date.setDate(date.getDate() + days);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper function to check if flight is valid based on current time
const isFlightValid = (flight) => {
  const today = new Date().toISOString().split('T')[0];
  
  // If flight is not today, it's valid
  if (flight.departDate !== today) {
    return true;
  }
  
  // If flight is today, check if departure time is in the future
  const now = new Date();
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  
  // Compare departure time with current time
  return flight.departureTime >= currentTime;
};

// Default dates
const getDefaultDates = () => {
  const today = new Date();
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);

  return {
    today: today.toISOString().split('T')[0],
    nextWeek: nextWeek.toISOString().split('T')[0],
  };
};

const defaultDates = getDefaultDates();

const defaultFilters = {
  from: '',
  to: '',
  date: defaultDates.today,
  returnDate: defaultDates.nextWeek,
  minPrice: '',
  maxPrice: '',
  nonstop: 'any',
  airlines: [], // Changed to array for multi-select
  sort: 'price-asc', // Combined sort: 'price-asc', 'price-desc', 'duration-asc'
};

const FlightsPage = () => {
  useDocumentTitle('Search Flights');
  
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const toast = useToast();
  const [filters, setFilters] = useState(defaultFilters);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [results, setResults] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showDepartCalendar, setShowDepartCalendar] = useState(false);
  const [showReturnCalendar, setShowReturnCalendar] = useState(false);
  const [alternativeDates, setAlternativeDates] = useState([]);
  const [suggestedFlights, setSuggestedFlights] = useState([]);
  const [isRoundTrip, setIsRoundTrip] = useState(false);
  const [roundTripCombos, setRoundTripCombos] = useState([]);
  const [availableAirlines, setAvailableAirlines] = useState([]);
  
  // Autocomplete states
  const [showFromDropdown, setShowFromDropdown] = useState(false);
  const [showToDropdown, setShowToDropdown] = useState(false);
  const [fromOptions, setFromOptions] = useState([]);
  const [toOptions, setToOptions] = useState([]);
  const [fromSelected, setFromSelected] = useState(false);
  const [toSelected, setToSelected] = useState(false);
  const fromDropdownRef = useRef(null);
  const toDropdownRef = useRef(null);
  const fromSearchTimeoutRef = useRef(null);
  const toSearchTimeoutRef = useRef(null);

  // Handle View Deal button click
  const handleViewDeal = (flight, returnFlight = null) => {
    // Check if user is authenticated
    if (!isAuthenticated) {
      toast.showError('Please log in to continue with booking');
      // Save booking data to sessionStorage to restore after login
      const bookingData = {
        type: returnFlight ? 'round-trip' : 'one-way',
        outbound: flight,
        return: returnFlight || null,
        searchParams: {
          from: filters.from,
          to: filters.to,
          departDate: filters.date,
          returnDate: filters.returnDate,
          travelers: 1,
        }
      };
      sessionStorage.setItem('pendingBooking', JSON.stringify(bookingData));
      sessionStorage.setItem('returnPath', '/bookings');
      navigate('/login');
      return;
    }

    // Navigate to bookings page with flight data
    // If round trip, include both outbound and return flights
    const bookingData = {
      type: returnFlight ? 'round-trip' : 'one-way',
      outbound: flight,
      return: returnFlight || null,
      searchParams: {
        from: filters.from,
        to: filters.to,
        departDate: filters.date,
        returnDate: filters.returnDate,
        travelers: 1, // Default, can be enhanced later
      }
    };
    
    navigate('/bookings', { 
      state: { 
        bookingData,
        createNew: true 
      } 
    });
  };

  // Extract airport code from label format (e.g., "LAX - Los Angeles..." -> "LAX")
  const extractAirportCode = (value) => {
    if (!value) return null;
    // If it's already just a code (3 letters), return it
    if (/^[A-Z]{3}$/.test(value.trim())) {
      return value.trim();
    }
    // Extract code from format like "LAX - Los Angeles (Los Angeles International)"
    const match = value.match(/^([A-Z]{3})/);
    return match ? match[1] : value.trim();
  };

  // Load flight location options from API
  const loadFlightLocations = async (query, setter) => {
    try {
      const trimmed = query.trim();
      if (!trimmed) {
        setter([]);
        return;
      }
      const { items } = await listingsApi.searchFlightLocations(trimmed, 10);
      // The API now returns objects with code, city, name, and label
      // Format: { code: "LAX", city: "Los Angeles", name: "Los Angeles International", label: "LAX - Los Angeles (Los Angeles International)" }
      setter(items || []);
    } catch (err) {
      console.error('Failed to load flight locations', err);
      setter([]);
    }
  };

  // Handle from input change
  const handleFromInputChange = (e) => {
    const value = e.target.value.toUpperCase(); // Convert to uppercase for airport codes
    setFilters((prev) => ({ ...prev, from: value }));
    setFromSelected(false);
    
    // Debounced search
    if (fromSearchTimeoutRef.current) {
      clearTimeout(fromSearchTimeoutRef.current);
    }
    
    fromSearchTimeoutRef.current = setTimeout(() => {
      if (value.trim()) {
        loadFlightLocations(value, setFromOptions);
        setShowFromDropdown(true);
      } else {
        setFromOptions([]);
        setShowFromDropdown(false);
      }
    }, 300);
  };

  // Handle to input change
  const handleToInputChange = (e) => {
    const value = e.target.value.toUpperCase(); // Convert to uppercase for airport codes
    setFilters((prev) => ({ ...prev, to: value }));
    setToSelected(false);
    
    // Debounced search
    if (toSearchTimeoutRef.current) {
      clearTimeout(toSearchTimeoutRef.current);
    }
    
    toSearchTimeoutRef.current = setTimeout(() => {
      if (value.trim()) {
        loadFlightLocations(value, setToOptions);
        setShowToDropdown(true);
      } else {
        setToOptions([]);
        setShowToDropdown(false);
      }
    }, 300);
  };

  // Handle from select
  const handleFromSelect = (location) => {
    setFilters((prev) => ({ ...prev, from: location.code }));
    setShowFromDropdown(false);
    setFromSelected(true);
    setFromOptions([]);
  };

  // Handle to select
  const handleToSelect = (location) => {
    setFilters((prev) => ({ ...prev, to: location.code }));
    setShowToDropdown(false);
    setToSelected(true);
    setToOptions([]);
  };

  // Handle from blur
  const handleFromBlur = () => {
    // Delay to allow click events to fire first
    setTimeout(() => {
      if (!fromSelected && filters.from.trim() && !/^[A-Z]{3}$/.test(filters.from.trim())) {
        // Clear invalid input
        setFilters((prev) => ({ ...prev, from: '' }));
      }
      setShowFromDropdown(false);
    }, 200);
  };

  // Handle to blur
  const handleToBlur = () => {
    // Delay to allow click events to fire first
    setTimeout(() => {
      if (!toSelected && filters.to.trim() && !/^[A-Z]{3}$/.test(filters.to.trim())) {
        // Clear invalid input
        setFilters((prev) => ({ ...prev, to: '' }));
      }
      setShowToDropdown(false);
    }, 200);
  };

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (fromDropdownRef.current && !fromDropdownRef.current.contains(event.target)) {
        setShowFromDropdown(false);
      }
      if (toDropdownRef.current && !toDropdownRef.current.contains(event.target)) {
        setShowToDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const loadAirlines = async (activeFilters) => {
    try {
      const params = {};
      if (activeFilters.from) params.from = extractAirportCode(activeFilters.from);
      if (activeFilters.to) params.to = extractAirportCode(activeFilters.to);
      if (activeFilters.date) params.departDate = activeFilters.date;
      if (activeFilters.returnDate) params.returnDate = activeFilters.returnDate;

      const data = await listingsApi.getAvailableAirlines(params);
      setAvailableAirlines(data.airlines || []);
    } catch (err) {
      console.error('Failed to load airlines', err);
      setAvailableAirlines([]);
    }
  };

  const handleAirlineToggle = (airline) => {
    const newAirlines = filters.airlines.includes(airline)
      ? filters.airlines.filter(a => a !== airline)
      : [...filters.airlines, airline];
    
    const newFilters = { ...filters, airlines: newAirlines };
    setFilters(newFilters);
    loadFlights(1, newFilters);
  };

  const handleAllAirlinesToggle = () => {
    const newAirlines = filters.airlines.length === availableAirlines.length ? [] : [...availableAirlines];
    const newFilters = { ...filters, airlines: newAirlines };
    setFilters(newFilters);
    loadFlights(1, newFilters);
  };

  const loadFlights = async (overridePage, overrideFilters) => {
    const currentPage = overridePage ?? page;
    setLoading(true);
    setError(null);

    try {
      const activeFilters = overrideFilters ?? filters;
      const isRound = activeFilters.returnDate && activeFilters.returnDate !== activeFilters.date;
      setIsRoundTrip(isRound);

      if (isRound) {
        // For round trips, fetch outbound and return flights separately and create combinations
        const [outboundData, returnData] = await Promise.all([
          listingsApi.searchFlights({
            from: extractAirportCode(activeFilters.from),
            to: extractAirportCode(activeFilters.to),
            departDate: activeFilters.date,
            // Don't pass price filters for round trips - we filter by total price client-side
            nonstop: activeFilters.nonstop,
            airline: activeFilters.airlines.length > 0 ? activeFilters.airlines.join(',') : undefined,
            pageSize: 100, // Get more flights for combinations
          }),
          listingsApi.searchFlights({
            from: extractAirportCode(activeFilters.to), // Reverse direction
            to: extractAirportCode(activeFilters.from),
            departDate: activeFilters.returnDate,
            // Don't pass price filters for round trips - we filter by total price client-side
            nonstop: activeFilters.nonstop,
            airline: activeFilters.airlines.length > 0 ? activeFilters.airlines.join(',') : undefined,
            pageSize: 100,
          }),
        ]);

        // Filter to get only flights on the exact dates requested
        const outboundFlights = (outboundData.items || [])
          .filter(isFlightValid)
          .filter(flight => flight.departDate === activeFilters.date)
          .filter(flight => {
            // Apply nonstop filter on frontend as well
            if (activeFilters.nonstop === 'true') return flight.nonstop === true;
            if (activeFilters.nonstop === 'false') return flight.nonstop === false;
            return true; // 'any' - show all
          });
        
        const returnFlights = (returnData.items || [])
          .filter(isFlightValid)
          .filter(flight => flight.departDate === activeFilters.returnDate)
          .filter(flight => {
            // Apply nonstop filter on frontend as well
            if (activeFilters.nonstop === 'true') return flight.nonstop === true;
            if (activeFilters.nonstop === 'false') return flight.nonstop === false;
            return true; // 'any' - show all
          });

        // Create all combinations
        const combinations = [];
        outboundFlights.forEach(outbound => {
          returnFlights.forEach(returnFlight => {
            combinations.push({
              id: `${outbound.id}-${returnFlight.id}`,
              outbound,
              return: returnFlight,
              totalPrice: outbound.price + returnFlight.price,
              isRoundTrip: true,
            });
          });
        });

        // Filter combinations by total price range
        let filteredCombinations = combinations;
        if (activeFilters.minPrice) {
          const minPrice = parseFloat(activeFilters.minPrice);
          filteredCombinations = filteredCombinations.filter(combo => combo.totalPrice >= minPrice);
        }
        if (activeFilters.maxPrice) {
          const maxPrice = parseFloat(activeFilters.maxPrice);
          filteredCombinations = filteredCombinations.filter(combo => combo.totalPrice <= maxPrice);
        }

        // Parse combined sort option and apply sorting
        const sortValue = activeFilters.sort || 'price-asc'; // Default to price-asc
        const [sortBy, sortOrder] = sortValue.split('-');
        console.log('Round trip sorting:', { sortValue, sortBy, sortOrder, combosCount: filteredCombinations.length });
        
        filteredCombinations.sort((a, b) => {
          let compareValue = 0;
          if (sortBy === 'price') {
            compareValue = a.totalPrice - b.totalPrice;
          } else if (sortBy === 'duration') {
            // Total duration = outbound + return
            const aDuration = a.outbound.durationMinutes + a.return.durationMinutes;
            const bDuration = b.outbound.durationMinutes + b.return.durationMinutes;
            compareValue = aDuration - bDuration;
          }
          return sortOrder === 'asc' ? compareValue : -compareValue;
        });
        
        console.log('After sorting, first 3 prices:', filteredCombinations.slice(0, 3).map(c => c.totalPrice));

        setRoundTripCombos(filteredCombinations);
        setResults([]);
        setSuggestedFlights([]);
        setPagination({
          page: 1,
          pageSize,
          totalItems: filteredCombinations.length,
          totalPages: Math.ceil(filteredCombinations.length / pageSize),
          hasNextPage: false,
          hasPrevPage: false,
        });

      } else {
        // One-way flight logic (existing)
        // Parse combined sort option
        const sortValue = activeFilters.sort || 'price-asc'; // Default to price-asc
        const [sortBy, sortOrder] = sortValue.split('-');
        console.log('One-way sorting:', { sortValue, sortBy, sortOrder });
        
        const params = {
          page: currentPage,
          pageSize,
          sortBy: sortBy === 'duration' ? 'durationMinutes' : sortBy,
          sortOrder: sortOrder,
        };

        if (activeFilters.from) params.from = extractAirportCode(activeFilters.from);
        if (activeFilters.to) params.to = extractAirportCode(activeFilters.to);
        if (activeFilters.date) params.departDate = activeFilters.date;
        if (activeFilters.returnDate) params.returnDate = activeFilters.returnDate;
        if (activeFilters.minPrice) params.minPrice = activeFilters.minPrice;
        if (activeFilters.maxPrice) params.maxPrice = activeFilters.maxPrice;
        if (activeFilters.nonstop !== 'any') params.nonstop = activeFilters.nonstop;
        if (activeFilters.airlines && activeFilters.airlines.length > 0) params.airline = activeFilters.airlines.join(',');

        const data = await listingsApi.searchFlights(params);
        const allFlights = (data.items || [])
          .filter(isFlightValid)
          .filter(flight => {
            // Apply nonstop filter on frontend as well for safety
            if (activeFilters.nonstop === 'true') return flight.nonstop === true;
            if (activeFilters.nonstop === 'false') return flight.nonstop === false;
            return true; // 'any' - show all
          });
        
        // Separate exact matches from suggestions
        const exactMatches = allFlights.filter(flight => flight.departDate === activeFilters.date);
        const suggestions = allFlights.filter(flight => flight.departDate !== activeFilters.date);
        
        setResults(exactMatches);
        setSuggestedFlights(suggestions);
        setRoundTripCombos([]);
        
        // Update pagination to reflect only exact matches
        const updatedPagination = data.pagination ? {
          ...data.pagination,
          totalItems: exactMatches.length,
          totalPages: Math.ceil(exactMatches.length / pageSize)
        } : null;
        
        setPagination(updatedPagination);
        setPage(currentPage);

        // If no exact matches, also load alternative dates for the calendar suggestion
        if (exactMatches.length === 0) {
          await loadAlternativeDates(activeFilters);
        } else {
          setAlternativeDates([]);
        }
      }
    } catch (err) {
      console.error('Failed to load flights', err);
      setError(err.response?.data?.message || 'Failed to load flights');
    } finally {
      setLoading(false);
    }
  };

  const loadAlternativeDates = async (activeFilters) => {
    try {
      if (!activeFilters.from || !activeFilters.to || !activeFilters.date) return;

      // Get dates around the selected date (±7 days)
      const selectedDate = parseLocalDate(activeFilters.date);
      const startDate = new Date(selectedDate);
      startDate.setDate(startDate.getDate() - 7);
      const endDate = new Date(selectedDate);
      endDate.setDate(endDate.getDate() + 7);

      const startDateStr = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}`;
      const endDateStr = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;

      const priceData = await listingsApi.getFlightPricesByDate({
        from: extractAirportCode(activeFilters.from),
        to: extractAirportCode(activeFilters.to),
        startDate: startDateStr,
        endDate: endDateStr
      });

      if (priceData.dates) {
        // Convert to array and sort by price, exclude current date
        const alternatives = Object.values(priceData.dates)
          .filter(d => d.date !== activeFilters.date)
          .sort((a, b) => a.minPrice - b.minPrice)
          .slice(0, 5); // Show top 5 cheapest alternatives

        setAlternativeDates(alternatives);
      }
    } catch (err) {
      console.error('Failed to load alternative dates', err);
    }
  };

  // Load search parameters from HomePage navigation state
  useEffect(() => {
    if (location.state?.search) {
      const searchParams = location.state.search;
      const newFilters = {
        ...filters,
        from: searchParams.from || '',
        to: searchParams.to || '',
        date: searchParams.departDate || defaultDates.today,
        returnDate: searchParams.returnDate || defaultDates.nextWeek,
      };
      setFilters(newFilters);
      loadFlights(1, newFilters);
      loadAirlines(newFilters);
    } else {
      loadFlights(1);
      loadAirlines(filters);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reload airlines when from, to, or dates change
  useEffect(() => {
    if (filters.from || filters.to) {
      loadAirlines(filters);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.from, filters.to, filters.date, filters.returnDate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleReset = () => {
    setFilters(defaultFilters);
    loadFlights(1, defaultFilters);
  };

  const swapLocations = () => {
    const newFilters = { ...filters, from: filters.to, to: filters.from };
    setFilters(newFilters);
    setFromSelected(false);
    setToSelected(false);
    setFromOptions([]);
    setToOptions([]);
    setShowFromDropdown(false);
    setShowToDropdown(false);
    loadFlights(1, newFilters);
  };

  const goToPage = (newPage) => {
    if (!pagination) return;
    if (newPage < 1 || newPage > pagination.totalPages) return;
    loadFlights(newPage);
  };

  return (
    <div className="min-h-screen bg-base-100">
      {/* Compact Sticky Header */}
      <div className="bg-base-100 text-base-content border-b border-base-300 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="btn btn-sm btn-outline gap-2"
            >
              <span className="text-xl">✈️</span>
              <span className="font-semibold">New Search</span>
            </button>
            
            <div className="flex gap-2">
              <button
                type="button"
                className="btn btn-sm btn-ghost"
                onClick={() => {
                  // Navigate to hotels with destination city pre-filled
                  const today = new Date();
                  const tomorrow = new Date(today);
                  tomorrow.setDate(tomorrow.getDate() + 1);
                  
                  navigate('/hotels', {
                    state: {
                      search: {
                        location: filters.to || '',
                        checkIn: today.toISOString().split('T')[0],
                        checkOut: tomorrow.toISOString().split('T')[0],
                        guests: 1
                      }
                    }
                  });
                }}
              >
                <FaBed className="w-4 h-4" />
                <span className="hidden sm:inline ml-1">Stays</span>
              </button>
              <button
                type="button"
                className="btn btn-sm btn-ghost"
                onClick={() => {
                  // Navigate to cars with destination location pre-filled
                  navigate('/cars', {
                    state: {
                      search: {
                        location: filters.to || '',
                        pickupDate: new Date().toISOString().split('T')[0],
                        dropoffDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
                      }
                    }
                  });
                }}
              >
                <FaCar className="w-4 h-4" />
                <span className="hidden sm:inline ml-1">Cars</span>
              </button>
            </div>
          </div>
          
          {/* Search Summary */}
          <div className="mt-3 text-sm opacity-90 flex items-center flex-wrap gap-2">
            <span className="font-semibold">{filters.from || 'Any location'}</span>
            <span>→</span>
            <span className="font-semibold">{filters.to || 'Any destination'}</span>
            {filters.date && (
              <>
                <span>•</span>
                <button
                  type="button"
                  onClick={() => {
                    console.log('Opening departure calendar with filters:', { from: filters.from, to: filters.to, date: filters.date });
                    setShowDepartCalendar(true);
                  }}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary hover:bg-primary/20 rounded-md transition-colors cursor-pointer"
                  title="Click to change departure date"
                >
                  <FaCalendar className="w-3 h-3" />
                  <span>{parseLocalDate(filters.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </button>
                {filters.returnDate && (
                  <>
                    <span>-</span>
                    <button
                      type="button"
                      onClick={() => setShowReturnCalendar(true)}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary hover:bg-primary/20 rounded-md transition-colors cursor-pointer"
                      title="Click to change return date"
                    >
                      <FaCalendar className="w-3 h-3" />
                      <span>{parseLocalDate(filters.returnDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </button>
                  </>
                )}
              </>
            )}
          </div>

          {/* Editable From/To inputs */}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {/* From input with autocomplete */}
            <div className="relative" ref={fromDropdownRef}>
              <input
                type="text"
                placeholder="From (e.g., LAX)"
                className="input input-sm input-bordered w-32"
                value={filters.from}
                onChange={handleFromInputChange}
                onFocus={() => {
                  if (filters.from.trim()) {
                    loadFlightLocations(filters.from, setFromOptions);
                    setShowFromDropdown(true);
                  }
                }}
                onBlur={handleFromBlur}
                autoComplete="off"
                maxLength={3}
              />
              {showFromDropdown && fromOptions.length > 0 && (
                <div className="absolute top-full left-0 mt-1 bg-base-100 border border-base-300 rounded-lg shadow-xl w-64 max-h-72 overflow-y-auto z-50">
                  {fromOptions.map((loc, index) => (
                    <button
                      key={`from-${loc.code}-${index}`}
                      type="button"
                      className="w-full text-left px-4 py-3 hover:bg-primary/10 flex items-center justify-between border-b border-base-200 last:border-b-0"
                      onMouseDown={(e) => {
                        e.preventDefault(); // Prevent blur from firing
                        handleFromSelect(loc);
                      }}
                    >
                      <div className="flex flex-col">
                        <span className="font-semibold text-base">{loc.label || loc.code}</span>
                        {loc.city && (
                          <span className="text-xs text-base-content/60">{loc.city}</span>
                        )}
                      </div>
                      <span className="badge badge-ghost badge-sm">{loc.code}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={swapLocations}
              title="Swap From/To"
            >
              ⇆
            </button>
            {/* To input with autocomplete */}
            <div className="relative" ref={toDropdownRef}>
              <input
                type="text"
                placeholder="To (e.g., SFO)"
                className="input input-sm input-bordered w-32"
                value={filters.to}
                onChange={handleToInputChange}
                onFocus={() => {
                  if (filters.to.trim()) {
                    loadFlightLocations(filters.to, setToOptions);
                    setShowToDropdown(true);
                  }
                }}
                onBlur={handleToBlur}
                autoComplete="off"
                maxLength={3}
              />
              {showToDropdown && toOptions.length > 0 && (
                <div className="absolute top-full left-0 mt-1 bg-base-100 border border-base-300 rounded-lg shadow-xl w-64 max-h-72 overflow-y-auto z-50">
                  {toOptions.map((loc, index) => (
                    <button
                      key={`to-${loc.code}-${index}`}
                      type="button"
                      className="w-full text-left px-4 py-3 hover:bg-primary/10 flex items-center justify-between border-b border-base-200 last:border-b-0"
                      onMouseDown={(e) => {
                        e.preventDefault(); // Prevent blur from firing
                        handleToSelect(loc);
                      }}
                    >
                      <div className="flex flex-col">
                        <span className="font-semibold text-base">{loc.label || loc.code}</span>
                        {loc.city && (
                          <span className="text-xs text-base-content/60">{loc.city}</span>
                        )}
                      </div>
                      <span className="badge badge-ghost badge-sm">{loc.code}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => loadFlights(1)}
            >
              Update
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar Filters */}
          <aside className="lg:w-64 shrink-0">
            <div className="card bg-base-100 shadow-md sticky top-24">
              <div className="card-body p-4 space-y-4">
                <h3 className="font-bold text-lg">Filters</h3>
                
                {/* Stops */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Stops</span>
                  </label>
                  <select
                    name="nonstop"
                    value={filters.nonstop}
                    onChange={(e) => {
                      const newFilters = { ...filters, nonstop: e.target.value };
                      setFilters(newFilters);
                      loadFlights(1, newFilters); // Pass new filters immediately
                    }}
                    className="select select-sm select-bordered w-full"
                  >
                    <option value="any">Any stops</option>
                    <option value="true">Non-stop only</option>
                    <option value="false">With stops</option>
                  </select>
                </div>

                {/* Airline */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Airlines</span>
                  </label>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {/* All airlines checkbox */}
                    <label className="label cursor-pointer justify-start gap-2 py-1">
                      <input
                        type="checkbox"
                        className="checkbox checkbox-sm"
                        checked={filters.airlines.length === availableAirlines.length && availableAirlines.length > 0}
                        onChange={handleAllAirlinesToggle}
                      />
                      <span className="label-text font-medium">All airlines</span>
                    </label>
                    
                    {/* Individual airline checkboxes */}
                    {availableAirlines.map((airline) => (
                      <label key={airline} className="label cursor-pointer justify-start gap-2 py-1">
                        <input
                          type="checkbox"
                          className="checkbox checkbox-sm"
                          checked={filters.airlines.includes(airline)}
                          onChange={() => handleAirlineToggle(airline)}
                        />
                        <span className="label-text">{airline}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Price Range */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Price Range</span>
                  </label>
                  <div className="flex gap-2">
                    {/* Min Price */}
                    <div className="flex-1">
                      <label className="label py-1">
                        <span className="label-text text-xs">Min</span>
                      </label>
                      <input
                        type="number"
                        name="minPrice"
                        placeholder="0"
                        value={filters.minPrice}
                        onChange={handleInputChange}
                        onBlur={(e) => {
                          const newFilters = { ...filters, minPrice: e.target.value };
                          setFilters(newFilters);
                          loadFlights(1, newFilters);
                        }}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            const newFilters = { ...filters, minPrice: e.target.value };
                            setFilters(newFilters);
                            loadFlights(1, newFilters);
                          }
                        }}
                        className="input input-sm input-bordered w-full"
                        min="0"
                      />
                    </div>
                    {/* Max Price */}
                    <div className="flex-1">
                      <label className="label py-1">
                        <span className="label-text text-xs">Max</span>
                      </label>
                      <input
                        type="number"
                        name="maxPrice"
                        placeholder="No limit"
                        value={filters.maxPrice}
                        onChange={handleInputChange}
                        onBlur={(e) => {
                          const newFilters = { ...filters, maxPrice: e.target.value };
                          setFilters(newFilters);
                          loadFlights(1, newFilters);
                        }}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            const newFilters = { ...filters, maxPrice: e.target.value };
                            setFilters(newFilters);
                            loadFlights(1, newFilters);
                          }
                        }}
                        className="input input-sm input-bordered w-full"
                        min="0"
                      />
                    </div>
                  </div>
                </div>

                {/* Sort By */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Sort By</span>
                  </label>
                  <select
                    name="sort"
                    value={filters.sort}
                    onChange={(e) => {
                      const newFilters = { ...filters, sort: e.target.value };
                      setFilters(newFilters);
                      loadFlights(1, newFilters);
                    }}
                    className="select select-sm select-bordered w-full"
                  >
                    <option value="price-asc">Lowest to Highest Price</option>
                    <option value="price-desc">Highest to Lowest Price</option>
                    <option value="duration-asc">Min Duration</option>
                  </select>
                </div>

                {/* Reset Button */}
                <button
                  type="button"
                  onClick={handleReset}
                  className="btn btn-sm btn-ghost w-full"
                >
                  Reset Filters
                </button>
              </div>
            </div>
          </aside>

          {/* Results Section */}
          <main className="flex-1">
            <div className="space-y-4">
              {/* Results Header */}
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">
                  {loading 
                    ? 'Searching...' 
                    : isRoundTrip 
                      ? `${roundTripCombos.length} Round Trip Combo${roundTripCombos.length !== 1 ? 's' : ''} Found`
                      : `${results.length} Flight${results.length !== 1 ? 's' : ''} Found`
                  }
                </h2>
              </div>

              {/* Suggested Flights - Horizontal Scrollable (only when we have results) */}
              {!loading && results.length > 0 && suggestedFlights.length > 0 && (
                <div className="mb-6 w-full">
                  <h3 className="text-lg font-semibold mb-3">
                    ✈️ Other available dates:
                  </h3>
                  <div className="overflow-x-auto overflow-y-hidden scrollbar-thin scrollbar-thumb-base-300 scrollbar-track-base-200">
                    <div className="flex gap-3 pb-2 w-max">
                      {suggestedFlights.map((flight) => (
                        <button
                          key={flight.id}
                          onClick={() => {
                            const newFilters = {
                              ...filters,
                              date: flight.departDate
                            };
                            setFilters(newFilters);
                            loadFlights(1, newFilters);
                          }}
                          className="card bg-base-100 border border-base-300 hover:border-primary/70 hover:shadow-lg transition-all cursor-pointer flex-shrink-0 w-56"
                        >
                          <div className="card-body p-3">
                            <div className="text-sm font-medium text-primary mb-1">
                              {parseLocalDate(flight.departDate).toLocaleDateString('en-US', {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </div>
                            <div className="flex items-center justify-between gap-2 mb-2">
                              <span className="font-semibold text-base-content truncate">{flight.airline}</span>
                              {flight.nonstop && (
                                <span className="badge badge-success badge-xs">Direct</span>
                              )}
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="text-xs text-base-content/70">
                                {flight.departureTime} - {flight.arrivalTime}
                              </div>
                              <div className="text-lg font-bold text-primary">
                                ${flight.price}
                              </div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="alert alert-error">
                  <span>{error}</span>
                </div>
              )}

              {/* Loading State */}
              {loading && (
                <div className="flex justify-center py-12">
                  <span className="loading loading-spinner loading-lg text-primary"></span>
                </div>
              )}

              {/* No Results */}
              {!loading && results.length === 0 && roundTripCombos.length === 0 && !error && (
                <>
                  {/* Suggested Flights - Horizontal Scrollable (when 0 exact matches) */}
                  {suggestedFlights.length > 0 && (
                    <div className="mb-6 w-full">
                      <h3 className="text-lg font-semibold mb-3">
                        ✈️ Other available dates:
                      </h3>
                      <div className="overflow-x-auto overflow-y-hidden scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                        <div className="flex gap-3 pb-2 w-max">
                          {suggestedFlights.map((flight) => (
                            <button
                              key={flight.id}
                              onClick={() => {
                                const newFilters = {
                                  ...filters,
                                  date: flight.departDate
                                };
                                setFilters(newFilters);
                                loadFlights(1, newFilters);
                              }}
                              className="card bg-base-100 border border-base-300 hover:border-primary/70 hover:shadow-lg transition-all cursor-pointer flex-shrink-0 w-56"
                            >
                              <div className="card-body p-3">
                                <div className="text-sm font-medium text-primary mb-1">
                                  {parseLocalDate(flight.departDate).toLocaleDateString('en-US', {
                                    weekday: 'short',
                                    month: 'short',
                                    day: 'numeric'
                                  })}
                                </div>
                                <div className="flex items-center justify-between gap-2 mb-2">
                                  <span className="font-semibold text-base-content truncate">{flight.airline}</span>
                                  {flight.nonstop && (
                                    <span className="badge badge-success badge-xs">Direct</span>
                                  )}
                                </div>
                                <div className="flex items-center justify-between">
                                  <div className="text-xs text-base-content/70">
                                    {flight.departureTime} - {flight.arrivalTime}
                                  </div>
                                  <div className="text-lg font-bold text-primary">
                                    ${flight.price}
                                  </div>
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="card bg-base-100 shadow-md">
                    <div className="card-body text-center py-12">
                      <div className="text-6xl mb-4">✈️</div>
                      <h3 className="text-xl font-semibold mb-2">No flights found</h3>
                      <p className="text-base-content/60">
                        {suggestedFlights.length > 0 
                          ? 'No flights available for the exact date. Check the suggestions above!'
                          : 'Try adjusting your filters or search criteria'}
                      </p>
                      <button
                        onClick={() => navigate('/')}
                        className="btn btn-primary mt-4"
                      >
                        New Search
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* Round Trip Combinations */}
              {!loading && roundTripCombos.length > 0 && (
                <>
                  {roundTripCombos.slice(0, pageSize).map((combo) => (
                    <div
                      key={combo.id}
                      className="card bg-base-100 shadow-md hover:shadow-xl transition-shadow"
                    >
                      <div className="card-body p-4">
                        {/* Outbound Flight */}
                        <div className="pb-4 border-b border-base-300">
                          <div className="text-xs font-semibold text-primary mb-2">OUTBOUND</div>
                          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div className="flex-1 space-y-3 w-full md:w-auto">
                              <div className="flex items-center gap-2">
                                <span className="text-xl">✈️</span>
                                <span className="font-semibold text-lg">{combo.outbound.airline}</span>
                                {combo.outbound.nonstop && (
                                  <span className="badge badge-success badge-sm">Non-stop</span>
                                )}
                              </div>

                              <div className="flex items-center gap-3">
                                <div className="text-center">
                                  <div className="text-xl font-bold">{combo.outbound.departureTime}</div>
                                  <div className="text-xs text-base-content/60">
                                    {parseLocalDate(combo.outbound.departDate).toLocaleDateString('en-US', {
                                      month: 'short',
                                      day: 'numeric',
                                    })}
                                  </div>
                                </div>

                                <div className="flex-1 flex flex-col items-center px-2">
                                  <div className="flex items-center gap-1 text-xs text-base-content/60">
                                    <FaClock className="w-3 h-3" />
                                    <span>{combo.outbound.duration}</span>
                                  </div>
                                  <div className="w-full h-0.5 bg-base-300 my-1 relative">
                                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                                      <FaPlane className="w-3 h-3 text-primary" />
                                    </div>
                                  </div>
                                  <span className="text-xs text-base-content/60">
                                    {combo.outbound.nonstop ? 'Direct' : `${combo.outbound.stops} stop${combo.outbound.stops !== 1 ? 's' : ''}`}
                                  </span>
                                </div>

                                <div className="text-center">
                                  <div className="text-xl font-bold">{combo.outbound.arrivalTime}</div>
                                  <div className="text-xs text-base-content/60">
                                    {parseLocalDate(combo.outbound.departDate).toLocaleDateString('en-US', {
                                      month: 'short',
                                      day: 'numeric',
                                    })}
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            <div className="text-right">
                              <div className="text-lg font-semibold">
                                ${combo.outbound.price}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Return Flight */}
                        <div className="pt-4">
                          <div className="text-xs font-semibold text-primary mb-2">RETURN</div>
                          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div className="flex-1 space-y-3 w-full md:w-auto">
                              <div className="flex items-center gap-2">
                                <span className="text-xl">✈️</span>
                                <span className="font-semibold text-lg">{combo.return.airline}</span>
                                {combo.return.nonstop && (
                                  <span className="badge badge-success badge-sm">Non-stop</span>
                                )}
                              </div>

                              <div className="flex items-center gap-3">
                                <div className="text-center">
                                  <div className="text-xl font-bold">{combo.return.departureTime}</div>
                                  <div className="text-xs text-base-content/60">
                                    {parseLocalDate(combo.return.departDate).toLocaleDateString('en-US', {
                                      month: 'short',
                                      day: 'numeric',
                                    })}
                                  </div>
                                </div>

                                <div className="flex-1 flex flex-col items-center px-2">
                                  <div className="flex items-center gap-1 text-xs text-base-content/60">
                                    <FaClock className="w-3 h-3" />
                                    <span>{combo.return.duration}</span>
                                  </div>
                                  <div className="w-full h-0.5 bg-base-300 my-1 relative">
                                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                                      <FaPlane className="w-3 h-3 text-primary rotate-180" />
                                    </div>
                                  </div>
                                  <span className="text-xs text-base-content/60">
                                    {combo.return.nonstop ? 'Direct' : `${combo.return.stops} stop${combo.return.stops !== 1 ? 's' : ''}`}
                                  </span>
                                </div>

                                <div className="text-center">
                                  <div className="text-xl font-bold">{combo.return.arrivalTime}</div>
                                  <div className="text-xs text-base-content/60">
                                    {parseLocalDate(combo.return.departDate).toLocaleDateString('en-US', {
                                      month: 'short',
                                      day: 'numeric',
                                    })}
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            <div className="text-right">
                              <div className="text-lg font-semibold">
                                ${combo.return.price}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Total Price */}
                        <div className="flex justify-end items-center gap-4 pt-4 border-t border-base-300 mt-4">
                          <div className="text-right">
                            <div className="text-xs text-base-content/60 mb-1">TOTAL PRICE</div>
                            <div className="text-3xl font-bold text-primary">
                              USD {combo.totalPrice.toFixed(2)}
                            </div>
                            <div className="text-xs text-base-content/60">per person</div>
                          </div>
                          <button 
                            className="btn btn-primary"
                            onClick={() => handleViewDeal(combo.outbound, combo.return)}
                          >
                            View Deal
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              )}

              {/* One-Way Flight Results */}
              {!loading && results.length > 0 && (
                <>
                  {results.map((flight) => (
                    <div
                      key={flight.id}
                      className="card bg-base-100 shadow-md hover:shadow-xl transition-shadow"
                    >
                      <div className="card-body p-4">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                          {/* Airline and Route Info */}
                          <div className="flex-1 space-y-3 w-full md:w-auto">
                            <div className="flex items-center gap-2">
                              <span className="text-xl">✈️</span>
                              <span className="font-semibold text-lg">{flight.airline}</span>
                              {flight.nonstop && (
                                <span className="badge badge-success badge-sm">Non-stop</span>
                              )}
                            </div>

                            {/* Route and Time */}
                            <div className="flex items-center gap-3">
                              <div className="text-center">
                                <div className="text-2xl font-bold">{flight.from}</div>
                                <div className="text-xs text-base-content/60">
                                  {new Date(flight.departDate).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                  })}
                                </div>
                              </div>

                              <div className="flex-1 flex flex-col items-center px-2">
                                <div className="flex items-center gap-1 text-xs text-base-content/60">
                                  <FaClock className="w-3 h-3" />
                                  <span>
                                    {Math.floor(flight.durationMinutes / 60)}h{' '}
                                    {flight.durationMinutes % 60}m
                                  </span>
                                </div>
                                <div className="w-full h-0.5 bg-base-300 my-1 relative">
                                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                                    <FaPlane className="w-3 h-3 text-primary" />
                                  </div>
                                </div>
                                <span className="text-xs text-base-content/60">
                                  {flight.nonstop ? 'Direct' : '1+ stops'}
                                </span>
                              </div>

                              <div className="text-center">
                                <div className="text-2xl font-bold">{flight.to}</div>
                                <div className="text-xs text-base-content/60">
                                  {new Date(flight.departDate).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                  })}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Price and Book Button */}
                          <div className="flex flex-row md:flex-col items-center md:items-end gap-2 justify-between w-full md:w-auto">
                            <div className="text-right">
                              <div className="text-3xl font-bold text-primary">
                                {flight.currency} {flight.price.toFixed(2)}
                              </div>
                              <div className="text-xs text-base-content/60">per person</div>
                            </div>
                            <button 
                              className="btn btn-primary btn-sm"
                              onClick={() => handleViewDeal(flight)}
                            >
                              View Deal
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Pagination */}
                  {pagination && pagination.totalPages > 1 && (
                    <div className="flex items-center justify-between mt-6 px-4">
                      <div className="text-sm text-base-content/60">
                        Page {pagination.page} of {pagination.totalPages} •{' '}
                        {pagination.totalItems} result(s)
                      </div>
                      <div className="btn-group">
                        <button
                          className="btn btn-sm"
                          onClick={() => goToPage(pagination.page - 1)}
                          disabled={!pagination.hasPrevPage || loading}
                        >
                          « Prev
                        </button>
                        <button className="btn btn-sm btn-ghost">{pagination.page}</button>
                        <button
                          className="btn btn-sm"
                          onClick={() => goToPage(pagination.page + 1)}
                          disabled={!pagination.hasNextPage || loading}
                        >
                          Next »
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </main>
        </div>
      </div>

      {/* Flight Price Calendar Modal for Departure Date */}
      {showDepartCalendar && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="relative">
            <button
              onClick={() => setShowDepartCalendar(false)}
              className="absolute -top-3 -right-3 z-10 bg-base-100 border border-base-300 rounded-full p-2 shadow-lg hover:bg-base-200"
            >
              <FaTimes className="w-5 h-5" />
            </button>
            <FlightPriceCalendar
              selectedDate={filters.date}
              onDateSelect={(date) => {
                const newFilters = {
                  ...filters,
                  date: date
                };
                // If return date is before new depart date, adjust it
                if (filters.returnDate && filters.returnDate < date) {
                  newFilters.returnDate = addDaysToDateString(date, 7);
                }
                setFilters(newFilters);
                setShowDepartCalendar(false);
                loadFlights(1, newFilters);
              }}
              from={filters.from || ''}
              to={filters.to || ''}
              minDate={new Date().toISOString().split('T')[0]}
            />
          </div>
        </div>
      )}

      {/* Flight Price Calendar Modal for Return Date */}
      {showReturnCalendar && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="relative">
            <button
              onClick={() => setShowReturnCalendar(false)}
              className="absolute -top-3 -right-3 z-10 bg-base-100 border border-base-300 rounded-full p-2 shadow-lg hover:bg-base-200"
            >
              <FaTimes className="w-5 h-5" />
            </button>
            <FlightPriceCalendar
              selectedDate={filters.returnDate}
              onDateSelect={(date) => {
                const newFilters = {
                  ...filters,
                  returnDate: date
                };
                setFilters(newFilters);
                setShowReturnCalendar(false);
                loadFlights(1, newFilters);
              }}
              from={filters.to} // Reverse for return flight
              to={filters.from}
              minDate={filters.date || new Date().toISOString().split('T')[0]}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default FlightsPage;
