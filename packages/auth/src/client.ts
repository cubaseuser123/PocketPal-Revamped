import axios, { AxiosInstance, AxiosError } from "axios";
import { getApiUrl } from "./config";
import { storage } from "./storage";
import type {
  User,
  LoginData,
  RegisterData,
  AuthResponse,
  ErrorResponse,
} from "./types";

class AuthClient {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: getApiUrl(),
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Add token to requests
    this.api.interceptors.request.use((config) => {
      const token = storage.getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  private handleError(error: AxiosError<ErrorResponse>): never {
    const message =
      error.response?.data?.message || error.message || "An error occurred";
    throw new Error(message);
  }

  /**
   * Register a new user
   */
  async register(data: RegisterData): Promise<AuthResponse> {
    try {
      const response = await this.api.post<AuthResponse>("/register", data);
      return response.data;
    } catch (error) {
      this.handleError(error as AxiosError<ErrorResponse>);
    }
  }

  /**
   * Login user
   */
  async login(data: LoginData): Promise<AuthResponse> {
    try {
      const response = await this.api.post<AuthResponse>("/login", data);
      if (response.data.token) {
        storage.setToken(response.data.token);
      }
      return response.data;
    } catch (error) {
      this.handleError(error as AxiosError<ErrorResponse>);
    }
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      await this.api.post("/logout");
      storage.clear();
    } catch (error) {
      storage.clear();
      this.handleError(error as AxiosError<ErrorResponse>);
    }
  }

  /**
   * Get current user
   */
  async getMe(): Promise<User> {
    try {
      const response = await this.api.get<{ user: User }>("/me");
      return response.data.user;
    } catch (error) {
      this.handleError(error as AxiosError<ErrorResponse>);
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!storage.getToken();
  }

  /**
   * Get stored token
   */
  getToken(): string | null {
    return storage.getToken();
  }
}

// Export singleton instance
export const authClient = new AuthClient();
export default authClient;
