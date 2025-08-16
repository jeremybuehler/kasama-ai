# Mermaid Diagram Templates

## Overview

This document contains Mermaid diagram templates for system architecture, data flows, and process visualization. You can render these directly in markdown viewers that support Mermaid, or use the Mermaid Live Editor at https://mermaid.live/

## 1. System Architecture Diagram

```mermaid
graph TB
    subgraph "Frontend"
        UI[Web UI]
        Mobile[Mobile App]
    end

    subgraph "API Gateway"
        Gateway[API Gateway]
        Auth[Authentication]
    end

    subgraph "Microservices"
        Service1[User Service]
        Service2[Product Service]
        Service3[Order Service]
    end

    subgraph "Data Layer"
        DB1[(User DB)]
        DB2[(Product DB)]
        Cache[(Redis Cache)]
    end

    subgraph "External Services"
        Payment[Payment Provider]
        Email[Email Service]
    end

    UI --> Gateway
    Mobile --> Gateway
    Gateway --> Auth
    Auth --> Service1
    Gateway --> Service1
    Gateway --> Service2
    Gateway --> Service3
    Service1 --> DB1
    Service2 --> DB2
    Service1 --> Cache
    Service3 --> Payment
    Service3 --> Email
```

## 2. User Journey Flow

```mermaid
journey
    title User Journey: New User Onboarding
    section Discovery
      Visit Website: 5: User
      View Features: 4: User
      Read Reviews: 3: User
    section Sign Up
      Click Sign Up: 5: User
      Enter Email: 3: User
      Verify Email: 2: User
      Create Password: 3: User
    section Onboarding
      Welcome Screen: 5: User
      Profile Setup: 3: User
      Tutorial: 4: User
      First Action: 5: User
    section Engagement
      Daily Use: 4: User
      Invite Friends: 3: User
      Premium Upgrade: 2: User
```

## 3. Data Flow Diagram

```mermaid
flowchart LR
    A[User Input] --> B{Validation}
    B -->|Valid| C[Process Data]
    B -->|Invalid| D[Error Message]
    C --> E[Transform]
    E --> F[Store in DB]
    F --> G[Update Cache]
    G --> H[Send Response]
    D --> A
    H --> I[Update UI]

    style A fill:#e1f5e1
    style I fill:#e1f5e1
    style D fill:#ffe1e1
```

## 4. State Diagram

```mermaid
stateDiagram-v2
    [*] --> Idle
    Idle --> Loading : User Action
    Loading --> Success : Data Received
    Loading --> Error : Request Failed
    Success --> Idle : Reset
    Error --> Idle : Retry
    Error --> Failed : Max Retries
    Failed --> [*]

    Success --> Processing : User Confirms
    Processing --> Complete : Process Success
    Processing --> Error : Process Failed
    Complete --> [*]
```

## 5. Sequence Diagram

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant A as API
    participant D as Database
    participant C as Cache
    participant E as Email Service

    U->>F: Login Request
    F->>A: POST /auth/login
    A->>D: Verify Credentials
    D-->>A: User Data
    A->>C: Store Session
    A->>E: Send Login Notification
    A-->>F: JWT Token
    F-->>U: Dashboard View

    Note over U,F: User is now authenticated

    U->>F: Request Data
    F->>A: GET /api/data
    A->>C: Check Cache
    alt Cache Hit
        C-->>A: Cached Data
    else Cache Miss
        A->>D: Query Database
        D-->>A: Fresh Data
        A->>C: Update Cache
    end
    A-->>F: Response Data
    F-->>U: Display Data
```

## 6. Entity Relationship Diagram

```mermaid
erDiagram
    USER ||--o{ ORDER : places
    USER {
        int user_id PK
        string email
        string name
        datetime created_at
    }
    ORDER ||--|{ ORDER_ITEM : contains
    ORDER {
        int order_id PK
        int user_id FK
        datetime order_date
        string status
        decimal total
    }
    PRODUCT ||--o{ ORDER_ITEM : included_in
    PRODUCT {
        int product_id PK
        string name
        decimal price
        int stock
    }
    ORDER_ITEM {
        int item_id PK
        int order_id FK
        int product_id FK
        int quantity
        decimal price
    }
```

## 7. Gantt Chart

```mermaid
gantt
    title Project Timeline
    dateFormat  YYYY-MM-DD
    section Discovery
    Market Research           :done,    des1, 2024-01-01, 14d
    User Interviews          :done,    des2, 2024-01-08, 10d
    Requirements Gathering    :active,  des3, 2024-01-15, 7d

    section Design
    Wireframing             :         des4, after des3, 10d
    Visual Design           :         des5, after des4, 14d
    Prototype               :         des6, after des4, 7d

    section Development
    Backend Setup           :         dev1, after des3, 14d
    API Development         :         dev2, after dev1, 21d
    Frontend Development    :         dev3, after des5, 28d
    Integration             :         dev4, after dev3, 14d

    section Testing
    Unit Testing            :         test1, after dev2, 7d
    Integration Testing     :         test2, after dev4, 10d
    UAT                     :         test3, after test2, 14d

    section Launch
    Deployment Prep         :         launch1, after test2, 7d
    Go Live                :crit,    launch2, after test3, 1d
    Monitoring              :         launch3, after launch2, 30d
```

## 8. Pie Chart

```mermaid
pie title Resource Allocation
    "Development" : 40
    "Design" : 15
    "Testing" : 20
    "Project Management" : 10
    "Infrastructure" : 10
    "Documentation" : 5
```

## 9. Git Flow Diagram

```mermaid
gitGraph
    commit
    branch develop
    checkout develop
    commit
    branch feature-1
    checkout feature-1
    commit
    commit
    checkout develop
    merge feature-1
    branch feature-2
    checkout feature-2
    commit
    checkout develop
    merge feature-2
    checkout main
    merge develop tag: "v1.0.0"
    checkout develop
    commit
    branch hotfix
    checkout hotfix
    commit
    checkout main
    merge hotfix tag: "v1.0.1"
    checkout develop
    merge hotfix
```

## 10. Class Diagram

```mermaid
classDiagram
    class User {
        +String id
        +String email
        +String name
        -String password
        +login()
        +logout()
        +updateProfile()
    }

    class Order {
        +String id
        +Date orderDate
        +OrderStatus status
        +calculateTotal()
        +addItem()
        +removeItem()
    }

    class Product {
        +String id
        +String name
        +Decimal price
        +Int stock
        +checkAvailability()
        +updateStock()
    }

    class OrderItem {
        +String id
        +Int quantity
        +Decimal price
        +calculateSubtotal()
    }

    User "1" --> "*" Order : places
    Order "1" --> "*" OrderItem : contains
    Product "1" --> "*" OrderItem : included in
```

## Usage Instructions

### In Markdown Files

1. Copy the desired diagram code including the ` ```mermaid ` markers
2. Paste into your markdown file
3. View in a Mermaid-compatible viewer (GitHub, GitLab, VS Code with extension)

### In Mermaid Live Editor

1. Go to https://mermaid.live/
2. Paste the diagram code (without the ` ```mermaid ` markers)
3. Edit and export as SVG, PNG, or PDF

### In Documentation

1. Include in your PRD or technical documentation
2. Update the diagram content to match your specific architecture
3. Keep diagrams version-controlled with your code

## Tips

- Keep diagrams simple and focused on one aspect
- Use consistent naming conventions
- Add comments in complex diagrams
- Consider breaking large diagrams into smaller, focused ones
- Update diagrams as the system evolves

---

_For more Mermaid syntax and examples, visit: https://mermaid.js.org/_
