import { useState, useEffect } from 'react';
import { paymentsApi } from '../../services/api/payments';
import { bookingsApi } from '../../services/api/bookings';
import { useToast } from '../../hooks/useToast';

const PaymentsPage = () => {
  const [payments, setPayments] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState({});
  const [filters, setFilters] = useState({
    status: '',
    bookingId: '',
  });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPayment, setNewPayment] = useState({
    bookingId: '',
    amount: '',
    currency: 'USD',
  });
  const toast = useToast();

  useEffect(() => {
    loadPayments();
    loadBookings();
  }, [filters]);

  const loadPayments = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.status) params.status = filters.status;
      if (filters.bookingId) params.bookingId = filters.bookingId;
      
      const response = await paymentsApi.listPayments(params);
      setPayments(response.items || []);
    } catch (error) {
      console.error('Error loading payments:', error);
      toast.showError('Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  const loadBookings = async () => {
    try {
      const response = await bookingsApi.searchBookings({ status: 'PENDING' });
      setBookings(response.items || []);
    } catch (error) {
      console.error('Error loading bookings:', error);
    }
  };

  const handleCreatePayment = async (e) => {
    e.preventDefault();
    try {
      setProcessing({ create: true });
      const paymentData = {
        bookingId: newPayment.bookingId,
        amount: parseFloat(newPayment.amount),
        currency: newPayment.currency,
      };
      
      const payment = await paymentsApi.createPayment(paymentData);
      toast.showSuccess('Payment created successfully');
      setShowCreateModal(false);
      setNewPayment({ bookingId: '', amount: '', currency: 'USD' });
      loadPayments();
    } catch (error) {
      console.error('Error creating payment:', error);
      toast.showError(error.response?.data?.message || 'Failed to create payment');
    } finally {
      setProcessing({ create: false });
    }
  };

  const handleProcessPayment = async (paymentId) => {
    try {
      setProcessing({ [paymentId]: true });
      await paymentsApi.processPayment(paymentId);
      toast.showSuccess('Payment processed successfully');
      loadPayments();
    } catch (error) {
      console.error('Error processing payment:', error);
      toast.showError(error.response?.data?.message || 'Failed to process payment');
    } finally {
      setProcessing({ [paymentId]: false });
    }
  };

  const handleRefundPayment = async (paymentId, amount = null) => {
    if (!window.confirm('Are you sure you want to refund this payment?')) {
      return;
    }
    
    try {
      setProcessing({ [`refund-${paymentId}`]: true });
      await paymentsApi.refundPayment(paymentId, amount);
      toast.showSuccess('Payment refunded successfully');
      loadPayments();
    } catch (error) {
      console.error('Error refunding payment:', error);
      toast.showError(error.response?.data?.message || 'Failed to refund payment');
    } finally {
      setProcessing({ [`refund-${paymentId}`]: false });
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      PENDING: 'badge-warning',
      AUTHORIZED: 'badge-info',
      SUCCEEDED: 'badge-success',
      FAILED: 'badge-error',
      REFUNDED: 'badge-neutral',
    };
    return badges[status] || 'badge-neutral';
  };

  const formatCurrency = (amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="min-h-screen bg-base-100">
      {/* Header Section */}
      <div className="bg-base-100/90 backdrop-blur-sm border-b border-base-300">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-base-content">Payments</h1>
              <p className="text-base-content/70">Manage your payment transactions</p>
            </div>
            <button
              className="btn btn-primary"
              onClick={() => setShowCreateModal(true)}
            >
              Create Payment
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="card bg-base-100 shadow-md border border-base-300">
          <div className="card-body">
            <div className="flex gap-4 flex-wrap">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Status</span>
                </label>
                <select
                  className="select select-bordered"
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                >
                  <option value="">All Statuses</option>
                  <option value="PENDING">Pending</option>
                  <option value="AUTHORIZED">Authorized</option>
                  <option value="SUCCEEDED">Succeeded</option>
                  <option value="FAILED">Failed</option>
                  <option value="REFUNDED">Refunded</option>
                </select>
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Booking ID</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered"
                  placeholder="Filter by booking ID"
                  value={filters.bookingId}
                  onChange={(e) => setFilters({ ...filters, bookingId: e.target.value })}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payments List */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        ) : payments.length === 0 ? (
          <div className="card bg-base-100 shadow-md border border-base-300">
            <div className="card-body text-center py-12">
              <p className="text-base-content/70">No payments found</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {payments.map((payment) => (
              <div key={payment.id} className="card bg-base-100 shadow-md border border-base-300">
                <div className="card-body">
                  <div className="flex justify-between items-start flex-wrap gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold">
                          Payment {payment.id.substring(0, 8)}...
                        </h3>
                        <span className={`badge ${getStatusBadge(payment.status)}`}>
                          {payment.status}
                        </span>
                      </div>
                      <div className="space-y-1 text-sm text-base-content/70">
                        <p>
                          <strong>Amount:</strong> {formatCurrency(payment.amount, payment.currency)}
                        </p>
                        <p>
                          <strong>Booking:</strong> {payment.bookingId?.substring(0, 8)}...
                          {payment.booking && ` (${payment.booking.bookingType})`}
                        </p>
                        {payment.transactionReference && (
                          <p>
                            <strong>Transaction:</strong> {payment.transactionReference}
                          </p>
                        )}
                        <p>
                          <strong>Created:</strong> {formatDate(payment.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {payment.status === 'PENDING' && (
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={() => handleProcessPayment(payment.id)}
                          disabled={processing[payment.id]}
                        >
                          {processing[payment.id] ? (
                            <span className="loading loading-spinner loading-xs"></span>
                          ) : (
                            'Process Payment'
                          )}
                        </button>
                      )}
                      {payment.status === 'SUCCEEDED' && (
                        <button
                          className="btn btn-sm btn-warning"
                          onClick={() => handleRefundPayment(payment.id)}
                          disabled={processing[`refund-${payment.id}`]}
                        >
                          {processing[`refund-${payment.id}`] ? (
                            <span className="loading loading-spinner loading-xs"></span>
                          ) : (
                            'Refund'
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Payment Modal */}
      {showCreateModal && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">Create New Payment</h3>
            <form onSubmit={handleCreatePayment}>
              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text">Booking</span>
                </label>
                <select
                  className="select select-bordered"
                  value={newPayment.bookingId}
                  onChange={(e) => setNewPayment({ ...newPayment, bookingId: e.target.value })}
                  required
                >
                  <option value="">Select a booking</option>
                  {bookings.map((booking) => (
                    <option key={booking.id} value={booking.id}>
                      {booking.bookingType} - {formatCurrency(booking.price?.amount || 0, booking.price?.currency || 'USD')}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text">Amount</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  className="input input-bordered"
                  value={newPayment.amount}
                  onChange={(e) => setNewPayment({ ...newPayment, amount: e.target.value })}
                  required
                />
              </div>
              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text">Currency</span>
                </label>
                <select
                  className="select select-bordered"
                  value={newPayment.currency}
                  onChange={(e) => setNewPayment({ ...newPayment, currency: e.target.value })}
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                </select>
              </div>
              <div className="modal-action">
                <button
                  type="button"
                  className="btn"
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewPayment({ bookingId: '', amount: '', currency: 'USD' });
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={processing.create}
                >
                  {processing.create ? (
                    <span className="loading loading-spinner loading-xs"></span>
                  ) : (
                    'Create Payment'
                  )}
                </button>
              </div>
            </form>
          </div>
          <div className="modal-backdrop" onClick={() => setShowCreateModal(false)}></div>
        </div>
      )}
    </div>
  );
};

export default PaymentsPage;
