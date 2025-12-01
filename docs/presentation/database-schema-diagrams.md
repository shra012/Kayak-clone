# Database Schema Diagrams

## Actual Supabase Database Schema

The actual database schema exported from Supabase is available as an SVG diagram:
- **File**: `supabase-actual-schema.svg`
- **Source**: Supabase Database Schema Export

This diagram shows the complete, up-to-date schema with all tables, relationships, and constraints as they exist in the production Supabase database.

---

## PostgreSQL Schema (Supabase) - Compact Version (For Presentation)

```mermaid
erDiagram
    USERS ||--o{ BOOKINGS : "has"
    USERS ||--o{ PAYMENTS : "makes"
    USERS ||--o{ REVIEWS : "writes"
    BOOKINGS ||--|| PAYMENTS : "has"
    
    USERS {
        uuid id PK
        varchar email UK
        varchar first_name
        varchar last_name
        varchar password_hash
        varchar phone_number
        varchar address_line1
        varchar address_city
        char address_state
        varchar address_zip_code
        varchar profile_type
        varchar role
        timestamp created_at
    }
    
    BOOKINGS {
        uuid id PK
        uuid user_id FK
        varchar booking_type
        varchar status
        decimal price_amount
        char price_currency
        jsonb itinerary
        timestamp created_at
    }
    
    PAYMENTS {
        uuid id PK
        uuid booking_id FK
        uuid user_id FK
        varchar status
        decimal amount
        char currency
        varchar transaction_reference
        varchar idempotency_key UK
        timestamp created_at
    }
    
    REVIEWS {
        uuid id PK
        uuid user_id FK
        varchar listing_type
        varchar listing_id
        integer rating
        varchar title
        text body
        timestamp created_at
    }
```

## PostgreSQL Schema (Supabase) - Detailed Version

```mermaid
erDiagram
    USERS ||--o{ BOOKINGS : "has"
    USERS ||--o{ PAYMENTS : "makes"
    USERS ||--o{ REVIEWS : "writes"
    BOOKINGS ||--|| PAYMENTS : "has"
    
    USERS {
        uuid id PK
        varchar ssn UK
        varchar first_name
        varchar last_name
        varchar email UK
        varchar password_hash
        varchar phone_number
        varchar address_line1
        varchar address_line2
        varchar address_city
        char address_state
        varchar address_zip_code
        varchar profile_image_url
        varchar profile_type
        timestamp ssn_verified_at
        jsonb partner_details
        varchar role
        varchar loyalty_tier
        timestamp last_login
        timestamp created_at
        timestamp updated_at
    }
    
    BOOKINGS {
        uuid id PK
        uuid user_id FK
        varchar booking_type
        varchar status
        decimal price_amount
        char price_currency
        jsonb itinerary
        jsonb metadata
        timestamp created_at
        timestamp updated_at
    }
    
    PAYMENTS {
        uuid id PK
        uuid booking_id FK
        uuid user_id FK
        varchar status
        decimal amount
        char currency
        varchar transaction_reference
        varchar idempotency_key UK
        jsonb metadata
        varchar invoice_url
        timestamp created_at
        timestamp updated_at
    }
    
    REVIEWS {
        uuid id PK
        uuid user_id FK
        varchar listing_type
        varchar listing_id
        integer rating
        varchar title
        text body
        timestamp created_at
        timestamp updated_at
    }
```

## PostgreSQL Schema - Horizontal Layout (Best for PowerPoint)

```mermaid
graph LR
    subgraph "PostgreSQL Database Schema"
        direction TB
        
        U[USERS<br/>━━━━━━━━━━━━━━━━━━━━<br/>• id PK<br/>• email UK<br/>• first_name<br/>• last_name<br/>• password_hash<br/>• phone_number<br/>• address fields<br/>• profile_type<br/>• role<br/>• created_at]
        
        B[BOOKINGS<br/>━━━━━━━━━━━━━━━━━━━━<br/>• id PK<br/>• user_id FK → USERS<br/>• booking_type<br/>• status<br/>• price_amount<br/>• price_currency<br/>• itinerary JSON<br/>• created_at]
        
        P[PAYMENTS<br/>━━━━━━━━━━━━━━━━━━━━<br/>• id PK<br/>• booking_id FK → BOOKINGS<br/>• user_id FK → USERS<br/>• status<br/>• amount<br/>• currency<br/>• transaction_reference<br/>• idempotency_key UK<br/>• created_at]
        
        R[REVIEWS<br/>━━━━━━━━━━━━━━━━━━━━<br/>• id PK<br/>• user_id FK → USERS<br/>• listing_type<br/>• listing_id<br/>• rating<br/>• title<br/>• body<br/>• created_at]
    end
    
    U -->|1:N| B
    U -->|1:N| P
    U -->|1:N| R
    B -->|1:1| P
    
    style U fill:#4CAF50,color:#fff,stroke:#388E3C,stroke-width:2px
    style B fill:#2196F3,color:#fff,stroke:#1976D2,stroke-width:2px
    style P fill:#FF9800,color:#fff,stroke:#F57C00,stroke-width:2px
    style R fill:#9C27B0,color:#fff,stroke:#7B1FA2,stroke-width:2px
```

## MongoDB Schema (Atlas) - Compact Version (Best for Single Slide)

```mermaid
graph LR
    subgraph "MongoDB Database Schema"
        direction TB
        
        F[FLIGHTS<br/>━━━━━━━━━━━━━━━━━━━━<br/>• _id: 'AA123'<br/>• airline<br/>• departure {airport, city, datetime}<br/>• arrival {airport, city, datetime}<br/>• durationMinutes<br/>• seats {economy, business}<br/>• basePrice {amount, currency}<br/>• fareClass<br/>• rating]
        
        H[HOTELS<br/>━━━━━━━━━━━━━━━━━━━━<br/>• _id: 'hotel_123'<br/>• name<br/>• address {street, city, state, coordinates}<br/>• rooms [{type, capacity, price, amenities}]<br/>• amenities []<br/>• rating<br/>• availableRooms]
        
        C[CARS<br/>━━━━━━━━━━━━━━━━━━━━<br/>• _id: 'car_ABC'<br/>• provider<br/>• model, year<br/>• type, transmission<br/>• seats<br/>• pricePerDay<br/>• availabilityStatus<br/>• location {pickup, return}]
        
        CS[CONCIERGE_SESSIONS<br/>━━━━━━━━━━━━━━━━━━━━<br/>• _id: ObjectId<br/>• userId<br/>• status<br/>• context {}<br/>• messages [{role, content, timestamp}]<br/>• bundles []<br/>• createdAt]
        
        UT[USER_TRACES<br/>━━━━━━━━━━━━━━━━━━━━<br/>• _id: ObjectId<br/>• userId<br/>• cohort<br/>• steps [{event, timestamp, data}]<br/>• createdAt]
    end
    
    style F fill:#FF9800,color:#fff,stroke:#F57C00,stroke-width:2px
    style H fill:#FF9800,color:#fff,stroke:#F57C00,stroke-width:2px
    style C fill:#FF9800,color:#fff,stroke:#F57C00,stroke-width:2px
    style CS fill:#9C27B0,color:#fff,stroke:#7B1FA2,stroke-width:2px
    style UT fill:#9C27B0,color:#fff,stroke:#7B1FA2,stroke-width:2px
```

## MongoDB Schema (Atlas) - Grouped Version

```mermaid
graph TB
    subgraph "MongoDB Collections - Document Store"
        direction LR
        
        subgraph Listings["Listings Collections"]
            F[FLIGHTS<br/>━━━━━━━━━━━━━━━━━━━━<br/>Flight Listings<br/>• Airline, Routes<br/>• Schedules, Pricing<br/>• Seat Availability<br/>• Ratings]
            
            H[HOTELS<br/>━━━━━━━━━━━━━━━━━━━━<br/>Hotel Listings<br/>• Name, Address<br/>• Rooms, Amenities<br/>• Pricing<br/>• Ratings]
            
            C[CARS<br/>━━━━━━━━━━━━━━━━━━━━<br/>Car Rentals<br/>• Provider, Model<br/>• Type, Pricing<br/>• Availability<br/>• Location]
        end
        
        subgraph Analytics["Analytics Collections"]
            CS[CONCIERGE_SESSIONS<br/>━━━━━━━━━━━━━━━━━━━━<br/>AI Conversations<br/>• User Context<br/>• Messages<br/>• Bundles]
            
            UT[USER_TRACES<br/>━━━━━━━━━━━━━━━━━━━━<br/>Behavior Analytics<br/>• User Events<br/>• Cohort Data<br/>• Journey Steps]
        end
    end
    
    style F fill:#FF9800,color:#fff,stroke:#F57C00,stroke-width:2px
    style H fill:#FF9800,color:#fff,stroke:#F57C00,stroke-width:2px
    style C fill:#FF9800,color:#fff,stroke:#F57C00,stroke-width:2px
    style CS fill:#9C27B0,color:#fff,stroke:#7B1FA2,stroke-width:2px
    style UT fill:#9C27B0,color:#fff,stroke:#7B1FA2,stroke-width:2px
```

## MongoDB Schema (Atlas) - Detailed Version

```mermaid
graph TB
    subgraph "MongoDB Collections"
        Flights["Flights Collection<br/>━━━━━━━━━━━━━━━━━━━━<br/>{<br/>  _id: 'AA123',<br/>  airline: 'American Airlines',<br/>  departure: {<br/>    airport: 'JFK',<br/>    city: 'New York',<br/>    datetime: ISODate<br/>  },<br/>  arrival: {<br/>    airport: 'LAX',<br/>    city: 'Los Angeles',<br/>    datetime: ISODate<br/>  },<br/>  seats: {<br/>    economy: {available, price},<br/>    business: {available, price}<br/>  },<br/>  amenities: [],<br/>  rating: 4.5<br/>}"]
        
        Hotels["Hotels Collection<br/>━━━━━━━━━━━━━━━━━━━━<br/>{<br/>  _id: 'hotel_12345',<br/>  name: 'Grand Hotel',<br/>  address: {<br/>    street, city, state,<br/>    zipCode, coordinates<br/>  },<br/>  rooms: [{<br/>    type, capacity,<br/>    pricePerNight,<br/>    amenities: []<br/>  }],<br/>  amenities: [],<br/>  rating: 4.5,<br/>  reviews: []<br/>}"]
        
        Cars["Cars Collection<br/>━━━━━━━━━━━━━━━━━━━━<br/>{<br/>  _id: 'car_ABC123',<br/>  provider: 'Hertz',<br/>  model: 'Toyota Camry',<br/>  year: 2023,<br/>  type: 'sedan',<br/>  transmission: 'automatic',<br/>  seats: 5,<br/>  pricePerDay: 45,<br/>  availabilityStatus: 'available',<br/>  location: {<br/>    pickup, return<br/>  }<br/>}"]
        
        Sessions["Concierge Sessions<br/>━━━━━━━━━━━━━━━━━━━━<br/>{<br/>  _id: ObjectId,<br/>  userId: 'uuid',<br/>  status: 'active',<br/>  context: {},<br/>  messages: [{<br/>    role, content,<br/>    timestamp<br/>  }],<br/>  bundles: [],<br/>  createdAt: ISODate<br/>}"]
        
        Traces["User Traces<br/>━━━━━━━━━━━━━━━━━━━━<br/>{<br/>  _id: ObjectId,<br/>  userId: 'uuid',<br/>  cohort: 'San Jose, CA',<br/>  steps: [{<br/>    event: 'search',<br/>    timestamp,<br/>    data: {}<br/>  }],<br/>  createdAt: ISODate<br/>}"]
    end
    
    style Flights fill:#FF9800,color:#fff
    style Hotels fill:#FF9800,color:#fff
    style Cars fill:#FF9800,color:#fff
    style Sessions fill:#9C27B0,color:#fff
    style Traces fill:#9C27B0,color:#fff
```

## Redis Cache Schema

```mermaid
graph LR
    subgraph "Redis Key Patterns"
        L1["listing:flight:AA123<br/>TTL: 300s"]
        L2["listing:hotel:hotel_123<br/>TTL: 300s"]
        L3["listing:car:car_ABC<br/>TTL: 300s"]
        
        U1["user:profile:{userId}<br/>TTL: 600s"]
        
        S1["search:flights:{hash}<br/>TTL: 60s"]
        S2["search:hotels:{hash}<br/>TTL: 60s"]
        S3["search:cars:{hash}<br/>TTL: 60s"]
        
        R1["ratelimit:{userId}:{endpoint}<br/>TTL: 900s"]
        
        SE1["session:{sessionId}<br/>TTL: 86400s"]
    end
    
    style L1 fill:#DC382D,color:#fff
    style L2 fill:#DC382D,color:#fff
    style L3 fill:#DC382D,color:#fff
    style U1 fill:#DC382D,color:#fff
    style S1 fill:#DC382D,color:#fff
    style S2 fill:#DC382D,color:#fff
    style S3 fill:#DC382D,color:#fff
    style R1 fill:#DC382D,color:#fff
    style SE1 fill:#DC382D,color:#fff
```

## Complete Database Architecture

```mermaid
graph TB
    subgraph "PostgreSQL - Relational Data"
        PG[(PostgreSQL<br/>Supabase)]
        PG --> Users[Users Table]
        PG --> Bookings[Bookings Table]
        PG --> Payments[Payments Table]
        PG --> Reviews[Reviews Table]
    end
    
    subgraph "MongoDB - Document Store"
        MONGO[(MongoDB Atlas)]
        MONGO --> Flights[Flights Collection]
        MONGO --> Hotels[Hotels Collection]
        MONGO --> Cars[Cars Collection]
        MONGO --> Sessions[Concierge Sessions]
        MONGO --> Traces[User Traces]
    end
    
    subgraph "Redis - Cache Layer"
        REDIS[(Redis Cloud)]
        REDIS --> Cache[Listing Cache]
        REDIS --> UserCache[User Cache]
        REDIS --> SearchCache[Search Cache]
        REDIS --> RateLimit[Rate Limiting]
    end
    
    style PG fill:#336791,color:#fff
    style MONGO fill:#47A248,color:#fff
    style REDIS fill:#DC382D,color:#fff
```
