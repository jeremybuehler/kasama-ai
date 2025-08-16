# Kasama.ai Component Hierarchy

## Application Component Tree

```mermaid
graph TD
    App[App.jsx]

    subgraph "Routing Layer"
        BrowserRouter[BrowserRouter]
        Routes[Routes]
        Navigate[Navigate]
    end

    subgraph "Context Providers"
        AuthProvider[AuthProvider]
        ErrorBoundary[ErrorBoundary]
    end

    subgraph "Layout Components"
        Navigation[Navigation Bar]
        BottomTabNav[BottomTabNavigation]
    end

    subgraph "Authentication Pages"
        LoginPage[LoginPage]
        SignupPage[SignupPage]
        ResetPasswordPage[ResetPasswordPage]

        LoginForm[Login Component]
        SignupForm[Signup Component]
        PasswordResetForm[PasswordReset Component]
        SocialAuth[SocialAuth Component]
        UpdatePassword[UpdatePassword Component]
    end

    subgraph "Protected Pages"
        ProtectedRoute[ProtectedRoute Wrapper]

        DashboardHome[DashboardHome]
        ProfileSettings[ProfileSettings]
        LearnPractices[LearnPractices]
        ProgressTracking[ProgressTracking]
        RelationshipAssessment[RelationshipAssessment]
        WelcomeOnboarding[WelcomeOnboarding]
    end

    subgraph "Dashboard Components"
        WelcomeHeader[WelcomeHeader]
        DailyInsightCard[DailyInsightCard]
        StatsGrid[StatsGrid]
        DevelopmentJourney[DevelopmentJourney]
        QuickActions[QuickActions]
        RecentActivity[RecentActivity]
    end

    subgraph "UI Components"
        Button[Button]
        Input[Input]
        Select[Select]
        Checkbox[Checkbox]
        ProgressBar[ProgressBar]
        ProfileModal[ProfileModal]
        AssessmentFlow[AssessmentFlow]
    end

    subgraph "Utility Components"
        ScrollToTop[ScrollToTop]
        AppIcon[AppIcon]
        AppImage[AppImage]
    end

    App --> BrowserRouter
    BrowserRouter --> AuthProvider
    AuthProvider --> ErrorBoundary
    ErrorBoundary --> Navigation
    ErrorBoundary --> Routes
    ErrorBoundary --> BottomTabNav

    Routes --> LoginPage
    Routes --> SignupPage
    Routes --> ResetPasswordPage
    Routes --> ProtectedRoute

    LoginPage --> LoginForm
    SignupPage --> SignupForm
    ResetPasswordPage --> PasswordResetForm

    LoginForm --> SocialAuth
    SignupForm --> SocialAuth

    ProtectedRoute --> DashboardHome
    ProtectedRoute --> ProfileSettings
    ProtectedRoute --> LearnPractices
    ProtectedRoute --> ProgressTracking
    ProtectedRoute --> RelationshipAssessment
    ProtectedRoute --> WelcomeOnboarding

    DashboardHome --> WelcomeHeader
    DashboardHome --> DailyInsightCard
    DashboardHome --> StatsGrid
    DashboardHome --> DevelopmentJourney
    DashboardHome --> QuickActions
    DashboardHome --> RecentActivity
    DashboardHome --> ProfileModal

    WelcomeHeader --> Button
    DailyInsightCard --> Button
    StatsGrid --> ProgressBar
    QuickActions --> Button
    ProfileModal --> Input
    ProfileModal --> Button
```

## Component Responsibility Matrix

```mermaid
graph LR
    subgraph "Container Components"
        Pages[Page Components<br/>- Routing logic<br/>- Data fetching<br/>- State management]
        Layouts[Layout Components<br/>- Page structure<br/>- Navigation<br/>- Common UI]
    end

    subgraph "Feature Components"
        Auth[Auth Components<br/>- Login/Signup forms<br/>- Session management<br/>- Protected routes]
        Dashboard[Dashboard Components<br/>- User stats<br/>- Activity feeds<br/>- Quick actions]
        Learning[Learning Components<br/>- Practices<br/>- Progress tracking<br/>- Assessments]
    end

    subgraph "Presentational Components"
        UI[UI Components<br/>- Buttons, Inputs<br/>- Modals, Cards<br/>- No business logic]
        Display[Display Components<br/>- Data visualization<br/>- Lists, Grids<br/>- Read-only views]
    end

    subgraph "Utility Components"
        Helpers[Helper Components<br/>- Error boundaries<br/>- Loading states<br/>- Scroll handlers]
        HOCs[Higher Order Components<br/>- Protected routes<br/>- Auth wrappers<br/>- Context providers]
    end

    Pages --> Auth
    Pages --> Dashboard
    Pages --> Learning

    Auth --> UI
    Dashboard --> UI
    Dashboard --> Display
    Learning --> UI
    Learning --> Display

    Layouts --> UI
    Layouts --> Helpers

    HOCs --> Pages
    HOCs --> Auth
```

## State Management by Component

```mermaid
flowchart TB
    subgraph "Global State (Context/Redux)"
        AuthContext[AuthContext<br/>- user<br/>- loading<br/>- auth methods]
        ReduxStore[Redux Store<br/>- app config<br/>- user preferences<br/>*partial use*]
    end

    subgraph "Page-Level State"
        DashboardState[Dashboard State<br/>- refreshing<br/>- modal visibility<br/>- active tab]
        ProfileState[Profile State<br/>- edit mode<br/>- form data<br/>- validation]
    end

    subgraph "Component-Level State"
        FormState[Form State<br/>- field values<br/>- errors<br/>- touched fields]
        UIState[UI State<br/>- hover states<br/>- open/closed<br/>- animations]
    end

    subgraph "Derived State"
        Computed[Computed Values<br/>- filtered lists<br/>- sorted data<br/>- calculations]
        Memoized[Memoized Data<br/>- expensive calcs<br/>- transformed data]
    end

    AuthContext --> DashboardState
    AuthContext --> ProfileState
    ReduxStore --> DashboardState

    DashboardState --> FormState
    ProfileState --> FormState

    FormState --> UIState
    UIState --> Computed
    Computed --> Memoized
```

## Component Communication Flow

```mermaid
graph TB
    subgraph "Parent-Child Communication"
        Parent[Parent Component]
        Child1[Child Component 1]
        Child2[Child Component 2]

        Parent -->|Props| Child1
        Parent -->|Props| Child2
        Child1 -->|Callbacks| Parent
        Child2 -->|Events| Parent
    end

    subgraph "Sibling Communication"
        ParentMediator[Parent as Mediator]
        Sibling1[Sibling 1]
        Sibling2[Sibling 2]

        Sibling1 -->|Lift State Up| ParentMediator
        ParentMediator -->|Pass Down| Sibling2
    end

    subgraph "Cross-Tree Communication"
        ContextProvider[Context Provider]
        ConsumerA[Consumer A]
        ConsumerB[Consumer B]
        ConsumerC[Consumer C]

        ContextProvider -->|Broadcast| ConsumerA
        ContextProvider -->|Broadcast| ConsumerB
        ContextProvider -->|Broadcast| ConsumerC
    end

    subgraph "Global Communication"
        ReduxDispatch[Redux Dispatch]
        ComponentX[Component X]
        ComponentY[Component Y]
        ComponentZ[Component Z]

        ComponentX -->|Action| ReduxDispatch
        ReduxDispatch -->|Update| ComponentY
        ReduxDispatch -->|Update| ComponentZ
    end
```

## Component Lifecycle Patterns

```mermaid
sequenceDiagram
    participant User
    participant Router
    participant Page
    participant Component
    participant API
    participant State

    User->>Router: Navigate to route
    Router->>Page: Mount page component
    Page->>Page: useEffect - Initial setup
    Page->>API: Fetch initial data
    API-->>Page: Return data
    Page->>State: Update state
    State-->>Component: Trigger re-render
    Component->>Component: Render with data

    User->>Component: Interact
    Component->>Component: Handle event
    Component->>State: Update local state
    State-->>Component: Re-render

    Component->>API: Submit data
    API-->>Component: Response
    Component->>State: Update global state
    State-->>Page: Propagate changes

    User->>Router: Navigate away
    Page->>Page: Cleanup effects
    Router->>Page: Unmount component
```

## Component Dependencies

```mermaid
graph LR
    subgraph "Core Dependencies"
        React[React 18.2.0]
        ReactDOM[React DOM]
        ReactRouter[React Router 6.0.2]
    end

    subgraph "State Libraries"
        Redux[Redux Toolkit]
        ReactQuery[React Query<br/>*installed, unused*]
        Zustand[Zustand<br/>*installed, unused*]
    end

    subgraph "Form Libraries"
        ReactHookForm[React Hook Form]
        Zod[Zod Validation]
    end

    subgraph "UI Libraries"
        FramerMotion[Framer Motion]
        LucideReact[Lucide Icons]
        RadixUI[Radix UI]
        TailwindCSS[TailwindCSS]
    end

    subgraph "Data Visualization"
        Recharts[Recharts]
        D3[D3.js<br/>*installed*]
    end

    React --> ReactRouter
    React --> Redux
    React --> ReactHookForm
    ReactHookForm --> Zod
    React --> FramerMotion
    React --> LucideReact
    React --> RadixUI
    React --> Recharts

    style ReactQuery fill:#ffcccc
    style Zustand fill:#ffcccc
    style D3 fill:#ffcccc
```

## Component Testing Strategy (Recommended)

```mermaid
graph TD
    subgraph "Unit Tests"
        ComponentLogic[Component Logic<br/>- Pure functions<br/>- Hooks<br/>- Utilities]
        ComponentRender[Component Rendering<br/>- Props validation<br/>- Conditional rendering<br/>- Event handlers]
    end

    subgraph "Integration Tests"
        PageTests[Page Tests<br/>- Route navigation<br/>- Data fetching<br/>- State updates]
        FormTests[Form Tests<br/>- Validation<br/>- Submission<br/>- Error handling]
    end

    subgraph "E2E Tests"
        UserFlows[User Flows<br/>- Login/Signup<br/>- Dashboard interaction<br/>- Profile updates]
        CriticalPaths[Critical Paths<br/>- Payment flows<br/>- Data persistence<br/>- Security features]
    end

    subgraph "Visual Tests"
        SnapshotTests[Snapshot Tests<br/>- Component appearance<br/>- Responsive layouts<br/>- Theme variations]
        RegressionTests[Visual Regression<br/>- UI consistency<br/>- Cross-browser<br/>- Mobile views]
    end

    ComponentLogic --> ComponentRender
    ComponentRender --> PageTests
    PageTests --> FormTests
    FormTests --> UserFlows
    UserFlows --> CriticalPaths
    ComponentRender --> SnapshotTests
    SnapshotTests --> RegressionTests

    style ComponentLogic fill:#ffcccc
    style ComponentRender fill:#ffcccc
    style PageTests fill:#ffcccc
    style FormTests fill:#ffcccc
    style UserFlows fill:#ffcccc
    style CriticalPaths fill:#ffcccc
    style SnapshotTests fill:#ffcccc
    style RegressionTests fill:#ffcccc
```

---

## Component Analysis Summary

### Strengths

- ✅ Clear separation of concerns (auth, dashboard, learning)
- ✅ Reusable UI component library
- ✅ Protected route implementation
- ✅ Form validation with React Hook Form + Zod

### Weaknesses

- ❌ No component documentation
- ❌ No component testing
- ❌ Inconsistent state management (Context + Redux + local)
- ❌ No performance optimization (memo, lazy loading)
- ⚠️ Limited error boundaries

### Recommendations

1. **Implement Component Documentation** - Use Storybook or similar
2. **Add Component Tests** - Start with critical auth and form components
3. **Standardize State Management** - Choose Redux OR Context, not both
4. **Optimize Performance** - Add React.memo, useMemo, lazy loading
5. **Improve Error Handling** - Add error boundaries at route level

### Component Metrics

- **Total Components:** ~40
- **Container Components:** 8 pages
- **Presentational Components:** ~25
- **Utility Components:** ~7
- **Average Component Size:** ~150 lines
- **Component Test Coverage:** 0%
