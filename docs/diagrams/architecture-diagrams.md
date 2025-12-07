# Architecture Diagrams for PowerPoint

## Diagram 1: High-Level System Architecture

```mermaid
graph TB
    subgraph "Client Layer"
        UI[React Frontend<br/>Port 5173]
    end
    
    subgraph "API Gateway Layer"
        API[Express.js Backend<br/>Port 3000<br/>API Gateway]
    end
    
    subgraph "Service Layer"
        Auth[User & Auth Service]
        List[Listings Service]
        Book[Bookings Service]
        Pay[Billing & Payments Service]
        Admin[Admin Service]
        Conc[Concierge Service]
        Anal[Analytics Service]
    end
    
    subgraph "Data Layer"
        PG[(PostgreSQL<br/>Supabase)]
        Mongo[(MongoDB<br/>Atlas)]
        Redis[(Redis<br/>Cloud)]
    end
    
    subgraph "Message Queue"
        Kafka[Kafka Event Bus<br/>Aiven Cloud]
    end
    
    subgraph "External Services"
        Firebase[Firebase Storage<br/>Images]
        AI[AI Agent Service<br/>FastAPI :8000]
    end
    
    UI -->|HTTP/REST| API
    API --> Auth
    API --> List
    API --> Book
    API --> Pay
    API --> Admin
    API --> Conc
    API --> Anal
    
    Auth --> PG
    Book --> PG
    Pay --> PG
    Admin --> PG
    
    List --> Mongo
    Conc --> Mongo
    Anal --> Mongo
    
    List --> Redis
    Auth --> Redis
    
    Book --> Kafka
    Pay --> Kafka
    Admin --> Kafka
    
    Kafka --> Anal
    Kafka --> Conc
    
    API --> Firebase
    Conc --> AI
    
    style UI fill:#e1f5ff
    style API fill:#fff4e1
    style PG fill:#e8f5e9
    style Mongo fill:#fff3e0
    style Redis fill:#fce4ec
    style Kafka fill:#f3e5f5
    style Firebase fill:#e0f2f1
    style AI fill:#e8eaf6
```

## Diagram 2: Database Architecture

```mermaid
graph LR
    subgraph "PostgreSQL - Supabase"
        Users[Users Table<br/>- User profiles<br/>- Authentication<br/>- Roles]
        Bookings[Bookings Table<br/>- Booking records<br/>- Status tracking<br/>- Itinerary]
        Payments[Payments Table<br/>- Transactions<br/>- Status<br/>- Idempotency]
        Reviews[Reviews Table<br/>- Ratings<br/>- Feedback]
        
        Users -->|1:N| Bookings
        Users -->|1:N| Payments
        Users -->|1:N| Reviews
        Bookings -->|1:1| Payments
    end
    
    subgraph "MongoDB - Atlas"
        Flights[Flights Collection<br/>- Flight listings<br/>- Schedules<br/>- Pricing]
        Hotels[Hotels Collection<br/>- Hotel listings<br/>- Rooms<br/>- Amenities]
        Cars[Cars Collection<br/>- Car rentals<br/>- Availability<br/>- Pricing]
        Sessions[Concierge Sessions<br/>- AI conversations<br/>- Context]
        Traces[User Traces<br/>- Analytics<br/>- Behavior]
    end
    
    subgraph "Redis - Cloud"
        Cache[Listing Cache<br/>TTL: 300s]
        UserCache[User Cache<br/>TTL: 600s]
        SearchCache[Search Cache<br/>TTL: 60s]
        RateLimit[Rate Limiting<br/>Counters]
    end
    
    style Users fill:#4caf50
    style Bookings fill:#4caf50
    style Payments fill:#4caf50
    style Reviews fill:#4caf50
    style Flights fill:#ff9800
    style Hotels fill:#ff9800
    style Cars fill:#ff9800
    style Sessions fill:#ff9800
    style Traces fill:#ff9800
    style Cache fill:#e91e63
    style UserCache fill:#e91e63
    style SearchCache fill:#e91e63
    style RateLimit fill:#e91e63
```

## Diagram 3: Booking & Payment Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Backend
    participant MongoDB
    participant PostgreSQL
    participant Kafka
    participant PaymentGateway
    
    User->>Frontend: Search Flights
    Frontend->>Backend: GET /api/v1/flights
    Backend->>MongoDB: Query flights collection
    MongoDB-->>Backend: Return results
    Backend-->>Frontend: Flight listings
    Frontend-->>User: Display results
    
    User->>Frontend: Select flight & create booking
    Frontend->>Backend: POST /api/v1/bookings
    Backend->>PostgreSQL: BEGIN TRANSACTION
    Backend->>PostgreSQL: Insert booking
    Backend->>MongoDB: Check availability
    MongoDB-->>Backend: Availability confirmed
    Backend->>PostgreSQL: COMMIT
    Backend->>Kafka: Publish "bookings.created"
    Backend-->>Frontend: Booking created
    Frontend-->>User: Booking confirmation
    
    User->>Frontend: Initiate payment
    Frontend->>Backend: POST /api/v1/payments
    Backend->>PostgreSQL: BEGIN TRANSACTION
    Backend->>PostgreSQL: Create payment record
    Backend->>PaymentGateway: Process payment
    PaymentGateway-->>Backend: Payment authorized
    Backend->>PostgreSQL: Update payment status
    Backend->>PostgreSQL: COMMIT
    Backend->>Kafka: Publish "payments.succeeded"
    Backend-->>Frontend: Payment success
    Frontend-->>User: Payment confirmation
```

## Diagram 4: Service Communication & Event Flow

```mermaid
graph TB
    subgraph "Synchronous Communication"
        HTTP1[HTTP/REST<br/>Request-Response]
    end
    
    subgraph "Asynchronous Communication"
        KafkaBus[Kafka Event Bus]
        
        Topic1[bookings.created]
        Topic2[bookings.updated]
        Topic3[payments.created]
        Topic4[payments.succeeded]
        Topic5[inventory.updated]
        
        Consumer1[Booking Consumer]
        Consumer2[Inventory Consumer]
        Consumer3[Analytics Consumer]
        Consumer4[Notification Consumer]
    end
    
    subgraph "Services"
        BookingSvc[Bookings Service]
        PaymentSvc[Payments Service]
        AdminSvc[Admin Service]
    end
    
    subgraph "Actions"
        UpdateInv[Update Inventory]
        UpdateAnalytics[Update Analytics]
        SendNotif[Send Notification]
        UpdateStatus[Update Booking Status]
    end
    
    BookingSvc -->|Publish| Topic1
    BookingSvc -->|Publish| Topic2
    PaymentSvc -->|Publish| Topic3
    PaymentSvc -->|Publish| Topic4
    AdminSvc -->|Publish| Topic5
    
    Topic1 --> Consumer1
    Topic2 --> Consumer2
    Topic3 --> Consumer3
    Topic4 --> Consumer4
    Topic5 --> Consumer2
    
    Consumer1 --> UpdateStatus
    Consumer2 --> UpdateInv
    Consumer3 --> UpdateAnalytics
    Consumer4 --> SendNotif
    
    HTTP1 -.->|Sync| BookingSvc
    HTTP1 -.->|Sync| PaymentSvc
    HTTP1 -.->|Sync| AdminSvc
    
    style KafkaBus fill:#9c27b0,color:#fff
    style Topic1 fill:#e1bee7
    style Topic2 fill:#e1bee7
    style Topic3 fill:#e1bee7
    style Topic4 fill:#e1bee7
    style Topic5 fill:#e1bee7
    style HTTP1 fill:#2196f3,color:#fff
```





