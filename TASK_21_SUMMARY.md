# React Developer Interview Preparation Guide
## Collance Technology Pvt Ltd. | Noida Sector 62

**Position:** React JS Developer  
**Experience Level:** 3 Years  
**Interview Date:** Monday, February 3, 2026  
**Company:** Collance Technologies (Healthcare IT Solutions)

---

## TABLE OF CONTENTS

1. [Quick Overview & Strategy](#quick-overview--strategy)
2. [Week-Wise Study Plan](#week-wise-study-plan)
3. [Core Concepts - Detailed Breakdown](#core-concepts---detailed-breakdown)
4. [Redux & State Management Mastery](#redux--state-management-mastery)
5. [Performance Optimization Techniques](#performance-optimization-techniques)
6. [REST API Integration Best Practices](#rest-api-integration-best-practices)
7. [Advanced React Patterns](#advanced-react-patterns)
8. [Build Tools & Development Workflow](#build-tools--development-workflow)
9. [Real Interview Questions & Answers](#real-interview-questions--answers)
10. [Code Examples & Implementation](#code-examples--implementation)
11. [Last-Minute Checklist](#last-minute-checklist)

---

## QUICK OVERVIEW & STRATEGY

### What They're Looking For (3 Year Experience Level)

As a mid-level React developer (3 years), interviewers expect:

✅ **Deep Understanding** of React fundamentals (not just basics)  
✅ **Practical Experience** with Redux and state management  
✅ **Performance Optimization** awareness and implementation  
✅ **API Integration** expertise using modern patterns  
✅ **Code Quality** focus - clean, maintainable, scalable code  
✅ **Problem-Solving** abilities with real-world scenarios  
✅ **System Design** thinking for building applications  

### Your Preparation Strategy

**Days 1-2 (Friday-Saturday):** Fundamentals + Hooks Deep Dive  
**Days 3-4 (Sunday-Monday Morning):** Redux + State Management  
**Day 4 (Monday Morning before interview):** Performance + API Integration  
**Last 2 Hours:** Mock Questions + Confidence Building

---

## WEEK-WISE STUDY PLAN

### Timeline: January 30 - February 3 (3 Days)

#### **Day 1: Friday, January 30 - React Fundamentals & Hooks (4-5 hours)**

**Morning Session (2 hours):**
- [ ] Review React Component Lifecycle (Class vs Functional)
- [ ] Deep dive into React Hooks: useState, useEffect
- [ ] useCallback, useMemo, useRef advanced concepts
- [ ] Custom Hooks creation and patterns

**Afternoon Session (2-3 hours):**
- [ ] Context API vs Redux comparison
- [ ] Prop Drilling problem and solutions
- [ ] Error Boundaries implementation
- [ ] Code Practice: Build a custom hook

**Evening (1 hour):**
- [ ] Watch one advanced React concept video
- [ ] Take notes on weak areas

#### **Day 2: Saturday, January 31 - Redux Mastery & State Management (5-6 hours)**

**Morning Session (3 hours):**
- [ ] Redux fundamentals: Store, Actions, Reducers
- [ ] Redux Thunk for async operations
- [ ] Middleware concept and implementation
- [ ] Redux best practices and anti-patterns

**Afternoon Session (2-3 hours):**
- [ ] Redux DevTools usage
- [ ] Normalize Redux state shape
- [ ] Selectors and Reselect library
- [ ] Code Practice: Build Redux store with async actions

**Evening (1 hour):**
- [ ] Review Redux patterns
- [ ] Create personal cheat sheet

#### **Day 3: Sunday, February 1 - Performance & API Integration (4-5 hours)**

**Morning Session (2-3 hours):**
- [ ] React.memo, lazy loading, Suspense
- [ ] Code Splitting and Dynamic Imports
- [ ] Bundle Size optimization
- [ ] Performance Monitoring tools

**Afternoon Session (2-3 hours):**
- [ ] REST API integration patterns
- [ ] Fetch API vs Axios
- [ ] Error handling and loading states
- [ ] Request/Response interceptors
- [ ] Code Practice: Build API service layer

**Evening (1 hour):**
- [ ] Quick revision of weak areas
- [ ] Solve 2-3 coding problems

#### **Day 4: Monday, February 3 - Final Prep & Interview Day**

**Morning (2 hours before interview):**
- [ ] Mock interview questions (30 mins)
- [ ] Review problem areas (30 mins)
- [ ] Confidence building & deep breathing (30 mins)
- [ ] Review key concepts one final time (30 mins)

---

## CORE CONCEPTS - DETAILED BREAKDOWN

### 1. REACT FUNDAMENTALS (MUST KNOW)

#### 1.1 JSX Basics

**What is JSX?**
- JSX is syntactic sugar for `React.createElement()`
- Allows you to write HTML-like code in JavaScript
- Transpiled to JavaScript function calls

```javascript
// JSX
const element = <h1>Hello, {name}!</h1>;

// Transpiles to:
const element = React.createElement('h1', null, `Hello, ${name}!`);
```

**Key Points:**
- JSX is closer to HTML but has JavaScript semantics
- Expressions must be wrapped in curly braces `{}`
- Always returns a single root element (or use Fragment `<>`)
- Class names are written as `className`
- Attributes use camelCase (onClick, onChange, etc.)

#### 1.2 Components: Class vs Functional

**Functional Components (Preferred):**
```javascript
function Welcome(props) {
  return <h1>Hello, {props.name}</h1>;
}
```

**Class Components:**
```javascript
class Welcome extends React.Component {
  render() {
    return <h1>Hello, {this.props.name}</h1>;
  }
}
```

**For 3-Year Experience:** You should know both but prefer functional components with Hooks. Understand lifecycle methods even if not using them.

#### 1.3 Props vs State

**Props:**
- Read-only data passed from parent to child
- Immutable
- Used for configuring components

```javascript
function Child({ name, age }) {
  return <div>{name} is {age} years old</div>;
}
```

**State:**
- Data that can change over time
- Mutable via setState (class) or setState function (hooks)
- Triggers re-render when changed

```javascript
const [count, setCount] = useState(0);

const increment = () => setCount(count + 1);
```

#### 1.4 React Hooks Deep Dive

**useState Hook:**
```javascript
const [state, setState] = useState(initialValue);

// With object state
const [form, setForm] = useState({ name: '', email: '' });
const handleChange = (e) => {
  setForm({ ...form, [e.target.name]: e.target.value });
};
```

**useEffect Hook:**
```javascript
// Run after every render
useEffect(() => {
  console.log('Rendered');
});

// Run once on mount
useEffect(() => {
  fetchData();
}, []);

// Run when dependencies change
useEffect(() => {
  const subscription = subscribe();
  return () => subscription.unsubscribe(); // Cleanup
}, [dependency]);
```

**useCallback Hook:**
```javascript
// Memoize callback function
const memoizedCallback = useCallback(() => {
  doSomething(a, b);
}, [a, b]);

// Without useCallback, new function created on every render
// Prevents unnecessary re-renders of child components
```

**useMemo Hook:**
```javascript
// Memoize expensive computation
const memoizedValue = useMemo(() => {
  return computeExpensiveValue(a, b);
}, [a, b]);
```

**useRef Hook:**
```javascript
const inputRef = useRef(null);

// Access DOM directly (use sparingly)
const focusInput = () => inputRef.current.focus();

// Mutable value that doesn't cause re-render
const intervalRef = useRef(null);
```

**Custom Hooks:**
```javascript
function useFetch(url) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(url)
      .then(res => res.json())
      .then(data => { setData(data); setLoading(false); })
      .catch(err => { setError(err); setLoading(false); });
  }, [url]);

  return { data, loading, error };
}

// Usage
const { data, loading, error } = useFetch('/api/users');
```

#### 1.5 Event Handling

```javascript
function Form() {
  const [input, setInput] = useState('');

  // Event object automatically passed
  const handleChange = (e) => {
    setInput(e.target.value);
  };

  // Prevent default behavior
  const handleSubmit = (e) => {
    e.preventDefault();
    console.log(input);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input value={input} onChange={handleChange} />
      <button type="submit">Submit</button>
    </form>
  );
}
```

#### 1.6 Conditional Rendering

```javascript
// Using if/else
function Greeting({ isLoggedIn }) {
  if (isLoggedIn) {
    return <Dashboard />;
  }
  return <LoginForm />;
}

// Using ternary operator
return isLoggedIn ? <Dashboard /> : <LoginForm />;

// Using && operator (render if true)
return isLoggedIn && <Dashboard />;

// Using switch
const role = user?.role;
return (
  <>
    {(() => {
      switch (role) {
        case 'admin': return <AdminPanel />;
        case 'user': return <UserDashboard />;
        default: return <GuestView />;
      }
    })()}
  </>
);
```

#### 1.7 Lists and Keys

```javascript
function UserList({ users }) {
  return (
    <ul>
      {users.map(user => (
        <li key={user.id}>
          {user.name}
        </li>
      ))}
    </ul>
  );
}

// ⚠️ AVOID: Using index as key (causes bugs with reordering/filtering)
// ✅ GOOD: Use unique identifier (user.id)
```

**Why Keys Matter:**
- Help React identify which items have changed
- Enable proper state preservation
- Without proper keys, list items lose their state

---

### 2. CONTEXT API (Must Understand)

**Problem:** Prop drilling (passing props through many levels)

**Solution:** Context API

```javascript
// Create Context
const ThemeContext = React.createContext();

// Provider Component
function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('light');

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// Consumer Component
function ThemedButton() {
  const { theme, setTheme } = useContext(ThemeContext);
  
  return (
    <button style={{ background: theme === 'light' ? '#fff' : '#000' }}>
      Current Theme: {theme}
    </button>
  );
}

// Usage
<ThemeProvider>
  <App />
</ThemeProvider>
```

**When to Use Context:**
- Theme switching (light/dark mode)
- Language/Localization
- User authentication state
- App-level settings

**When NOT to Use Context:**
- Frequently changing data (causes unnecessary re-renders)
- Complex state logic (use Redux instead)

---

## REDUX & STATE MANAGEMENT MASTERY

### 3. REDUX FUNDAMENTALS

**Redux is for managing application state with predictable patterns.**

#### 3.1 Core Concepts

**Store:**
```javascript
import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';

const store = createStore(rootReducer, applyMiddleware(thunk));
```

**Actions:**
```javascript
// Action Creator
const addTodo = (text) => ({
  type: 'ADD_TODO',
  payload: { text }
});

// Action Type Constants (best practice)
export const ADD_TODO = 'ADD_TODO';
export const REMOVE_TODO = 'REMOVE_TODO';

const addTodo = (text) => ({
  type: ADD_TODO,
  payload: text
});
```

**Reducers:**
```javascript
const initialState = {
  todos: [],
  loading: false,
  error: null
};

function todoReducer(state = initialState, action) {
  switch(action.type) {
    case ADD_TODO:
      return {
        ...state,
        todos: [...state.todos, { id: Date.now(), text: action.payload }]
      };
    case REMOVE_TODO:
      return {
        ...state,
        todos: state.todos.filter(todo => todo.id !== action.payload)
      };
    default:
      return state;
  }
}
```

**Combining Reducers:**
```javascript
import { combineReducers } from 'redux';

const rootReducer = combineReducers({
  todos: todoReducer,
  auth: authReducer,
  ui: uiReducer
});
```

#### 3.2 Redux Thunk (Async Actions)

**Problem:** Reducers must be pure functions, can't handle async operations

**Solution:** Redux Thunk Middleware

```javascript
// Thunk Action Creator
const fetchUsers = () => async (dispatch) => {
  dispatch({ type: FETCH_USERS_START });
  
  try {
    const response = await fetch('/api/users');
    const data = await response.json();
    dispatch({ 
      type: FETCH_USERS_SUCCESS, 
      payload: data 
    });
  } catch (error) {
    dispatch({ 
      type: FETCH_USERS_ERROR, 
      payload: error.message 
    });
  }
};

// Usage in component
dispatch(fetchUsers());
```

**Conditional Dispatch (Prevent Over-fetching):**
```javascript
const fetchUsersIfNeeded = () => (dispatch, getState) => {
  const { users } = getState();
  
  // Only fetch if not already fetching
  if (users.loading || users.data.length > 0) {
    return;
  }
  
  dispatch(fetchUsers());
};
```

#### 3.3 State Shape Normalization

**❌ Bad Structure (Nested):**
```javascript
{
  posts: [
    {
      id: 1,
      title: 'Post 1',
      author: {
        id: 1,
        name: 'John',
        email: 'john@example.com'
      }
    }
  ]
}
```

**✅ Good Structure (Normalized):**
```javascript
{
  entities: {
    posts: {
      '1': { id: 1, title: 'Post 1', authorId: 1 }
    },
    authors: {
      '1': { id: 1, name: 'John', email: 'john@example.com' }
    }
  },
  result: [1] // IDs of posts
}
```

**Benefits:**
- Easier to update data
- Prevents duplication
- Better performance
- Scales better with large datasets

#### 3.4 Selectors and Reselect

```javascript
import { createSelector } from 'reselect';

// Basic selectors
const selectTodos = (state) => state.todos.items;
const selectFilter = (state) => state.todos.filter;

// Memoized selector (only recomputes if inputs change)
const selectFilteredTodos = createSelector(
  [selectTodos, selectFilter],
  (todos, filter) => {
    return todos.filter(todo => todo.status === filter);
  }
);

// Prevents unnecessary re-renders
const mapStateToProps = (state) => ({
  todos: selectFilteredTodos(state)
});
```

#### 3.5 Redux Middleware

```javascript
// Custom Logger Middleware
const loggerMiddleware = (store) => (next) => (action) => {
  console.log('Dispatching:', action);
  const result = next(action);
  console.log('Next State:', store.getState());
  return result;
};

// Apply to store
const store = createStore(
  rootReducer,
  applyMiddleware(loggerMiddleware, thunk)
);
```

#### 3.6 Redux Best Practices for 3-Year Level

```javascript
// ✅ DO: Keep reducers pure
const reducer = (state = initialState, action) => {
  switch(action.type) {
    case ADD_ITEM:
      return {
        ...state,
        items: [...state.items, action.payload]
      };
    default:
      return state;
  }
};

// ❌ DON'T: Mutate state directly
const reducer = (state = initialState, action) => {
  if (action.type === ADD_ITEM) {
    state.items.push(action.payload); // WRONG!
    return state;
  }
  return state;
};

// ✅ DO: Use action types as constants
export const ADD_USER = 'users/ADD_USER';

// ❌ DON'T: Use string literals everywhere
dispatch({ type: 'ADD_USER', payload: user });

// ✅ DO: Organize code by features
// src/
//   features/
//     users/
//       userSlice.js
//       userActions.js
//       userReducers.js
//       userSelectors.js
```

---

## PERFORMANCE OPTIMIZATION TECHNIQUES

### 4. React Performance Optimization

#### 4.1 React.memo (Prevent Unnecessary Re-renders)

```javascript
// Without memo: re-renders when parent renders
function Button({ label, onClick }) {
  console.log('Button rendered');
  return <button onClick={onClick}>{label}</button>;
}

// With memo: only re-renders if props change
const MemoButton = React.memo(Button);

// Usage
<MemoButton label="Click me" onClick={handleClick} />
```

**Custom Comparison:**
```javascript
const MemoButton = React.memo(
  Button,
  (prevProps, nextProps) => {
    // Return true if props are equal (skip re-render)
    return prevProps.label === nextProps.label;
  }
);
```

#### 4.2 Code Splitting and Lazy Loading

```javascript
// Lazy load component
const HeavyComponent = React.lazy(() => import('./HeavyComponent'));

// Use with Suspense
function App() {
  return (
    <Suspense fallback={<Loading />}>
      <HeavyComponent />
    </Suspense>
  );
}

// Route-based code splitting
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Admin = React.lazy(() => import('./pages/Admin'));

function Router() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </Suspense>
  );
}
```

#### 4.3 Bundle Optimization

```javascript
// ✅ Tree Shaking: Unused code is removed
export function usedFunction() {}
export function unusedFunction() {}

// Import specific exports (enables tree shaking)
import { usedFunction } from './utils';

// ❌ Prevents tree shaking
import * as utils from './utils';

// ✅ Dynamic Import for conditional loading
const loadPolyfills = async () => {
  if (!window.Promise) {
    await import('promise-polyfill');
  }
};

// ✅ Vendor Code Splitting (webpack config)
// webpack.config.js
optimization: {
  splitChunks: {
    chunks: 'all',
    cacheGroups: {
      vendor: {
        test: /[\\/]node_modules[\\/]/,
        name: 'vendors',
        priority: 10
      }
    }
  }
}
```

#### 4.4 Optimization Checklist

- [ ] Use React.memo for components with expensive renders
- [ ] Memoize callbacks with useCallback
- [ ] Memoize computed values with useMemo
- [ ] Implement code splitting with React.lazy and Suspense
- [ ] Use Suspense for async data fetching
- [ ] Implement virtual scrolling for long lists (react-window)
- [ ] Optimize images (lazy loading, compression)
- [ ] Use CSS-in-JS carefully (can impact performance)
- [ ] Monitor bundle size with tools like webpack-bundle-analyzer
- [ ] Use React DevTools Profiler to identify bottlenecks

---

## REST API INTEGRATION BEST PRACTICES

### 5. API Integration Patterns

#### 5.1 Fetch API vs Axios

**Fetch API:**
```javascript
// GET Request
fetch('/api/users')
  .then(res => res.json())
  .then(data => console.log(data))
  .catch(err => console.error(err));

// POST Request
fetch('/api/users', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'John' })
})
  .then(res => res.json())
  .then(data => console.log(data));
```

**Axios (Recommended for 3-year level):**
```javascript
// GET Request
axios.get('/api/users')
  .then(res => console.log(res.data))
  .catch(err => console.error(err));

// POST Request with automatic JSON
axios.post('/api/users', { name: 'John' })
  .then(res => console.log(res.data));

// More features: interceptors, cancel requests, timeout
```

#### 5.2 Service Layer Architecture

```javascript
// api/client.js - Axios instance with config
import axios from 'axios';

const client = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor (add auth token)
client.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor (handle auth errors)
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Redirect to login
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default client;
```

```javascript
// services/userService.js
import client from '../api/client';

export const userService = {
  getUsers: () => client.get('/users'),
  
  getUser: (id) => client.get(`/users/${id}`),
  
  createUser: (data) => client.post('/users', data),
  
  updateUser: (id, data) => client.put(`/users/${id}`, data),
  
  deleteUser: (id) => client.delete(`/users/${id}`)
};

// services/authService.js
import client from '../api/client';

export const authService = {
  login: (email, password) => 
    client.post('/auth/login', { email, password }),
  
  logout: () => 
    client.post('/auth/logout'),
  
  refreshToken: () => 
    client.post('/auth/refresh-token')
};
```

#### 5.3 Using Services with Redux (Async Thunks)

```javascript
// features/users/userSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { userService } from '../../services/userService';

// Async thunk
export const fetchUsers = createAsyncThunk(
  'users/fetchUsers',
  async (_, { rejectWithValue }) => {
    try {
      const response = await userService.getUsers();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message);
    }
  }
);

export const createUser = createAsyncThunk(
  'users/createUser',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await userService.createUser(userData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message);
    }
  }
);

const userSlice = createSlice({
  name: 'users',
  initialState: {
    data: [],
    loading: false,
    error: null
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createUser.fulfilled, (state, action) => {
        state.data.push(action.payload);
      });
  }
});

export default userSlice.reducer;
```

#### 5.4 Error Handling in Components

```javascript
function UserList() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await userService.getUsers();
        setUsers(response.data);
      } catch (err) {
        // Handle different error types
        if (err.response?.status === 404) {
          setError('Users not found');
        } else if (err.response?.status === 401) {
          setError('Unauthorized. Please login.');
        } else {
          setError(err.message || 'Failed to fetch users');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div>Loading users...</div>;
  if (error) return <div className="error">{error}</div>;
  
  return (
    <ul>
      {users.map(user => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}
```

#### 5.5 Request Cancellation

```javascript
function SearchUsers() {
  const [query, setQuery] = useState('');
  const abortControllerRef = useRef(null);

  const handleSearch = async (searchTerm) => {
    // Cancel previous request
    abortControllerRef.current?.abort();
    
    // Create new abort controller
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch(
        `/api/users?q=${searchTerm}`,
        { signal: abortControllerRef.current.signal }
      );
      const data = await response.json();
      console.log(data);
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error(err);
      }
    }
  };

  useEffect(() => {
    return () => {
      // Cleanup: cancel request on unmount
      abortControllerRef.current?.abort();
    };
  }, []);

  return (
    <input 
      value={query}
      onChange={(e) => {
        setQuery(e.target.value);
        handleSearch(e.target.value);
      }}
      placeholder="Search users..."
    />
  );
}
```

---

## ADVANCED REACT PATTERNS

### 6. Higher-Order Components (HOCs)

```javascript
// HOC that adds authentication
function withAuth(Component) {
  return function AuthComponent(props) {
    const [isAuthed, setIsAuthed] = useState(false);

    useEffect(() => {
      const token = localStorage.getItem('token');
      setIsAuthed(!!token);
    }, []);

    if (!isAuthed) {
      return <Navigate to="/login" />;
    }

    return <Component {...props} />;
  };
}

// Usage
const ProtectedDashboard = withAuth(Dashboard);

// HOC that adds theme
function withTheme(Component) {
  return function ThemedComponent(props) {
    const [theme, setTheme] = useState('light');

    return (
      <ThemeContext.Provider value={{ theme, setTheme }}>
        <Component {...props} theme={theme} />
      </ThemeContext.Provider>
    );
  };
}

// Compose multiple HOCs
export default withAuth(withTheme(Dashboard));
```

### 7. Render Props Pattern

```javascript
// Component that accepts render prop
function MouseTracker({ render }) {
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e) => {
    setPosition({ x: e.clientX, y: e.clientY });
  };

  return (
    <div onMouseMove={handleMouseMove}>
      {render(position)}
    </div>
  );
}

// Usage
<MouseTracker render={({ x, y }) => (
  <div>Mouse is at ({x}, {y})</div>
)} />

// Or with children
function Fetcher({ url, children }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch(url).then(res => res.json()).then(setData);
  }, [url]);

  return children(data);
}

// Usage
<Fetcher url="/api/users">
  {(users) => (
    <ul>
      {users?.map(user => <li key={user.id}>{user.name}</li>)}
    </ul>
  )}
</Fetcher>
```

### 8. Compound Components

```javascript
// Parent component with shared state
function Tabs() {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <TabContext.Provider value={{ activeTab, setActiveTab }}>
      <div className="tabs">
        {children}
      </div>
    </TabContext.Provider>
  );
}

// Child components that work together
function TabList({ children }) {
  return <div className="tab-list">{children}</div>;
}

function Tab({ index, label }) {
  const { activeTab, setActiveTab } = useContext(TabContext);

  return (
    <button
      className={activeTab === index ? 'active' : ''}
      onClick={() => setActiveTab(index)}
    >
      {label}
    </button>
  );
}

function TabPanels({ children }) {
  return <div className="tab-panels">{children}</div>;
}

function TabPanel({ index, children }) {
  const { activeTab } = useContext(TabContext);

  return activeTab === index ? <div>{children}</div> : null;
}

// Usage
<Tabs>
  <TabList>
    <Tab index={0} label="Profile" />
    <Tab index={1} label="Settings" />
  </TabList>
  
  <TabPanels>
    <TabPanel index={0}>Profile Content</TabPanel>
    <TabPanel index={1}>Settings Content</TabPanel>
  </TabPanels>
</Tabs>
```

### 9. Error Boundaries

```javascript
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log to error reporting service
    console.error('Error caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-fallback">
          <h1>Something went wrong</h1>
          <p>{this.state.error?.message}</p>
          <button onClick={() => window.location.reload()}>
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Usage
<ErrorBoundary>
  <App />
</ErrorBoundary>
```

### 10. Custom Hooks Library

```javascript
// useLocalStorage
function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : initialValue;
  });

  const setValue = (value) => {
    const valueToStore = value instanceof Function ? value(storedValue) : value;
    setStoredValue(valueToStore);
    window.localStorage.setItem(key, JSON.stringify(valueToStore));
  };

  return [storedValue, setValue];
}

// useAsync
function useAsync(asyncFunction, immediate = true) {
  const [status, setStatus] = useState('idle');
  const [value, setValue] = useState(null);
  const [error, setError] = useState(null);

  const execute = useCallback(async () => {
    setStatus('pending');
    try {
      const response = await asyncFunction();
      setValue(response);
      setStatus('success');
      return response;
    } catch (error) {
      setError(error);
      setStatus('error');
    }
  }, [asyncFunction]);

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [execute, immediate]);

  return { execute, status, value, error };
}

// usePrevious
function usePrevious(value) {
  const ref = useRef();

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
}

// useDebounce
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}
```

---

## BUILD TOOLS & DEVELOPMENT WORKFLOW

### 11. Build Tools (Webpack, Babel, Parcel)

#### Webpack

```javascript
// webpack.config.js
module.exports = {
  entry: './src/index.js',
  output: {
    filename: 'bundle.js',
    path: __dirname + '/dist'
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        use: 'babel-loader'
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      }
    ]
  },
  devServer: {
    port: 3000,
    hot: true
  },
  optimization: {
    splitChunks: {
      chunks: 'all'
    }
  }
};
```

#### Babel

```javascript
// .babelrc
{
  "presets": [
    ["@babel/preset-env", { "targets": "> 0.25%" }],
    "@babel/preset-react"
  ],
  "plugins": [
    "@babel/plugin-proposal-class-properties",
    "@babel/plugin-syntax-dynamic-import"
  ]
}
```

### 12. Version Control Best Practices

```bash
# Git workflow
git checkout -b feature/user-authentication
git add .
git commit -m "feat: Add user login functionality"
git push origin feature/user-authentication

# Create Pull Request on GitHub
# Code Review → Approval → Merge to main
```

**Branching Strategy:**
- `main` - Production ready code
- `develop` - Integration branch
- `feature/*` - New features
- `fix/*` - Bug fixes
- `hotfix/*` - Production hotfixes

### 13. ESLint and Prettier

```javascript
// .eslintrc.json
{
  "extends": [
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended"
  ],
  "rules": {
    "react/prop-types": "warn",
    "no-unused-vars": "warn",
    "react-hooks/rules-of-hooks": "error"
  }
}

// .prettierrc
{
  "singleQuote": true,
  "trailingComma": "es5",
  "tabWidth": 2
}
```

---

## REAL INTERVIEW QUESTIONS & ANSWERS

### Question 1: Explain React Hooks and Why They Matter

**What they're looking for:**
- Understanding of functional components vs class components
- Knowledge of state management in functional components
- Understanding of side effects and lifecycle

**Answer:**
"React Hooks are functions that let you use state and other React features in functional components. Before hooks, you had to use class components for state management and lifecycle methods.

The main hooks are:
1. **useState** - Manages component state
2. **useEffect** - Handles side effects (API calls, subscriptions)
3. **useCallback** - Memoizes functions to prevent unnecessary re-renders
4. **useMemo** - Memoizes expensive computations
5. **useRef** - Access DOM directly or store mutable values

They matter because they:
- Make code more reusable (custom hooks)
- Reduce boilerplate compared to class components
- Simplify component logic
- Enable better code organization

Example with custom hook:
```javascript
function useFetch(url) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(url)
      .then(res => res.json())
      .then(data => setData(data))
      .catch(err => setError(err));
  }, [url]);

  return { data, error };
}
```

This hook can be reused across multiple components."

---

### Question 2: What is Redux and Why Do You Need It?

**What they're looking for:**
- When to use Redux vs Context API
- Understanding of Redux flow (Actions → Reducers → Store)
- Awareness of Redux for large applications

**Answer:**
"Redux is a state management library for predictable state container in JavaScript applications.

**Redux Flow:**
1. Component dispatches an action
2. Action is processed by reducer
3. Reducer creates new state
4. Store updates and notifies subscribed components

**Why Redux:**
- **Predictable State Management** - All state changes follow a pattern
- **Debugging** - Redux DevTools shows every action and state change
- **Scalability** - Good for large applications with complex state
- **Testing** - Easy to test pure functions (reducers)
- **Time-Travel Debugging** - Can replay actions

**Redux vs Context API:**

Use Redux for:
- Large applications
- Complex state logic
- Frequent state updates
- Need for dev tools

Use Context for:
- Theme/Language switching
- User authentication
- App-level settings
- Avoiding prop drilling

Example Redux flow:
```javascript
// Action
const addUser = (user) => ({
  type: 'ADD_USER',
  payload: user
});

// Reducer
const userReducer = (state = [], action) => {
  if (action.type === 'ADD_USER') {
    return [...state, action.payload];
  }
  return state;
};

// Store
const store = createStore(userReducer);

// Dispatch
store.dispatch(addUser({ id: 1, name: 'John' }));
```"

---

### Question 3: How Do You Optimize React Performance?

**What they're looking for:**
- Practical optimization techniques
- Understanding of re-render causes
- Knowledge of memoization

**Answer:**
"React performance optimization involves preventing unnecessary re-renders and reducing bundle size:

**Component Level:**
1. **React.memo** - Prevents re-render if props don't change
```javascript
const UserCard = React.memo(({ user }) => (
  <div>{user.name}</div>
));
```

2. **useCallback** - Memoize function to prevent child re-renders
```javascript
const handleClick = useCallback(() => {
  console.log('clicked');
}, []);
```

3. **useMemo** - Memoize expensive computations
```javascript
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(data);
}, [data]);
```

**Application Level:**
1. **Code Splitting** - Load code on demand
```javascript
const Dashboard = React.lazy(() => import('./Dashboard'));
<Suspense fallback={<Loading />}>
  <Dashboard />
</Suspense>
```

2. **Lazy Loading Images** - Load images when visible
```javascript
<img loading="lazy" src="image.jpg" />
```

3. **Virtual Scrolling** - Only render visible items
```javascript
import { FixedSizeList } from 'react-window';
```

**Bundle Optimization:**
1. **Tree Shaking** - Remove unused code
2. **Dynamic Imports** - Load modules on demand
3. **Minification** - Reduce code size
4. **Gzip Compression** - Compress for transfer

**Monitoring:**
- React DevTools Profiler to identify bottlenecks
- Lighthouse for performance audit
- webpack-bundle-analyzer for bundle size"

---

### Question 4: Explain REST API Integration in React

**What they're looking for:**
- Understanding of API patterns
- Error handling knowledge
- Service layer architecture

**Answer:**
"REST API integration in React involves making HTTP requests to backend services and managing the response data.

**Best Practice Pattern:**

1. **Create API Client (Axios instance)**
```javascript
// api/client.js
const client = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
  timeout: 10000
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

2. **Create Service Layer**
```javascript
// services/userService.js
export const userService = {
  getUsers: () => client.get('/users'),
  getUser: (id) => client.get(`/users/${id}`),
  createUser: (data) => client.post('/users', data),
  updateUser: (id, data) => client.put(`/users/${id}`, data),
  deleteUser: (id) => client.delete(`/users/${id}`)
};
```

3. **Use in Redux Thunk**
```javascript
export const fetchUsers = () => async (dispatch) => {
  dispatch({ type: FETCH_START });
  try {
    const response = await userService.getUsers();
    dispatch({ type: FETCH_SUCCESS, payload: response.data });
  } catch (error) {
    dispatch({ type: FETCH_ERROR, payload: error.message });
  }
};
```

4. **Use in Component**
```javascript
function UserList() {
  const dispatch = useDispatch();
  const { users, loading, error } = useSelector(state => state.users);

  useEffect(() => {
    dispatch(fetchUsers());
  }, [dispatch]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  
  return (
    <ul>
      {users.map(user => <li key={user.id}>{user.name}</li>)}
    </ul>
  );
}
```

**Key Points:**
- Always handle loading and error states
- Use service layer for code reuse
- Implement request/response interceptors
- Cancel previous requests when component unmounts
- Handle different HTTP status codes appropriately"

---

### Question 5: What are Controlled vs Uncontrolled Components?

**What they're looking for:**
- Form handling knowledge
- Understanding of component state
- When to use each pattern

**Answer:**
"This is about how form inputs manage their state in React.

**Controlled Components** - React state manages input value:
```javascript
function Form() {
  const [name, setName] = useState('');

  return (
    <input
      value={name}
      onChange={(e) => setName(e.target.value)}
    />
  );
}
```

Pros: Predictable, easy validation, real-time feedback
Cons: More code, more re-renders

**Uncontrolled Components** - DOM manages input value:
```javascript
function Form() {
  const inputRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log(inputRef.current.value);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input ref={inputRef} />
      <button>Submit</button>
    </form>
  );
}
```

Pros: Less code, simpler for simple forms
Cons: Harder to validate, less React-ish

**When to Use:**
- Use **Controlled** for most cases (default)
- Use **Uncontrolled** for file inputs, integrating non-React code, or when React control is unnecessary"

---

### Question 6: Explain Redux Thunk and Why It's Needed

**What they're looking for:**
- Understanding of async operations in Redux
- Knowledge of middleware
- Problem Redux Thunk solves

**Answer:**
"Redux Thunk is middleware that lets you write action creators that return a function instead of an action object.

**The Problem:**
Reducers must be pure functions - they can't make API calls. But applications need to fetch data asynchronously.

**Redux Thunk Solution:**
```javascript
// Without thunk (doesn't work - side effect in reducer)
const reducer = (state, action) => {
  if (action.type === 'FETCH_USERS') {
    fetch('/api/users') // ❌ Side effect!
      .then(res => res.json())
      .then(data => ...);
  }
};

// With thunk (works - side effect in thunk)
const fetchUsers = () => (dispatch) => {
  dispatch({ type: FETCH_START });
  
  fetch('/api/users')
    .then(res => res.json())
    .then(data => {
      dispatch({ type: FETCH_SUCCESS, payload: data });
    })
    .catch(err => {
      dispatch({ type: FETCH_ERROR, payload: err });
    });
};

// Usage
store.dispatch(fetchUsers());
```

**Thunk has access to dispatch and getState:**
```javascript
const fetchUsersIfNeeded = () => (dispatch, getState) => {
  const state = getState();
  
  // Conditional dispatch - avoid refetching
  if (state.users.isFetching) {
    return; // Already fetching
  }
  
  dispatch({ type: FETCH_START });
  // ... fetch logic
};
```

**How it works:**
1. Thunk middleware intercepts function actions
2. Calls the function with dispatch and getState
3. Function can dispatch multiple actions
4. Allows for side effects while keeping reducers pure

**Alternatives:**
- Redux Saga - More powerful but complex
- Redux Observable - RxJS-based
- Redux-Thunk - Simple and sufficient for most cases"

---

### Question 7: What is Context API and When to Use It?

**What they's looking for:**
- Comparison with Redux
- Understanding of prop drilling
- Practical use cases

**Answer:**
"Context API is a React feature for passing data through component tree without prop drilling.

**The Problem - Prop Drilling:**
```javascript
// Props passed through many components
function App() {
  const [theme, setTheme] = useState('light');
  return <Page theme={theme} setTheme={setTheme} />;
}

function Page({ theme, setTheme }) {
  return <Header theme={theme} setTheme={setTheme} />;
}

function Header({ theme, setTheme }) {
  return <Nav theme={theme} setTheme={setTheme} />;
}

function Nav({ theme, setTheme }) {
  return <Toggle theme={theme} setTheme={setTheme} />;
}
```

**Context API Solution:**
```javascript
const ThemeContext = React.createContext();

function App() {
  const [theme, setTheme] = useState('light');

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      <Page />
    </ThemeContext.Provider>
  );
}

function Nav() {
  const { theme, setTheme } = useContext(ThemeContext);
  return <Toggle />;
}

function Toggle() {
  const { theme, setTheme } = useContext(ThemeContext);
  return (
    <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
      Toggle Theme
    </button>
  );
}
```

**When to Use Context:**
- Theme switching
- Language/Localization
- User authentication
- Global settings
- Avoid prop drilling

**When NOT to Use Context:**
- Frequently changing data (causes unnecessary re-renders)
- Complex state logic (use Redux)
- Performance-critical applications

**Redux vs Context:**
- Context: Simple, built-in, good for static/infrequent updates
- Redux: Powerful, dev tools, good for complex state, frequent updates"

---

## CODE EXAMPLES & IMPLEMENTATION

### Example 1: Complete User Management App

```javascript
// features/users/userSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { userService } from '../../services/userService';

export const fetchUsers = createAsyncThunk(
  'users/fetchUsers',
  async (_, { rejectWithValue }) => {
    try {
      const response = await userService.getUsers();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message);
    }
  }
);

export const createUser = createAsyncThunk(
  'users/createUser',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await userService.createUser(userData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message);
    }
  }
);

const userSlice = createSlice({
  name: 'users',
  initialState: {
    data: [],
    loading: false,
    error: null,
    selectedUser: null
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(createUser.fulfilled, (state, action) => {
        state.loading = false;
        state.data.push(action.payload);
      })
      .addCase(createUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export default userSlice.reducer;
```

```javascript
// pages/UserList.jsx
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUsers } from '../features/users/userSlice';
import UserCard from '../components/UserCard';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

function UserList() {
  const dispatch = useDispatch();
  const { data: users, loading, error } = useSelector(state => state.users);

  useEffect(() => {
    dispatch(fetchUsers());
  }, [dispatch]);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="user-list">
      <h1>Users</h1>
      <div className="users-grid">
        {users.map(user => (
          <UserCard key={user.id} user={user} />
        ))}
      </div>
    </div>
  );
}

export default UserList;
```

### Example 2: Custom Hook for Form Handling

```javascript
// hooks/useForm.js
import { useState, useCallback } from 'react';

function useForm(initialValues, onSubmit) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    setValues(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  }, []);

  const handleBlur = useCallback((e) => {
    const { name } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
  }, []);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await onSubmit(values);
    } catch (error) {
      setErrors({ submit: error.message });
    } finally {
      setIsSubmitting(false);
    }
  }, [values, onSubmit]);

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  }, [initialValues]);

  return {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    setValues,
    setErrors,
    reset
  };
}

export default useForm;

// Usage in component
function RegisterForm() {
  const form = useForm(
    { name: '', email: '', password: '' },
    async (values) => {
      await authService.register(values);
    }
  );

  return (
    <form onSubmit={form.handleSubmit}>
      <input
        name="name"
        value={form.values.name}
        onChange={form.handleChange}
        onBlur={form.handleBlur}
      />
      {form.touched.name && form.errors.name && (
        <span className="error">{form.errors.name}</span>
      )}
      
      <button type="submit" disabled={form.isSubmitting}>
        {form.isSubmitting ? 'Loading...' : 'Register'}
      </button>
    </form>
  );
}
```

---

## LAST-MINUTE CHECKLIST

### 2 Days Before Interview

- [ ] Review React hooks (useState, useEffect, useCallback, useMemo, useRef)
- [ ] Understand Redux flow and Redux Thunk
- [ ] Know differences between Controlled and Uncontrolled components
- [ ] Practice API integration patterns
- [ ] Review Context API and when to use it
- [ ] Understand performance optimization techniques
- [ ] Know what build tools do (Webpack, Babel, Parcel)
- [ ] Familiarize with error handling patterns

### 1 Day Before Interview

- [ ] Do 3-5 mock interview questions
- [ ] Review code examples from this guide
- [ ] Practice explaining concepts out loud
- [ ] Solve one coding problem from LeetCode (medium)
- [ ] Review your past projects and technical challenges
- [ ] Get good sleep
- [ ] Prepare examples from your real-world experience

### Morning of Interview

- [ ] Light review of core concepts
- [ ] Deep breathing and positive mindset
- [ ] Have your setup ready (if coding test)
- [ ] Have questions ready to ask about the company/role
- [ ] Review job description one more time

### During Interview

**Do:**
- [ ] Listen carefully to questions
- [ ] Ask for clarification if confused
- [ ] Think out loud (show your thought process)
- [ ] Use concrete examples from your experience
- [ ] Discuss trade-offs and best practices
- [ ] Write clean, readable code
- [ ] Test your code mentally before submission
- [ ] Ask follow-up questions about the role

**Don't:**
- [ ] Rush into answers without thinking
- [ ] Give vague answers
- [ ] Claim knowledge you don't have
- [ ] Write code without planning first
- [ ] Ignore edge cases
- [ ] Forget to handle errors
- [ ] Make assumptions without clarifying

### Questions to Ask Them

1. "What does the tech stack look like? Any Redux/GraphQL/state management?"
2. "How is the team structured? Any code review process?"
3. "What are the biggest technical challenges your team faces?"
4. "How do you handle testing? Unit, integration, E2E?"
5. "What's the onboarding process like?"
6. "How do you approach performance optimization?"
7. "What are the main performance metrics you track?"

---

## FINAL TIPS FOR SUCCESS

1. **Know Your Experience Level**: At 3 years, you should know practical patterns, not just theory
2. **Show Real Examples**: Reference your actual projects and technical decisions
3. **Discuss Trade-offs**: Show that you understand when to use different tools
4. **Code Quality**: Write clean, readable code with proper error handling
5. **Ask Questions**: Show genuine interest in the company and role
6. **Be Honest**: Don't claim knowledge you don't have - they respect honesty
7. **Think Out Loud**: Let them see your problem-solving process
8. **Confidence**: You have 3 years of experience - own it!

---

## ADDITIONAL RESOURCES

### Books
- "Learning React" by Alex Banks and Eve Porcello
- "Redux in Action" by Marc Gauthier

### Websites
- React Official Docs: https://react.dev
- Redux Docs: https://redux.js.org
- MDN Web Docs: https://developer.mozilla.org

### Practice Platforms
- LeetCode (Frontend Interview Problems)
- CodeSignal (JavaScript Algorithms)
- HackerRank (React Challenges)

### YouTube Channels
- Scrimba React Course
- The Net Ninja - React Tutorials
- Academind - React & Redux

---

**Good luck with your interview! You've got this! 🚀**

*Study hard, practice coding, and remember: they're looking for someone who can build scalable, maintainable applications. Show them you understand not just the "how" but the "why" behind best practices.*

---

**Last Updated:** January 30, 2026  
**For:** React Developer Interview - Collance Technology Pvt Ltd.  
**Location:** Noida Sector 62
