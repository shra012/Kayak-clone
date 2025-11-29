import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { FaHotel, FaArrowLeft } from 'react-icons/fa';
import toast from 'react-hot-toast';

const AddHotelPage = () => {
  useDocumentTitle('Add New Hotel');
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    city: '',
    address: '',
    description: '',
    pricePerNight: '',
    rating: '',
    amenities: [],
    lat: '',
    lng: '',
  });

  const availableAmenities = [
    'wifi',
    'breakfast',
    'pool',
    'spa',
    'restaurant',
    'gym',
    'parking',
    'concierge',
    'room_service',
    'bar',
  ];

  const handleAmenityChange = (amenity) => {
    setFormData((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter((a) => a !== amenity)
        : [...prev.amenities, amenity],
    }));
  };

  // TODO: Replace with actual API call when backend endpoint is ready
  const mutation = useMutation({
    mutationFn: async (data) => {
      // Placeholder - replace with actual API call
      // await apiClient.post('/admin/hotels', data);
      return { success: true };
    },
    onSuccess: () => {
      toast.success('Hotel submitted for approval!');
      navigate('/owner/hotels');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create hotel');
    },
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const submitData = {
        ...formData,
        pricePerNight: parseFloat(formData.pricePerNight),
        rating: formData.rating ? parseFloat(formData.rating) : null,
        lat: formData.lat ? parseFloat(formData.lat) : null,
        lng: formData.lng ? parseFloat(formData.lng) : null,
      };
      await mutation.mutateAsync(submitData);
    } catch (error) {
      console.error('Error submitting hotel:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <button
          onClick={() => navigate('/owner/hotels')}
          className="btn btn-ghost mb-4"
        >
          <FaArrowLeft className="mr-2" />
          Back to Hotels
        </button>
        <h1 className="text-4xl font-bold mb-2">Add New Hotel</h1>
        <p className="text-base-content/70">Create a new hotel listing</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title mb-4">
              <FaHotel className="text-primary" />
              Basic Information
            </h2>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Hotel Name *</span>
              </label>
              <input
                type="text"
                className="input input-bordered"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">City *</span>
              </label>
              <input
                type="text"
                className="input input-bordered"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                required
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Address *</span>
              </label>
              <input
                type="text"
                className="input input-bordered"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                required
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Description</span>
              </label>
              <textarea
                className="textarea textarea-bordered h-24"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title mb-4">Pricing & Rating</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Price per Night (USD) *</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  className="input input-bordered"
                  value={formData.pricePerNight}
                  onChange={(e) => setFormData({ ...formData, pricePerNight: e.target.value })}
                  required
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Rating (1-5)</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  step="0.1"
                  className="input input-bordered"
                  value={formData.rating}
                  onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title mb-4">Amenities</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {availableAmenities.map((amenity) => (
                <label key={amenity} className="label cursor-pointer">
                  <span className="label-text capitalize">{amenity.replace('_', ' ')}</span>
                  <input
                    type="checkbox"
                    className="checkbox checkbox-primary"
                    checked={formData.amenities.includes(amenity)}
                    onChange={() => handleAmenityChange(amenity)}
                  />
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title mb-4">Location (Optional)</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Latitude</span>
                </label>
                <input
                  type="number"
                  step="any"
                  className="input input-bordered"
                  value={formData.lat}
                  onChange={(e) => setFormData({ ...formData, lat: e.target.value })}
                />
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Longitude</span>
                </label>
                <input
                  type="number"
                  step="any"
                  className="input input-bordered"
                  value={formData.lng}
                  onChange={(e) => setFormData({ ...formData, lng: e.target.value })}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => navigate('/owner/hotels')}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting || mutation.isLoading}
          >
            {isSubmitting || mutation.isLoading ? (
              <>
                <span className="loading loading-spinner loading-sm"></span>
                Submitting...
              </>
            ) : (
              'Submit for Approval'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddHotelPage;

