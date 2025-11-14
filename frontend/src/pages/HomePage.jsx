import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaPlane, FaBed, FaCar, FaExchangeAlt, FaSearch, FaChevronDown } from 'react-icons/fa';
import { getDestinationImageUrl } from '../services/destinationImages.service.js';
import AnimatedCard from '../components/common/AnimatedCard';
import AnimatedIcon from '../components/common/AnimatedIcon';

const HomePage = () => {
  const [activeTab, setActiveTab] = useState('flights');
  const [tripType, setTripType] = useState('round-trip');
  const [bags, setBags] = useState(0);
  const [destinationImages, setDestinationImages] = useState({});
  const [searchData, setSearchData] = useState({
    flights: {
      from: '',
      to: '',
      departDate: '',
      returnDate: '',
      travelers: 1,
      class: 'economy'
    },
    hotels: {
      location: '',
      checkIn: '',
      checkOut: '',
      guests: 1
    },
    cars: {
      location: '',
      pickUp: '',
      dropOff: '',
      driverAge: 25
    }
  });
  const navigate = useNavigate();

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

  const handleSearch = () => {
    if (activeTab === 'flights') {
      navigate('/flights', { state: { search: searchData.flights } });
    } else if (activeTab === 'hotels') {
      navigate('/hotels', { state: { search: searchData.hotels } });
    } else if (activeTab === 'cars') {
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
  };

  return (
    <div className="min-h-screen bg-base-100">
      <div className="bg-base-100 border-b border-base-300">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-4xl font-bold text-base-content mb-6 text-center">
              Compare flight deals from 100s of sites
            </h1>

            <div className="card bg-base-100 p-6 card-hover">
              <div className="flex gap-2 mb-6 justify-center">
                <button
                  className={`btn ${activeTab === 'flights' ? 'btn-primary' : 'btn-ghost'} flex items-center gap-2`}
                  onClick={() => setActiveTab('flights')}
                >
                  <AnimatedIcon>
                    <FaPlane className="w-5 h-5" />
                  </AnimatedIcon>
                  Flights
                </button>
                <button
                  className={`btn ${activeTab === 'hotels' ? 'btn-primary' : 'btn-ghost'} flex items-center gap-2`}
                  onClick={() => setActiveTab('hotels')}
                >
                  <AnimatedIcon>
                    <FaBed className="w-5 h-5" />
                  </AnimatedIcon>
                  Stays
                </button>
                <button
                  className={`btn ${activeTab === 'cars' ? 'btn-primary' : 'btn-ghost'} flex items-center gap-2`}
                  onClick={() => setActiveTab('cars')}
                >
                  <AnimatedIcon>
                    <FaCar className="w-5 h-5" />
                  </AnimatedIcon>
                  Cars
                </button>
              </div>

              {activeTab === 'flights' && (
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <select
                      className="select select-bordered flex-1 text-sm bg-base-100"
                      value={tripType}
                      onChange={(e) => setTripType(e.target.value)}
                    >
                      <option value="round-trip">Round-trip</option>
                      <option value="one-way">One-way</option>
                      <option value="multi-city">Multi-city</option>
                    </select>
                    <select
                      className="select select-bordered flex-1 text-sm bg-base-100"
                      value={bags}
                      onChange={(e) => setBags(parseInt(e.target.value))}
                    >
                      <option value="0">0 bags</option>
                      <option value="1">1 bag</option>
                      <option value="2">2 bags</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
                    <div className="form-control">
                      <input
                        type="text"
                        placeholder="From?"
                        className="input input-bordered w-full bg-base-100"
                        value={searchData.flights.from}
                        onChange={(e) => setSearchData({
                          ...searchData,
                          flights: { ...searchData.flights, from: e.target.value }
                        })}
                      />
                    </div>
                    <button
                      onClick={swapLocations}
                      className="btn btn-ghost btn-sm self-center"
                      type="button"
                    >
                      <AnimatedIcon animation="float">
                        <FaExchangeAlt className="w-5 h-5" />
                      </AnimatedIcon>
                    </button>
                    <div className="form-control">
                      <input
                        type="text"
                        placeholder="To?"
                        className="input input-bordered w-full bg-base-100"
                        value={searchData.flights.to}
                        onChange={(e) => setSearchData({
                          ...searchData,
                          flights: { ...searchData.flights, to: e.target.value }
                        })}
                      />
                    </div>
                    <div className="form-control">
                      <input
                        type="date"
                        placeholder="Departure"
                        className="input input-bordered w-full bg-base-100"
                        value={searchData.flights.departDate}
                        onChange={(e) => setSearchData({
                          ...searchData,
                          flights: { ...searchData.flights, departDate: e.target.value }
                        })}
                      />
                    </div>
                    {tripType === 'round-trip' && (
                      <div className="form-control">
                        <input
                          type="date"
                          placeholder="Return"
                          className="input input-bordered w-full bg-base-100"
                          value={searchData.flights.returnDate}
                          onChange={(e) => setSearchData({
                            ...searchData,
                            flights: { ...searchData.flights, returnDate: e.target.value }
                          })}
                        />
                      </div>
                    )}
                    {tripType !== 'round-trip' && (
                      <div className="form-control">
                        <select
                          className="select select-bordered w-full bg-base-100"
                          value={`${searchData.flights.travelers} adult, ${searchData.flights.class}`}
                          onChange={(e) => {
                            const [travelers, classType] = e.target.value.split(', ');
                            setSearchData({
                              ...searchData,
                              flights: {
                                ...searchData.flights,
                                travelers: parseInt(travelers),
                                class: classType
                              }
                            });
                          }}
                        >
                          <option value="1 adult, economy">1 adult, Economy</option>
                          <option value="2 adult, economy">2 adults, Economy</option>
                          <option value="1 adult, business">1 adult, Business</option>
                          <option value="2 adult, business">2 adults, Business</option>
                        </select>
                      </div>
                    )}
                  </div>

                  {tripType === 'round-trip' && (
                    <div className="form-control max-w-xs">
                      <select
                        className="select select-bordered w-full bg-base-100"
                        value={`${searchData.flights.travelers} adult, ${searchData.flights.class}`}
                        onChange={(e) => {
                          const [travelers, classType] = e.target.value.split(', ');
                          setSearchData({
                            ...searchData,
                            flights: {
                              ...searchData.flights,
                              travelers: parseInt(travelers),
                              class: classType
                            }
                          });
                        }}
                      >
                        <option value="1 adult, economy">1 adult, Economy</option>
                        <option value="2 adult, economy">2 adults, Economy</option>
                        <option value="1 adult, business">1 adult, Business</option>
                        <option value="2 adult, business">2 adults, Business</option>
                      </select>
                    </div>
                  )}

                  <div className="flex justify-end">
                    <button
                      onClick={handleSearch}
                      className="btn btn-primary rounded-full w-16 h-16"
                    >
                      <AnimatedIcon>
                        <FaSearch className="w-6 h-6" />
                      </AnimatedIcon>
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'hotels' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="form-control">
                      <input
                        type="text"
                        placeholder="Where are you going?"
                        className="input input-bordered w-full bg-base-100"
                        value={searchData.hotels.location}
                        onChange={(e) => setSearchData({
                          ...searchData,
                          hotels: { ...searchData.hotels, location: e.target.value }
                        })}
                      />
                    </div>
                    <div className="form-control">
                      <input
                        type="date"
                        placeholder="Check-in"
                        className="input input-bordered w-full bg-base-100"
                        value={searchData.hotels.checkIn}
                        onChange={(e) => setSearchData({
                          ...searchData,
                          hotels: { ...searchData.hotels, checkIn: e.target.value }
                        })}
                      />
                    </div>
                    <div className="form-control">
                      <input
                        type="date"
                        placeholder="Check-out"
                        className="input input-bordered w-full bg-base-100"
                        value={searchData.hotels.checkOut}
                        onChange={(e) => setSearchData({
                          ...searchData,
                          hotels: { ...searchData.hotels, checkOut: e.target.value }
                        })}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button
                      onClick={handleSearch}
                      className="btn btn-primary rounded-full w-16 h-16"
                    >
                      <AnimatedIcon>
                        <FaSearch className="w-6 h-6" />
                      </AnimatedIcon>
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'cars' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="form-control">
                      <input
                        type="text"
                        placeholder="Pick-up location"
                        className="input input-bordered w-full bg-base-100"
                        value={searchData.cars.location}
                        onChange={(e) => setSearchData({
                          ...searchData,
                          cars: { ...searchData.cars, location: e.target.value }
                        })}
                      />
                    </div>
                    <div className="form-control">
                      <input
                        type="date"
                        placeholder="Pick-up date"
                        className="input input-bordered w-full bg-base-100"
                        value={searchData.cars.pickUp}
                        onChange={(e) => setSearchData({
                          ...searchData,
                          cars: { ...searchData.cars, pickUp: e.target.value }
                        })}
                      />
                    </div>
                    <div className="form-control">
                      <input
                        type="date"
                        placeholder="Drop-off date"
                        className="input input-bordered w-full bg-base-100"
                        value={searchData.cars.dropOff}
                        onChange={(e) => setSearchData({
                          ...searchData,
                          cars: { ...searchData.cars, dropOff: e.target.value }
                        })}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button
                      onClick={handleSearch}
                      className="btn btn-primary rounded-full w-16 h-16"
                    >
                      <AnimatedIcon>
                        <FaSearch className="w-6 h-6" />
                      </AnimatedIcon>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

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
    </div>
  );
};

export default HomePage;
