const BookingsPage = () => {
  return (
    <div className="min-h-screen bg-sky-50">
      {/* Header Section with Background */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-sky-200">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold">My Bookings</h1>
          <p className="text-base-content/60">View and manage your travel bookings</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="card bg-white shadow-xl border border-gray-200">
          <div className="card-body">
            <p className="text-gray-600">Bookings functionality coming soon...</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingsPage;

