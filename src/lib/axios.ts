import axios, { AxiosHeaders, type InternalAxiosRequestConfig } from "axios";
import { getSession } from "next-auth/react";
import type { Session } from "next-auth";

export const api = axios.create({
  baseURL: "/",
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
});

api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const session = (await getSession()) as Session | null;
  const token = session?.accessToken;

  if (token) {
    const headers =
      config.headers instanceof AxiosHeaders
        ? config.headers
        : new AxiosHeaders(config.headers);

    headers.set("Authorization", `Bearer ${token}`);
    config.headers = headers;
  }

  return config;
});
