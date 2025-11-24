# @repo/auth

Shared authentication package for PocketPal monorepo. Works with both Ionic (React) and Next.js applications.

## Installation

This package is internal to the monorepo and will be automatically linked via pnpm workspace.

In your app's `package.json`:

```json
{
  "dependencies": {
    "@repo/auth": "workspace:*"
  }
}
```

## Usage

### For Ionic (React Native/React)

#### 1. Wrap your app with AuthProvider

```tsx
// App.tsx
import { AuthProvider } from "@repo/auth/react";

function App() {
  return <AuthProvider>{/* Your app content */}</AuthProvider>;
}
```

#### 2. Use the useAuth hook

```tsx
import { useAuth } from "@repo/auth/react";

function ProfilePage() {
  const { user, logout, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <LoginPrompt />;
  }

  return (
    <div>
      <h1>Welcome, {user?.name}</h1>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

#### 3. Login/Register pages

```tsx
import { useAuth } from "@repo/auth/react";

function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login({ email, password });
      // Navigate to home
    } catch (error) {
      console.error(error.message);
    }
  };

  // ... form JSX
}
```

### For Next.js

#### 1. Create Auth Context Provider

```tsx
// app/providers.tsx
"use client";

import { AuthProvider } from "@repo/auth/react";

export function Providers({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
```

```tsx
// app/layout.tsx
import { Providers } from "./providers";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

#### 2. Use in Server Components (API calls)

```tsx
// app/actions/auth.ts
"use server";

import { authClient } from "@repo/auth";

export async function loginAction(email: string, password: string) {
  try {
    const response = await authClient.login({ email, password });
    return { success: true, user: response.user };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
```

#### 3. Use in Client Components

```tsx
"use client";

import { useAuth } from "@repo/auth/react";

export function ProfileClient() {
  const { user, logout } = useAuth();

  return (
    <div>
      <p>{user?.name}</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

### Direct API Usage (without React hooks)

```typescript
import { authClient } from "@repo/auth";

// Login
const response = await authClient.login({
  email: "user@example.com",
  password: "password123",
});

// Get current user
const user = await authClient.getMe();

// Logout
await authClient.logout();

// Check auth status
const isAuth = authClient.isAuthenticated();
```

## Environment Variables

Set in your app's `.env` file:

```env
# For Next.js
NEXT_PUBLIC_API_URL=http://localhost:5757/api/auth

# For Ionic/React
REACT_APP_API_URL=http://localhost:5757/api/auth
```

## API

### Types

```typescript
interface User {
  _id: string;
  name: string;
  email: string;
}

interface LoginData {
  email: string;
  password: string;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
}
```

### AuthClient Methods

- `login(data: LoginData): Promise<AuthResponse>`
- `register(data: RegisterData): Promise<AuthResponse>`
- `logout(): Promise<void>`
- `getMe(): Promise<User>`
- `isAuthenticated(): boolean`
- `getToken(): string | null`

### React Hooks

- `useAuth()` - Main auth hook with context
- `useLogin()` - Login without context
- `useRegister()` - Register without context

## Development

```bash
# Build the package
pnpm build

# Watch mode
pnpm dev

# Type check
pnpm check-types
```
