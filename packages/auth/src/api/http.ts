import { RequestProps, HttpResponse } from "../types";
import { storage } from "../storage/storage";
import { Platform } from "react-native";

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

