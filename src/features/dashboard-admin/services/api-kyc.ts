import axios from "axios";

type KycRequestGetArgs = {
  id?: string; 
};

export async function KycRequestGet({ id }: KycRequestGetArgs) {
  const url = id ? `/kyc/requests/${id}` : `/kyc/requests`;

  const { data } = await axios.get(url);
  return data;
}
