// import axios from "axios";

// export const apiClient = axios.create({
//   baseURL: "/",
//   headers: { "Content-Type": "application/json", Accept: "application/json" },
// });

// สำหรับ sign out เมื่อ token หมด ใช้เมื่อ dashboard เสร็จ
import axios from "axios";
import { signOut } from "next-auth/react";

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE || "",
  withCredentials: true,
});

apiClient.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err?.response?.status;

    if (status === 401) {
      // สั่ง logout อัตโนมัติ
      signOut({ callbackUrl: "/sign-in" });
    }

    return Promise.reject(err);
  }
);
