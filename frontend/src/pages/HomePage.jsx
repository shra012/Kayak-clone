import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaPlane, FaBed, FaCar, FaExchangeAlt, FaSearch, FaChevronDown, FaTimes, FaCalendar, FaClock } from 'react-icons/fa';
import { getDestinationImageUrl } from '../services/destinationImages.service.js';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useAuth } from '../hooks/useAuth';
import AnimatedCard from '../components/common/AnimatedCard';
import AnimatedIcon from '../components/common/AnimatedIcon';
import { listingsApi } from '../services/api/listings';
import FlightPriceCalendar from '../components/common/FlightPriceCalendar';
import cars1 from '../assets/Background_images/cars1.jpg';
import cars2 from '../assets/Background_images/cars2.jpg';
import cars3 from '../assets/Background_images/cars3.jpg';
import cars4 from '../assets/Background_images/cars4.webp';
import cars5 from '../assets/Background_images/cars5.jpg';
import cars6 from '../assets/Background_images/cars6.webp';

// Helper function to parse date string as local time (not UTC)
const parseLocalDate = (dateStr) => {
  if (!dateStr) return new Date();
  // Add T00:00:00 to force local timezone interpretation
  return new Date(dateStr + 'T00:00:00');
};

// Helper function to format date without timezone issues
const formatDateString = (dateStr) => {
  const date = parseLocalDate(dateStr);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper function to add days to a date string
const addDaysToDateString = (dateStr, days) => {
  const date = parseLocalDate(dateStr);
  date.setDate(date.getDate() + days);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper function to generate time options (30-minute intervals)
const generateTimeOptions = () => {
  const times = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute of [0, 30]) {
      const hourStr = hour.toString().padStart(2, '0');
      const minuteStr = minute.toString().padStart(2, '0');
      const time24 = `${hourStr}:${minuteStr}`;
      
      // Format for display
      let displayTime;
      if (hour === 0 && minute === 0) {
        displayTime = 'Midnight';
      } else if (hour === 12 && minute === 0) {
        displayTime = 'Noon';
      } else if (hour < 12) {
        displayTime = `${hour === 0 ? 12 : hour}:${minuteStr} am`;
      } else {
        const displayHour = hour === 12 ? 12 : hour - 12;
        displayTime = `${displayHour}:${minuteStr} pm`;
      }
      
      times.push({ value: time24, label: displayTime });
    }
  }
  return times;
};

const HomePage = () => {
  useDocumentTitle('Search Flights, Hotels & Cars');
  
  const { user } = useAuth();
  
  const [activeTab, setActiveTab] = useState('flights');
  const [tripType, setTripType] = useState('round-trip');
  const [showBagsDropdown, setShowBagsDropdown] = useState(false);
  const [bags, setBags] = useState({
    carryOn: 0,
    checked: 0
  });
  const [destinationImages, setDestinationImages] = useState({});
  const [showTravelersDropdown, setShowTravelersDropdown] = useState(false);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [locationSearch, setLocationSearch] = useState('');
  const [locationOptions, setLocationOptions] = useState([]);
  const [locationOptionsLoading, setLocationOptionsLoading] = useState(false);
  const [showFromDropdown, setShowFromDropdown] = useState(false);
  const [showToDropdown, setShowToDropdown] = useState(false);
  const [fromOptions, setFromOptions] = useState([]);
  const [toOptions, setToOptions] = useState([]);
  
  // Hotel location dropdown states
  const [showHotelLocationDropdown, setShowHotelLocationDropdown] = useState(false);
  const [hotelLocationOptions, setHotelLocationOptions] = useState([]);
  const [hotelLocationSelected, setHotelLocationSelected] = useState(false);
  
  // Car location dropdown states
  const [showCarLocationDropdown, setShowCarLocationDropdown] = useState(false);
  const [carLocationOptions, setCarLocationOptions] = useState([]);
  const [carLocationSelected, setCarLocationSelected] = useState(false);
  const [showDropOffLocationDropdown, setShowDropOffLocationDropdown] = useState(false);
  const [dropOffLocationOptions, setDropOffLocationOptions] = useState([]);
  const [dropOffLocationSelected, setDropOffLocationSelected] = useState(false);
  const [showPickUpTimeModal, setShowPickUpTimeModal] = useState(false);
  const [showDropOffTimeModal, setShowDropOffTimeModal] = useState(false);
  const [multiCityFromDropdowns, setMultiCityFromDropdowns] = useState({});
  const [multiCityToDropdowns, setMultiCityToDropdowns] = useState({});
  const [multiCityFromOptions, setMultiCityFromOptions] = useState({});
  const [multiCityToOptions, setMultiCityToOptions] = useState({});
  const [travelers, setTravelers] = useState({
    adults: 1,
    students: 0,
    seniors: 0,
    youths: 0,
    children: 0,
    toddlers: 0,
    infants: 0
  });
  const [cabinClass, setCabinClass] = useState('economy');
  const [showDepartCalendar, setShowDepartCalendar] = useState(false);
  const [showReturnCalendar, setShowReturnCalendar] = useState(false);
  const [calendarType, setCalendarType] = useState('departure'); // 'departure' or 'return'
  const travelersDropdownRef = useRef(null);
  const bagsDropdownRef = useRef(null);
  const locationDropdownRef = useRef(null);
  const locationSearchTimeoutRef = useRef(null);
  const fromDropdownRef = useRef(null);
  const toDropdownRef = useRef(null);
  const fromSearchTimeoutRef = useRef(null);
  const toSearchTimeoutRef = useRef(null);
  const multiCitySearchTimeoutRefs = useRef({});
  
  // Get default dates
  const getDefaultDates = () => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    
    return {
      today: today.toISOString().split('T')[0],
      tomorrow: tomorrow.toISOString().split('T')[0],
      nextWeek: nextWeek.toISOString().split('T')[0]
    };
  };

  const defaultDates = getDefaultDates();

  // Initialize multi-city flights with default dates (using function to avoid initialization issues)
  const [multiCityFlights, setMultiCityFlights] = useState(() => [
    { from: '', to: '', date: new Date().toISOString().split('T')[0] },
    { from: '', to: '', date: new Date(Date.now() + 86400000).toISOString().split('T')[0] }
  ]);

  // Error state for validation
  const [errors, setErrors] = useState({
    flights: '',
    hotels: '',
    cars: ''
  });
  const [multiCityErrors, setMultiCityErrors] = useState({});
  const [fromError, setFromError] = useState('');
  const [toError, setToError] = useState('');
  const [carTimeError, setCarTimeError] = useState('');
  
  // Track if locations were properly selected from dropdown
  const [fromSelected, setFromSelected] = useState(false);
  const [toSelected, setToSelected] = useState(false);
  const [multiCitySelected, setMultiCitySelected] = useState({});

  const [searchData, setSearchData] = useState({
    flights: {
      from: '',
      to: '',
      departDate: defaultDates.today,
      returnDate: defaultDates.nextWeek,
      travelers: 1,
      class: 'economy'
    },
    hotels: {
      location: '',
      checkIn: defaultDates.today,
      checkOut: defaultDates.tomorrow,
      guests: 1
    },
    cars: {
      location: '',
      pickUp: defaultDates.today,
      pickUpTime: '12:00',
      dropOff: defaultDates.tomorrow,
      dropOffTime: '12:00',
      sameDropOff: true,
      dropOffLocation: '',
      driverAge: 25
    }
  });
  const navigate = useNavigate();

  // Redirect owners to their dashboard - they shouldn't see the booking homepage
  useEffect(() => {
    if (user?.profileType === 'owner') {
      navigate('/owner', { replace: true });
    }
  }, [user, navigate]);

  // Prevent rendering blank page for owners during redirect
  if (user?.profileType === 'owner') {
    return null;
  }

  useEffect(() => {
    const loadImages = async () => {
      const cities = ['Los Angeles', 'Las Vegas', 'San Diego', 'Reno'];
      const imageMap = {};
      for (const city of cities) {
        try {
          const url = await getDestinationImageUrl(city);
          if (url) {
            imageMap[city] = url;
          }
        } catch (error) {
          console.error(`Failed to load image for ${city}:`, error);
        }
      }
      setDestinationImages(imageMap);
    };
    loadImages();
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (travelersDropdownRef.current && !travelersDropdownRef.current.contains(event.target)) {
        setShowTravelersDropdown(false);
      }
      if (bagsDropdownRef.current && !bagsDropdownRef.current.contains(event.target)) {
        setShowBagsDropdown(false);
      }
      if (locationDropdownRef.current && !locationDropdownRef.current.contains(event.target)) {
        setShowLocationDropdown(false);
      }
      if (fromDropdownRef.current && !fromDropdownRef.current.contains(event.target)) {
        setShowFromDropdown(false);
      }
      if (toDropdownRef.current && !toDropdownRef.current.contains(event.target)) {
        setShowToDropdown(false);
      }
    };

    if (showTravelersDropdown || showBagsDropdown || showLocationDropdown || showFromDropdown || showToDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showTravelersDropdown, showBagsDropdown, showLocationDropdown, showFromDropdown, showToDropdown]);

  // Validation function
  const validateFlightSearch = () => {
    const { from, to, departDate, returnDate } = searchData.flights;
    
    // Clear previous errors
    setErrors(prev => ({ ...prev, flights: '' }));

    // Check for regular trips (round-trip and one-way)
    if (tripType !== 'multi-city') {
      // Check if required fields are empty
      if (!from || !from.trim()) {
        setErrors(prev => ({ ...prev, flights: 'Please enter a departure location' }));
        return false;
      }

      if (!to || !to.trim()) {
        setErrors(prev => ({ ...prev, flights: 'Please enter a destination location' }));
        return false;
      }
      
      // Check if locations were properly selected from dropdown
      if (!fromSelected) {
        // Clear invalid input silently
        setSearchData(prev => ({
          ...prev,
          flights: { ...prev.flights, from: '' }
        }));
        return false;
      }
      
      if (!toSelected) {
        // Clear invalid input silently
        setSearchData(prev => ({
          ...prev,
          flights: { ...prev.flights, to: '' }
        }));
        return false;
      }
    }

    // Check if from and to are the same
    if (from && to && from.toLowerCase().trim() === to.toLowerCase().trim()) {
      setErrors(prev => ({ ...prev, flights: 'From and To locations cannot be the same' }));
      return false;
    }

    // Check if departure date is in the past
    if (tripType !== 'multi-city' && departDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Parse date in local time to avoid timezone issues
      const [year, month, day] = departDate.split('-').map(Number);
      const departDateTime = new Date(year, month - 1, day);
      departDateTime.setHours(0, 0, 0, 0);
      
      if (departDateTime.getTime() < today.getTime()) {
        setErrors(prev => ({ ...prev, flights: 'Departure date cannot be in the past' }));
        return false;
      }
    }

    // Check if departure date is after return date (for round-trip)
    if (tripType === 'round-trip' && departDate && returnDate) {
      // Parse dates in local time to avoid timezone issues
      const [dYear, dMonth, dDay] = departDate.split('-').map(Number);
      const [rYear, rMonth, rDay] = returnDate.split('-').map(Number);
      
      const departDateTime = new Date(dYear, dMonth - 1, dDay);
      const returnDateTime = new Date(rYear, rMonth - 1, rDay);
      
      if (departDateTime.getTime() > returnDateTime.getTime()) {
        setErrors(prev => ({ ...prev, flights: 'Return date must be on or after departure date' }));
        return false;
      }
    }

    // Validate multi-city flights
    if (tripType === 'multi-city') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      for (let i = 0; i < multiCityFlights.length; i++) {
        const flight = multiCityFlights[i];
        
        // Check if required fields are empty
        if (!flight.from || !flight.from.trim()) {
          setErrors(prev => ({ ...prev, flights: `Flight ${i + 1}: Please enter a departure location` }));
          return false;
        }

        if (!flight.to || !flight.to.trim()) {
          setErrors(prev => ({ ...prev, flights: `Flight ${i + 1}: Please enter a destination location` }));
          return false;
        }
        
        // Check if locations were properly selected from dropdown
        if (!multiCitySelected[`${i}_from`]) {
          setMultiCityErrors(prev => ({
            ...prev,
            [`${i}_from`]: 'Please select a valid location from the dropdown suggestions'
          }));
          setErrors(prev => ({ ...prev, flights: `Flight ${i + 1}: Please select a valid departure location from the dropdown` }));
          return false;
        }
        
        if (!multiCitySelected[`${i}_to`]) {
          setMultiCityErrors(prev => ({
            ...prev,
            [`${i}_to`]: 'Please select a valid location from the dropdown suggestions'
          }));
          setErrors(prev => ({ ...prev, flights: `Flight ${i + 1}: Please select a valid destination location from the dropdown` }));
          return false;
        }
        
        // Check if from and to are the same
        if (flight.from && flight.to && flight.from.toLowerCase().trim() === flight.to.toLowerCase().trim()) {
          setErrors(prev => ({ ...prev, flights: `Flight ${i + 1}: From and To locations cannot be the same` }));
          return false;
        }

        // Check if first flight date is in the past
        if (i === 0 && flight.date) {
          // Parse date in local time to avoid timezone issues
          const [year, month, day] = flight.date.split('-').map(Number);
          const flightDateTime = new Date(year, month - 1, day);
          flightDateTime.setHours(0, 0, 0, 0);
          
          if (flightDateTime.getTime() < today.getTime()) {
            setErrors(prev => ({ ...prev, flights: 'Departure date cannot be in the past' }));
            return false;
          }
        }

        // Check if dates are in logical order
        if (i > 0 && flight.date && multiCityFlights[i - 1].date) {
          // Parse dates in local time to avoid timezone issues
          const [cYear, cMonth, cDay] = flight.date.split('-').map(Number);
          const [pYear, pMonth, pDay] = multiCityFlights[i - 1].date.split('-').map(Number);
          
          const currentDate = new Date(cYear, cMonth - 1, cDay);
          const prevDate = new Date(pYear, pMonth - 1, pDay);
          
          if (currentDate.getTime() < prevDate.getTime()) {
            setErrors(prev => ({ ...prev, flights: `Flight ${i + 1} date cannot be before Flight ${i} date` }));
            return false;
          }
        }
      }
    }

    return true;
  };

  const validateCarSearch = () => {
    const { pickUp, pickUpTime, dropOff, dropOffTime } = searchData.cars;
    
    // Clear previous errors
    setCarTimeError('');
    
    console.log('=== CAR VALIDATION DEBUG ===');
    console.log('Pickup Date:', pickUp, 'Time:', pickUpTime);
    console.log('Drop Date:', dropOff, 'Time:', dropOffTime);
    
    const today = new Date().toISOString().split('T')[0];
    const currentTime = new Date();
    const currentHours = currentTime.getHours();
    const currentMinutes = currentTime.getMinutes();
    const currentTimeString = `${String(currentHours).padStart(2, '0')}:${String(currentMinutes).padStart(2, '0')}`;
    
    // Check if pick-up date is today and time is in the past
    if (pickUp === today && pickUpTime < currentTimeString) {
      console.log('ERROR: Pick-up time in the past');
      setCarTimeError('Pick-up time cannot be in the past');
      return false;
    }
    
    // Create datetime objects for pickup and dropoff to compare full date-time
    const pickUpDateTime = new Date(`${pickUp}T${pickUpTime}:00`);
    const dropOffDateTime = new Date(`${dropOff}T${dropOffTime}:00`);
    
    console.log('Pickup DateTime:', pickUpDateTime);
    console.log('Drop DateTime:', dropOffDateTime);
    console.log('Drop <= Pickup?', dropOffDateTime <= pickUpDateTime);
    
    // Check if drop-off date-time is after pick-up date-time
    if (dropOffDateTime <= pickUpDateTime) {
      console.log('ERROR: Drop-off is before or equal to pick-up');
      setCarTimeError('Drop-off date and time must be after pick-up date and time');
      return false;
    }
    
    console.log('Validation PASSED');
    return true;
  };

  const handleSearch = () => {
    if (activeTab === 'flights') {
      // Check for multi-city validation errors
      if (tripType === 'multi-city' && Object.keys(multiCityErrors).length > 0) {
        setErrors(prev => ({ ...prev, flights: 'Please fix invalid locations before searching' }));
        return;
      }
      
      // Validate before search
      if (!validateFlightSearch()) {
        return;
      }
      navigate('/flights', { state: { search: searchData.flights } });
    } else if (activeTab === 'hotels') {
      navigate('/hotels', { state: { search: searchData.hotels } });
    } else if (activeTab === 'cars') {
      // Validate car search
      if (!validateCarSearch()) {
        return;
      }
      navigate('/cars', { state: { search: searchData.cars } });
    }
  };

  const swapLocations = () => {
    setSearchData({
      ...searchData,
      flights: {
        ...searchData.flights,
        from: searchData.flights.to,
        to: searchData.flights.from
      }
    });
    // Swap the selection state as well
    const tempFromSelected = fromSelected;
    setFromSelected(toSelected);
    setToSelected(tempFromSelected);
    
    // Swap errors as well
    const tempFromError = fromError;
    setFromError(toError);
    setToError(tempFromError);
  };

  const getTotalTravelers = () => {
    return Object.values(travelers).reduce((sum, count) => sum + count, 0);
  };

  const updateTravelerCount = (type, increment) => {
    setTravelers(prev => ({
      ...prev,
      [type]: Math.max(0, prev[type] + (increment ? 1 : -1))
    }));
  };

  const getTravelersLabel = () => {
    const total = getTotalTravelers();
    const classLabel = cabinClass === 'premium' ? 'Prem. Econ.' : cabinClass.charAt(0).toUpperCase() + cabinClass.slice(1);
    return `${total} traveler${total !== 1 ? 's' : ''}, ${classLabel}`;
  };

  const getTotalBags = () => {
    return bags.carryOn + bags.checked;
  };

  const updateBagCount = (type, increment) => {
    setBags(prev => ({
      ...prev,
      [type]: Math.max(0, prev[type] + (increment ? 1 : -1))
    }));
  };

  const getBagsLabel = () => {
    const total = getTotalBags();
    const hasCarryOn = bags.carryOn > 0;
    const hasChecked = bags.checked > 0;
    
    if (total === 0) {
      return '0 bags';
    }
    
    // If only carry-on bags selected
    if (hasCarryOn && !hasChecked) {
      return `${bags.carryOn} carry-on bag${bags.carryOn !== 1 ? 's' : ''}`;
    }
    
    // If only checked bags selected
    if (hasChecked && !hasCarryOn) {
      return `${bags.checked} checked bag${bags.checked !== 1 ? 's' : ''}`;
    }
    
    // If both types selected
    return `${total} bag${total !== 1 ? 's' : ''}`;
  };

  // Load location options from backend (fuzzy search over hotel cities)
  const loadLocationOptions = async (searchTerm) => {
    try {
      setLocationOptionsLoading(true);
      const { items } = await listingsApi.searchHotelLocations(searchTerm);
      setLocationOptions(items || []);
    } catch (error) {
      console.error('Failed to load hotel locations', error);
      setLocationOptions([]);
    } finally {
      setLocationOptionsLoading(false);
    }
  };

  const getFilteredLocations = () => locationOptions;

  const handleLocationSelect = (location) => {
    setSearchData({
      ...searchData,
      hotels: { ...searchData.hotels, location: location.name }
    });
    setLocationSearch(location.name);
    setShowLocationDropdown(false);
  };

  // Unified location loader for all tabs (flights, hotels, cars)
  const loadLocations = async (value, setter) => {
    try {
      const trimmed = value.trim();
      const { items } = await listingsApi.searchFlightLocations(trimmed, 10);
      setter(items || []);
    } catch (err) {
      console.error('Failed to load locations', err);
      setter([]);
    }
  };

  // Load car locations specifically (uses different API)
  const loadCarLocations = async (value, setter) => {
    try {
      const trimmed = value.trim();
      const { items } = await listingsApi.searchCarLocations(trimmed, 10);
      setter(items || []);
    } catch (err) {
      console.error('Failed to load car locations', err);
      setter([]);
    }
  };

  // Legacy alias for backward compatibility
  const loadFlightLocations = loadLocations;

  // Unified date validation helper - get minimum allowed date (today)
  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const handleFromInputChange = (e) => {
    const value = e.target.value;
    setSearchData({
      ...searchData,
      flights: { ...searchData.flights, from: value }
    });
    
    // Clear error when user starts typing and mark as not selected
    setFromError('');
    setFromSelected(false);
    
    // Debounced search and validation
    if (fromSearchTimeoutRef.current) {
      clearTimeout(fromSearchTimeoutRef.current);
    }
    
    fromSearchTimeoutRef.current = setTimeout(async () => {
      if (value.trim()) {
        try {
          const response = await listingsApi.searchFlightLocations(value);
          const options = response.items || response || [];
          setFromOptions(options);
          
          // If no results found, show error
          if (options.length === 0) {
            setFromError('No matching location found. Please enter a valid city or country.');
            setFromSelected(false);
          }
        } catch (err) {
          console.error('Failed to load flight locations', err);
          setFromOptions([]);
          setFromError('Unable to find location. Please try again.');
          setFromSelected(false);
        }
      } else {
        setFromOptions([]);
      }
    }, 500);
    
    setShowFromDropdown(true);
  };
  
  // Validate from input on blur
  const handleFromBlur = () => {
    const value = searchData.flights.from;
    if (value.trim() && !fromSelected) {
      // Clear invalid input instead of showing error
      setSearchData({
        ...searchData,
        flights: { ...searchData.flights, from: '' }
      });
      setFromOptions([]);
    }
  };

  const handleToInputChange = (e) => {
    const value = e.target.value;
    setSearchData({
      ...searchData,
      flights: { ...searchData.flights, to: value }
    });
    
    // Clear error when user starts typing and mark as not selected
    setToError('');
    setToSelected(false);
    
    // Debounced search and validation
    if (toSearchTimeoutRef.current) {
      clearTimeout(toSearchTimeoutRef.current);
    }
    
    toSearchTimeoutRef.current = setTimeout(async () => {
      if (value.trim()) {
        try {
          const response = await listingsApi.searchFlightLocations(value);
          const options = response.items || response || [];
          setToOptions(options);
          
          // If no results found, show error
          if (options.length === 0) {
            setToError('No matching location found. Please enter a valid city or country.');
            setToSelected(false);
          }
        } catch (err) {
          console.error('Failed to load flight locations', err);
          setToOptions([]);
          setToError('Unable to find location. Please try again.');
          setToSelected(false);
        }
      } else {
        setToOptions([]);
      }
    }, 500);
    
    setShowToDropdown(true);
  };
  
  // Validate to input on blur
  const handleToBlur = () => {
    const value = searchData.flights.to;
    if (value.trim() && !toSelected) {
      // Clear invalid input instead of showing error
      setSearchData({
        ...searchData,
        flights: { ...searchData.flights, to: '' }
      });
      setToOptions([]);
    }
  };

  const handleFromSelect = (location) => {
    setSearchData({
      ...searchData,
      flights: { ...searchData.flights, from: location.name }
    });
    setShowFromDropdown(false);
    setFromError(''); // Clear error on valid selection
    setFromSelected(true); // Mark as properly selected
  };

  const handleToSelect = (location) => {
    setSearchData({
      ...searchData,
      flights: { ...searchData.flights, to: location.name }
    });
    setShowToDropdown(false);
    setToError(''); // Clear error on valid selection
    setToSelected(true); // Mark as properly selected
  };

  // Multi-city flight handlers
  const addMultiCityFlight = () => {
    setMultiCityFlights([
      ...multiCityFlights,
      { from: '', to: '', date: new Date().toISOString().split('T')[0] }
    ]);
  };

  const removeMultiCityFlight = (index) => {
    if (multiCityFlights.length > 2) {
      setMultiCityFlights(multiCityFlights.filter((_, i) => i !== index));
    }
  };

  const updateMultiCityFlight = (index, field, value) => {
    const updated = [...multiCityFlights];
    updated[index][field] = value;
    setMultiCityFlights(updated);
    
    const timeoutKey = `${index}_${field}`;
    
    // Clear error when typing
    if (field === 'from') {
      setMultiCityErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[`${index}_from`];
        return newErrors;
      });
      
      // Mark as not selected when typing
      setMultiCitySelected(prev => ({
        ...prev,
        [`${index}_from`]: false
      }));
      
      setMultiCityFromDropdowns(prev => ({ ...prev, [index]: true }));
      
      // Clear previous timeout
      if (multiCitySearchTimeoutRefs.current[timeoutKey]) {
        clearTimeout(multiCitySearchTimeoutRefs.current[timeoutKey]);
      }
      
      // Debounced search
      multiCitySearchTimeoutRefs.current[timeoutKey] = setTimeout(async () => {
        if (value.trim()) {
          try {
            const response = await listingsApi.searchFlightLocations(value);
            const options = response.items || response || [];
            setMultiCityFromOptions(prev => ({ ...prev, [index]: options }));
            
            // If no results, show error
            if (options.length === 0) {
              setMultiCityErrors(prev => ({
                ...prev,
                [`${index}_from`]: 'No matching location found. Please enter a valid city or country.'
              }));
            }
          } catch (err) {
            console.error('Failed to load flight locations', err);
            setMultiCityFromOptions(prev => ({ ...prev, [index]: [] }));
            setMultiCityErrors(prev => ({
              ...prev,
              [`${index}_from`]: 'Unable to find location. Please try again.'
            }));
          }
        } else {
          setMultiCityFromOptions(prev => ({ ...prev, [index]: [] }));
        }
      }, 500);
      
    } else if (field === 'to') {
      setMultiCityErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[`${index}_to`];
        return newErrors;
      });
      
      // Mark as not selected when typing
      setMultiCitySelected(prev => ({
        ...prev,
        [`${index}_to`]: false
      }));
      
      setMultiCityToDropdowns(prev => ({ ...prev, [index]: true }));
      
      // Clear previous timeout
      if (multiCitySearchTimeoutRefs.current[timeoutKey]) {
        clearTimeout(multiCitySearchTimeoutRefs.current[timeoutKey]);
      }
      
      // Debounced search
      multiCitySearchTimeoutRefs.current[timeoutKey] = setTimeout(async () => {
        if (value.trim()) {
          try {
            const response = await listingsApi.searchFlightLocations(value);
            const options = response.items || response || [];
            setMultiCityToOptions(prev => ({ ...prev, [index]: options }));
            
            // If no results, show error
            if (options.length === 0) {
              setMultiCityErrors(prev => ({
                ...prev,
                [`${index}_to`]: 'No matching location found. Please enter a valid city or country.'
              }));
            }
          } catch (err) {
            console.error('Failed to load flight locations', err);
            setMultiCityToOptions(prev => ({ ...prev, [index]: [] }));
            setMultiCityErrors(prev => ({
              ...prev,
              [`${index}_to`]: 'Unable to find location. Please try again.'
            }));
          }
        } else {
          setMultiCityToOptions(prev => ({ ...prev, [index]: [] }));
        }
      }, 500);
    }
  };

  const handleMultiCityFromSelect = (index, location) => {
    const updated = [...multiCityFlights];
    updated[index]['from'] = location.name;
    setMultiCityFlights(updated);
    setMultiCityFromDropdowns(prev => ({ ...prev, [index]: false }));
    // Clear error on valid selection and mark as selected
    setMultiCityErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[`${index}_from`];
      return newErrors;
    });
    setMultiCitySelected(prev => ({
      ...prev,
      [`${index}_from`]: true
    }));
  };

  const handleMultiCityToSelect = (index, location) => {
    const updated = [...multiCityFlights];
    updated[index]['to'] = location.name;
    setMultiCityFlights(updated);
    setMultiCityToDropdowns(prev => ({ ...prev, [index]: false }));
    // Clear error on valid selection and mark as selected
    setMultiCityErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[`${index}_to`];
      return newErrors;
    });
    setMultiCitySelected(prev => ({
      ...prev,
      [`${index}_to`]: true
    }));
  };

  // Mock hotel results data
  const mockHotelResults = [
    {
      id: 1,
      name: 'Ameron Luzern Hotel Flora',
      location: 'Downtown, Lucerne',
      rating: 8.4,
      reviews: 3749,
      stars: 4,
      price: 224,
      originalPrice: 324,
      amenities: ['wifi', 'breakfast', 'parking'],
      image: '/stays1.webp'
    },
    {
      id: 2,
      name: 'Chateau Gutsch',
      location: 'Lucerne',
      rating: 8.8,
      reviews: 3730,
      stars: 4,
      price: 363,
      originalPrice: 463,
      amenities: ['wifi', 'pool', 'spa'],
      image: '/stays2.jpg'
    },
    {
      id: 3,
      name: 'Renaissance Lucerne Hotel',
      location: 'Downtown, Lucerne',
      rating: 7.9,
      reviews: 601,
      stars: 5,
      price: 289,
      originalPrice: 389,
      amenities: ['wifi', 'gym', 'restaurant'],
      image: '/stays3.webp'
    },
  ];

  return (
    <div className="min-h-screen bg-sky-50">
      <section className="bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-6 lg:py-10 flex flex-col lg:flex-row gap-4 lg:gap-6">
          {/* Column 1: search area (60% width on desktop) */}
          <div className="w-full lg:w-[60%]">
            <div className="space-y-4">
              {/* Tab bar */}
              <div className="flex gap-2">
                <button
                  className={`btn btn-sm ${activeTab === 'flights' ? 'btn-primary' : 'btn-ghost'} rounded-full flex items-center gap-2 px-4`}
                  onClick={() => setActiveTab('flights')}
                >
                  <FaPlane className="w-4 h-4" />
                  <span className="text-sm font-medium">Flights</span>
                </button>
                <button
                  className={`btn btn-sm ${activeTab === 'hotels' ? 'btn-primary' : 'btn-ghost'} rounded-full flex items-center gap-2 px-4`}
                  onClick={() => setActiveTab('hotels')}
                >
                  <FaBed className="w-4 h-4" />
                  <span className="text-sm font-medium">Stays</span>
                </button>
                <button
                  className={`btn btn-sm ${activeTab === 'cars' ? 'btn-primary' : 'btn-ghost'} rounded-full flex items-center gap-2 px-4`}
                  onClick={() => setActiveTab('cars')}
                >
                  <FaCar className="w-4 h-4" />
                  <span className="text-sm font-medium">Cars</span>
                </button>
              </div>

              <h1 className="text-2xl md:text-3xl font-bold text-base-content">
                {activeTab === 'flights' && 'Compare flight deals from 100s of sites'}
                {activeTab === 'hotels' && 'Search hotels & more'}
                {activeTab === 'cars' && 'Compare car rental deals'}
              </h1>

              {activeTab === 'flights' && (
                <div className="bg-base-100 rounded-lg shadow-xl">
                  {/* Top row: Trip type and bags */}
                  <div className="flex gap-4 px-3 pt-3 pb-2 border-b border-base-300">
                    <div className="flex items-center gap-2">
                    <select
                        className="select select-xs select-bordered text-xs"
                      value={tripType}
                      onChange={(e) => {
                        setTripType(e.target.value);
                        // Reset multi-city flights when switching away
                        if (e.target.value !== 'multi-city') {
                          setMultiCityFlights([
                            { from: '', to: '', date: new Date().toISOString().split('T')[0] },
                            { from: '', to: '', date: new Date(Date.now() + 86400000).toISOString().split('T')[0] }
                          ]);
                        }
                      }}
                    >
                      <option value="round-trip">Round-trip</option>
                      <option value="one-way">One-way</option>
                      <option value="multi-city">Multi-city</option>
                    </select>
                    </div>
                    <div className="flex items-center gap-2 relative" ref={bagsDropdownRef}>
                      <button
                        type="button"
                        className="btn btn-xs flex items-center gap-1"
                        onClick={() => setShowBagsDropdown(!showBagsDropdown)}
                      >
                        <span className="text-xs">{getBagsLabel()}</span>
                        <FaChevronDown className="w-3 h-3" />
                      </button>

                      {/* Bags Dropdown */}
                      {showBagsDropdown && (
                        <div className="absolute top-full left-0 mt-1 bg-base-100 border border-base-300 rounded-lg shadow-xl z-50 p-4 w-64">
                          <div className="space-y-3">
                            {/* Carry-on bag */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-lg">🎒</span>
                                <div className="text-sm font-medium">Carry-on bag</div>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  className="btn btn-xs btn-circle btn-outline"
                                  onClick={() => updateBagCount('carryOn', false)}
                                  disabled={bags.carryOn <= 0}
                                >
                                  −
                                </button>
                                <span className="w-8 text-center text-sm">{bags.carryOn}</span>
                                <button
                                  type="button"
                                  className="btn btn-xs btn-circle btn-outline"
                                  onClick={() => updateBagCount('carryOn', true)}
                                >
                                  +
                                </button>
                              </div>
                            </div>

                            {/* Checked bag */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-lg">💼</span>
                                <div className="text-sm font-medium">Checked bag</div>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  className="btn btn-xs btn-circle btn-outline"
                                  onClick={() => updateBagCount('checked', false)}
                                  disabled={bags.checked <= 0}
                                >
                                  −
                                </button>
                                <span className="w-8 text-center text-sm">{bags.checked}</span>
                                <button
                                  type="button"
                                  className="btn btn-xs btn-circle btn-outline"
                                  onClick={() => updateBagCount('checked', true)}
                                >
                                  +
                                </button>
                              </div>
                            </div>

                            <div className="text-xs text-base-content/60 pt-2 border-t border-base-300">
                              Baggage per passenger
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Main search row - Regular (Round-trip/One-way) */}
                  {tripType !== 'multi-city' && (
                  <div className="flex items-end gap-1 px-3 py-3">
                    {/* From */}
                    <div className="w-32 relative" ref={fromDropdownRef}>
                      <input
                        type="text"
                        placeholder="From?"
                        className={`input input-sm input-bordered w-full text-sm px-2 h-10 ${fromError ? 'input-error border-error' : ''}`}
                        value={searchData.flights.from}
                        onChange={handleFromInputChange}
                        onBlur={handleFromBlur}
                        onFocus={() => {
                          setShowFromDropdown(true);
                          if (!fromOptions.length && searchData.flights.from) {
                            loadFlightLocations(searchData.flights.from, setFromOptions);
                          }
                        }}
                        autoComplete="off"
                      />
                      {showFromDropdown && fromOptions.length > 0 && (
                        <div className="absolute top-full left-0 mt-1 bg-base-100 border border-base-300 rounded-lg shadow-xl w-80 max-h-72 overflow-y-auto z-50">
                          {fromOptions.map((loc, index) => (
                            <button
                              key={`${loc.name}-${index}`}
                              type="button"
                              className="w-full text-left px-4 py-3 hover:bg-primary/10 flex items-center justify-between border-b border-base-200 last:border-b-0"
                              onMouseDown={(e) => {
                                e.preventDefault(); // Prevent blur from firing
                                handleFromSelect(loc);
                              }}
                            >
                              <span className="font-medium text-base">{loc.name}</span>
                              <span className="text-sm text-base-content/60 ml-4 whitespace-nowrap">
                                {loc.totalFlights} flight{loc.totalFlights !== 1 ? 's' : ''}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Swap button */}
                    <button
                      onClick={swapLocations}
                      className="btn btn-ghost btn-sm btn-circle flex-shrink-0"
                      type="button"
                    >
                      <FaExchangeAlt className="w-4 h-4" />
                    </button>

                    {/* To */}
                    <div className="w-32 relative" ref={toDropdownRef}>
                      <input
                        type="text"
                        placeholder="To?"
                        className={`input input-sm input-bordered w-full text-sm px-2 h-10 ${toError ? 'input-error border-error' : ''}`}
                        value={searchData.flights.to}
                        onChange={handleToInputChange}
                        onBlur={handleToBlur}
                        onFocus={() => {
                          setShowToDropdown(true);
                          if (!toOptions.length && searchData.flights.to) {
                            loadFlightLocations(searchData.flights.to, setToOptions);
                          }
                        }}
                        autoComplete="off"
                      />
                      {showToDropdown && toOptions.length > 0 && (
                        <div className="absolute top-full left-0 mt-1 bg-base-100 border border-base-300 rounded-lg shadow-xl w-80 max-h-72 overflow-y-auto z-50">
                          {toOptions.map((loc, index) => (
                            <button
                              key={`${loc.name}-${index}`}
                              type="button"
                              className="w-full text-left px-4 py-3 hover:bg-primary/10 flex items-center justify-between border-b border-base-200 last:border-b-0"
                              onMouseDown={(e) => {
                                e.preventDefault(); // Prevent blur from firing
                                handleToSelect(loc);
                              }}
                            >
                              <span className="font-medium text-base">{loc.name}</span>
                              <span className="text-sm text-base-content/60 ml-4 whitespace-nowrap">
                                {loc.totalFlights} flight{loc.totalFlights !== 1 ? 's' : ''}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Departure Date */}
                    <div className="w-28 flex flex-col">
                      <label className="text-xs text-base-content/60 mb-1">Departure</label>
                      <button
                        type="button"
                        className="input input-sm input-bordered w-full text-sm px-2 h-10 flex items-center justify-between cursor-pointer hover:border-blue-500"
                        onClick={() => {
                          setCalendarType('departure');
                          setShowDepartCalendar(true);
                        }}
                      >
                        <span>{searchData.flights.departDate ? parseLocalDate(searchData.flights.departDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Select'}</span>
                        <FaCalendar className="text-gray-400" />
                      </button>
                    </div>

                    {/* Return Date - Only show for round-trip */}
                    {tripType === 'round-trip' && (
                      <>
                        {/* Separator */}
                        <span className="text-sm text-base-content/50 px-1 mb-2">–</span>

                        {/* Return Date */}
                        <div className="w-28 flex flex-col">
                          <label className="text-xs text-base-content/60 mb-1">Return</label>
                          <button
                            type="button"
                            className="input input-sm input-bordered w-full text-sm px-2 h-10 flex items-center justify-between cursor-pointer hover:border-blue-500"
                            onClick={() => {
                              setCalendarType('return');
                              setShowReturnCalendar(true);
                            }}
                          >
                            <span>{searchData.flights.returnDate ? parseLocalDate(searchData.flights.returnDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Select'}</span>
                            <FaCalendar className="text-gray-400" />
                          </button>
                        </div>
                      </>
                    )}

                    {/* Travelers & Class */}
                    <div className="w-44 relative" ref={travelersDropdownRef}>
                      <button
                        type="button"
                        className="input input-sm input-bordered w-full text-sm text-left flex items-center justify-between px-2 h-10 whitespace-nowrap"
                        onClick={() => setShowTravelersDropdown(!showTravelersDropdown)}
                      >
                        <span className="truncate">{getTravelersLabel()}</span>
                        <FaChevronDown className="w-3 h-3 flex-shrink-0 ml-1" />
                      </button>

                      {/* Travelers Dropdown */}
                      {showTravelersDropdown && (
                        <div className="absolute top-full left-0 mt-1 bg-base-100 border border-base-300 rounded-lg shadow-xl z-50 p-4 w-80">
                          <div className="space-y-3">
                            <h3 className="font-semibold text-sm mb-3">Travelers</h3>

                            {/* Adults */}
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="text-sm font-medium">Adults</div>
                                <div className="text-xs text-base-content/60">18-64</div>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  className="btn btn-xs btn-circle btn-outline"
                                  onClick={() => updateTravelerCount('adults', false)}
                                  disabled={travelers.adults <= 1}
                                >
                                  −
                                </button>
                                <span className="w-8 text-center text-sm">{travelers.adults}</span>
                                <button
                                  type="button"
                                  className="btn btn-xs btn-circle btn-outline"
                                  onClick={() => updateTravelerCount('adults', true)}
                                >
                                  +
                                </button>
                              </div>
                            </div>

                            {/* Students */}
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="text-sm font-medium">Students</div>
                                <div className="text-xs text-base-content/60">over 18</div>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  className="btn btn-xs btn-circle btn-outline"
                                  onClick={() => updateTravelerCount('students', false)}
                                  disabled={travelers.students <= 0}
                                >
                                  −
                                </button>
                                <span className="w-8 text-center text-sm">{travelers.students}</span>
                                <button
                                  type="button"
                                  className="btn btn-xs btn-circle btn-outline"
                                  onClick={() => updateTravelerCount('students', true)}
                                >
                                  +
                                </button>
                              </div>
                            </div>

                            {/* Seniors */}
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="text-sm font-medium">Seniors</div>
                                <div className="text-xs text-base-content/60">over 65</div>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  className="btn btn-xs btn-circle btn-outline"
                                  onClick={() => updateTravelerCount('seniors', false)}
                                  disabled={travelers.seniors <= 0}
                                >
                                  −
                                </button>
                                <span className="w-8 text-center text-sm">{travelers.seniors}</span>
                                <button
                                  type="button"
                                  className="btn btn-xs btn-circle btn-outline"
                                  onClick={() => updateTravelerCount('seniors', true)}
                                >
                                  +
                                </button>
                              </div>
                            </div>

                            {/* Youths */}
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="text-sm font-medium">Youths</div>
                                <div className="text-xs text-base-content/60">12-17</div>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  className="btn btn-xs btn-circle btn-outline"
                                  onClick={() => updateTravelerCount('youths', false)}
                                  disabled={travelers.youths <= 0}
                                >
                                  −
                                </button>
                                <span className="w-8 text-center text-sm">{travelers.youths}</span>
                                <button
                                  type="button"
                                  className="btn btn-xs btn-circle btn-outline"
                                  onClick={() => updateTravelerCount('youths', true)}
                                >
                                  +
                                </button>
                              </div>
                            </div>

                            {/* Children */}
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="text-sm font-medium">Children</div>
                                <div className="text-xs text-base-content/60">2-11</div>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  className="btn btn-xs btn-circle btn-outline"
                                  onClick={() => updateTravelerCount('children', false)}
                                  disabled={travelers.children <= 0}
                                >
                                  −
                                </button>
                                <span className="w-8 text-center text-sm">{travelers.children}</span>
                                <button
                                  type="button"
                                  className="btn btn-xs btn-circle btn-outline"
                                  onClick={() => updateTravelerCount('children', true)}
                                >
                                  +
                                </button>
                              </div>
                            </div>

                            {/* Toddlers */}
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="text-sm font-medium">Toddlers in own seat</div>
                                <div className="text-xs text-base-content/60">under 2</div>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  className="btn btn-xs btn-circle btn-outline"
                                  onClick={() => updateTravelerCount('toddlers', false)}
                                  disabled={travelers.toddlers <= 0}
                                >
                                  −
                                </button>
                                <span className="w-8 text-center text-sm">{travelers.toddlers}</span>
                                <button
                                  type="button"
                                  className="btn btn-xs btn-circle btn-outline"
                                  onClick={() => updateTravelerCount('toddlers', true)}
                                >
                                  +
                                </button>
                              </div>
                            </div>

                            {/* Infants */}
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="text-sm font-medium">Infants on lap</div>
                                <div className="text-xs text-base-content/60">under 2</div>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  className="btn btn-xs btn-circle btn-outline"
                                  onClick={() => updateTravelerCount('infants', false)}
                                  disabled={travelers.infants <= 0}
                                >
                                  −
                                </button>
                                <span className="w-8 text-center text-sm">{travelers.infants}</span>
                                <button
                                  type="button"
                                  className="btn btn-xs btn-circle btn-outline"
                                  onClick={() => updateTravelerCount('infants', true)}
                                >
                                  +
                                </button>
                              </div>
                            </div>

                            {/* Cabin Class */}
                            <div className="pt-3 border-t border-base-300">
                              <h3 className="font-semibold text-sm mb-2">Cabin Class</h3>
                              <div className="grid grid-cols-2 gap-2">
                                <button
                                  type="button"
                                  className={`btn btn-sm ${cabinClass === 'economy' ? 'btn-primary' : 'btn-outline'}`}
                                  onClick={() => setCabinClass('economy')}
                                >
                                  Economy
                                </button>
                                <button
                                  type="button"
                                  className={`btn btn-sm ${cabinClass === 'premium' ? 'btn-primary' : 'btn-outline'}`}
                                  onClick={() => setCabinClass('premium')}
                                >
                                  Premium Economy
                                </button>
                                <button
                                  type="button"
                                  className={`btn btn-sm ${cabinClass === 'business' ? 'btn-primary' : 'btn-outline'}`}
                                  onClick={() => setCabinClass('business')}
                                >
                                  Business
                                </button>
                                <button
                                  type="button"
                                  className={`btn btn-sm ${cabinClass === 'first' ? 'btn-primary' : 'btn-outline'}`}
                                  onClick={() => setCabinClass('first')}
                                >
                                  First
                                </button>
                              </div>
                            </div>
                          </div>
                      </div>
                    )}
                  </div>

                    {/* Search button */}
                    <button
                      onClick={handleSearch}
                      className="btn btn-primary btn-circle"
                    >
                      <FaSearch className="w-5 h-5" />
                    </button>
                  </div>
                  )}

                  {/* Multi-City Flights */}
                  {tripType === 'multi-city' && (
                    <div className="px-3 py-3 space-y-3">
                      {multiCityFlights.map((flight, index) => (
                        <div key={index} className="flex items-end gap-2">
                          <span className="text-xs font-semibold text-base-content/60 w-16 mb-2">Flight {index + 1}</span>
                          
                          {/* From */}
                          <div className="flex-1 relative">
                            <input
                              type="text"
                              placeholder="From?"
                              className={`input input-sm input-bordered w-full text-sm h-10 ${multiCityErrors[`${index}_from`] ? 'input-error border-error' : ''}`}
                              value={flight.from}
                              onChange={(e) => updateMultiCityFlight(index, 'from', e.target.value)}
                              onFocus={() => {
                                if (flight.from) {
                                  setMultiCityFromDropdowns(prev => ({ ...prev, [index]: true }));
                                  loadFlightLocations(flight.from, (options) => {
                                    setMultiCityFromOptions(prev => ({ ...prev, [index]: options }));
                                  });
                                }
                              }}
                              autoComplete="off"
                            />
                            {multiCityErrors[`${index}_from`] && (
                              <div className="text-error text-xs mt-1 absolute">{multiCityErrors[`${index}_from`]}</div>
                            )}
                            {multiCityFromDropdowns[index] && multiCityFromOptions[index]?.length > 0 && (
                              <div className="absolute z-10 mt-1 w-full bg-base-100 border border-base-300 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                                {multiCityFromOptions[index].map((loc, i) => (
                                  <button
                                    key={i}
                                    type="button"
                                    className="w-full text-left px-4 py-2 hover:bg-base-200 border-b border-base-200 last:border-b-0"
                                    onMouseDown={(e) => {
                                      e.preventDefault(); // Prevent blur from firing
                                      handleMultiCityFromSelect(index, loc);
                                    }}
                                  >
                                    <div className="font-semibold">{loc.name}</div>
                                    {loc.code && <div className="text-xs text-base-content/60">{loc.code}</div>}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>

                          <FaExchangeAlt className="w-3 h-3 text-base-content/40 mb-3" />

                          {/* To */}
                          <div className="flex-1 relative">
                            <input
                              type="text"
                              placeholder="To?"
                              className={`input input-sm input-bordered w-full text-sm h-10 ${multiCityErrors[`${index}_to`] ? 'input-error border-error' : ''}`}
                              value={flight.to}
                              onChange={(e) => updateMultiCityFlight(index, 'to', e.target.value)}
                              onFocus={() => {
                                if (flight.to) {
                                  setMultiCityToDropdowns(prev => ({ ...prev, [index]: true }));
                                  loadFlightLocations(flight.to, (options) => {
                                    setMultiCityToOptions(prev => ({ ...prev, [index]: options }));
                                  });
                                }
                              }}
                              autoComplete="off"
                            />
                            {multiCityErrors[`${index}_to`] && (
                              <div className="text-error text-xs mt-1 absolute">{multiCityErrors[`${index}_to`]}</div>
                            )}
                            {multiCityToDropdowns[index] && multiCityToOptions[index]?.length > 0 && (
                              <div className="absolute z-10 mt-1 w-full bg-base-100 border border-base-300 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                                {multiCityToOptions[index].map((loc, i) => (
                                  <button
                                    key={i}
                                    type="button"
                                    className="w-full text-left px-4 py-2 hover:bg-base-200 border-b border-base-200 last:border-b-0"
                                    onMouseDown={(e) => {
                                      e.preventDefault(); // Prevent blur from firing
                                      handleMultiCityToSelect(index, loc);
                                    }}
                                  >
                                    <div className="font-semibold">{loc.name}</div>
                                    {loc.code && <div className="text-xs text-base-content/60">{loc.code}</div>}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Date */}
                          <div className="w-40 flex flex-col">
                            <label className="text-xs text-base-content/60 mb-1">Departure</label>
                            <input
                              type="date"
                              className="input input-sm input-bordered w-full text-sm h-10"
                              value={flight.date}
                              min={index === 0 ? new Date().toISOString().split('T')[0] : multiCityFlights[index - 1]?.date || new Date().toISOString().split('T')[0]}
                              onChange={(e) => updateMultiCityFlight(index, 'date', e.target.value)}
                            />
                          </div>

                          {/* Remove button */}
                          {multiCityFlights.length > 2 && (
                            <button
                              type="button"
                              onClick={() => removeMultiCityFlight(index)}
                              className="btn btn-ghost btn-sm btn-circle mb-1"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      ))}

                      <div className="flex items-center justify-between gap-2 pt-2">
                        {/* Add Flight button */}
                        <button
                          type="button"
                          onClick={addMultiCityFlight}
                          className="btn btn-sm btn-outline"
                          disabled={multiCityFlights.length >= 5}
                        >
                          + Add Flight
                        </button>

                        {/* Search button */}
                        <button
                          onClick={handleSearch}
                          className="btn btn-primary btn-circle"
                        >
                          <FaSearch className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Bottom row: Additional options */}
                  <div className="flex items-center gap-4 px-3 pb-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" className="checkbox checkbox-xs checkbox-primary" />
                      <span className="text-xs">Direct flights only</span>
                    </label>
                  </div>

                  {/* Error message display */}
                  {errors.flights && (
                    <div className="px-3 pb-3">
                      <div className="alert alert-error py-2 text-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-5 w-5" fill="none" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{errors.flights}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'hotels' && (
                <div className="bg-base-100 rounded-lg shadow-xl">
                  {/* Main search row */}
                  <div className="flex items-center gap-2 p-4">
                    {/* Location */}
                    <div className="flex-[2] min-w-0 relative">
                      <input
                        type="text"
                        placeholder="Try: Mumbai, Bangalore, Goa, London, New York..."
                        className="input input-sm input-bordered w-full text-sm"
                        value={searchData.hotels.location}
                        onChange={(e) => {
                          const value = e.target.value;
                          setSearchData({
                            ...searchData,
                            hotels: { ...searchData.hotels, location: value }
                          });
                          setHotelLocationSelected(false);
                          
                          // Load location options with debounce
                          if (value.trim().length >= 2) {
                            setTimeout(() => loadLocations(value, setHotelLocationOptions), 300);
                          } else {
                            setHotelLocationOptions([]);
                          }
                          setShowHotelLocationDropdown(true);
                        }}
                        onBlur={() => {
                          // Delay to allow click event to register first
                          setTimeout(() => {
                            setShowHotelLocationDropdown(false);
                          }, 300);
                        }}
                        onFocus={() => {
                          setShowHotelLocationDropdown(true);
                          if (!hotelLocationOptions.length && searchData.hotels.location) {
                            loadLocations(searchData.hotels.location, setHotelLocationOptions);
                          }
                        }}
                        autoComplete="off"
                      />
                      
                      {/* Location Dropdown */}
                      {showHotelLocationDropdown && hotelLocationOptions.length > 0 && (
                        <div className="absolute top-full left-0 mt-1 bg-base-100 border border-base-300 rounded-lg shadow-xl w-80 max-h-72 overflow-y-auto z-50">
                          {hotelLocationOptions.map((loc, index) => (
                            <button
                              key={`${loc.name}-${index}`}
                              type="button"
                              className="w-full text-left px-4 py-3 hover:bg-primary/10 flex items-center justify-between border-b border-base-200 last:border-b-0"
                              onMouseDown={(e) => {
                                e.preventDefault(); // Prevent blur from firing
                                setSearchData({
                                  ...searchData,
                                  hotels: { ...searchData.hotels, location: loc.name }
                                });
                                setHotelLocationSelected(true);
                                setShowHotelLocationDropdown(false);
                                setHotelLocationOptions([]);
                              }}
                            >
                              <span className="font-medium text-base">{loc.name}</span>
                              <span className="text-sm text-base-content/60 ml-4 whitespace-nowrap">
                                {loc.country}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Check-in */}
                    <div className="flex-1 min-w-0">
                      <input
                        type="date"
                        className="input input-sm input-bordered w-full text-xs"
                        value={searchData.hotels.checkIn}
                        min={getMinDate()}
                        onChange={(e) => setSearchData({
                          ...searchData,
                          hotels: { ...searchData.hotels, checkIn: e.target.value }
                        })}
                      />
                    </div>

                    {/* Check-out */}
                    <div className="flex-1 min-w-0">
                      <input
                        type="date"
                        className="input input-sm input-bordered w-full text-xs"
                        value={searchData.hotels.checkOut}
                        min={searchData.hotels.checkIn || getMinDate()}
                        onChange={(e) => setSearchData({
                          ...searchData,
                          hotels: { ...searchData.hotels, checkOut: e.target.value }
                        })}
                      />
                    </div>

                    {/* Guests */}
                    <div className="flex-1 min-w-0">
                      <select
                        className="select select-sm select-bordered w-full text-xs"
                        value={searchData.hotels.guests}
                        onChange={(e) => setSearchData({
                          ...searchData,
                          hotels: { ...searchData.hotels, guests: parseInt(e.target.value) }
                        })}
                      >
                        <option value="1">1 guest</option>
                        <option value="2">2 guests</option>
                        <option value="3">3 guests</option>
                        <option value="4">4 guests</option>
                      </select>
                  </div>

                    {/* Search button */}
                    <button
                      onClick={handleSearch}
                      className="btn btn-primary btn-circle"
                    >
                      <FaSearch className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'cars' && (
                <div className="bg-base-100 rounded-lg shadow-xl">
                  {/* Main search row */}
                  <div className="flex items-end gap-2 p-4">
                    {/* Pick-up location */}
                    <div className="flex-[2] min-w-0 relative">
                      <label className="block text-xs font-medium text-base-content/70 mb-1">
                        Pickup Location
                      </label>
                      <input
                        type="text"
                        placeholder="Pick-up location"
                        className="input input-sm input-bordered w-full text-sm"
                        value={searchData.cars.location}
                        onChange={(e) => {
                          const value = e.target.value;
                          setSearchData({
                            ...searchData,
                            cars: { ...searchData.cars, location: value }
                          });
                          setCarLocationSelected(false);
                          
                          // Load location options with debounce
                          if (value.trim().length >= 2) {
                            setTimeout(() => loadCarLocations(value, setCarLocationOptions), 300);
                          } else {
                            setCarLocationOptions([]);
                          }
                          setShowCarLocationDropdown(true);
                        }}
                        onBlur={() => {
                          // Delay to allow click event to register first
                          setTimeout(() => {
                            setShowCarLocationDropdown(false);
                          }, 300);
                        }}
                        onFocus={() => {
                          setShowCarLocationDropdown(true);
                          if (!carLocationOptions.length && searchData.cars.location) {
                            loadCarLocations(searchData.cars.location, setCarLocationOptions);
                          }
                        }}
                        autoComplete="off"
                      />
                      
                      {/* Location Dropdown */}
                      {showCarLocationDropdown && carLocationOptions.length > 0 && (
                        <div className="absolute top-full left-0 mt-1 bg-base-100 border border-base-300 rounded-lg shadow-xl w-80 max-h-72 overflow-y-auto z-50">
                          {carLocationOptions.map((loc, index) => (
                            <button
                              key={`${loc.name}-${index}`}
                              type="button"
                              className="w-full text-left px-4 py-3 hover:bg-primary/10 flex items-center justify-between border-b border-base-200 last:border-b-0"
                              onMouseDown={(e) => {
                                e.preventDefault(); // Prevent blur from firing
                                setSearchData({
                                  ...searchData,
                                  cars: { ...searchData.cars, location: loc.name }
                                });
                                setCarLocationSelected(true);
                                setShowCarLocationDropdown(false);
                                setCarLocationOptions([]);
                              }}
                            >
                              <span className="font-medium text-base">{loc.name}</span>
                              <span className="text-sm text-base-content/60 ml-4 whitespace-nowrap">
                                {loc.carCount} car{loc.carCount !== 1 ? 's' : ''}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Pick-up date */}
                    <div className="flex-1 min-w-0">
                      <label className="block text-xs font-medium text-base-content/70 mb-1">
                        Pickup Date
                      </label>
                      <input
                        type="date"
                        className={`input input-sm input-bordered w-full text-xs ${carTimeError && carTimeError.includes('Pick-up') ? 'border-error' : ''}`}
                        value={searchData.cars.pickUp}
                        min={getMinDate()}
                        onChange={(e) => {
                          setSearchData({
                            ...searchData,
                            cars: { ...searchData.cars, pickUp: e.target.value }
                          });
                          setCarTimeError('');
                        }}
                      />
                    </div>

                    {/* Pick-up time */}
                    <div className="flex-1 min-w-0">
                      <label className="block text-xs font-medium text-base-content/70 mb-1">
                        Pickup Time
                      </label>
                      <input
                        type="time"
                        className={`input input-sm input-bordered w-full text-xs ${carTimeError && carTimeError.includes('Pick-up') ? 'border-error' : ''}`}
                        value={searchData.cars.pickUpTime}
                        onChange={(e) => {
                          setSearchData({
                            ...searchData,
                            cars: { ...searchData.cars, pickUpTime: e.target.value }
                          });
                          setCarTimeError('');
                        }}
                      />
                    </div>

                    {/* Drop-off date */}
                    <div className="flex-1 min-w-0">
                      <label className="block text-xs font-medium text-base-content/70 mb-1">
                        Drop Date
                      </label>
                      <input
                        type="date"
                        className={`input input-sm input-bordered w-full text-xs ${carTimeError && carTimeError.includes('Drop-off') ? 'border-error' : ''}`}
                        value={searchData.cars.dropOff}
                        min={searchData.cars.pickUp || getMinDate()}
                        onChange={(e) => {
                          setSearchData({
                            ...searchData,
                            cars: { ...searchData.cars, dropOff: e.target.value }
                          });
                          setCarTimeError('');
                        }}
                      />
                    </div>

                    {/* Drop-off time */}
                    <div className="flex-1 min-w-0">
                      <label className="block text-xs font-medium text-base-content/70 mb-1">
                        Drop Time
                      </label>
                      <input
                        type="time"
                        className={`input input-sm input-bordered w-full text-xs ${carTimeError && carTimeError.includes('Drop-off') ? 'border-error' : ''}`}
                        value={searchData.cars.dropOffTime}
                        onChange={(e) => {
                          setSearchData({
                            ...searchData,
                            cars: { ...searchData.cars, dropOffTime: e.target.value }
                          });
                          setCarTimeError('');
                        }}
                      />
                  </div>

                    {/* Search button */}
                    <div className="flex-shrink-0">
                      <button
                        onClick={handleSearch}
                        className="btn btn-primary btn-circle"
                      >
                        <FaSearch className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  
                  {/* Error message - more prominent position */}
                  {carTimeError && (
                    <div className="px-4 pb-4">
                      <div className="alert alert-error text-sm py-3 shadow-lg">
                        <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="font-medium">{carTimeError}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Column 2: vertical image stack (20% width) - scrollable with page */}
          <div className="hidden lg:block lg:w-[20%]">
            <div className="grid grid-cols-1 gap-3">
              <div className="h-48 rounded-3xl overflow-hidden shadow-lg">
                <img
                  src={
                    activeTab === 'flights'
                      ? '/flight1.jpg'
                      : activeTab === 'hotels'
                      ? '/stays1.webp'
                      : cars1
                  }
                  alt={`${activeTab} 1`}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="h-56 rounded-3xl overflow-hidden shadow-lg">
                <img
                  src={
                    activeTab === 'flights'
                      ? '/flight2.avif'
                      : activeTab === 'hotels'
                      ? '/stays2.jpg'
                      : cars2
                  }
                  alt={`${activeTab} 2`}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="h-40 rounded-3xl overflow-hidden shadow-lg">
                <img
                  src={
                    activeTab === 'flights'
                      ? '/flight3.jpg'
                      : activeTab === 'hotels'
                      ? '/stays3.webp'
                      : cars3
                  }
                  alt={`${activeTab} 3`}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>

          {/* Column 3: vertical image stack (20% width) - scrollable with page */}
          <div className="hidden lg:block lg:w-[20%]">
            <div className="grid grid-cols-1 gap-3">
              <div className="h-56 rounded-3xl overflow-hidden shadow-lg">
                <img
                  src={
                    activeTab === 'flights'
                      ? '/flight4.webp'
                      : activeTab === 'hotels'
                      ? '/stays4.jpg'
                      : cars4
                  }
                  alt={`${activeTab} 4`}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="h-40 rounded-3xl overflow-hidden shadow-lg">
                <img
                  src={
                    activeTab === 'flights'
                      ? '/flight5.jpg'
                      : activeTab === 'hotels'
                      ? '/stays5.jpg'
                      : cars5
                  }
                  alt={`${activeTab} 5`}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="h-48 rounded-3xl overflow-hidden shadow-lg">
                <img
                  src={
                    activeTab === 'flights'
                      ? '/flight6.jpg'
                      : activeTab === 'hotels'
                      ? '/stays6.jpeg'
                      : cars6
                  }
                  alt={`${activeTab} 6`}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            <AnimatedCard delay={0} animation="fadeInUp">
              <div className="card bg-base-100 p-6 card-hover">
                <div className="flex items-center gap-4 mb-4">
                  <div className="text-2xl font-bold text-base-content">Save when you compare</div>
                </div>
                <p className="text-base-content/70">More deals. More sites. One search.</p>
              </div>
            </AnimatedCard>

            <AnimatedCard delay={100} animation="fadeInUp">
              <div className="card bg-base-100 p-6 card-hover">
                <div className="flex items-center gap-4 mb-4">
                  <div className="text-2xl font-bold text-base-content">41,000,000+</div>
                </div>
                <p className="text-base-content/70">searches this week</p>
              </div>
            </AnimatedCard>

            <AnimatedCard delay={200} animation="fadeInUp">
              <div className="card bg-base-100 p-6 card-hover">
                <div className="flex items-center gap-4 mb-4">
                  <div className="text-2xl font-bold text-base-content">Travelers love us</div>
                </div>
                <p className="text-base-content/70">1M+ ratings on our app</p>
              </div>
            </AnimatedCard>
          </div>

          <div className="mb-12">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-bold text-base-content">Travel deals under $246</h2>
              <a href="/flights" className="link link-primary">Explore more &gt;</a>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { city: 'Los Angeles', price: 62, duration: '1h 21m', dates: 'Sun 12/14 ▸ Thu 12/18' },
                { city: 'Las Vegas', price: 83, duration: '1h 42m', dates: 'Sun 12/14 ▸ Thu 12/18' },
                { city: 'San Diego', price: 117, duration: '1h 37m', dates: 'Sat 12/6 ▸ Tue 12/9' },
                { city: 'Reno', price: 171, duration: '1h 5m', dates: 'Thu 12/11 ▸ Thu 12/18' }
              ].map((deal, index) => (
                <AnimatedCard key={deal.city} delay={index * 100} animation="scaleIn">
                  <div
                    className="card bg-base-100 overflow-hidden card-hover cursor-pointer"
                    onClick={() => {
                      setActiveTab('flights');
                      setSearchData({
                        ...searchData,
                        flights: { ...searchData.flights, to: deal.city }
                      });
                    }}
                  >
                  {destinationImages[deal.city] ? (
                    <img
                      src={destinationImages[deal.city]}
                      alt={deal.city}
                      className="w-full h-32 object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'block';
                      }}
                    />
                  ) : null}
                  <div
                    className={`w-full h-32 bg-gradient-to-br from-primary/20 to-secondary/20 ${destinationImages[deal.city] ? 'hidden' : ''}`}
                  ></div>
                  <div className="card-body p-4">
                    <h3 className="card-title text-base-content mb-1">{deal.city}</h3>
                    <p className="text-sm text-base-content/70 mb-1">{deal.duration}, non-stop</p>
                    <p className="text-sm text-base-content/70 mb-2">{deal.dates}</p>
                    <p className="font-bold text-base-content">from ${deal.price}</p>
                  </div>
                </div>
                </AnimatedCard>
              ))}
            </div>
          </div>

          <div className="mb-12">
            <h2 className="text-3xl font-bold text-base-content mb-6">For travel pros</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { title: 'KAYAK.ai', tag: 'BETA', desc: 'Get travel questions answered' },
                { title: 'Best Time to Travel', desc: 'Know when to save' },
                { title: 'Explore', desc: 'See destinations on your budget' },
                { title: 'Trips', desc: 'Keep all your plans in one place' }
              ].map((item, index) => (
                <AnimatedCard key={item.title} delay={index * 100} animation="fadeInUp">
                  <div className="card bg-base-100 p-6 card-hover cursor-pointer">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-bold text-base-content">{item.title}</h3>
                    {item.tag && <span className="badge badge-ghost badge-sm">{item.tag}</span>}
                  </div>
                  <p className="text-base-content/70 text-sm">{item.desc}</p>
                </div>
                </AnimatedCard>
              ))}
            </div>
          </div>

          <div className="mb-12">
            <h2 className="text-3xl font-bold text-base-content mb-6">Start your travel planning here</h2>
            <p className="text-base-content/70 mb-6">
              <a href="/flights" className="link link-primary">Search Flights, Hotels & Rental Cars</a>
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                ['Las Vegas', 'Los Angeles', 'Orlando', 'Cancún', 'Tokyo', 'Chicago', 'Phoenix', 'India', 'Japan', 'Tampa', 'Nashville'],
                ['New York', 'Miami', 'Rome', 'Seattle', 'Fort Lauderdale', 'Atlanta', 'Boston', 'United States', 'Hawaii', 'Dallas', 'Honolulu'],
                ['London', 'Paris', 'Manila', 'Denver', 'San Francisco', 'San Diego', 'Punta Cana', 'Europe', 'Florida', 'Washington, D.C.', 'Portland']
              ].map((column, colIndex) => (
                <div key={colIndex} className="space-y-1">
                  {column.map((city) => (
                    <div
                      key={city}
                      className="flex items-center justify-between py-2 border-b border-base-300 cursor-pointer hover:text-primary transition-colors"
                      onClick={() => {
                        setActiveTab('flights');
                        setSearchData({
                          ...searchData,
                          flights: { ...searchData.flights, to: city }
                        });
                      }}
                    >
                      <div>
                        <div className="font-semibold text-base-content">{city}</div>
                        <div className="text-sm text-primary">
                          <a href="/cars" className="hover:underline">CARS</a>
                          {' • '}
                          <a href="/flights" className="hover:underline">FLIGHTS</a>
                          {' • '}
                          <a href="/hotels" className="hover:underline">HOTELS</a>
                        </div>
                      </div>
                      <AnimatedIcon>
                        <FaChevronDown className="w-4 h-4 text-base-content/50" />
                      </AnimatedIcon>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Flight Price Calendar Modal for Departure Date */}
      {showDepartCalendar && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="relative">
            <button
              onClick={() => setShowDepartCalendar(false)}
              className="absolute -top-3 -right-3 z-10 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100"
            >
              <FaTimes className="w-5 h-5" />
            </button>
            <FlightPriceCalendar
              selectedDate={searchData.flights.departDate}
              onDateSelect={(date) => {
                setSearchData({
                  ...searchData,
                  flights: { ...searchData.flights, departDate: date }
                });
                setShowDepartCalendar(false);
                // If return date is before depart date, adjust it
                if (searchData.flights.returnDate && searchData.flights.returnDate < date) {
                  const newReturnDate = addDaysToDateString(date, 7);
                  setSearchData({
                    ...searchData,
                    flights: { 
                      ...searchData.flights, 
                      departDate: date,
                      returnDate: newReturnDate
                    }
                  });
                }
              }}
              from={searchData.flights.from}
              to={searchData.flights.to}
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
              className="absolute -top-3 -right-3 z-10 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100"
            >
              <FaTimes className="w-5 h-5" />
            </button>
            <FlightPriceCalendar
              selectedDate={searchData.flights.returnDate}
              onDateSelect={(date) => {
                setSearchData({
                  ...searchData,
                  flights: { ...searchData.flights, returnDate: date }
                });
                setShowReturnCalendar(false);
              }}
              from={searchData.flights.to} // Reverse for return flight
              to={searchData.flights.from}
              minDate={searchData.flights.departDate || new Date().toISOString().split('T')[0]}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;

