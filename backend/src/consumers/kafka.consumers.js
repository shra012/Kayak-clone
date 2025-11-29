import { getKafkaConsumer } from '../config/kafka.js';
import { logger } from '../config/logger.js';
import { getMongoDB } from '../config/database.js';

/**
 * Watch trigger consumer
 * Listens for inventory updates and triggers watches
 */
export const startWatchTriggerConsumer = async () => {
  try {
    const consumer = await getKafkaConsumer('watch-trigger-group');
    if (!consumer) {
      logger.warn('Kafka consumer not available. Watch trigger consumer not started.');
      return;
    }

    await consumer.subscribe({ topics: ['inventory.updated'], fromBeginning: false });

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const event = JSON.parse(message.value.toString());
          logger.info(`Watch trigger consumer received event: ${topic}`, { eventId: event.eventId });

          const db = await getMongoDB();
          const watchesCollection = db.collection('watches');

          const { listingType, listingId, action, data } = event.payload || event;

          if (action === 'deleted') {
            await watchesCollection.updateMany(
              {
                listingType,
                listingId,
                status: 'active',
              },
              {
                $set: {
                  status: 'expired',
                  updatedAt: new Date(),
                },
              }
            );
            logger.info(`Expired watches for deleted listing: ${listingType}/${listingId}`);
            return;
          }

          const activeWatches = await watchesCollection.find({
            listingType,
            listingId,
            status: 'active',
          }).toArray();

          for (const watch of activeWatches) {
            const shouldTrigger = await checkWatchCriteria(watch, data);

            if (shouldTrigger) {
              await watchesCollection.updateOne(
                { _id: watch._id },
                {
                  $set: {
                    status: 'triggered',
                    triggeredAt: new Date(),
                    updatedAt: new Date(),
                  },
                }
              );

              await sendWatchNotification(watch, data);
              logger.info(`Watch triggered: ${watch._id} for listing ${listingId}`);
            }
          }
        } catch (error) {
          logger.error('Error processing watch trigger event:', error);
        }
      },
    });

    logger.info('Watch trigger consumer started');
  } catch (error) {
    logger.error('Error starting watch trigger consumer:', error);
  }
};

/**
 * Deal event consumer
 * Processes deal tagging events
 */
export const startDealEventConsumer = async () => {
  try {
    const consumer = await getKafkaConsumer('deal-event-group');
    if (!consumer) {
      logger.warn('Kafka consumer not available. Deal event consumer not started.');
      return;
    }

    await consumer.subscribe({ topics: ['deals.tagged'], fromBeginning: false });

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const event = JSON.parse(message.value.toString());
          logger.info(`Deal event consumer received event: ${topic}`, { eventId: event.eventId });

          const db = await getMongoDB();
          const dealsCollection = db.collection('deals');

          const dealData = {
            dealId: event.payload.dealId,
            listingType: event.payload.listingType,
            listingId: event.payload.listingId,
            score: event.payload.score,
            tags: event.payload.tags,
            price: event.payload.price,
            availability: event.payload.availability,
            promotionEndsAt: event.payload.promotionEndsAt ? new Date(event.payload.promotionEndsAt) : null,
            summary: event.payload.summary,
            createdAt: new Date(event.occurredAt),
            updatedAt: new Date(),
          };

          await dealsCollection.updateOne(
            { dealId: dealData.dealId },
            { $set: dealData },
            { upsert: true }
          );

          logger.info(`Deal processed: ${dealData.dealId}`);
        } catch (error) {
          logger.error('Error processing deal event:', error);
        }
      },
    });

    logger.info('Deal event consumer started');
  } catch (error) {
    logger.error('Error starting deal event consumer:', error);
  }
};

/**
 * Inventory update consumer
 * Handles inventory updates and cache invalidation
 */
export const startInventoryUpdateConsumer = async () => {
  try {
    const consumer = await getKafkaConsumer('inventory-update-group');
    if (!consumer) {
      logger.warn('Kafka consumer not available. Inventory update consumer not started.');
      return;
    }

    await consumer.subscribe({ topics: ['inventory.updated'], fromBeginning: false });

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const event = JSON.parse(message.value.toString());
          logger.info(`Inventory update consumer received event: ${topic}`, { eventId: event.eventId });

          const { invalidateListingCache } = await import('../utils/cache.js');
          const { listingType, listingId } = event.payload || event;

          await invalidateListingCache(listingType, listingId);
          logger.info(`Cache invalidated for ${listingType}/${listingId}`);
        } catch (error) {
          logger.error('Error processing inventory update event:', error);
        }
      },
    });

    logger.info('Inventory update consumer started');
  } catch (error) {
    logger.error('Error starting inventory update consumer:', error);
  }
};

/**
 * Booking status update consumer
 * Handles booking status changes and notifications
 */
export const startBookingStatusConsumer = async () => {
  try {
    const consumer = await getKafkaConsumer('booking-status-group');
    if (!consumer) {
      logger.warn('Kafka consumer not available. Booking status consumer not started.');
      return;
    }

    await consumer.subscribe({
      topics: ['bookings.created', 'bookings.updated', 'bookings.confirmed'],
      fromBeginning: false,
    });

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const event = JSON.parse(message.value.toString());
          logger.info(`Booking status consumer received event: ${topic}`, { eventId: event.eventId });

          const db = await getMongoDB();
          const notificationsCollection = db.collection('notifications');

          const notification = {
            userId: event.userId || event.payload?.userId,
            type: 'booking',
            topic,
            bookingId: event.bookingId || event.payload?.bookingId,
            status: event.status || event.payload?.status,
            message: getBookingNotificationMessage(topic, event),
            read: false,
            createdAt: new Date(event.occurredAt),
          };

          await notificationsCollection.insertOne(notification);
          logger.info(`Notification created for booking: ${notification.bookingId}`);
        } catch (error) {
          logger.error('Error processing booking status event:', error);
        }
      },
    });

    logger.info('Booking status consumer started');
  } catch (error) {
    logger.error('Error starting booking status consumer:', error);
  }
};

/**
 * Payment confirmation consumer
 * Handles payment status changes
 */
export const startPaymentConfirmationConsumer = async () => {
  try {
    const consumer = await getKafkaConsumer('payment-confirmation-group');
    if (!consumer) {
      logger.warn('Kafka consumer not available. Payment confirmation consumer not started.');
      return;
    }

    await consumer.subscribe({
      topics: ['payments.created', 'payments.succeeded', 'payments.refunded'],
      fromBeginning: false,
    });

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const event = JSON.parse(message.value.toString());
          logger.info(`Payment confirmation consumer received event: ${topic}`, { eventId: event.eventId });

          if (topic === 'payments.succeeded') {
            const { updateBookingStatus } = await import('../services/bookings.service.js');
            const bookingId = event.bookingId || event.payload?.bookingId;

            if (bookingId) {
              try {
                await updateBookingStatus(bookingId, 'CONFIRMED');
                logger.info(`Booking ${bookingId} confirmed after payment success`);
              } catch (error) {
                logger.error(`Error confirming booking ${bookingId}:`, error);
              }
            }
          }
        } catch (error) {
          logger.error('Error processing payment confirmation event:', error);
        }
      },
    });

    logger.info('Payment confirmation consumer started');
  } catch (error) {
    logger.error('Error starting payment confirmation consumer:', error);
  }
};

/**
 * Check if watch criteria matches listing data
 */
const checkWatchCriteria = async (watch, listingData) => {
  if (!watch.criteria) {
    return false;
  }

  const { priceThreshold, availabilityThreshold } = watch.criteria;

  if (priceThreshold && listingData.price) {
    const currentPrice = typeof listingData.price === 'object'
      ? listingData.price.amount
      : listingData.price;

    if (currentPrice <= priceThreshold) {
      return true;
    }
  }

  if (availabilityThreshold && listingData.availableSeats !== undefined) {
    if (listingData.availableSeats >= availabilityThreshold) {
      return true;
    }
  }

  return false;
};

/**
 * Send watch notification
 */
const sendWatchNotification = async (watch, listingData) => {
  const db = await getMongoDB();
  const notificationsCollection = db.collection('notifications');

  const notification = {
    userId: watch.userId,
    type: 'watch',
    watchId: watch._id.toString(),
    listingType: watch.listingType,
    listingId: watch.listingId,
    message: `Your watch for ${watch.listingType} ${watch.listingId} has been triggered!`,
    data: listingData,
    read: false,
    createdAt: new Date(),
  };

  await notificationsCollection.insertOne(notification);
};

/**
 * Get booking notification message
 */
const getBookingNotificationMessage = (topic, event) => {
  const status = event.status || event.payload?.status;
  const bookingId = event.bookingId || event.payload?.bookingId;

  switch (topic) {
    case 'bookings.created':
      return `Booking ${bookingId} has been created and is pending confirmation.`;
    case 'bookings.confirmed':
      return `Booking ${bookingId} has been confirmed!`;
    case 'bookings.updated':
      return `Booking ${bookingId} status updated to ${status}.`;
    default:
      return `Booking ${bookingId} updated.`;
  }
};

/**
 * Start all Kafka consumers
 */
export const startAllConsumers = async () => {
  try {
    await Promise.all([
      startWatchTriggerConsumer(),
      startDealEventConsumer(),
      startInventoryUpdateConsumer(),
      startBookingStatusConsumer(),
      startPaymentConfirmationConsumer(),
    ]);

    logger.info('All Kafka consumers started');
  } catch (error) {
    logger.error('Error starting Kafka consumers:', error);
  }
};

