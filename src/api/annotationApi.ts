import { axiosInstance } from "@/service/axios";

export async function saveAnnotation(payload: any) {
  const { data } = await axiosInstance.post(
    "/annotations",
    payload
  );

  return data;
}

export async function getAnnotations(
  urn: string
) {
  const { data } = await axiosInstance.get(
    `/annotations?urn=${encodeURIComponent(urn)}`
  );

  return data;
}