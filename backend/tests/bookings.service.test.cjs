/**
 * Basic unit tests for bookings.service
 * These are shallow tests that mock database and Kafka to avoid external dependencies.
 */

jest.unstable_mockModule('../src/config/database.js', () => ({
  getPostgresPool: () => ({
    connect: async () => ({
      query: jest.fn()
        .mockResolvedValueOnce({
          rows: [{
            id: 'booking-1',
            user_id: 'user-1',
            booking_type: 'flight',
            status: 'PENDING',
            price_amount: 100,
            price_currency: 'USD',
            itinerary: {},
            metadata: {},
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }],
        }),
      release: jest.fn(),
    }),
  }),
  getMongoDB: async () => ({
    collection: () => ({
      find: () => ({ project: () => ({ toArray: async () => [] }) }),
    }),
  }),
}));

jest.unstable_mockModule('../src/config/kafka.js', () => ({
  sendKafkaMessage: jest.fn().mockResolvedValue(undefined),
}));

const { createBooking } = await import('../src/services/bookings.service.js');

describe('bookings.service - createBooking', () => {
  test('should create a booking and return normalized object', async () => {
    const result = await createBooking('user-1', {
      bookingType: 'flight',
      listingId: 'flight-1',
      priceAmount: 100,
      priceCurrency: 'USD',
      itinerary: { from: 'LAX', to: 'JFK' },
      metadata: { test: true },
    });

    expect(result).toHaveProperty('id');
    expect(result).toHaveProperty('userId', 'user-1');
    expect(result).toHaveProperty('bookingType', 'flight');
    expect(result).toHaveProperty('status', 'PENDING');
    expect(result).toHaveProperty('price');
    expect(result.price).toMatchObject({ amount: 100, currency: 'USD' });
  });
});


