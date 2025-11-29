const BookingsPage = () => {
  return (
    <div className="min-h-screen bg-base-100">
      {/* Header Section with Background */}
      <div className="bg-base-100/90 backdrop-blur-sm border-b border-base-300">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-base-content">My Bookings</h1>
          <p className="text-base-content/70">View and manage your travel bookings</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="card bg-base-100 shadow-md border border-base-300">
          <div className="card-body">
            <p className="text-base-content/70">Bookings functionality coming soon...</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingsPage;
