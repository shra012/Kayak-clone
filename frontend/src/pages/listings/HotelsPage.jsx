import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './HotelsMap.css';
import L from 'leaflet';
import { listingsApi } from '../../services/api/listings';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { US_STATES } from '../../constants/usStates';
import AgentInlineChat from '../../components/agent/AgentInlineChat';

// Fix for default marker icon in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom price marker icon with hover and selected states
const createPriceIcon = (price, isHovered = false, isSelected = false) => {
  const scale = isSelected ? 1.3 : isHovered ? 1.15 : 1;
  const bgGradient = isSelected 
    ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' 
    : isHovered 
      ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' 
      : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)';
  const borderColor = isSelected ? '#10b981' : isHovered ? '#60a5fa' : '#ffffff';
  const borderWidth = isSelected ? 3 : isHovered ? 2.5 : 2;
  const shadowColor = isSelected 
    ? 'rgba(16, 185, 129, 0.5)' 
    : isHovered 
      ? 'rgba(59, 130, 246, 0.4)' 
      : 'rgba(0, 0, 0, 0.3)';
  const shadowSize = isSelected ? 8 : isHovered ? 6 : 4;
  
  return L.divIcon({
    className: `custom-price-marker ${isSelected ? 'selected' : ''} ${isHovered ? 'hovered' : ''}`,
    html: `<div style="
      background: ${bgGradient};
      color: white;
      padding: ${4 * scale}px ${10 * scale}px;
      border-radius: ${20 * scale}px;
      font-weight: 700;
      font-size: ${12 * scale}px;
      letter-spacing: 0.5px;
      border: ${borderWidth}px solid ${borderColor};
      box-shadow: 0 ${shadowSize}px ${shadowSize * 2}px ${shadowColor}, 
                  0 0 ${shadowSize * 2}px ${shadowColor} inset,
                  0 0 ${shadowSize * 3}px ${shadowColor};
      white-space: nowrap;
      transform: scale(${scale});
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      cursor: pointer;
      z-index: ${isSelected ? 1000 : isHovered ? 999 : 1};
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
      position: relative;
    ">
      <span style="
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: ${isSelected ? '120%' : '100%'};
        height: ${isSelected ? '120%' : '100%'};
        background: radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%);
        border-radius: inherit;
        pointer-events: none;
      "></span>
      <span style="position: relative; z-index: 1;">$${price}</span>
    </div>`,
    iconSize: [60 * scale, 30 * scale],
    iconAnchor: [30 * scale, 15 * scale],
  });
};

const MAX_CITY_SUGGESTIONS = 18;

const mapHotelLocationToOption = (item) => {
  if (!item) return null;
  const baseCity = item.city || item.name || '';
  if (!baseCity) return null;

  const regionParts = [];
  if (item.state) regionParts.push(item.state);
  if (item.country && !regionParts.includes(item.country)) {
    regionParts.push(item.country);
  }

  return {
    id: `${item.type || 'location'}-${baseCity}-${regionParts.join('-')}`,
    label: item.displayName || baseCity,
    city: baseCity,
    region: regionParts.join(', '),
    type: item.type || 'location',
  };
};

// Property type icons mapping
const propertyTypeIcons = {
  'Hotel': '🏨',
  'Apartment': '🏠',
  'Resort': '🛖',
  'Business Hotel': '🏢',
  'Villa': '🏡',
  'Hostel': '🛏️',
  'Bed & Breakfast': '🍳',
};

// Helper function to get property type icon
const getPropertyTypeIcon = (propertyType) => {
  return propertyTypeIcons[propertyType] || '🏨';
};

// Map controller component to handle programmatic map panning
const MapController = ({ selectedHotelId, hotels, zoom = 15 }) => {
  const map = useMap();
  
  useEffect(() => {
    if (selectedHotelId) {
      const hotel = hotels.find(h => h && h.id === selectedHotelId);
      if (hotel && hotel.lat && hotel.lng && typeof hotel.lat === 'number' && typeof hotel.lng === 'number') {
        // Smoothly pan and zoom to the selected hotel
        map.flyTo([hotel.lat, hotel.lng], zoom, {
          duration: 1.0, // Animation duration in seconds
          easeLinearity: 0.25
        });
      }
    }
  }, [selectedHotelId, hotels, map, zoom]);
  
  return null;
};

const defaultFilters = {
  city: '',
  state: '',
  minPrice: '',
  maxPrice: '',
  minRating: '',
  amenity: '', // Keep for backward compatibility with dropdown
  amenities: [], // Array for multiple selections
  propertyType: '', // Property type filter
  sortBy: 'rating',
  sortOrder: 'desc',
};

// Helper to get the current sort option value for the dropdown
const getCurrentSortValue = (sortBy, sortOrder) => {
  if (sortBy === 'rating' && sortOrder === 'desc') {
    return 'highest_rated';
  } else if (sortBy === 'pricePerNight' && sortOrder === 'asc') {
    return 'lowest_price';
  } else if (sortBy === 'bookingsCount' && sortOrder === 'desc') {
    return 'most_popular';
  } else if (sortBy === 'amenitiesCount' && sortOrder === 'desc') {
    return 'top_amenities';
  } else if (sortBy === 'createdAt' && sortOrder === 'desc') {
    return 'newest_listings';
  }
  // Default to highest_rated if no match
  return 'highest_rated';
};

const HotelsPage = () => {
  useDocumentTitle('Search Hotels');
  
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const toast = useToast();
  const searchData = location.state?.search;
  const agentMode = Boolean(location.state?.agentMode);
  const initialAgentPrompt = useMemo(() => {
    const text = location.state?.agentInitialPrompt;
    const id = location.state?.agentInitialPromptId;
    return text ? { text, id: id || `hotels-agent-${Date.now()}` } : null;
  }, [location.state]);
  
  // Initialize filters with search data from HomePage if available
  // Extract just the city name from full location string (e.g., "New York, New York, United States" -> "New York")
  // Also handles airport codes (e.g., "New Delhi (DEL)" -> "New Delhi")
  const extractCityName = (location) => {
    if (!location) return '';
    const parts = location.split(',');
    let cityName = parts[0].trim(); // Get first part before comma
    // Remove airport code in parentheses if present
    cityName = cityName.replace(/\s*\([A-Z]{3}\)\s*$/, '');
    return cityName;
  };
  
  const initialFilters = {
    ...defaultFilters,
    city: extractCityName(searchData?.location) || '',
    amenities: [], // Initialize amenities array
  };
  
  const [filters, setFilters] = useState(initialFilters);
  const [cityInput, setCityInput] = useState(extractCityName(searchData?.location) || '');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [results, setResults] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mapCenter, setMapCenter] = useState([40.7128, -74.0060]); // Default to NYC
  const [hoveredHotelId, setHoveredHotelId] = useState(null);
  const [selectedHotelId, setSelectedHotelId] = useState(null);
  const [mapZoom, setMapZoom] = useState(12);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const cityDropdownRef = useRef(null);
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [showHotelModal, setShowHotelModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showPriceFilter, setShowPriceFilter] = useState(false);
  const [tempMinPrice, setTempMinPrice] = useState('');
  const [tempMaxPrice, setTempMaxPrice] = useState('');
  const [selectedPriceRange, setSelectedPriceRange] = useState('');

  const navigateAgentTo = (mode) => {
    if (!agentMode) return;
    if (mode === 'flights') {
      navigate('/agent/flights', { state: { agentMode: true } });
      return;
    }
    if (mode === 'cars') {
      const today = new Date().toISOString().split('T')[0];
      const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
      navigate('/cars', {
        state: {
          agentMode: true,
          search: { location: filters.city, pickUp: today, dropOff: tomorrow },
        },
      });
      return;
    }
    // already on hotels
  };
  const priceDropdownRef = useRef(null);
  const [showAllFilters, setShowAllFilters] = useState(false);
  const [selectedFilterSection, setSelectedFilterSection] = useState('price');
  const [freebies, setFreebies] = useState([]);
  const [availableAmenities, setAvailableAmenities] = useState([]);
  const [loadingAmenities, setLoadingAmenities] = useState(false);
  const [availablePropertyTypes, setAvailablePropertyTypes] = useState([]);
  const [loadingPropertyTypes, setLoadingPropertyTypes] = useState(false);
  const [showSmartFilters, setShowSmartFilters] = useState(false);
  // Filters drawer: visible on desktop (xl breakpoint), hidden on mobile/tablet
  const [showFiltersDrawer, setShowFiltersDrawer] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  
  // Auto-show filters on desktop (xl breakpoint = 1280px) and track screen size
  useEffect(() => {
    const handleResize = () => {
      const desktop = window.innerWidth >= 1280;
      setIsDesktop(desktop);
      // Auto-show filters when switching to desktop
      if (desktop) {
        setShowFiltersDrawer(true);
      } else {
        // On mobile, start with filters closed
        setShowFiltersDrawer(false);
      }
    };
    
    // Set initial state on mount
    handleResize();
    
    // Listen for resize events
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const [expandedFilterSections, setExpandedFilterSections] = useState({
    price: true,
    amenities: true,
    mealPlan: true,
    propertyType: true,
    rating: true
  });
  const [citySuggestions, setCitySuggestions] = useState([]);
  const [popularCities, setPopularCities] = useState([]);
  const [isCityLoading, setIsCityLoading] = useState(false);
  const cityDebounceRef = useRef(null);

  const fetchCityOptions = useCallback(async (query = '') => {
    try {
      setIsCityLoading(true);
      const results = await listingsApi.searchHotelLocations(query || '', MAX_CITY_SUGGESTIONS);
      const formatted = (results || [])
        .map(mapHotelLocationToOption)
        .filter(Boolean);

      if (query) {
        setCitySuggestions(formatted);
      } else {
        setPopularCities(formatted);
        setCitySuggestions(formatted);
      }
    } catch (fetchError) {
      console.error('Failed to load hotel locations', fetchError);
      if (query) {
        setCitySuggestions([]);
      }
    } finally {
      setIsCityLoading(false);
    }
  }, []);

  const loadHotels = async (overridePage, overrideFilters) => {
    const currentPage = overridePage ?? page;
    const activeFilters = overrideFilters ?? filters;
    
    // Only show loading spinner on initial load or when there are no results
    // This prevents flickering when filters change
    if (results.length === 0) {
    setLoading(true);
    } else {
      // Show subtle refresh indicator when updating existing results
      setIsRefreshing(true);
    }
    setError(null);

    try {
      const params = {
        page: currentPage,
        pageSize,
        sortBy: activeFilters.sortBy,
        sortOrder: activeFilters.sortOrder,
      };

      if (activeFilters.city) params.city = activeFilters.city;
      if (activeFilters.state) params.state = activeFilters.state;
      if (activeFilters.minPrice) params.minPrice = activeFilters.minPrice;
      if (activeFilters.maxPrice) params.maxPrice = activeFilters.maxPrice;
      if (activeFilters.minRating) params.minRating = activeFilters.minRating;
      // Support both single amenity (for dropdown) and multiple amenities (for checkboxes)
      if (activeFilters.amenities && activeFilters.amenities.length > 0) {
        // Send as comma-separated string for backend compatibility
        params.amenities = activeFilters.amenities.join(',');
      } else if (activeFilters.amenity) {
        params.amenity = activeFilters.amenity;
      }
      if (activeFilters.propertyType) params.propertyType = activeFilters.propertyType;

      const data = await listingsApi.searchHotels(params);
      // Filter out any invalid hotels and ensure required fields exist
      const validHotels = (data.items || []).filter(hotel => 
        hotel && hotel.id && hotel.name
      );
      setResults(validHotels);
      setPagination(data.pagination || null);
      setPage(currentPage);

      // Update map center based on first result with valid coordinates
      const firstHotelWithCoords = validHotels.find(h => h.lat && h.lng && typeof h.lat === 'number' && typeof h.lng === 'number');
      if (firstHotelWithCoords) {
        setMapCenter([firstHotelWithCoords.lat, firstHotelWithCoords.lng]);
        setMapZoom(12);
      } else if (validHotels.length > 0) {
        // If no hotels have coordinates, keep default map center
        // Don't change map center
      }
    } catch (err) {
      console.error('Failed to load hotels', err);
      setError(err.response?.data?.message || 'Failed to load hotels');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  // Load available amenities and property types on component mount
  useEffect(() => {
    const fetchAmenities = async () => {
      setLoadingAmenities(true);
      try {
        const data = await listingsApi.getAvailableAmenities();
        setAvailableAmenities(data.amenities || []);
      } catch (err) {
        console.error('Failed to load amenities', err);
        // Fallback to default amenities if API fails
        setAvailableAmenities(['wifi', 'pool', 'parking', 'gym', 'spa', 'restaurant', 'breakfast', 'concierge', 'beach_access', 'airport_shuttle', 'boat_service']);
      } finally {
        setLoadingAmenities(false);
      }
    };

    const fetchPropertyTypes = async () => {
      setLoadingPropertyTypes(true);
      try {
        const data = await listingsApi.getAvailablePropertyTypes();
        setAvailablePropertyTypes(data.propertyTypes || []);
      } catch (err) {
        console.error('Failed to load property types', err);
        // Fallback to default property types if API fails
        setAvailablePropertyTypes(['Hotel', 'Resort', 'Apartment', 'Villa', 'Hostel', 'Bed & Breakfast', 'Business Hotel']);
      } finally {
        setLoadingPropertyTypes(false);
      }
    };

    fetchAmenities();
    fetchPropertyTypes();
  }, []);

  // Reset hover/selection when results change
  useEffect(() => {
    setHoveredHotelId(null);
    setSelectedHotelId(null);
  }, [results]);

  // Load hotels when component mounts or when search data changes
  useEffect(() => {
    if (searchData?.location) {
      // If we have search data from navigation, extract city and load with those filters
      const cityName = extractCityName(searchData.location);
      const newFilters = { ...filters, city: cityName };
      setFilters(newFilters);
      setCityInput(cityName);
      // Load hotels immediately with the new filters
      loadHotels(1, newFilters);
    } else {
      // No search data, just load all hotels
      loadHotels(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (cityDropdownRef.current && !cityDropdownRef.current.contains(event.target)) {
        setShowCityDropdown(false);
      }
      if (priceDropdownRef.current && !priceDropdownRef.current.contains(event.target)) {
        setShowPriceFilter(false);
      }
      // Close smart filters dropdown when clicking outside
      if (!event.target.closest('.smart-filters-container')) {
        setShowSmartFilters(false);
      }
    };

    if (showCityDropdown || showPriceFilter || showSmartFilters) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCityDropdown, showPriceFilter, showSmartFilters]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const newFilters = { ...filters, [name]: value };
    setFilters(newFilters);
    loadHotels(1, newFilters);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // If cityInput is empty, clear the city filter to show all hotels
    const cityValue = cityInput.trim() || '';
    const newFilters = { ...filters, city: cityValue };
    setFilters(newFilters);
    setShowCityDropdown(false);
    // Always trigger search, even if city is empty (will show all hotels)
    loadHotels(1, newFilters);
  };
  
  const handleCityInputChange = (e) => {
    setCityInput(e.target.value);
    setShowCityDropdown(true);
  };

  useEffect(() => {
    fetchCityOptions('');
  }, [fetchCityOptions]);

  useEffect(() => {
    const trimmed = cityInput.trim();
    if (!trimmed) {
      setCitySuggestions([...(popularCities ?? [])]);
      return undefined;
    }

    if (cityDebounceRef.current) {
      clearTimeout(cityDebounceRef.current);
    }

    cityDebounceRef.current = setTimeout(() => {
      fetchCityOptions(trimmed);
    }, 300);

    return () => {
      if (cityDebounceRef.current) {
        clearTimeout(cityDebounceRef.current);
      }
    };
  }, [cityInput, fetchCityOptions, popularCities]);

  const handleCitySelect = (cityOption) => {
    const selectedCity = cityOption?.city || cityOption?.name;
    if (!selectedCity) return;
    setCityInput(cityOption.label || selectedCity);
    const newFilters = { ...filters, city: selectedCity };
    setFilters(newFilters);
    setShowCityDropdown(false);
    loadHotels(1, newFilters);
  };

  const goToPage = (newPage) => {
    if (!pagination) return;
    if (newPage < 1 || newPage > pagination.totalPages) return;
    loadHotels(newPage);
  };

  const handleViewDeal = (hotel) => {
    console.log('=== View Deal clicked ===');
    console.log('Hotel:', hotel);
    console.log('isAuthenticated:', isAuthenticated);
    console.log('searchData:', searchData);
    
    // Check if user is authenticated
    if (!isAuthenticated) {
      console.log('User not authenticated, redirecting to login');
      toast.showError('Please log in to continue with booking');
      // Save booking data to sessionStorage to restore after login
      const checkIn = searchData?.checkIn || new Date().toISOString().split('T')[0];
      const checkOut = searchData?.checkOut || new Date(Date.now() + 86400000).toISOString().split('T')[0];
      const checkInDate = new Date(checkIn);
      const checkOutDate = new Date(checkOut);
      const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24)) || 1;

      const bookingData = {
        type: 'hotel',
        hotel,
        checkIn,
        checkOut,
        nights,
        guests: searchData?.guests || 1,
      };
      sessionStorage.setItem('pendingBooking', JSON.stringify(bookingData));
      sessionStorage.setItem('returnPath', '/bookings');
      navigate('/login');
      return;
    }

    // Calculate nights between check-in and check-out
    // Use searchData first, then fallback to today/tomorrow
    const checkIn = searchData?.checkIn || new Date().toISOString().split('T')[0];
    const checkOut = searchData?.checkOut || new Date(Date.now() + 86400000).toISOString().split('T')[0];
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24)) || 1;

    const bookingData = {
      type: 'hotel',
      hotel,
      checkIn,
      checkOut,
      nights,
      guests: searchData?.guests || 1,
    };

    console.log('Navigating to /bookings with bookingData:', bookingData);
    navigate('/bookings', { state: { bookingData } });
  };

  const handlePriceFilterApply = () => {
    const newFilters = {
      ...filters,
      minPrice: tempMinPrice,
      maxPrice: tempMaxPrice
    };
    setFilters(newFilters);
    loadHotels(1, newFilters);
    setShowPriceFilter(false);
  };

  const handlePriceFilterReset = () => {
    setTempMinPrice('');
    setTempMaxPrice('');
    setSelectedPriceRange('');
    const newFilters = {
      ...filters,
      minPrice: '',
      maxPrice: ''
    };
    setFilters(newFilters);
    loadHotels(1, newFilters);
  };

  const handleQuickPriceSelect = (range, minPrice, maxPrice) => {
    setTempMinPrice(minPrice);
    setTempMaxPrice(maxPrice);
    setSelectedPriceRange(range);
  };

  const getPriceFilterLabel = () => {
    if (filters.minPrice && filters.maxPrice) {
      return `$${filters.minPrice} - $${filters.maxPrice}`;
    } else if (filters.minPrice) {
      return `$${filters.minPrice}+`;
    } else if (filters.maxPrice) {
      return `Up to $${filters.maxPrice}`;
    }
    return 'Price';
  };

  const handleAllFiltersApply = () => {
    const newFilters = {
      ...filters,
      minPrice: tempMinPrice,
      maxPrice: tempMaxPrice,
    };
    setFilters(newFilters);
    loadHotels(1, newFilters);
    setShowAllFilters(false);
  };

  const handleAllFiltersReset = () => {
    setTempMinPrice('');
    setTempMaxPrice('');
    setSelectedPriceRange('');
    setFreebies([]);
    const newFilters = {
      ...defaultFilters,
      city: filters.city, // Keep city filter
      propertyType: '', // Reset property type
    };
    setFilters(newFilters);
    loadHotels(1, newFilters);
  };

  const toggleFreebie = (freebie) => {
    setFreebies(prev => 
      prev.includes(freebie) 
        ? prev.filter(f => f !== freebie)
        : [...prev, freebie]
    );
  };

  const activeCityOptions = (cityInput.trim() ? citySuggestions : popularCities);

  return (
    <div className="min-h-screen bg-base-100">
      {/* Top search bar - Kayak style */}
      <div className="bg-base-100/90 backdrop-blur-sm border-b border-base-300 sticky top-0 z-20 shadow-sm">
        <div className="max-w-full mx-auto px-4 py-3">
          <form className="flex items-center gap-2" onSubmit={handleSubmit}>
            <div className="relative flex-1 max-w-md" ref={cityDropdownRef}>
              <input
                type="text"
                name="city"
                placeholder="Search city (e.g., New York, Miami, Austin...)"
                value={cityInput}
                onChange={handleCityInputChange}
                onFocus={() => setShowCityDropdown(true)}
                className="input input-sm input-bordered w-full"
                autoComplete="off"
              />
              
              {/* Autocomplete Dropdown */}
              {showCityDropdown && (
                <div className="absolute top-full left-0 mt-1 bg-base-100 border-2 border-primary/20 rounded-lg shadow-2xl w-full max-h-96 overflow-y-auto" style={{ zIndex: 9999 }}>
                  <div className="sticky top-0 bg-base-200 px-4 py-2 text-xs font-semibold text-base-content/70 border-b border-base-300 flex items-center justify-between">
                    <span>
                      {isCityLoading
                        ? 'Searching cities...'
                        : `${activeCityOptions.length} ${activeCityOptions.length === 1 ? 'city' : 'cities'} found`}
                    </span>
                    {isCityLoading && <span className="loading loading-xs loading-spinner text-primary"></span>}
                  </div>

                  {isCityLoading && (
                    <div className="px-4 py-6 text-sm text-base-content/70 flex items-center gap-2">
                      <span className="loading loading-sm loading-spinner text-primary"></span>
                      Fetching the best matches...
                    </div>
                  )}

                  {!isCityLoading && activeCityOptions.length === 0 && (
                    <div className="px-4 py-4 text-sm text-base-content/60">
                      No cities found. Try broadening your search or check spelling.
                    </div>
                  )}

                  {!isCityLoading && activeCityOptions.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      className="w-full text-left px-4 py-3 hover:bg-primary/10 flex items-start gap-3 border-b border-base-200 last:border-b-0 transition-colors"
                      onClick={() => handleCitySelect(option)}
                    >
                      <span className="text-primary text-lg mt-0.5"></span>
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-base-content">{option.label}</div>
                        {option.region && (
                          <div className="text-xs text-base-content/60 mt-0.5">{option.region}</div>
                        )}
                      </div>
                      <span className="badge badge-xs badge-outline uppercase tracking-wide">
                        {option.type === 'property' ? 'Property' : 'City'}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            <input
              type="date"
              className="input input-sm input-bordered w-32"
              value={searchData?.checkIn || ''}
              readOnly
            />
            <input
              type="date"
              className="input input-sm input-bordered w-32"
              value={searchData?.checkOut || ''}
              readOnly
            />
            <div className="text-sm px-3">
              {searchData?.guests || 1} guest{searchData?.guests > 1 ? 's' : ''}
            </div>
            <button
              type="submit"
              className="btn btn-primary btn-sm btn-circle"
              disabled={loading}
            >
              
            </button>
          </form>
        </div>
      </div>

      {/* Filter bar - Simplified */}
      <div className="bg-base-200 border-b border-base-300">
        <div className="max-w-full mx-auto px-4 py-3">
          <div className="flex flex-wrap gap-2 items-center">
              <button
              className="btn btn-sm btn-primary"
              onClick={() => setShowFiltersDrawer(!showFiltersDrawer)}
            >
              {showFiltersDrawer ? '✕ Close Filters' : '☰ Filters'}
            </button>
            {filters.state && (
              <button
                className="btn btn-sm btn-primary"
                onClick={() => {
                  const newFilters = { ...filters, state: '' };
                  setFilters(newFilters);
                  loadHotels(1, newFilters);
                }}
              >
                State: {US_STATES.find(s => s.value === filters.state)?.label || filters.state}
                <span className="ml-2">×</span>
              </button>
            )}
            <div className="smart-filters-container">
              <button 
                className="btn btn-sm btn-outline transition-all duration-200 hover:btn-primary"
                onClick={() => setShowSmartFilters(!showSmartFilters)}
              >
                <span className="mr-2">✨</span>
                Smart Filters
              </button>
              
              {/* Slide-out Panel from Right */}
              <div 
                className={`fixed top-0 right-0 h-full w-96 max-w-[90vw] bg-base-100 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out overflow-y-auto ${
                  showSmartFilters ? 'translate-x-0' : 'translate-x-full'
                }`}
                style={{ top: '0', height: '100vh' }}
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6 pb-4 border-b border-base-300">
                    <div>
                      <h3 className="text-2xl font-bold text-primary mb-1">✨ Smart Filters</h3>
                      <p className="text-sm text-base-content/60">Quick filter presets</p>
                    </div>
                    <button 
                      className="btn btn-sm btn-circle btn-ghost"
                      onClick={() => setShowSmartFilters(false)}
                    >
                      ✕
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    <button
                      className="group w-full text-left bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 border-2 border-yellow-200 dark:border-yellow-800 rounded-xl p-5 hover:border-yellow-400 dark:hover:border-yellow-600 hover:shadow-lg transition-all duration-300"
                      onClick={() => {
                        const newFilters = {
                          ...filters,
                          minRating: '4.5',
                          amenities: ['wifi', 'breakfast', 'pool'],
                          amenity: ''
                        };
                        setFilters(newFilters);
                        loadHotels(1, newFilters);
                        setShowSmartFilters(false);
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-3xl group-hover:scale-110 transition-transform duration-300">⭐</div>
                        <div className="flex-1">
                          <h4 className="text-lg font-bold text-yellow-900 dark:text-yellow-200 mb-1">Luxury</h4>
                          <p className="text-xs text-yellow-700 dark:text-yellow-300/80">4.5+ stars, WiFi, Breakfast, Pool</p>
                        </div>
                        <div className="text-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-yellow-600">→</div>
                      </div>
                    </button>

                    <button
                      className="group w-full text-left bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-200 dark:border-green-800 rounded-xl p-5 hover:border-green-400 dark:hover:border-green-600 hover:shadow-lg transition-all duration-300"
                      onClick={() => {
                        const newFilters = {
                          ...filters,
                          maxPrice: '200',
                          amenities: ['wifi', 'breakfast'],
                          amenity: ''
                        };
                        setFilters(newFilters);
                        loadHotels(1, newFilters);
                        setShowSmartFilters(false);
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-3xl group-hover:scale-110 transition-transform duration-300">💰</div>
                        <div className="flex-1">
                          <h4 className="text-lg font-bold text-green-900 dark:text-green-200 mb-1">Best Value</h4>
                          <p className="text-xs text-green-700 dark:text-green-300/80">Under $200, WiFi, Breakfast</p>
                        </div>
                        <div className="text-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-green-600">→</div>
                      </div>
                    </button>

                    <button
                      className="group w-full text-left bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-xl p-5 hover:border-blue-400 dark:hover:border-blue-600 hover:shadow-lg transition-all duration-300"
                      onClick={() => {
                        const newFilters = {
                          ...filters,
                          amenities: ['wifi', 'pool', 'gym', 'spa'],
                          amenity: ''
                        };
                        setFilters(newFilters);
                        loadHotels(1, newFilters);
                        setShowSmartFilters(false);
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-3xl group-hover:scale-110 transition-transform duration-300">🏋️</div>
                        <div className="flex-1">
                          <h4 className="text-lg font-bold text-blue-900 dark:text-blue-200 mb-1">Fitness & Wellness</h4>
                          <p className="text-xs text-blue-700 dark:text-blue-300/80">WiFi, Pool, Gym, Spa</p>
                        </div>
                        <div className="text-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-blue-600">→</div>
                      </div>
                    </button>

                    <button
                      className="group w-full text-left bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20 border-2 border-pink-200 dark:border-pink-800 rounded-xl p-5 hover:border-pink-400 dark:hover:border-pink-600 hover:shadow-lg transition-all duration-300"
                      onClick={() => {
                        const newFilters = {
                          ...filters,
                          amenities: ['wifi', 'breakfast', 'pool', 'parking'],
                          amenity: ''
                        };
                        setFilters(newFilters);
                        loadHotels(1, newFilters);
                        setShowSmartFilters(false);
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-3xl group-hover:scale-110 transition-transform duration-300">👨‍👩‍👧‍👦</div>
                        <div className="flex-1">
                          <h4 className="text-lg font-bold text-pink-900 dark:text-pink-200 mb-1">Family Friendly</h4>
                          <p className="text-xs text-pink-700 dark:text-pink-300/80">WiFi, Breakfast, Pool, Parking</p>
                        </div>
                        <div className="text-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-pink-600">→</div>
                      </div>
                    </button>

                    <button
                      className="group w-full text-left bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20 border-2 border-teal-200 dark:border-teal-800 rounded-xl p-5 hover:border-teal-400 dark:hover:border-teal-600 hover:shadow-lg transition-all duration-300"
                      onClick={() => {
                        const newFilters = {
                          ...filters,
                          amenities: ['beach_access', 'pool', 'spa'],
                          amenity: ''
                        };
                        setFilters(newFilters);
                        loadHotels(1, newFilters);
                        setShowSmartFilters(false);
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-3xl group-hover:scale-110 transition-transform duration-300">🏖️</div>
                        <div className="flex-1">
                          <h4 className="text-lg font-bold text-teal-900 dark:text-teal-200 mb-1">Beach Resort</h4>
                          <p className="text-xs text-teal-700 dark:text-teal-300/80">Beach Access, Pool, Spa</p>
                        </div>
                        <div className="text-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-teal-600">→</div>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Overlay backdrop - only when panel is open */}
              {showSmartFilters && (
                <div 
                  className="fixed inset-0 bg-black/20 z-40"
                  onClick={() => setShowSmartFilters(false)}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main content: 3-column CSS Grid Layout */}
      {/* Desktop (xl+): 3 columns (filters can be toggled) | Mobile/Tablet: Single column stack */}
      <div 
        className={`grid gap-4 max-xl:grid-cols-1 max-xl:auto-rows-auto transition-all duration-300`}
        style={{ 
          height: 'calc(100vh - 150px)', 
          minHeight: 'calc(100vh - 150px)',
          gridTemplateColumns: isDesktop 
            ? (showFiltersDrawer ? '300px 1fr 450px' : '1fr 450px')
            : '1fr'
        }}
      >
        {/* Filters Sidebar - Column 1 - Sticky */}
        {showFiltersDrawer && (
          <aside className={`overflow-y-auto border-r border-base-300 bg-base-100 transition-all duration-300 sticky`} style={{ 
            height: 'calc(100vh - 150px)',
            minWidth: '300px',
            maxWidth: '300px',
            width: '300px',
            top: '8rem',
            alignSelf: 'flex-start'
          }}>
          <div className="h-full overflow-y-auto p-4" style={{ maxHeight: 'calc(100vh - 150px)' }}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">Filters</h2>
                  <button
                    className="btn btn-sm btn-ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowFiltersDrawer(false);
                    }}
                  >
                    ✕
                  </button>
                </div>

                {/* Clear all filters button */}
                {(filters.minPrice || filters.maxPrice || filters.minRating || filters.amenity || (filters.amenities && filters.amenities.length > 0) || filters.propertyType) && (
                  <button
                    className="btn btn-sm btn-outline btn-error w-full mb-4"
                    onClick={() => {
                      const newFilters = {
                        ...filters,
                        minPrice: '',
                        maxPrice: '',
                        minRating: '',
                        amenity: '',
                        amenities: [],
                        propertyType: ''
                      };
                      setFilters(newFilters);
                      setTempMinPrice('');
                      setTempMaxPrice('');
                    setSelectedPriceRange('');
                      loadHotels(1, newFilters);
                }}
              >
                    Clear all filters
              </button>
                )}

                {/* Price Section */}
                <div className="collapse collapse-arrow bg-base-200 mb-2">
                  <input
                    type="checkbox"
                    checked={expandedFilterSections.price}
                    onChange={(e) => setExpandedFilterSections({ ...expandedFilterSections, price: e.target.checked })}
                  />
                  <div className="collapse-title text-lg font-semibold">
                    💰 Price
                  </div>
                  <div className="collapse-content">
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                      <div>
                          <label className="label label-text text-xs">Min Price</label>
                        <input
                          type="number"
                          placeholder="$0"
                          value={tempMinPrice}
                          onChange={(e) => {
                            setTempMinPrice(e.target.value);
                              setSelectedPriceRange('');
                          }}
                          className="input input-sm input-bordered w-full"
                        />
                      </div>
                      <div>
                          <label className="label label-text text-xs">Max Price</label>
                        <input
                          type="number"
                            placeholder="$500"
                          value={tempMaxPrice}
                          onChange={(e) => {
                            setTempMaxPrice(e.target.value);
                              setSelectedPriceRange('');
                          }}
                          className="input input-sm input-bordered w-full"
                        />
        </div>
      </div>
                      <div className="grid grid-cols-2 gap-2">
                      <button
                        className={`btn btn-xs ${selectedPriceRange === 'under100' ? 'btn-primary' : 'btn-outline'}`}
                        onClick={() => handleQuickPriceSelect('under100', '', '100')}
                      >
                        Under $100
                      </button>
                      <button
                        className={`btn btn-xs ${selectedPriceRange === '100-200' ? 'btn-primary' : 'btn-outline'}`}
                        onClick={() => handleQuickPriceSelect('100-200', '100', '200')}
                      >
                          $100-$200
                      </button>
                      <button
                        className={`btn btn-xs ${selectedPriceRange === '200-300' ? 'btn-primary' : 'btn-outline'}`}
                        onClick={() => handleQuickPriceSelect('200-300', '200', '300')}
                      >
                          $200-$300
                      </button>
                      <button
                        className={`btn btn-xs ${selectedPriceRange === '300+' ? 'btn-primary' : 'btn-outline'}`}
                        onClick={() => handleQuickPriceSelect('300+', '300', '')}
                      >
                        $300+
                      </button>
                    </div>
                      <div className="flex gap-2">
                      <button
                          className="btn btn-xs btn-ghost flex-1"
                        onClick={handlePriceFilterReset}
                      >
                        Reset
                      </button>
                      <button
                          className="btn btn-xs btn-primary flex-1"
                        onClick={handlePriceFilterApply}
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                </div>
                </div>

                {/* Amenities Section */}
                <div className="collapse collapse-arrow bg-base-200 mb-2">
                  <input
                    type="checkbox"
                    checked={expandedFilterSections.amenities}
                    onChange={(e) => setExpandedFilterSections({ ...expandedFilterSections, amenities: e.target.checked })}
                  />
                  <div className="collapse-title text-lg font-semibold">
                    🛎️ Amenities
                  </div>
                  <div className="collapse-content">
                    {loadingAmenities ? (
                      <div className="text-center py-4">
                        <span className="loading loading-spinner loading-sm"></span>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {availableAmenities.length > 0 ? (
                          availableAmenities.map((amenity) => (
                            <label key={amenity} className="flex items-center gap-2 cursor-pointer p-2 hover:bg-base-300 rounded">
                              <input
                                type="checkbox"
                                className="checkbox checkbox-sm"
                                checked={(filters.amenities || []).includes(amenity)}
                                onChange={(e) => {
                                  const currentAmenities = filters.amenities || [];
                                  let newAmenities;
                                  if (e.target.checked) {
                                    newAmenities = [...currentAmenities, amenity];
                                  } else {
                                    newAmenities = currentAmenities.filter(a => a !== amenity);
                                  }
                                  const newFilters = {
                                    ...filters,
                                    amenities: newAmenities,
                                  };
                                  setFilters(newFilters);
                                  loadHotels(1, newFilters);
                                }}
                              />
                              <span className="text-sm capitalize">{amenity.replace(/_/g, ' ')}</span>
                            </label>
                          ))
                        ) : (
                          <p className="text-sm text-base-content/60">No amenities available</p>
                        )}
                      </div>
                    )}
                  </div>
            </div>
            
                {/* Meal Plan Section */}
                <div className="collapse collapse-arrow bg-base-200 mb-2">
                  <input
                    type="checkbox"
                    checked={expandedFilterSections.mealPlan}
                    onChange={(e) => setExpandedFilterSections({ ...expandedFilterSections, mealPlan: e.target.checked })}
                  />
                  <div className="collapse-title text-lg font-semibold">
                    🍳 Meal Plan
                  </div>
                  <div className="collapse-content">
                    <label className="flex items-center gap-2 cursor-pointer p-2 hover:bg-base-300 rounded">
                      <input
                        type="checkbox"
                        className="checkbox checkbox-sm"
                        checked={filters.amenity === 'breakfast'}
                        onChange={(e) => {
                          const newFilters = {
                            ...filters,
                            amenity: e.target.checked ? 'breakfast' : ''
                          };
                          setFilters(newFilters);
                          loadHotels(1, newFilters);
                        }}
                      />
                      <span className="text-sm">Free breakfast</span>
                    </label>
                  </div>
                </div>

                {/* Property Type Section */}
                <div className="collapse collapse-arrow bg-base-200 mb-2">
                  <input
                    type="checkbox"
                    checked={expandedFilterSections.propertyType}
                    onChange={(e) => setExpandedFilterSections({ ...expandedFilterSections, propertyType: e.target.checked })}
                  />
                  <div className="collapse-title text-lg font-semibold">
                    🏨 Property Type
                  </div>
                  <div className="collapse-content">
                    <div className="space-y-2">
                      {availablePropertyTypes.map((type) => (
                        <label key={type} className="flex items-center gap-2 cursor-pointer p-2 hover:bg-base-300 rounded">
                          <input
                            type="radio"
                            name="propertyType"
                            className="radio radio-sm"
                            checked={filters.propertyType === type}
                            onChange={() => {
                              const newFilters = {
                                ...filters,
                                propertyType: filters.propertyType === type ? '' : type
                              };
                              setFilters(newFilters);
                              loadHotels(1, newFilters);
                            }}
                          />
                          <span className="text-lg">{getPropertyTypeIcon(type)}</span>
                          <span className="text-sm">{type}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Rating Section */}
                <div className="collapse collapse-arrow bg-base-200 mb-2">
                  <input
                    type="checkbox"
                    checked={expandedFilterSections.rating}
                    onChange={(e) => setExpandedFilterSections({ ...expandedFilterSections, rating: e.target.checked })}
                  />
                  <div className="collapse-title text-lg font-semibold">
                    ⭐ Hotel Rating
                  </div>
                  <div className="collapse-content">
                    <div className="space-y-2">
                      {['3', '3.5', '4', '4.5'].map((rating) => (
                        <label key={rating} className="flex items-center gap-2 cursor-pointer p-2 hover:bg-base-300 rounded">
                          <input
                            type="radio"
                            name="minRating"
                            className="radio radio-sm"
                            checked={filters.minRating === rating}
                            onChange={() => {
                  const newFilters = {
                    ...filters,
                                minRating: filters.minRating === rating ? '' : rating
                  };
                  setFilters(newFilters);
                  loadHotels(1, newFilters);
                }}
                          />
                          <span className="text-sm">{rating}+ stars</span>
                          <div className="flex gap-0.5">
                            {[...Array(Math.floor(Number(rating)))].map((_, i) => (
                              <span key={i} className="text-warning text-xs">★</span>
                            ))}
          </div>
                        </label>
                      ))}
        </div>
      </div>
                </div>
          </div>
          </aside>
        )}

        {/* Hotel List - Column 2 */}
        <main className="overflow-y-auto px-4 py-4 flex-shrink-0" style={{ 
          height: 'calc(100vh - 150px)',
          minWidth: '360px'
        }}>
          {/* Toggle Filters Button - All screen sizes */}
          <div className="mb-4">
            <button
              className="btn btn-sm btn-primary"
              onClick={() => setShowFiltersDrawer(!showFiltersDrawer)}
            >
              {showFiltersDrawer ? '✕ Close Filters' : '☰ Filters'}
            </button>
          </div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="font-bold">{pagination?.totalItems || 0} results</span>
              {isRefreshing && (
                <span className="loading loading-spinner loading-xs"></span>
              )}
              <span className="ml-2 text-sm">Sort by</span>
              <select
                value={getCurrentSortValue(filters.sortBy, filters.sortOrder)}
                onChange={(e) => {
                  const value = e.target.value;
                  let sortBy, sortOrder;
                  // Map the new sort options to backend fields
                  switch(value) {
                    case 'highest_rated':
                      sortBy = 'rating';
                      sortOrder = 'desc';
                      break;
                    case 'lowest_price':
                      sortBy = 'pricePerNight';
                      sortOrder = 'asc';
                      break;
                    case 'most_popular':
                      sortBy = 'bookingsCount';
                      sortOrder = 'desc';
                      break;
                    case 'top_amenities':
                      sortBy = 'amenitiesCount';
                      sortOrder = 'desc';
                      break;
                    case 'newest_listings':
                      sortBy = 'createdAt';
                      sortOrder = 'desc';
                      break;
                    default:
                      const [sb, so] = value.split('_');
                      sortBy = sb;
                      sortOrder = so;
                  }
                  const newFilters = { ...filters, sortBy, sortOrder };
                  setFilters(newFilters);
                  loadHotels(1, newFilters);
                }}
                className="select select-sm select-bordered ml-2"
              >
                <option value="highest_rated">⭐ Highest Rated</option>
                <option value="lowest_price">💰 Lowest Price</option>
                <option value="most_popular">🔥 Most Popular</option>
                <option value="top_amenities">🛏️ Top Amenities</option>
                <option value="newest_listings">📰 Newest Listings</option>
              </select>
            </div>
          </div>

          {error && (
            <div className="alert alert-error mb-4">
              <span>{error}</span>
            </div>
          )}

          {loading && (
            <div className="space-y-4">
              {/* Skeleton Loaders for Hotel Cards with Shimmer Effect */}
              {[...Array(5)].map((_, index) => (
                <div key={index} className="card bg-base-100 border border-base-300 overflow-hidden">
                  <div className="flex gap-4 p-4">
                    {/* Image Skeleton with Shimmer */}
                    <div className="w-48 h-32 flex-shrink-0 bg-gradient-to-r from-base-300 via-base-200 to-base-300 rounded-lg animate-pulse" style={{
                      backgroundSize: '200% 100%',
                      animation: 'shimmer 2s infinite'
                    }}></div>
                    {/* Content Skeleton */}
                    <div className="flex-1 space-y-3">
                      <div className="h-6 bg-gradient-to-r from-base-300 via-base-200 to-base-300 rounded w-3/4 animate-pulse" style={{
                        backgroundSize: '200% 100%',
                        animation: 'shimmer 2s infinite'
                      }}></div>
                      <div className="h-4 bg-gradient-to-r from-base-300 via-base-200 to-base-300 rounded w-1/2 animate-pulse" style={{
                        backgroundSize: '200% 100%',
                        animation: 'shimmer 2s infinite'
                      }}></div>
                      <div className="h-4 bg-gradient-to-r from-base-300 via-base-200 to-base-300 rounded w-2/3 animate-pulse" style={{
                        backgroundSize: '200% 100%',
                        animation: 'shimmer 2s infinite'
                      }}></div>
                      <div className="flex gap-2">
                        <div className="h-6 bg-gradient-to-r from-base-300 via-base-200 to-base-300 rounded w-16 animate-pulse" style={{
                          backgroundSize: '200% 100%',
                          animation: 'shimmer 2s infinite'
                        }}></div>
                        <div className="h-6 bg-gradient-to-r from-base-300 via-base-200 to-base-300 rounded w-16 animate-pulse" style={{
                          backgroundSize: '200% 100%',
                          animation: 'shimmer 2s infinite'
                        }}></div>
                        <div className="h-6 bg-gradient-to-r from-base-300 via-base-200 to-base-300 rounded w-16 animate-pulse" style={{
                          backgroundSize: '200% 100%',
                          animation: 'shimmer 2s infinite'
                        }}></div>
                      </div>
                      <div className="flex justify-between items-end">
                        <div className="h-5 bg-gradient-to-r from-base-300 via-base-200 to-base-300 rounded w-24 animate-pulse" style={{
                          backgroundSize: '200% 100%',
                          animation: 'shimmer 2s infinite'
                        }}></div>
                        <div className="h-8 bg-gradient-to-r from-base-300 via-base-200 to-base-300 rounded w-24 animate-pulse" style={{
                          backgroundSize: '200% 100%',
                          animation: 'shimmer 2s infinite'
                        }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && results.length === 0 && !error && (
            <div className="text-center py-8">
              <svg className="w-16 h-16 mx-auto mb-4 text-base-content/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <p className="text-base-content/70 mb-4">No hotels found. Try adjusting your filters.</p>
              <div className="text-sm text-base-content/60">
                <p className="font-semibold mb-2">Popular destinations:</p>
                {popularCities.length === 0 ? (
                  <p className="text-xs text-base-content/50">We are loading top cities for you...</p>
                ) : (
                  <div className="flex flex-wrap gap-2 justify-center max-w-2xl mx-auto">
                    {popularCities.slice(0, 18).map((cityOption) => (
                      <button
                        key={cityOption.id}
                        className="btn btn-xs btn-outline"
                        onClick={() => handleCitySelect(cityOption)}
                      >
                        {cityOption.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {!loading && results.length > 0 && (
            <div className={`space-y-4 transition-opacity duration-300 ${isRefreshing ? 'opacity-70' : 'opacity-100'}`}>
              {results.filter(hotel => hotel && hotel.id).map((hotel) => {
                const isHovered = hoveredHotelId === hotel.id;
                const isSelected = selectedHotelId === hotel.id;
                return (
                <div 
                  key={hotel.id} 
                  id={`hotel-card-${hotel.id}`}
                  className={`card bg-base-100 border transition-all duration-300 ease-in-out transform overflow-hidden ${
                    isSelected 
                      ? 'border-primary border-2 shadow-2xl ring-4 ring-primary/30 scale-[1.02] bg-gradient-to-br from-primary/5 to-transparent' 
                      : isHovered 
                        ? 'border-primary/60 shadow-xl ring-2 ring-primary/20 scale-[1.01] bg-gradient-to-br from-primary/3 to-transparent' 
                        : 'border-base-300 hover:shadow-lg hover:border-primary/30'
                  }`}
                  style={{
                    boxShadow: isSelected 
                      ? '0 20px 25px -5px rgba(59, 130, 246, 0.3), 0 10px 10px -5px rgba(59, 130, 246, 0.2)' 
                      : isHovered 
                        ? '0 10px 15px -3px rgba(59, 130, 246, 0.2), 0 4px 6px -2px rgba(59, 130, 246, 0.1)' 
                        : undefined
                  }}
                  onMouseEnter={() => setHoveredHotelId(hotel.id)}
                  onMouseLeave={() => setHoveredHotelId(null)}
                  onClick={() => {
                    setSelectedHotelId(hotel.id);
                    // Scroll to card
                    const cardElement = document.getElementById(`hotel-card-${hotel.id}`);
                    if (cardElement) {
                      cardElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                  }}
                >
                  <div className="flex gap-4 p-4 min-w-0">
                    {/* Hotel Image */}
                    <div className="w-48 h-32 flex-shrink-0 bg-base-300 rounded-lg overflow-hidden relative" style={{ minWidth: '192px', minHeight: '128px' }}>
                      {hotel.imageUrl ? (
                        <img
                          src={hotel.imageUrl}
                          alt={hotel.name || 'Hotel'}
                          className="w-full h-full object-cover"
                          style={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover' }}
                          loading="lazy"
                          width="192"
                          height="128"
                          onError={(e) => {
                            // Replace with placeholder on error
                            e.target.onerror = null; // Prevent infinite loop
                            e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="192" height="128"%3E%3Crect fill="%23e5e7eb" width="192" height="128"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-size="48"%3E🏨%3C/text%3E%3C/svg%3E';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl bg-gradient-to-br from-base-300 to-base-200" style={{ minWidth: '192px', minHeight: '128px' }}>
                          🏨
                        </div>
                      )}
                    </div>

                    {/* Hotel Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h3 className="text-lg font-bold text-base-content truncate">{hotel.name || 'Hotel'}</h3>
                            {hotel.propertyType && (
                              <span className="badge badge-primary badge-sm gap-1.5 px-2 py-1 shadow-sm flex-shrink-0">
                                <span className="text-base">{getPropertyTypeIcon(hotel.propertyType)}</span>
                                <span className="font-medium text-xs whitespace-nowrap">{hotel.propertyType}</span>
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-base-content/70 flex items-center gap-1">
                            <span>📍</span>
                            <span>{hotel.city || 'Location not specified'}</span>
                          </p>
                          {hotel.rating && (
                          <div className="flex items-center gap-2 mt-2">
                              <span className="badge badge-success text-white font-bold">{Number(hotel.rating).toFixed(1)}</span>
                            <span className="text-sm text-base-content/60">Very good</span>
                            <div className="flex gap-0.5">
                              {[...Array(Math.floor(Number(hotel.rating)))].map((_, i) => (
                                <span key={i} className="text-warning">★</span>
                              ))}
                            </div>
                          </div>
                          )}
                          <div className="flex gap-2 mt-2">
                            {Array.isArray(hotel.amenities) && hotel.amenities.slice(0, 3).map((amenity, i) => (
                              <span key={i} className="text-xs text-base-content/60">{amenity}</span>
                            ))}
                          </div>
                        </div>

                        {/* Price */}
                        <div className="text-right flex-shrink-0">
                          <div className="text-2xl font-bold text-primary whitespace-nowrap">
                            {hotel.currency || 'USD'} {(hotel.pricePerNight || 0).toFixed(0)}
                          </div>
                          <button 
                            className="btn btn-primary btn-sm mt-2 whitespace-nowrap"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewDeal(hotel);
                            }}
                          >
                            View Deal
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
              })}
            </div>
          )}

          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <button
                className="btn btn-sm"
                onClick={() => goToPage(pagination.page - 1)}
                disabled={!pagination.hasPrevPage || loading}
              >
                « Prev
              </button>
              <button className="btn btn-sm btn-ghost">
                {pagination.page}
              </button>
              <button
                className="btn btn-sm"
                onClick={() => goToPage(pagination.page + 1)}
                disabled={!pagination.hasNextPage || loading}
              >
                Next »
              </button>
            </div>
          )}
        </main>

        {/* Map Section - Column 3 - Sticky */}
        <aside className="xl:block hidden flex-shrink-0 sticky" style={{ 
          height: 'calc(100vh - 150px)',
          minWidth: '450px',
          maxWidth: '450px',
          top: '8rem',
          alignSelf: 'flex-start'
        }}>
          {results.length > 0 && results.some(h => h && h.lat && h.lng && typeof h.lat === 'number' && typeof h.lng === 'number') ? (
            <MapContainer
              center={mapCenter}
              zoom={mapZoom}
              style={{ height: '100%', width: '100%' }}
              key={`${mapCenter[0]}-${mapCenter[1]}`}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MapController selectedHotelId={selectedHotelId} hotels={results} zoom={15} />
              {results
                .filter(hotel => hotel && hotel.lat && hotel.lng && typeof hotel.lat === 'number' && typeof hotel.lng === 'number')
                .map((hotel) => {
                  const isHovered = hoveredHotelId === hotel.id;
                  const isSelected = selectedHotelId === hotel.id;
                  return (
                  <Marker 
                    key={`${hotel.id}-${isHovered}-${isSelected}`}
                    position={[hotel.lat, hotel.lng]}
                    icon={createPriceIcon((hotel.pricePerNight || 0).toFixed(0), isHovered, isSelected)}
                    eventHandlers={{
                      mouseover: () => {
                        setHoveredHotelId(hotel.id);
                        // Scroll to card on hover
                        const cardElement = document.getElementById(`hotel-card-${hotel.id}`);
                        if (cardElement && !isSelected) {
                          cardElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                        }
                      },
                      mouseout: () => {
                        if (!isSelected) {
                          setHoveredHotelId(null);
                        }
                      },
                      click: () => {
                        setSelectedHotelId(hotel.id);
                        // Scroll to card
                        const cardElement = document.getElementById(`hotel-card-${hotel.id}`);
                        if (cardElement) {
                          cardElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }
                      },
                    }}
                  >
                    <Popup className="custom-popup">
                      <div className="p-0" style={{ minWidth: '280px', maxWidth: '320px' }}>
                        {/* Hotel Image */}
                        <div className="w-full h-40 bg-base-300 rounded-t-lg overflow-hidden relative">
                          {hotel.imageUrl ? (
                            <img
                              src={hotel.imageUrl}
                              alt={hotel.name || 'Hotel'}
                              className="w-full h-full object-cover"
                              style={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover' }}
                              loading="lazy"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="280" height="160"%3E%3Crect fill="%23e5e7eb" width="280" height="160"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-size="48"%3E🏨%3C/text%3E%3C/svg%3E';
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-5xl bg-gradient-to-br from-base-300 to-base-200">
                              🏨
                            </div>
                          )}
                        </div>
                        
                        {/* Hotel Details */}
                        <div className="p-3">
                          <div className="flex items-start gap-2 mb-2">
                            <h3 className="font-bold text-base flex-1">{hotel.name || 'Hotel'}</h3>
                            {hotel.propertyType && (
                              <span className="badge badge-primary badge-sm gap-1">
                                <span>{getPropertyTypeIcon(hotel.propertyType)}</span>
                                <span className="text-xs">{hotel.propertyType}</span>
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-base-content/70 mb-2 flex items-center gap-1">
                            <span>📍</span>
                            <span>{hotel.city || 'Location not specified'}</span>
                          </p>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-lg font-bold text-primary">
                            {hotel.currency || 'USD'} {(hotel.pricePerNight || 0).toFixed(0)}
                            <span className="text-xs font-normal text-base-content/60">/night</span>
                          </p>
                          {hotel.rating && (
                            <div className="flex items-center gap-1">
                              <span className="badge badge-success badge-sm text-white">{Number(hotel.rating).toFixed(1)}</span>
                              <div className="flex gap-0.5">
                                {[...Array(Math.floor(Number(hotel.rating)))].map((_, i) => (
                                  <span key={i} className="text-warning text-xs">★</span>
                                ))}
                        </div>
                            </div>
                          )}
                        </div>
                        {Array.isArray(hotel.amenities) && hotel.amenities.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {hotel.amenities.slice(0, 3).map((amenity, i) => (
                              <span key={i} className="badge badge-outline badge-xs capitalize">
                                {amenity.replace(/_/g, ' ')}
                              </span>
                            ))}
                          </div>
                        )}
                        <button 
                            className="btn btn-primary btn-sm w-full mt-2"
                          onClick={() => handleViewDeal(hotel)}
                        >
                          View Deal
                        </button>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                );
                })}
            </MapContainer>
          ) : (
            <div className="h-full flex items-center justify-center bg-base-200">
              {loading ? (
                <div className="w-full h-full animate-pulse">
                  <div className="w-full h-full bg-gradient-to-br from-base-300 via-base-200 to-base-300 flex items-center justify-center">
                    <div className="text-center">
                      <div className="loading loading-spinner loading-lg mb-4"></div>
                      <p className="text-lg font-semibold">Loading map...</p>
                    </div>
                  </div>
                </div>
              ) : (
              <div className="text-center">
                <div className="text-6xl mb-4"></div>
                <p className="text-lg font-semibold">Map View</p>
                  <p className="text-sm text-base-content/60">No hotels to display on map</p>
              </div>
              )}
            </div>
          )}
        </aside>
      </div>

      {/* All Filters Modal */}
      {showAllFilters && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-base-100 rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="bg-base-100 border-b border-base-300 px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold">All filters</h2>
              <button 
                className="btn btn-ghost btn-sm btn-circle"
                onClick={() => setShowAllFilters(false)}
              >
                
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex flex-1 overflow-hidden">
              {/* Left Sidebar - Filter Categories */}
              <div className="w-64 border-r border-base-300 overflow-y-auto">
                <div className="py-2">
                  <button
                    className={`w-full text-left px-6 py-3 hover:bg-base-200 ${selectedFilterSection === 'location' ? 'border-l-4 border-primary bg-base-200' : ''}`}
                    onClick={() => setSelectedFilterSection('location')}
                  >
                    <span className="font-semibold">Location</span>
                  </button>
                  <button
                    className={`w-full text-left px-6 py-3 hover:bg-base-200 ${selectedFilterSection === 'price' ? 'border-l-4 border-primary bg-base-200' : ''}`}
                    onClick={() => setSelectedFilterSection('price')}
                  >
                    <span className="font-semibold">Price</span>
                  </button>
                  <button
                    className={`w-full text-left px-6 py-3 hover:bg-base-200 ${selectedFilterSection === 'freebies' ? 'border-l-4 border-primary bg-base-200' : ''}`}
                    onClick={() => setSelectedFilterSection('freebies')}
                  >
                    <span className="font-semibold">Freebies</span>
                  </button>
                  <button
                    className={`w-full text-left px-6 py-3 hover:bg-base-200 ${selectedFilterSection === 'amenities' ? 'border-l-4 border-primary bg-base-200' : ''}`}
                    onClick={() => setSelectedFilterSection('amenities')}
                  >
                    <span className="font-semibold">Amenities</span>
                  </button>
                  <button
                    className={`w-full text-left px-6 py-3 hover:bg-base-200 ${selectedFilterSection === 'propertyType' ? 'border-l-4 border-primary bg-base-200' : ''}`}
                    onClick={() => setSelectedFilterSection('propertyType')}
                  >
                    <span className="font-semibold">Property Type</span>
                  </button>
                  <button
                    className={`w-full text-left px-6 py-3 hover:bg-base-200 ${selectedFilterSection === 'hotelRating' ? 'border-l-4 border-primary bg-base-200' : ''}`}
                    onClick={() => setSelectedFilterSection('hotelRating')}
                  >
                    <span className="font-semibold">Hotel rating</span>
                  </button>
                </div>
              </div>

              {/* Right Content - Filter Options */}
              <div className="flex-1 overflow-y-auto p-6">
                {/* Location Section */}
                {selectedFilterSection === 'location' && (
                  <div>
                    <h3 className="text-xl font-bold mb-4">Location</h3>
                    
                    <div className="mb-6">
                      <label className="block text-sm font-medium mb-2">State</label>
                      <select
                        className="select select-bordered w-full"
                        value={filters.state}
                        onChange={(e) => {
                          const newFilters = { ...filters, state: e.target.value };
                          setFilters(newFilters);
                          loadHotels(1, newFilters);
                        }}
                      >
                        <option value="">All states</option>
                        {US_STATES.map((state) => (
                          <option key={state.value} value={state.value}>
                            {state.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {/* Price Section */}
                {selectedFilterSection === 'price' && (
                  <div>
                    <h3 className="text-xl font-bold mb-4">Price</h3>
                    
                    <div className="mb-4">
                      <label className="block text-sm font-medium mb-2">Nightly including fees</label>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div>
                        <label className="text-xs text-base-content/60 mb-1 block">Min Price</label>
                        <input
                          type="number"
                          placeholder="$0"
                          value={tempMinPrice}
                          onChange={(e) => {
                            setTempMinPrice(e.target.value);
                            setSelectedPriceRange('');
                          }}
                          className="input input-bordered w-full"
                          min="0"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-base-content/60 mb-1 block">Max Price</label>
                        <input
                          type="number"
                          placeholder="Any"
                          value={tempMaxPrice}
                          onChange={(e) => {
                            setTempMaxPrice(e.target.value);
                            setSelectedPriceRange('');
                          }}
                          className="input input-bordered w-full"
                          min="0"
                        />
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        className={`btn btn-sm ${selectedPriceRange === 'under100' ? 'btn-primary' : 'btn-outline'}`}
                        onClick={() => handleQuickPriceSelect('under100', '', '100')}
                      >
                        Under $100
                      </button>
                      <button
                        className={`btn btn-sm ${selectedPriceRange === '100-200' ? 'btn-primary' : 'btn-outline'}`}
                        onClick={() => handleQuickPriceSelect('100-200', '100', '200')}
                      >
                        $100 - $200
                      </button>
                      <button
                        className={`btn btn-sm ${selectedPriceRange === '200-300' ? 'btn-primary' : 'btn-outline'}`}
                        onClick={() => handleQuickPriceSelect('200-300', '200', '300')}
                      >
                        $200 - $300
                      </button>
                      <button
                        className={`btn btn-sm ${selectedPriceRange === '300+' ? 'btn-primary' : 'btn-outline'}`}
                        onClick={() => handleQuickPriceSelect('300+', '300', '')}
                      >
                        $300+
                      </button>
                    </div>
                  </div>
                )}

                {/* Freebies Section */}
                {selectedFilterSection === 'freebies' && (
                  <div>
                    <h3 className="text-xl font-bold mb-6">Freebies</h3>
                    
                    <div className="grid grid-cols-2 gap-3">
                      {['Free cancellation', 'Free internet', 'Free parking', 'Free breakfast', 'All-inclusive', 'Free airport shuttle'].map((freebie) => (
                        <button
                          key={freebie}
                          className={`btn ${freebies.includes(freebie) ? 'btn-primary' : 'btn-outline'} justify-start`}
                          onClick={() => toggleFreebie(freebie)}
                        >
                          {freebie}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Amenities Section */}
                {selectedFilterSection === 'amenities' && (
                  <div>
                    <h3 className="text-xl font-bold mb-6">Amenities</h3>
                    
                    {loadingAmenities ? (
                      <div className="flex justify-center py-8">
                        <span className="loading loading-spinner loading-lg"></span>
                      </div>
                    ) : (
                    <div className="space-y-4">
                        <h4 className="font-semibold text-base-content/70">All Amenities ({availableAmenities.length} available)</h4>
                        <div className="grid grid-cols-2 gap-3 max-h-96 overflow-y-auto p-2 border border-base-300 rounded-lg">
                          {availableAmenities.length > 0 ? (
                            availableAmenities.map((amenity) => (
                              <label key={amenity} className="flex items-center gap-2 cursor-pointer hover:bg-base-200 p-2 rounded">
                            <input
                                  type="checkbox"
                                  name="amenities"
                              value={amenity}
                                  checked={filters.amenities?.includes(amenity) || false}
                              onChange={(e) => {
                                    const currentAmenities = filters.amenities || [];
                                    let newAmenities;
                                    if (e.target.checked) {
                                      // Add amenity if checked
                                      newAmenities = [...currentAmenities, amenity];
                                    } else {
                                      // Remove amenity if unchecked
                                      newAmenities = currentAmenities.filter(a => a !== amenity);
                                    }
                                    const newFilters = { 
                                      ...filters, 
                                      amenities: newAmenities,
                                      amenity: '' // Clear single amenity filter when using multiple
                                    };
                                setFilters(newFilters);
                              }}
                                  className="checkbox checkbox-primary"
                            />
                                <span className="capitalize text-sm">{amenity.replace(/_/g, ' ')}</span>
                          </label>
                            ))
                          ) : (
                            <p className="text-base-content/60 col-span-2 text-center py-4">No amenities available</p>
                          )}
                        </div>
                        {filters.amenities && filters.amenities.length > 0 && (
                          <div className="mt-4 p-3 bg-primary/10 rounded-lg">
                            <p className="text-sm font-semibold mb-2">Selected ({filters.amenities.length}):</p>
                            <div className="flex flex-wrap gap-2">
                              {filters.amenities.map((amenity) => (
                                <span key={amenity} className="badge badge-primary badge-sm">
                                  {amenity.replace(/_/g, ' ')}
                                </span>
                        ))}
                      </div>
                    </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Property Type Section */}
                {selectedFilterSection === 'propertyType' && (
                  <div>
                    <h3 className="text-xl font-bold mb-6">Property Type</h3>
                    
                    {loadingPropertyTypes ? (
                      <div className="flex justify-center py-8">
                        <span className="loading loading-spinner loading-lg"></span>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <label className="flex items-center gap-3 cursor-pointer hover:bg-base-200 p-2 rounded">
                          <input
                            type="radio"
                            name="propertyType"
                            value=""
                            checked={!filters.propertyType}
                            onChange={(e) => {
                              const newFilters = { ...filters, propertyType: '' };
                              setFilters(newFilters);
                            }}
                            className="radio radio-primary"
                          />
                          <span className="text-base">All Types</span>
                        </label>
                        {availablePropertyTypes.map((type) => (
                          <label key={type} className="flex items-center gap-3 cursor-pointer hover:bg-base-200 p-2 rounded">
                            <input
                              type="radio"
                              name="propertyType"
                              value={type}
                              checked={filters.propertyType === type}
                              onChange={(e) => {
                                const newFilters = { ...filters, propertyType: e.target.value };
                                setFilters(newFilters);
                              }}
                              className="radio radio-primary"
                            />
                            <span className="text-base flex items-center gap-2">
                              <span className="text-xl">{getPropertyTypeIcon(type)}</span>
                              <span>{type}</span>
                            </span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Hotel Rating Section */}
                {selectedFilterSection === 'hotelRating' && (
                  <div>
                    <h3 className="text-xl font-bold mb-6">Hotel rating</h3>
                    
                    <div className="space-y-3">
                      {[
                        { value: '3', label: '3+ stars' },
                        { value: '3.5', label: '3.5+ stars' },
                        { value: '4', label: '4+ stars' },
                        { value: '4.5', label: '4.5+ stars' },
                      ].map((option) => (
                        <label key={option.value} className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="radio"
                            name="minRating"
                            value={option.value}
                            checked={filters.minRating === option.value}
                            onChange={(e) => {
                              const newFilters = { ...filters, minRating: e.target.value };
                              setFilters(newFilters);
                            }}
                            className="radio radio-primary"
                          />
                          <span>{option.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t border-base-300 px-6 py-4 flex justify-between items-center bg-base-100">
              <button
                className="btn btn-ghost"
                onClick={handleAllFiltersReset}
              >
                Reset
              </button>
              <button
                className="btn btn-primary"
                onClick={handleAllFiltersApply}
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hotel Details Modal */}
      {showHotelModal && selectedHotel && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={() => setShowHotelModal(false)}>
          <div className="bg-base-100 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="sticky top-0 bg-base-100 border-b border-base-300 px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold">{selectedHotel.name}</h2>
              <button 
                className="btn btn-ghost btn-sm btn-circle"
                onClick={() => setShowHotelModal(false)}
              >
                
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {/* Hotel Image */}
              <div className="w-full h-64 bg-base-200 rounded-lg mb-6 overflow-hidden flex items-center justify-center">
                {selectedHotel.imageUrl ? (
                  <img
                    src={selectedHotel.imageUrl}
                    alt={selectedHotel.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/800x600/4A5568/FFFFFF?text=Hotel+Image';
                    }}
                  />
                ) : (
                  <span className="text-8xl"></span>
                )}
              </div>

              {/* Hotel Info */}
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="font-semibold text-sm text-base-content/60 mb-2">Location</h3>
                  <p className="text-lg">{selectedHotel.city}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-base-content/60 mb-2">Rating</h3>
                  <div className="flex items-center gap-2">
                    <span className="badge badge-success text-white font-bold text-lg p-3">{selectedHotel.rating.toFixed(1)}</span>
                    <div className="flex gap-0.5">
                      {[...Array(Math.floor(selectedHotel.rating))].map((_, i) => (
                        <span key={i} className="text-warning text-xl"></span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Amenities */}
              <div className="mb-6">
                <h3 className="font-semibold text-sm text-base-content/60 mb-3">Amenities</h3>
                <div className="flex flex-wrap gap-2">
                  {Array.isArray(selectedHotel.amenities) && selectedHotel.amenities.map((amenity, i) => (
                    <span key={i} className="badge badge-outline badge-lg">{amenity}</span>
                  ))}
                </div>
              </div>

              {/* Pricing */}
              <div className="bg-base-200 rounded-lg p-6 mb-6">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-base-content/60 mb-1">Price per night</p>
                    <p className="text-4xl font-bold text-primary">
                      {selectedHotel.currency} {selectedHotel.pricePerNight.toFixed(0)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-base-content/60 mb-1">Check-in: {searchData?.checkIn || 'N/A'}</p>
                    <p className="text-sm text-base-content/60">Check-out: {searchData?.checkOut || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Booking Providers (Kayak-style) */}
              <div className="mb-6">
                <h3 className="font-semibold text-lg mb-4">Available on</h3>
                <div className="space-y-3">
                  {['Booking.com', 'Expedia', 'Hotels.com', 'Agoda'].map((provider, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 border border-base-300 rounded-lg hover:border-primary transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-base-200 rounded flex items-center justify-center font-bold text-sm">
                          {provider.charAt(0)}
                        </div>
                        <span className="font-semibold">{provider}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-xl font-bold text-primary">
                          {selectedHotel.currency} {(selectedHotel.pricePerNight + (idx * 5)).toFixed(0)}
                        </span>
                        <a 
                          href="#"
                          className="btn btn-primary btn-sm"
                          onClick={(e) => {
                            e.preventDefault();
                            alert(`In a real app, this would redirect to ${provider}`);
                          }}
                        >
                          Book Now
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer Note */}
              <div className="text-center text-sm text-base-content/60 pt-4 border-t border-base-300">
                <p>Prices shown are per night and may vary by date</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HotelsPage;
