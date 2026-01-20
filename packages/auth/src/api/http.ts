import { RequestProps, HttpResponse } from "../types";
import { storage } from "../storage/storage";
import { Platform } from "react-native";
import { authEvents } from "../events";

async function request({
  method,
  url,
  data,
}: RequestProps): Promise<HttpResponse> {
  const token = await storage.get("access_token");

  console.log("Making request:", {
    method,
    url,
    hasToken: !!token,
    platform: Platform.OS,
  });

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    // Shim Origin for Better Auth compatibility
    "Origin": "app://pocketpal",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const fetchOptions: RequestInit = {
    method,
    headers,
    credentials: "include",
  };

  if (data && (method === "POST" || method === "PUT" || method === "PATCH")) {
    fetchOptions.body = JSON.stringify(data);
  }

  const response = await fetch(url, fetchOptions);
  const responseData = await response.json().catch(() => ({}));

  console.log("Response:", {
    status: response.status,
    ok: response.ok,
    data: responseData,
  });

  // Throw error for non-2xx responses
  if (!response.ok) {
    // Handle 401 Unauthorized
    if (response.status === 401) {
      console.log("⚠️ 401 Unauthorized - Clearing token");
      await storage.remove("access_token");
      authEvents.emit("logout");
    }

    const error = new Error(responseData.message || `HTTP ${response.status}`);
    (error as any).status = response.status;
    (error as any).data = responseData;
    throw error;
  }

  return {
    status: response.status,
    headers: Object.fromEntries(response.headers.entries()),
    data: responseData,
    url: response.url,
  };
}

export const api = {
  get: (url: string) => request({ method: "GET", url }),
  post: (url: string, data: any) => request({ method: "POST", url, data }),
  put: (url: string, data: any) => request({ method: "PUT", url, data }),
  delete: (url: string) => request({ method: "DELETE", url }),
};
