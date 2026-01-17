type AuthEvent = "logout";
type Listener = () => void;

class AuthEventEmitter {
  private listeners: Map<AuthEvent, Set<Listener>> = new Map();

  on(event: AuthEvent, listener: Listener) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)?.add(listener);
    
    // Return unsubscribe function
    return () => {
      this.listeners.get(event)?.delete(listener);
    };
  }

  emit(event: AuthEvent) {
    this.listeners.get(event)?.forEach((listener) => listener());
  }
}

export const authEvents = new AuthEventEmitter();
