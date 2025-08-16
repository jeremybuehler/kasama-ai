# Kasama.ai System Architecture

## Current Architecture Overview

```mermaid
graph TB
    subgraph "Client Layer"
        Browser[Web Browser]
        Mobile[Mobile Browser]
    end

    subgraph "Frontend Application"
        React[React App<br/>Port: 4028]
        subgraph "State Management"
            Redux[Redux Toolkit]
            Context[Auth Context]
            Query[React Query<br/>*not utilized*]
        end
        subgraph "UI Layer"
            Components[Components]
            Pages[Pages/Routes]
            Forms[React Hook Form]
        end
    end

    subgraph "Backend Services"
        Supabase[Supabase Platform]
        subgraph "Supabase Services"
            Auth[Authentication Service]
            DB[(PostgreSQL Database)]
            Storage[File Storage<br/>*planned*]
            Realtime[Realtime<br/>*planned*]
        end
    end

    subgraph "External Services"
        Email[Email Service<br/>via Supabase]
        CDN[CDN<br/>*not configured*]
    end

    subgraph "Development Tools"
        Vite[Vite Dev Server]
        Build[Build Pipeline]
    end

    Browser --> React
    Mobile --> React
    React --> Redux
    React --> Context
    React --> Query
    Components --> Pages
    Forms --> Components

    React --> Supabase
    Supabase --> Auth
    Supabase --> DB
    Supabase --> Storage
    Supabase --> Realtime

    Auth --> Email
    React -.-> CDN

    Vite --> React
    Build --> React

    style Query fill:#ffcccc
    style Storage fill:#ffcccc
    style Realtime fill:#ffcccc
    style CDN fill:#ffcccc
```

## Component Architecture

```mermaid
graph LR
    subgraph "Application Structure"
        App[App.jsx]
        Routes[Routes.jsx]

        subgraph "Authentication Flow"
            AuthContext[AuthContext]
            ProtectedRoute[ProtectedRoute]
            LoginPage[Login Page]
            SignupPage[Signup Page]
        end

        subgraph "Main Features"
            Dashboard[Dashboard Home]
            Profile[Profile Settings]
            Learn[Learn Practices]
            Progress[Progress Tracking]
            Assessment[Relationship Assessment<br/>*pending*]
            Onboarding[Welcome Onboarding<br/>*pending*]
        end

        subgraph "Shared Components"
            UIComponents[UI Components]
            Navigation[Bottom Navigation]
            Modals[Modal System]
        end
    end

    App --> Routes
    Routes --> AuthContext
    AuthContext --> ProtectedRoute
    ProtectedRoute --> Dashboard
    ProtectedRoute --> Profile
    ProtectedRoute --> Learn
    ProtectedRoute --> Progress

    LoginPage --> AuthContext
    SignupPage --> AuthContext

    Dashboard --> UIComponents
    Dashboard --> Navigation
    Profile --> Modals

    style Assessment fill:#ffcccc
    style Onboarding fill:#ffcccc
```

## Data Flow Architecture

```mermaid
sequenceDiagram
    participant User
    participant ReactApp
    participant AuthContext
    participant Supabase
    participant Database

    User->>ReactApp: Access Application
    ReactApp->>AuthContext: Check Auth Status
    AuthContext->>Supabase: Get Session
    Supabase->>AuthContext: Return Session/null

    alt User Not Authenticated
        AuthContext->>ReactApp: Redirect to Login
        User->>ReactApp: Enter Credentials
        ReactApp->>Supabase: SignIn Request
        Supabase->>Database: Validate User
        Database->>Supabase: User Data
        Supabase->>ReactApp: Auth Token + User
        ReactApp->>AuthContext: Update State
        AuthContext->>ReactApp: Navigate to Dashboard
    else User Authenticated
        AuthContext->>ReactApp: Load Dashboard
        ReactApp->>Supabase: Fetch User Data
        Supabase->>Database: Query Data
        Database->>Supabase: Return Data
        Supabase->>ReactApp: User Data
        ReactApp->>User: Display Dashboard
    end
```

## Deployment Architecture (Current)

```mermaid
graph TB
    subgraph "Development Environment"
        Dev[Local Development<br/>localhost:4028]
        DevDB[Supabase Dev Project]
    end

    subgraph "Build Process"
        Source[Source Code]
        Vite[Vite Build]
        Bundle[Production Bundle<br/>build/]
    end

    subgraph "Production *Not Configured*"
        Server[Web Server]
        ProdDB[Supabase Prod Project]
    end

    Dev --> DevDB
    Source --> Vite
    Vite --> Bundle
    Bundle -.-> Server
    Server -.-> ProdDB

    style Server fill:#ffcccc
    style ProdDB fill:#ffcccc
```

## Security Architecture

```mermaid
graph TB
    subgraph "Security Layers"
        subgraph "Frontend Security"
            HTTPS[HTTPS<br/>*not enforced*]
            CSP[CSP Headers<br/>*not configured*]
            XSS[XSS Protection<br/>React Default]
        end

        subgraph "Authentication"
            JWT[JWT Tokens]
            Refresh[Auto Refresh]
            Protected[Protected Routes]
        end

        subgraph "API Security"
            RLS[Row Level Security<br/>*Supabase*]
            CORS[CORS Policy]
            RateLimit[Rate Limiting<br/>*not implemented*]
        end

        subgraph "Data Security"
            Encryption[TLS Encryption]
            Sanitization[Input Sanitization<br/>*not implemented*]
            Validation[Zod Validation<br/>*partial*]
        end
    end

    HTTPS --> JWT
    JWT --> Protected
    Protected --> RLS
    RLS --> Encryption
    Validation --> Sanitization

    style HTTPS fill:#ffcccc
    style CSP fill:#ffcccc
    style RateLimit fill:#ffcccc
    style Sanitization fill:#ffcccc
```

## Technology Stack Layers

```mermaid
graph TD
    subgraph "Presentation Layer"
        React[React 18.2.0]
        Router[React Router 6.0.2]
        Tailwind[TailwindCSS 3.4.6]
    end

    subgraph "State Management Layer"
        Redux[Redux Toolkit 2.6.1]
        Zustand[Zustand 5.0.7<br/>*unused*]
        ReactQuery[React Query 5.84.1<br/>*unused*]
        Context[Context API]
    end

    subgraph "Business Logic Layer"
        Forms[React Hook Form 7.55.0]
        Validation[Zod 4.0.15]
        Utils[Utility Functions]
    end

    subgraph "Data Access Layer"
        SupabaseClient[Supabase JS 2.54.0]
        Axios[Axios 1.8.4<br/>*installed*]
    end

    subgraph "Infrastructure Layer"
        Vite[Vite 5.4.19]
        TypeScript[TypeScript 5.9.2]
        Node[Node.js]
    end

    React --> Redux
    React --> Context
    Redux --> Forms
    Forms --> Validation
    Forms --> SupabaseClient
    SupabaseClient --> Vite

    style Zustand fill:#ffcccc
    style ReactQuery fill:#ffcccc
    style Axios fill:#ffcccc
```

## Network Architecture

```mermaid
graph LR
    subgraph "Client Devices"
        Desktop[Desktop Browser]
        Mobile[Mobile Browser]
        Tablet[Tablet Browser]
    end

    subgraph "Network Edge"
        DNS[DNS Resolution]
        CDN[CDN<br/>*not configured*]
        WAF[WAF<br/>*not configured*]
    end

    subgraph "Application Tier"
        WebServer[Static Hosting<br/>*not deployed*]
        API[API Gateway<br/>*Supabase*]
    end

    subgraph "Data Tier"
        Database[(PostgreSQL)]
        Cache[Cache Layer<br/>*not implemented*]
        FileStorage[File Storage<br/>*planned*]
    end

    Desktop --> DNS
    Mobile --> DNS
    Tablet --> DNS

    DNS --> CDN
    CDN --> WebServer
    WebServer --> API
    API --> Database
    API --> Cache
    API --> FileStorage

    style CDN fill:#ffcccc
    style WAF fill:#ffcccc
    style WebServer fill:#ffcccc
    style Cache fill:#ffcccc
    style FileStorage fill:#ffcccc
```

---

**Legend:**

- 🟢 Green: Implemented and working
- 🟡 Yellow: Partially implemented
- 🔴 Red: Not implemented/configured
- Dotted lines: Planned/future connections
