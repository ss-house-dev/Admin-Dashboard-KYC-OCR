import { api } from "@/lib/axios";

export type SignUpPayload = {
  username: string;
  password: string;
  company: {
    name: string;
    contactEmail: string;
    contactPhone: string;
  };
};

export async function signUp(payload: SignUpPayload) {
  const clean: SignUpPayload = {
    username: payload.username.trim(),
    password: payload.password,
    company: {
      name: payload.company.name.trim(),
      contactEmail: payload.company.contactEmail.trim(),
      contactPhone: payload.company.contactPhone.trim(),
    },
  };
  const { data } = await api.post("/auth/signup", clean);
  return data;
}