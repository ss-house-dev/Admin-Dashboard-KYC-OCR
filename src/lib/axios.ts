import axios from "axios";
import { getSession } from "next-auth/react";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
});

api.interceptors.request.use(async (config) => {
  const session = await getSession();          
  const token = (session as any)?.accessToken as string | undefined;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});