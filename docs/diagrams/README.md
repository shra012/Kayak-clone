# Architecture Diagrams for PowerPoint

This directory contains architecture diagrams that can be used in PowerPoint presentations.

## How to Convert to Images

### Option 1: Using Mermaid Live Editor (Recommended)
1. Go to https://mermaid.live/
2. Copy the mermaid code from `architecture-diagrams.md`
3. Export as PNG or SVG
4. Insert into PowerPoint

### Option 2: Using Mermaid CLI
```bash
npm install -g @mermaid-js/mermaid-cli
mmdc -i diagram1.mmd -o diagram1.png
```

### Option 3: Using Online Tools
- https://mermaid.ink/ - Direct image URLs
- https://kroki.io/ - Multiple diagram formats

## Diagram Descriptions

### Diagram 1: High-Level System Architecture
Shows the complete system architecture including:
- Client layer (React Frontend)
- API Gateway layer (Express.js)
- Service layer (all microservices)
- Data layer (PostgreSQL, MongoDB, Redis)
- Message queue (Kafka)
- External services (Firebase, AI Agent)

**Use for**: System overview, introduction slides

### Diagram 2: Database Architecture
Illustrates the multi-database strategy:
- PostgreSQL tables and relationships
- MongoDB collections
- Redis cache patterns

**Use for**: Database design, data storage explanation

### Diagram 3: Booking & Payment Flow
Sequence diagram showing the complete flow:
- User search and booking creation
- Payment processing
- Event publishing
- Database transactions

**Use for**: Process flows, user journey explanation

### Diagram 4: Service Communication & Event Flow
Shows communication patterns:
- Synchronous HTTP/REST
- Asynchronous Kafka events
- Event consumers and actions

**Use for**: Architecture patterns, event-driven design

## PowerPoint Tips

1. **Use high resolution**: Export diagrams at 2x or 3x resolution for crisp images
2. **Consistent colors**: The diagrams use a color scheme that matches the project
3. **Add labels**: Consider adding text boxes with explanations
4. **Animate**: Use PowerPoint animations to reveal parts of diagrams sequentially

## Color Scheme

- **Blue (#e1f5ff)**: Frontend/Client
- **Orange (#fff4e1)**: API Gateway
- **Green (#e8f5e9)**: PostgreSQL
- **Orange (#fff3e0)**: MongoDB
- **Pink (#fce4ec)**: Redis
- **Purple (#f3e5f5)**: Kafka
- **Teal (#e0f2f1)**: Firebase
- **Indigo (#e8eaf6)**: AI Services





