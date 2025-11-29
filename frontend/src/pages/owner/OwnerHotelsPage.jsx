import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { FaHotel, FaPlus, FaEdit, FaTrash, FaCheckCircle, FaClock } from 'react-icons/fa';

const OwnerHotelsPage = () => {
  useDocumentTitle('My Hotels');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // TODO: Replace with actual API call when backend endpoint is ready
  const { data, isLoading, error } = useQuery({
    queryKey: ['owner-hotels', page],
    queryFn: async () => {
      // Placeholder - replace with actual API call
      return {
        items: [],
        pagination: {
          page: 1,
          pageSize: 10,
          totalItems: 0,
          totalPages: 1,
        },
      };
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-error">
        <span>Error loading hotels: {error.message}</span>
      </div>
    );
  }

  const hotels = data?.items || [];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">My Hotels</h1>
          <p className="text-base-content/70">Manage your hotel listings</p>
        </div>
        <Link to="/owner/hotels/new" className="btn btn-primary">
          <FaPlus className="mr-2" />
          Add New Hotel
        </Link>
      </div>

      {hotels.length === 0 ? (
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body text-center py-16">
            <FaHotel className="text-6xl text-base-content/20 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">No hotels yet</h2>
            <p className="text-base-content/70 mb-6">
              Start by adding your first hotel listing to reach travelers.
            </p>
            <Link to="/owner/hotels/new" className="btn btn-primary">
              <FaPlus className="mr-2" />
              Add Your First Hotel
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {hotels.map((hotel) => (
              <div key={hotel.id} className="card bg-base-100 shadow-xl">
                <figure>
                  {hotel.imageUrl ? (
                    <img src={hotel.imageUrl} alt={hotel.name} />
                  ) : (
                    <div className="w-full h-48 bg-base-200 flex items-center justify-center">
                      <FaHotel className="text-4xl text-base-content/30" />
                    </div>
                  )}
                </figure>
                <div className="card-body">
                  <div className="flex items-start justify-between mb-2">
                    <h2 className="card-title">{hotel.name}</h2>
                    {hotel.status === 'approved' ? (
                      <FaCheckCircle className="text-success" title="Approved" />
                    ) : (
                      <FaClock className="text-warning" title="Pending Approval" />
                    )}
                  </div>
                  <p className="text-sm text-base-content/70">{hotel.city}</p>
                  <p className="text-lg font-semibold">${hotel.pricePerNight}/night</p>
                  <div className="card-actions justify-end mt-4">
                    <button className="btn btn-sm btn-ghost">
                      <FaEdit className="mr-1" />
                      Edit
                    </button>
                    <button className="btn btn-sm btn-error">
                      <FaTrash className="mr-1" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {data?.pagination && data.pagination.totalPages > 1 && (
            <div className="flex justify-center gap-2">
              <button
                className="btn btn-outline"
                disabled={!data.pagination.hasPrevPage}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </button>
              <span className="btn btn-disabled">
                Page {data.pagination.page} of {data.pagination.totalPages}
              </span>
              <button
                className="btn btn-outline"
                disabled={!data.pagination.hasNextPage}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default OwnerHotelsPage;

