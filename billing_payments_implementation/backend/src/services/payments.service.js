import { v4 as uuidv4 } from 'uuid';
import { getPostgresPool } from '../config/database.js';
import { logger } from '../config/logger.js';
import { sendKafkaMessage } from '../config/kafka.js';
import { getBookingById } from './bookings.service.js';

const PAYMENT_STATUSES = {
  PENDING: 'PENDING',
  AUTHORIZED: 'AUTHORIZED',
  SUCCEEDED: 'SUCCEEDED',
  FAILED: 'FAILED',
  REFUNDED: 'REFUNDED',
};

/**
 * Mock payment gateway simulation (Stripe-like)
 * Simulates payment processing with success/failure scenarios
 */
const simulatePaymentGateway = async (paymentData) => {
  const { amount, currency, metadata = {} } = paymentData;
  
  // Simulate network delay (50-200ms)
  await new Promise(resolve => setTimeout(resolve, Math.random() * 150 + 50));
  
  // Simulate failure scenarios (for testing)
  // Fail if amount is exactly 0.01 (test failure case)
  if (amount === 0.01) {
    return {
      success: false,
      transactionReference: `txn_fail_${Date.now()}`,
      error: 'Insufficient funds',
      errorCode: 'card_declined',
    };
  }
  
  // Fail if metadata contains forceFailure flag
  if (metadata.forceFailure === true) {
    return {
      success: false,
      transactionReference: `txn_fail_${Date.now()}`,
      error: 'Payment gateway error',
      errorCode: 'gateway_error',
    };
  }
  
  // Simulate random failures (5% failure rate for testing)
  if (Math.random() < 0.05 && process.env.NODE_ENV === 'development') {
    return {
      success: false,
      transactionReference: `txn_fail_${Date.now()}`,
      error: 'Network timeout',
      errorCode: 'timeout',
    };
  }
  
  // Success case - generate transaction reference
  const transactionReference = `txn_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  
  return {
    success: true,
    transactionReference,
    authorizationCode: `auth_${Math.random().toString(36).slice(2, 14).toUpperCase()}`,
    processedAt: new Date().toISOString(),
  };
};

/**
 * Create a payment with transaction support
 */
export const createPayment = async (userId, paymentData) => {
  const pool = getPostgresPool();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const {
      bookingId,
      amount,
      currency = 'USD',
      transactionReference,
      idempotencyKey,
      metadata = {},
    } = paymentData;

    if (!bookingId) {
      throw new Error('bookingId is required');
    }

    if (!amount || amount <= 0) {
      throw new Error('amount must be greater than 0');
    }

    const booking = await getBookingById(bookingId);
    if (!booking) {
      throw new Error('Booking not found');
    }

    if (booking.userId !== userId) {
      throw new Error('Payment can only be created by booking owner');
    }

    if (idempotencyKey) {
      const existingPayment = await client.query(
        'SELECT * FROM payments WHERE idempotency_key = $1',
        [idempotencyKey]
      );

      if (existingPayment.rows.length > 0) {
        await client.query('COMMIT');
        logger.info(`Idempotent payment request: ${idempotencyKey}`);
        return mapPaymentForResponse(existingPayment.rows[0]);
      }
    }

    const paymentId = uuidv4();

    const paymentResult = await client.query(
      `INSERT INTO payments (
        id, booking_id, user_id, status, amount, currency, transaction_reference, idempotency_key, metadata, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
      RETURNING *`,
      [
        paymentId,
        bookingId,
        userId,
        PAYMENT_STATUSES.PENDING,
        amount,
        currency,
        transactionReference || null,
        idempotencyKey || null,
        JSON.stringify(metadata),
      ]
    );

    const payment = paymentResult.rows[0];

    await client.query('COMMIT');

    logger.info(`Payment created: ${paymentId} for booking: ${bookingId}`);

    await sendKafkaMessage('payments.created', {
      eventId: uuidv4(),
      occurredAt: new Date().toISOString(),
      paymentId: payment.id,
      bookingId: payment.booking_id,
      userId: payment.user_id,
      amount: parseFloat(payment.amount),
      currency: payment.currency,
      status: payment.status,
    });

    return mapPaymentForResponse(payment);
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Error creating payment:', error);
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Get payment by ID
 */
export const getPaymentById = async (paymentId) => {
  const pool = getPostgresPool();

  try {
    const result = await pool.query(
      `SELECT p.*, 
        json_build_object(
          'id', b.id,
          'bookingType', b.booking_type,
          'status', b.status
        ) as booking
      FROM payments p
      LEFT JOIN bookings b ON p.booking_id = b.id
      WHERE p.id = $1`,
      [paymentId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return mapPaymentForResponse(result.rows[0]);
  } catch (error) {
    logger.error('Error getting payment:', error);
    throw error;
  }
};

/**
 * Search payments with filters
 */
export const searchPayments = async (filters = {}) => {
  const pool = getPostgresPool();

  try {
    const {
      userId,
      bookingId,
      status,
      startDate,
      endDate,
      limit = 50,
      offset = 0,
    } = filters;

    let query = `
      SELECT p.*, 
        json_build_object(
          'id', b.id,
          'bookingType', b.booking_type,
          'status', b.status
        ) as booking
      FROM payments p
      LEFT JOIN bookings b ON p.booking_id = b.id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (userId) {
      query += ` AND p.user_id = $${paramIndex}`;
      params.push(userId);
      paramIndex++;
    }

    if (bookingId) {
      query += ` AND p.booking_id = $${paramIndex}`;
      params.push(bookingId);
      paramIndex++;
    }

    if (status) {
      query += ` AND p.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (startDate) {
      query += ` AND p.created_at >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      query += ` AND p.created_at <= $${paramIndex}`;
      params.push(endDate);
      paramIndex++;
    }

    query += ` ORDER BY p.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    const countResult = await pool.query(
      query.replace(/SELECT.*FROM/, 'SELECT COUNT(*) as total FROM').replace(/ORDER BY.*$/, '')
    );

    const payments = result.rows.map(mapPaymentForResponse);

    return {
      items: payments,
      pagination: {
        total: parseInt(countResult.rows[0].total, 10),
        limit,
        offset,
      },
    };
  } catch (error) {
    logger.error('Error searching payments:', error);
    throw error;
  }
};

/**
 * Update payment status
 */
export const updatePaymentStatus = async (paymentId, newStatus, transactionReference = null) => {
  const pool = getPostgresPool();
  const client = await pool.connect();

  try {
    if (!Object.values(PAYMENT_STATUSES).includes(newStatus)) {
      throw new Error(`Invalid payment status: ${newStatus}`);
    }

    await client.query('BEGIN');

    const updateFields = ['status = $1', 'updated_at = NOW()'];
    const params = [newStatus, paymentId];
    let paramIndex = 2;

    if (transactionReference) {
      updateFields.push(`transaction_reference = $${paramIndex}`);
      params.splice(1, 0, transactionReference);
      paramIndex++;
    }

    const result = await client.query(
      `UPDATE payments 
       SET ${updateFields.join(', ')}
       WHERE id = $${paramIndex}
       RETURNING *`,
      params
    );

    if (result.rows.length === 0) {
      throw new Error('Payment not found');
    }

    const payment = result.rows[0];

    await client.query('COMMIT');

    logger.info(`Payment ${paymentId} status updated to ${newStatus}`);

    if (newStatus === PAYMENT_STATUSES.SUCCEEDED) {
      await sendKafkaMessage('payments.succeeded', {
        eventId: uuidv4(),
        occurredAt: new Date().toISOString(),
        paymentId: payment.id,
        bookingId: payment.booking_id,
        userId: payment.user_id,
        amount: parseFloat(payment.amount),
        currency: payment.currency,
      });
    }

    return mapPaymentForResponse(payment);
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Error updating payment:', error);
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Process payment (authorize and capture) with payment gateway simulation
 */
export const processPayment = async (paymentId, paymentMethodData = {}) => {
  const pool = getPostgresPool();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const payment = await getPaymentById(paymentId);
    if (!payment) {
      throw new Error('Payment not found');
    }

    if (payment.status !== PAYMENT_STATUSES.PENDING) {
      throw new Error(`Cannot process payment with status: ${payment.status}`);
    }

    // Simulate payment gateway processing
    const gatewayResponse = await simulatePaymentGateway({
      amount: payment.amount,
      currency: payment.currency,
      metadata: payment.metadata,
      ...paymentMethodData,
    });

    if (!gatewayResponse.success) {
      // Payment failed - update status to FAILED
      const failedPayment = await updatePaymentStatus(
        paymentId,
        PAYMENT_STATUSES.FAILED,
        gatewayResponse.transactionReference
      );

      await client.query('COMMIT');

      logger.warn(`Payment ${paymentId} failed: ${gatewayResponse.error}`);

      await sendKafkaMessage('payments.failed', {
        eventId: uuidv4(),
        occurredAt: new Date().toISOString(),
        paymentId: failedPayment.id,
        bookingId: failedPayment.booking_id,
        userId: failedPayment.user_id,
        amount: parseFloat(failedPayment.amount),
        currency: failedPayment.currency,
        error: gatewayResponse.error,
        errorCode: gatewayResponse.errorCode,
      });

      throw new Error(`Payment processing failed: ${gatewayResponse.error}`);
    }

    // Payment succeeded - authorize first, then capture
    const authorized = await updatePaymentStatus(
      paymentId,
      PAYMENT_STATUSES.AUTHORIZED,
      gatewayResponse.transactionReference
    );

    // Small delay to simulate capture
    await new Promise(resolve => setTimeout(resolve, 100));

    const succeeded = await updatePaymentStatus(
      paymentId,
      PAYMENT_STATUSES.SUCCEEDED,
      gatewayResponse.transactionReference
    );

    await client.query('COMMIT');

    logger.info(`Payment ${paymentId} processed successfully: ${gatewayResponse.transactionReference}`);

    return succeeded;
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Error processing payment:', error);
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Refund payment
 */
export const refundPayment = async (paymentId, refundAmount = null) => {
  const pool = getPostgresPool();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const payment = await getPaymentById(paymentId);
    if (!payment) {
      throw new Error('Payment not found');
    }

    if (payment.status !== PAYMENT_STATUSES.SUCCEEDED) {
      throw new Error(`Cannot refund payment with status: ${payment.status}`);
    }

    const refundAmountValue = refundAmount || payment.amount;

    if (refundAmountValue > payment.amount) {
      throw new Error('Refund amount cannot exceed payment amount');
    }

    const result = await client.query(
      `UPDATE payments 
       SET status = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [PAYMENT_STATUSES.REFUNDED, paymentId]
    );

    const refundedPayment = result.rows[0];

    await client.query('COMMIT');

    logger.info(`Payment ${paymentId} refunded: ${refundAmountValue}`);

    await sendKafkaMessage('payments.refunded', {
      eventId: uuidv4(),
      occurredAt: new Date().toISOString(),
      paymentId: refundedPayment.id,
      bookingId: refundedPayment.booking_id,
      userId: refundedPayment.user_id,
      refundAmount: refundAmountValue,
      originalAmount: parseFloat(refundedPayment.amount),
      currency: refundedPayment.currency,
    });

    return mapPaymentForResponse(refundedPayment);
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Error refunding payment:', error);
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Map payment database row to response format
 */
const mapPaymentForResponse = (payment) => {
  return {
    id: payment.id,
    bookingId: payment.booking_id,
    userId: payment.user_id,
    booking: payment.booking ? JSON.parse(payment.booking) : null,
    status: payment.status,
    amount: parseFloat(payment.amount),
    currency: payment.currency,
    transactionReference: payment.transaction_reference,
    invoiceUrl: payment.invoice_url,
    metadata: payment.metadata ? JSON.parse(payment.metadata) : {},
    createdAt: payment.created_at,
    updatedAt: payment.updated_at,
  };
};

