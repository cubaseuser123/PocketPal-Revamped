import { CapacitorHttp } from "@capacitor/core";
import { RequestProps } from "../types";
import { cookies } from "../cookies/cookies";

async function request({ method, url, data }: RequestProps) {
  const token = await cookies.get("access_token");

  return CapacitorHttp.request({
    method,
    url,
    data,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    webFetchExtra: {
      credentials: "include",
    },
  });
}

export const api = {
  get: (url: string) => request({ method: "GET", url }),
  post: (url: string, data: any) => request({ method: "POST", url, data }),
  put: (url: string, data: any) => request({ method: "PUT", url, data }),
  delete: (url: string) => request({ method: "DELETE", url }),
};
