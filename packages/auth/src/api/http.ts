import { CapacitorHttp, HttpResponse } from "@capacitor/core";
import { Capacitor } from "@capacitor/core";
import { RequestProps } from "../types";
import { cookies } from "../cookies/cookies";

async function request({
  method,
  url,
  data,
}: RequestProps): Promise<HttpResponse> {
  const token = await cookies.get("access_token");

  console.log("Making request:", {
    method,
    url,
    data,
    platform: Capacitor.getPlatform(),
  });

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  // Use native fetch for web platform to ensure proper body handling
  if (Capacitor.getPlatform() === "web") {
    const fetchOptions: RequestInit = {
      method,
      headers,
      credentials: "include",
    };

    if (data && (method === "POST" || method === "PUT" || method === "PATCH")) {
      fetchOptions.body = JSON.stringify(data);
    }

    console.log("Using fetch with options:", fetchOptions);

    const response = await fetch(url, fetchOptions);
    const responseData = await response.json().catch(() => ({}));

    return {
      status: response.status,
      headers: Object.fromEntries(response.headers.entries()),
      data: responseData,
      url: response.url,
    };
  }

  // Use CapacitorHttp for native platforms
  const options: any = {
    method,
    url,
    headers,
  };

  // For native platforms, CapacitorHttp expects data as a plain object
  // It will handle the serialization internally
  if (data && (method === "POST" || method === "PUT" || method === "PATCH")) {
    options.data = data;
  }

  console.log("Using CapacitorHttp with options:", options);

  const response = await CapacitorHttp.request(options);

  console.log("Response:", response);

  return response;
}

export const api = {
  get: (url: string) => request({ method: "GET", url }),
  post: (url: string, data: any) => request({ method: "POST", url, data }),
  put: (url: string, data: any) => request({ method: "PUT", url, data }),
  delete: (url: string) => request({ method: "DELETE", url }),
};
