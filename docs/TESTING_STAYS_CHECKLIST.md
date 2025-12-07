# Stays (Hotels) Testing Checklist for Shristi

## Overview
This document outlines all the functionality that needs to be tested for the **Stays (Hotels)** feature. The goal is to ensure the entire flow works end-to-end from search to booking to payment.

---

## 1. Homepage → Stays Search Flow

### 1.1 Homepage Stays Tab
- [ ] Navigate to homepage (`/`)
- [ ] Click on "Stays" tab
- [ ] Verify the search form appears with:
  - [ ] Location input field
  - [ ] Check-in date picker
  - [ ] Check-out date picker
  - [ ] Guests selector
  - [ ] Search button
- [ ] Enter a valid city (e.g., "Mumbai", "New York", "London")
- [ ] Select check-in date (today or future)
- [ ] Select check-out date (after check-in)
- [ ] Select number of guests
- [ ] Click "Search" button
- [ ] Verify navigation to `/hotels` page with search parameters

### 1.2 Direct Navigation
- [ ] Navigate directly to `/hotels`
- [ ] Verify page loads without errors
- [ ] Verify search bar is visible at the top

---

## 2. Hotels Search Page (`/hotels`)

### 2.1 Search Functionality
- [ ] **City Search Input:**
  - [ ] Type a city name (e.g., "Mumbai")
  - [ ] Verify autocomplete dropdown appears
  - [ ] Verify dropdown shows matching cities with hotel counts
  - [ ] Click on a city from dropdown
  - [ ] Verify city is selected and search executes
  - [ ] Try typing partial city name (e.g., "New")
  - [ ] Verify multiple suggestions appear
  - [ ] Try invalid city name
  - [ ] Verify "No cities found" message appears

- [ ] **Date Inputs:**
  - [ ] Verify check-in and check-out dates are displayed (read-only if from homepage)
  - [ ] If dates are editable, test date selection
  - [ ] Verify check-out date must be after check-in date

- [ ] **Guests Display:**
  - [ ] Verify guest count is displayed correctly
  - [ ] Verify it matches the selection from homepage

### 2.2 Filter Functionality

- [ ] **Price Filter:**
  - [ ] Click "Price" filter button
  - [ ] Verify dropdown opens
  - [ ] Test quick select buttons:
    - [ ] "Under $100"
    - [ ] "$100 - $200"
    - [ ] "$200 - $300"
    - [ ] "$300+"
  - [ ] Test manual min/max price input
  - [ ] Click "Apply" button
  - [ ] Verify results are filtered by price
  - [ ] Click "Reset" button
  - [ ] Verify price filter is cleared

- [ ] **Hotel Rating Filter:**
  - [ ] Select rating from dropdown (3+, 3.5+, 4+, 4.5+)
  - [ ] Verify results are filtered by rating
  - [ ] Verify only hotels with selected rating or higher are shown

- [ ] **Amenities Filter:**
  - [ ] Select amenity from dropdown (WiFi, Pool, Parking, Breakfast)
  - [ ] Verify results are filtered
  - [ ] Test "Free breakfast" quick filter button
  - [ ] Verify filter state is maintained

- [ ] **State Filter (for US hotels):**
  - [ ] Select a US state from dropdown
  - [ ] Verify results are filtered by state
  - [ ] Verify state filter chip appears
  - [ ] Click "×" on state filter chip
  - [ ] Verify state filter is removed

- [ ] **All Filters Modal:**
  - [ ] Click "All filters" button
  - [ ] Verify modal opens
  - [ ] Test each filter section:
    - [ ] Location section
    - [ ] Price section
    - [ ] Freebies section
    - [ ] Amenities section
    - [ ] Hotel rating section
  - [ ] Apply filters
  - [ ] Verify modal closes and results update
  - [ ] Click "Reset" in modal
  - [ ] Verify all filters are cleared

- [ ] **Clear Filters:**
  - [ ] Apply multiple filters
  - [ ] Click "Clear filters" button
  - [ ] Verify all filters are reset
  - [ ] Verify results show all hotels again

### 2.3 Sorting
- [ ] Test sort options:
  - [ ] "Price: Lowest to Highest"
  - [ ] "Price: Highest to Lowest"
  - [ ] "Rating"
- [ ] Verify results are sorted correctly
- [ ] Verify sort persists when filters change

### 2.4 Results Display

- [ ] **Hotel List:**
  - [ ] Verify hotels are displayed in a list
  - [ ] For each hotel card, verify:
    - [ ] Hotel image is displayed (or placeholder)
    - [ ] Hotel name is shown
    - [ ] City location is shown
    - [ ] Rating badge is displayed
    - [ ] Star rating is shown
    - [ ] Amenities are listed (at least 3)
    - [ ] Price per night is displayed
    - [ ] Currency is correct
    - [ ] "View Deal" button is present

- [ ] **Map View:**
  - [ ] Verify map is displayed on the right side
  - [ ] Verify map shows markers for each hotel
  - [ ] Verify markers show price
  - [ ] Click on a marker
  - [ ] Verify popup shows hotel name, city, price, and rating
  - [ ] Verify map centers on first result's location
  - [ ] Verify map updates when filters change

- [ ] **Pagination:**
  - [ ] If more than 10 results, verify pagination controls appear
  - [ ] Click "Next" button
  - [ ] Verify next page loads
  - [ ] Click "Prev" button
  - [ ] Verify previous page loads
  - [ ] Verify page number is displayed

- [ ] **Empty State:**
  - [ ] Apply filters that return no results
  - [ ] Verify "No hotels found" message appears
  - [ ] Verify suggested cities are shown
  - [ ] Click on a suggested city
  - [ ] Verify search executes with that city

- [ ] **Loading States:**
  - [ ] Verify loading spinner appears during search
  - [ ] Verify "Loading hotels..." message is shown
  - [ ] Verify loading state clears when results arrive

- [ ] **Error Handling:**
  - [ ] Test with invalid search parameters
  - [ ] Verify error message is displayed
  - [ ] Verify error doesn't break the page

### 2.5 Hotel Details Modal
- [ ] Click on a hotel card (if modal exists)
- [ ] Verify modal opens
- [ ] Verify modal displays:
  - [ ] Hotel image
  - [ ] Hotel name
  - [ ] Location
  - [ ] Rating and stars
  - [ ] Amenities list
  - [ ] Price per night
  - [ ] Check-in/check-out dates
  - [ ] "Available on" section with booking providers
- [ ] Click close button
- [ ] Verify modal closes

---

## 3. Booking Flow

### 3.1 Initiate Booking
- [ ] Click "View Deal" button on a hotel
- [ ] **If NOT logged in:**
  - [ ] Verify error toast: "Please log in to continue with booking"
  - [ ] Verify redirect to `/login` page
  - [ ] Verify booking data is saved in sessionStorage
  - [ ] After login, verify redirect back to booking flow

- [ ] **If logged in:**
  - [ ] Verify navigation to `/bookings` page
  - [ ] Verify booking data is passed correctly

### 3.2 Booking Review Page (`/bookings` - Step 1)

- [ ] Verify page loads with booking data
- [ ] Verify step indicator shows "1. Review" as active
- [ ] Verify booking summary displays:
  - [ ] Hotel name
  - [ ] Location (city, state)
  - [ ] Check-in date
  - [ ] Check-out date
  - [ ] Number of nights (calculated correctly)
  - [ ] Number of guests
  - [ ] Subtotal price
  - [ ] Total price (with taxes)
- [ ] Verify sidebar shows:
  - [ ] Booking type: "Hotel"
  - [ ] Subtotal
  - [ ] Taxes & Fees (10%)
  - [ ] Total amount
- [ ] Click "Continue to Billing" button
- [ ] Verify navigation to Step 2

### 3.3 Billing Information (Step 2)

- [ ] Verify step indicator shows "2. Billing" as active
- [ ] **Form Fields:**
  - [ ] First Name (required)
  - [ ] Last Name (required)
  - [ ] Email (required, must be valid format)
  - [ ] Phone (required)
  - [ ] Address Line 1 (required)
  - [ ] Address Line 2 (optional)
  - [ ] City (required, dropdown)
  - [ ] State (required, dropdown)
  - [ ] ZIP Code (required)
  - [ ] Country (defaults to "United States")

- [ ] **Validation Testing:**
  - [ ] Try submitting with empty required fields
  - [ ] Verify error messages appear for each empty field
  - [ ] Enter invalid email format
  - [ ] Verify email validation error appears
  - [ ] Fill in all required fields
  - [ ] Verify errors clear as you type

- [ ] **Form Functionality:**
  - [ ] Test city dropdown (select from US cities)
  - [ ] Test state dropdown (select from US states)
  - [ ] Verify form data persists when navigating back
  - [ ] Click "Back" button
  - [ ] Verify return to Step 1
  - [ ] Verify billing data is preserved

- [ ] **Create Booking:**
  - [ ] Fill in all required billing information
  - [ ] Click "Continue to Payment" button
  - [ ] Verify loading state appears
  - [ ] Verify booking is created in backend
  - [ ] Verify success toast: "Booking created successfully!"
  - [ ] Verify navigation to `/payments` page
  - [ ] Verify booking ID, amount, and currency are passed

- [ ] **Error Handling:**
  - [ ] Test with network error
  - [ ] Verify error toast appears
  - [ ] Verify user stays on billing page
  - [ ] Verify form data is preserved

---

## 4. Payment Flow

### 4.1 Payment Page (`/payments`)

- [ ] Verify page loads with booking information
- [ ] Verify booking details are displayed:
  - [ ] Booking ID
  - [ ] Booking type: "Hotel"
  - [ ] Amount to pay
  - [ ] Currency
- [ ] **Payment Form:**
  - [ ] Verify payment method selection (if applicable)
  - [ ] Verify card number input
  - [ ] Verify expiry date input
  - [ ] Verify CVV input
  - [ ] Verify cardholder name input
- [ ] **Payment Processing:**
  - [ ] Fill in payment details
  - [ ] Click "Pay Now" or "Complete Payment" button
  - [ ] Verify loading state
  - [ ] Verify payment is processed
  - [ ] Verify success message
  - [ ] Verify payment status updates
- [ ] **Error Handling:**
  - [ ] Test with invalid card details
  - [ ] Verify error message appears
  - [ ] Test with declined payment
  - [ ] Verify appropriate error handling

---

## 5. Booking Confirmation & Management

### 5.1 View Bookings List
- [ ] Navigate to `/bookings` (without booking data)
- [ ] Verify "My Bookings" page loads
- [ ] Verify all hotel bookings are listed
- [ ] For each booking, verify:
  - [ ] Hotel icon is displayed
  - [ ] Booking type: "hotel"
  - [ ] Hotel name and city
  - [ ] Booking status badge
  - [ ] Timeline badge (if applicable)
  - [ ] Date range (check-in to check-out)
  - [ ] Total price
  - [ ] "View Details" button

### 5.2 Booking Details Page (`/bookings/:bookingId`)

- [ ] Click "View Details" on a hotel booking
- [ ] Verify navigation to booking details page
- [ ] Verify all booking information is displayed:
  - [ ] Booking ID
  - [ ] Booking status
  - [ ] Hotel name
  - [ ] Location (city, state)
  - [ ] Check-in date
  - [ ] Check-out date
  - [ ] Number of nights
  - [ ] Number of guests
  - [ ] Hotel rating
  - [ ] Amenities
  - [ ] Price breakdown:
    - [ ] Subtotal
    - [ ] Taxes & fees
    - [ ] Total
  - [ ] Payment status
  - [ ] Payment details (if paid)

---

## 6. Edge Cases & Error Scenarios

### 6.1 Search Edge Cases
- [ ] Search with no results
- [ ] Search with special characters in city name
- [ ] Search with very long city name
- [ ] Search with empty city field
- [ ] Search with past check-in date
- [ ] Search with check-out before check-in
- [ ] Search with 0 guests
- [ ] Search with very high guest count

### 6.2 Booking Edge Cases
- [ ] Try to book same hotel twice simultaneously
- [ ] Try to book with expired session
- [ ] Try to book with invalid hotel ID
- [ ] Try to book with missing check-in/check-out dates
- [ ] Try to book with negative price (if possible)
- [ ] Test booking with different currencies

### 6.3 Payment Edge Cases
- [ ] Try to pay for already paid booking
- [ ] Try to pay for cancelled booking
- [ ] Try to pay with insufficient funds
- [ ] Test payment timeout scenarios
- [ ] Test payment with network interruption

### 6.4 Data Consistency
- [ ] Verify hotel data matches between search and booking
- [ ] Verify price calculations are correct
- [ ] Verify dates are consistent throughout flow
- [ ] Verify guest count is consistent
- [ ] Verify currency is consistent

---

## 7. UI/UX Testing

### 7.1 Responsive Design
- [ ] Test on desktop (1920x1080, 1366x768)
- [ ] Test on tablet (768x1024)
- [ ] Test on mobile (375x667, 414x896)
- [ ] Verify:
  - [ ] Search bar is usable on all screen sizes
  - [ ] Filters are accessible on mobile
  - [ ] Map view is responsive (or hidden on mobile)
  - [ ] Hotel cards are readable on all sizes
  - [ ] Booking form is usable on mobile
  - [ ] Payment form is usable on mobile

### 7.2 Accessibility
- [ ] Test keyboard navigation:
  - [ ] Tab through all interactive elements
  - [ ] Verify focus indicators are visible
  - [ ] Verify Enter/Space activates buttons
- [ ] Test screen reader (if available):
  - [ ] Verify labels are announced
  - [ ] Verify error messages are announced
- [ ] Verify color contrast meets WCAG standards
- [ ] Verify text is readable

### 7.3 Performance
- [ ] Test search with many results (100+ hotels)
- [ ] Verify page loads in reasonable time (< 3 seconds)
- [ ] Verify map loads without blocking UI
- [ ] Verify images load progressively
- [ ] Test with slow network connection
- [ ] Verify loading states are shown appropriately

---

## 8. Integration Testing

### 8.1 Backend Integration
- [ ] Verify API calls are made correctly:
  - [ ] `GET /api/v1/listings/hotels/search`
  - [ ] `GET /api/v1/listings/hotels/:hotelId`
  - [ ] `POST /api/v1/bookings`
  - [ ] `POST /api/v1/payments`
- [ ] Verify request parameters are correct
- [ ] Verify response data is handled correctly
- [ ] Verify error responses are handled

### 8.2 Database Integration
- [ ] Verify hotel data is retrieved from MongoDB
- [ ] Verify bookings are created in PostgreSQL
- [ ] Verify payments are created in PostgreSQL
- [ ] Verify data relationships are correct

### 8.3 Kafka Integration (if applicable)
- [ ] Verify booking creation publishes Kafka event
- [ ] Verify payment creation publishes Kafka event
- [ ] Verify events contain correct data

---

## 9. Cross-Browser Testing

- [ ] Test on Chrome (latest)
- [ ] Test on Firefox (latest)
- [ ] Test on Safari (latest)
- [ ] Test on Edge (latest)
- [ ] Verify all functionality works across browsers
- [ ] Verify styling is consistent

---

## 10. Documentation & Reporting

### 10.1 Issues Found
- [ ] Document any bugs found with:
  - [ ] Steps to reproduce
  - [ ] Expected behavior
  - [ ] Actual behavior
  - [ ] Screenshots (if applicable)
  - [ ] Browser/OS information

### 10.2 Test Results Summary
- [ ] Create summary of:
  - [ ] Total test cases executed
  - [ ] Passed test cases
  - [ ] Failed test cases
  - [ ] Blocked test cases
  - [ ] Overall status

---

## Quick Test Scenarios (Priority)

If time is limited, focus on these critical paths:

1. **Happy Path:**
   - Homepage → Search "Mumbai" → Select hotel → Login → Fill billing → Create booking → Complete payment → View booking

2. **Filter & Search:**
   - Search hotels → Apply price filter → Apply rating filter → Sort by price → View results

3. **Error Handling:**
   - Search invalid city → Try booking without login → Submit invalid billing info → Test payment errors

4. **Data Consistency:**
   - Verify hotel details match between search, booking, and confirmation

---

## Notes

- All tests should be performed in a test environment
- Use test user accounts (not production data)
- Document any discrepancies between expected and actual behavior
- Report critical bugs immediately
- Test with realistic data (actual hotel names, cities, dates)

---

## Questions to Answer

After testing, you should be able to answer:

1. Does the entire Stays flow work end-to-end?
2. Are there any broken features or missing functionality?
3. Are there any UI/UX issues that need attention?
4. Are there any performance issues?
5. Are there any security concerns?
6. What is the overall quality of the Stays feature?

---

**Good luck with testing! 🏨✨**

