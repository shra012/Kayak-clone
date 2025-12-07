# Sample Flight Data

Flight routes available in database for testing.

**Total Flights:** 113,779 (Kaggle data) + ~4,500-9,000 (US seed data)  
**Date Range:** November 30, 2025 to February 28, 2026

## Kaggle Dataset Routes

| From | To | One-Way Date | Round-Trip Return Date | Seats |
|------|-----|--------------|------------------------|-------|
| OSC | ORL | 2025-12-01 | N/A | 112/142 |
| BED | PTU | 2025-12-04 | N/A | 71/158 |
| BMX | ITO | 2025-11-30 | N/A | 140/165 |
| BTI | STG | 2025-11-30 | 2025-12-01 | Varies |
| CZF | UTO | 2025-12-08 | 2025-12-09 | Varies |
| SVW | SNP | 2025-11-30 | Check dates | Varies |
| ILI | LUR | 2025-12-01 | No return flights | Varies |

## US Seed Data Routes (seed-us-data.js)

Routes between major US airports. All routes available in both directions for round-trip.

| From | To | City Pair | Airlines |
|------|-----|-----------|----------|
| LAX | JFK | Los Angeles - New York | AA, DL, UA, WN, B6 |
| SFO | ORD | San Francisco - Chicago | AA, UA, WN |
| MIA | LAX | Miami - Los Angeles | AA, DL, UA |
| ATL | DEN | Atlanta - Denver | DL, WN |
| SEA | DFW | Seattle - Dallas | AA, DL, AS |
| BOS | PHX | Boston - Phoenix | AA, DL, WN |
| LAS | IAH | Las Vegas - Houston | UA, WN |
| MCO | EWR | Orlando - Newark | UA, WN, B6 |
| CLT | DTW | Charlotte - Detroit | AA, DL |
| PHL | LGA | Philadelphia - New York | AA, DL, UA |

**Available Airports:** LAX, JFK, SFO, ORD, DFW, DEN, ATL, LAS, SEA, MIA, BOS, PHX, IAH, MCO, EWR, CLT, DTW, PHL, LGA, BWI

**Note:** seed-us-data.js generates ~50 routes between these 20 airports, with 1-2 flights per day for each route across all dates.

## API Examples

One-way: `GET /api/v1/flights/search?from=OSC&to=ORL&departDate=2025-12-01`  
Round-trip: `GET /api/v1/flights/search?from=BTI&to=STG&departDate=2025-11-30&returnDate=2025-12-01`  
Airlines (one-way): `GET /api/v1/flights/airlines?from=OSC&to=ORL&departDate=2025-12-01`  
Airlines (round-trip): `GET /api/v1/flights/airlines?from=BTI&to=STG&departDate=2025-11-30&returnDate=2025-12-01`

Note: Airlines endpoint with returnDate returns only airlines that serve both outbound and return routes on the specified dates.
