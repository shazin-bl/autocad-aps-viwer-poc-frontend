import { axiosInstance } from "@/service/axios";

export async function getViewerToken() {
  const { data } = await axiosInstance.get("/api/auth/token");
  return data;
}