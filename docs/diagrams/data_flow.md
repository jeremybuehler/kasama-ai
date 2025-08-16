# Kasama.ai Data Flow Diagrams

## Authentication Data Flow

```mermaid
flowchart TD
    Start([User Visits App])
    CheckAuth{Session Valid?}

    subgraph "Login Flow"
        LoginForm[Login Form]
        EmailPass[Email/Password Input]
        SubmitLogin[Submit Credentials]
        ValidateCreds{Valid?}
        CreateSession[Create Session]
        StoreToken[Store JWT Token]
    end

    subgraph "Signup Flow"
        SignupForm[Signup Form]
        NewUserData[User Details Input]
        SubmitSignup[Submit Registration]
        CreateUser[Create User Account]
        SendVerification[Send Verification Email]
        AwaitVerify[Await Verification]
    end

    subgraph "Session Management"
        RefreshToken[Auto-Refresh Token]
        UpdateContext[Update Auth Context]
        PersistSession[Persist to LocalStorage]
    end

    Dashboard([Load Dashboard])
    LoginPage([Show Login Page])

    Start --> CheckAuth
    CheckAuth -->|Yes| RefreshToken
    CheckAuth -->|No| LoginPage

    LoginPage --> LoginForm
    LoginPage --> SignupForm

    LoginForm --> EmailPass
    EmailPass --> SubmitLogin
    SubmitLogin --> ValidateCreds
    ValidateCreds -->|Yes| CreateSession
    ValidateCreds -->|No| LoginForm

    SignupForm --> NewUserData
    NewUserData --> SubmitSignup
    SubmitSignup --> CreateUser
    CreateUser --> SendVerification
    SendVerification --> AwaitVerify
    AwaitVerify --> CreateSession

    CreateSession --> StoreToken
    StoreToken --> UpdateContext
    UpdateContext --> PersistSession

    RefreshToken --> UpdateContext
    PersistSession --> Dashboard
```

## User Data Flow

```mermaid
flowchart LR
    subgraph "User Input Layer"
        Forms[Form Components]
        Validation[Zod Validation]
        ErrorHandling[Error Messages]
    end

    subgraph "State Management"
        LocalState[Component State]
        AuthState[Auth Context]
        ReduxState[Redux Store<br/>*partial use*]
    end

    subgraph "Data Processing"
        Transform[Data Transformation]
        Sanitize[Sanitization<br/>*not implemented*]
        Encrypt[Encryption<br/>*TLS only*]
    end

    subgraph "Persistence Layer"
        SupabaseClient[Supabase Client]
        PostgreSQL[(PostgreSQL)]
        LocalStorage[Local Storage<br/>*auth tokens only*]
    end

    subgraph "Response Flow"
        APIResponse[API Response]
        StateUpdate[State Updates]
        UIUpdate[UI Re-render]
    end

    Forms --> Validation
    Validation --> LocalState
    Validation --> ErrorHandling

    LocalState --> Transform
    Transform --> Sanitize
    Sanitize --> Encrypt

    Encrypt --> SupabaseClient
    SupabaseClient --> PostgreSQL

    AuthState --> LocalStorage

    PostgreSQL --> APIResponse
    APIResponse --> StateUpdate
    StateUpdate --> ReduxState
    StateUpdate --> AuthState
    StateUpdate --> UIUpdate

    style Sanitize stroke:#ff0000,stroke-width:2px
    style ReduxState stroke:#ffaa00,stroke-width:2px
```

## Dashboard Data Flow

```mermaid
sequenceDiagram
    participant User
    participant Dashboard
    participant AuthContext
    participant Redux
    participant Supabase
    participant Database

    User->>Dashboard: Navigate to Dashboard
    Dashboard->>AuthContext: Check Authentication
    AuthContext-->>Dashboard: User Object

    Dashboard->>Dashboard: Initialize Components

    par Load User Data
        Dashboard->>Supabase: Fetch User Profile
        Supabase->>Database: Query user_profiles
        Database-->>Supabase: Profile Data
        Supabase-->>Dashboard: User Profile
    and Load Stats
        Dashboard->>Supabase: Fetch User Stats
        Supabase->>Database: Query user_stats
        Database-->>Supabase: Stats Data
        Supabase-->>Dashboard: Statistics
    and Load Activities
        Dashboard->>Supabase: Fetch Recent Activities
        Supabase->>Database: Query activities
        Database-->>Supabase: Activity List
        Supabase-->>Dashboard: Activities
    end

    Dashboard->>Redux: Update State
    Redux-->>Dashboard: State Updated
    Dashboard->>User: Render Dashboard

    loop Real-time Updates
        Database->>Supabase: Data Change
        Supabase->>Dashboard: WebSocket Update<br/>*not implemented*
        Dashboard->>Redux: Update State
        Dashboard->>User: Re-render Component
    end
```

## Form Submission Flow

```mermaid
flowchart TD
    subgraph "Form Input"
        UserInput[User Input]
        FormState[React Hook Form State]
        FieldValidation[Field-level Validation]
    end

    subgraph "Validation Layer"
        ZodSchema[Zod Schema Validation]
        CustomValidation[Custom Rules<br/>*if needed*]
        ValidationResult{Valid?}
    end

    subgraph "Submission Process"
        PrepareData[Prepare Payload]
        APICall[Supabase API Call]
        HandleResponse{Success?}
    end

    subgraph "Response Handling"
        SuccessPath[Update UI State]
        SuccessNotify[Show Success Message]
        Navigate[Navigate/Refresh]

        ErrorPath[Handle Error]
        ErrorNotify[Show Error Message]
        RetryOption[Retry Option]
    end

    UserInput --> FormState
    FormState --> FieldValidation
    FieldValidation --> ZodSchema
    ZodSchema --> CustomValidation
    CustomValidation --> ValidationResult

    ValidationResult -->|Yes| PrepareData
    ValidationResult -->|No| ErrorNotify

    PrepareData --> APICall
    APICall --> HandleResponse

    HandleResponse -->|Success| SuccessPath
    SuccessPath --> SuccessNotify
    SuccessNotify --> Navigate

    HandleResponse -->|Error| ErrorPath
    ErrorPath --> ErrorNotify
    ErrorNotify --> RetryOption
    RetryOption --> PrepareData
```

## State Management Flow

```mermaid
flowchart TB
    subgraph "State Sources"
        ServerState[Server State<br/>Supabase]
        LocalState[Local State<br/>useState]
        GlobalState[Global State<br/>Redux/Context]
    end

    subgraph "State Types"
        AuthState[Authentication State<br/>*Context*]
        UIState[UI State<br/>*Local*]
        UserData[User Data<br/>*Redux*]
        AppConfig[App Config<br/>*Local*]
    end

    subgraph "State Updates"
        Action[User Action]
        Dispatch[Redux Dispatch]
        SetState[setState Hook]
        ContextUpdate[Context Update]
    end

    subgraph "State Consumers"
        Components[React Components]
        Routes[Protected Routes]
        Forms[Form Components]
        Modals[Modal Windows]
    end

    ServerState --> AuthState
    ServerState --> UserData

    LocalState --> UIState
    LocalState --> AppConfig

    GlobalState --> AuthState
    GlobalState --> UserData

    Action --> Dispatch
    Action --> SetState
    Action --> ContextUpdate

    Dispatch --> UserData
    SetState --> UIState
    ContextUpdate --> AuthState

    AuthState --> Routes
    UIState --> Components
    UserData --> Forms
    UserData --> Modals
```

## Error Handling Flow

```mermaid
flowchart LR
    subgraph "Error Sources"
        NetworkError[Network Errors]
        AuthError[Auth Errors]
        ValidationError[Validation Errors]
        RuntimeError[Runtime Errors]
    end

    subgraph "Error Capture"
        TryCatch[Try-Catch Blocks]
        ErrorBoundary[Error Boundary<br/>*limited*]
        PromiseReject[Promise Rejection]
    end

    subgraph "Error Processing"
        LogError[Console Log<br/>*only method*]
        ParseError[Parse Error Type]
        MapMessage[Map to User Message]
    end

    subgraph "User Feedback"
        Toast[Toast Notification<br/>*not implemented*]
        InlineError[Inline Error Message]
        ModalError[Error Modal<br/>*not implemented*]
        FallbackUI[Fallback UI<br/>*limited*]
    end

    subgraph "Recovery"
        Retry[Retry Action]
        Redirect[Redirect]
        Refresh[Page Refresh]
    end

    NetworkError --> TryCatch
    AuthError --> TryCatch
    ValidationError --> TryCatch
    RuntimeError --> ErrorBoundary

    TryCatch --> LogError
    ErrorBoundary --> LogError
    PromiseReject --> LogError

    LogError --> ParseError
    ParseError --> MapMessage

    MapMessage --> InlineError
    MapMessage --> FallbackUI

    InlineError --> Retry
    FallbackUI --> Redirect

    style Toast stroke:#ff0000,stroke-width:2px
    style ModalError stroke:#ff0000,stroke-width:2px
    style ErrorBoundary stroke:#ffaa00,stroke-width:2px
```

## Data Persistence Flow

```mermaid
flowchart TD
    subgraph "Data Sources"
        UserInput[User Input]
        APIResponse[API Response]
        CachedData[Cached Data<br/>*not implemented*]
    end

    subgraph "Storage Layers"
        Memory[In-Memory<br/>React State]
        LocalStore[LocalStorage<br/>Auth Tokens Only]
        SessionStore[SessionStorage<br/>*not used*]
        Database[(PostgreSQL<br/>via Supabase)]
    end

    subgraph "Data Lifecycle"
        Create[Create]
        Read[Read]
        Update[Update]
        Delete[Delete]
    end

    subgraph "Sync Strategy"
        Immediate[Immediate Sync]
        Debounced[Debounced Sync<br/>*not implemented*]
        Batch[Batch Updates<br/>*not implemented*]
    end

    UserInput --> Memory
    APIResponse --> Memory

    Memory --> LocalStore
    Memory --> Database

    Create --> Immediate
    Read --> Database
    Update --> Immediate
    Delete --> Immediate

    Immediate --> Database

    Database --> APIResponse
    LocalStore --> Memory

    style CachedData stroke:#ff0000,stroke-width:2px
    style SessionStore stroke:#ff0000,stroke-width:2px
    style Debounced stroke:#ff0000,stroke-width:2px
    style Batch stroke:#ff0000,stroke-width:2px
```

## Real-time Data Flow (Planned)

```mermaid
flowchart LR
    subgraph "Event Sources"
        UserAction[User Actions]
        SystemEvent[System Events]
        ExternalTrigger[External Triggers]
    end

    subgraph "Real-time Pipeline"
        WebSocket[WebSocket Connection<br/>*not implemented*]
        SupabaseRealtime[Supabase Realtime<br/>*not configured*]
        EventStream[Event Stream]
    end

    subgraph "Event Processing"
        Filter[Event Filtering]
        Transform[Event Transform]
        Aggregate[Aggregation<br/>*if needed*]
    end

    subgraph "State Updates"
        OptimisticUpdate[Optimistic Update]
        PessimisticUpdate[Pessimistic Update]
        Reconciliation[State Reconciliation]
    end

    subgraph "UI Updates"
        ComponentRerender[Component Re-render]
        Notification[User Notification]
        Animation[UI Animation]
    end

    UserAction --> WebSocket
    SystemEvent --> WebSocket
    ExternalTrigger --> SupabaseRealtime

    WebSocket --> EventStream
    SupabaseRealtime --> EventStream

    EventStream --> Filter
    Filter --> Transform
    Transform --> Aggregate

    Aggregate --> OptimisticUpdate
    Aggregate --> PessimisticUpdate

    OptimisticUpdate --> Reconciliation
    PessimisticUpdate --> Reconciliation

    Reconciliation --> ComponentRerender
    Reconciliation --> Notification
    ComponentRerender --> Animation

    style WebSocket stroke:#ff0000,stroke-width:2px
    style SupabaseRealtime stroke:#ff0000,stroke-width:2px
```

---

## Data Flow Summary

### Current Implementation

- ✅ Basic authentication flow with Supabase
- ✅ Form validation with React Hook Form and Zod
- ✅ State management with Context API and partial Redux
- ⚠️ Limited error handling and recovery
- ❌ No caching strategy
- ❌ No real-time updates
- ❌ No optimistic updates
- ❌ No batch processing

### Critical Gaps

1. **No Data Caching**: Every request hits the database
2. **No Real-time Updates**: Users must refresh for new data
3. **Limited Error Recovery**: Basic error display only
4. **No Offline Support**: Requires constant connection
5. **No Data Synchronization**: No conflict resolution

### Recommendations

1. Implement React Query for server state management
2. Add WebSocket support for real-time features
3. Create comprehensive error handling strategy
4. Add data caching layer (Redis or in-memory)
5. Implement optimistic updates for better UX
