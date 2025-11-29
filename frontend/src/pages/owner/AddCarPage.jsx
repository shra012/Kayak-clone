import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { FaCar, FaArrowLeft } from 'react-icons/fa';
import toast from 'react-hot-toast';

const AddCarPage = () => {
  useDocumentTitle('Add New Car');
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    vendor: '',
    type: '',
    location: '',
    seats: '',
    pricePerDay: '',
    description: '',
  });

  const carTypes = ['Sedan', 'SUV', 'Hatchback', 'Convertible', 'Coupe', 'Wagon', 'Van', 'Truck'];
  const vendors = ['Hertz', 'Avis', 'Enterprise', 'Budget', 'National', 'Alamo', 'Local Rentals'];

  // TODO: Replace with actual API call when backend endpoint is ready
  const mutation = useMutation({
    mutationFn: async (data) => {
      // Placeholder - replace with actual API call
      // await apiClient.post('/admin/cars', data);
      return { success: true };
    },
    onSuccess: () => {
      toast.success('Car submitted for approval!');
      navigate('/owner/cars');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create car');
    },
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const submitData = {
        ...formData,
        seats: parseInt(formData.seats, 10),
        pricePerDay: parseFloat(formData.pricePerDay),
      };
      await mutation.mutateAsync(submitData);
    } catch (error) {
      console.error('Error submitting car:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <button
          onClick={() => navigate('/owner/cars')}
          className="btn btn-ghost mb-4"
        >
          <FaArrowLeft className="mr-2" />
          Back to Cars
        </button>
        <h1 className="text-4xl font-bold mb-2">Add New Car</h1>
        <p className="text-base-content/70">Create a new car rental listing</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title mb-4">
              <FaCar className="text-primary" />
              Basic Information
            </h2>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Vendor *</span>
              </label>
              <select
                className="select select-bordered"
                value={formData.vendor}
                onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                required
              >
                <option value="">Select a vendor</option>
                {vendors.map((vendor) => (
                  <option key={vendor} value={vendor}>
                    {vendor}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Car Type *</span>
              </label>
              <select
                className="select select-bordered"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                required
              >
                <option value="">Select a type</option>
                {carTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Location *</span>
              </label>
              <input
                type="text"
                className="input input-bordered"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g., San Francisco, New York"
                required
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Number of Seats *</span>
              </label>
              <input
                type="number"
                min="2"
                max="15"
                className="input input-bordered"
                value={formData.seats}
                onChange={(e) => setFormData({ ...formData, seats: e.target.value })}
                required
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Price per Day (USD) *</span>
              </label>
              <input
                type="number"
                step="0.01"
                className="input input-bordered"
                value={formData.pricePerDay}
                onChange={(e) => setFormData({ ...formData, pricePerDay: e.target.value })}
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
                placeholder="Additional details about the car..."
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => navigate('/owner/cars')}
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

export default AddCarPage;

