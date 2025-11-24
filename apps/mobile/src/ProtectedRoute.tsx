import { Route, Redirect, RouteProps } from "react-router-dom";
import { useAuth } from "@repo/auth";

interface ProtectedRouteProps extends RouteProps {
  component: React.ComponentType<any>;
}

export function ProtectedRoute({
  component: Component,
  ...rest
}: ProtectedRouteProps) {
  const auth = useAuth();

  if (!auth) {
    return <div>Loading auth...</div>;
  }

  const { authenticated, loading } = auth;

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Route
      {...rest}
      render={(props) =>
        authenticated ? <Component {...props} /> : <Redirect to="/login" />
      }
    />
  );
}
