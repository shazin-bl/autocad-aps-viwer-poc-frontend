// api/modelApi.ts
import { axiosInstance } from "@/service/axios";

export async function getModels() {
  const { data } = await axiosInstance.get("/api/models");
  return data;
}

export async function getModelStatus(urn: string) {
  const { data } = await axiosInstance.get(
    `/api/models/${urn}/status`
  );

  return data;
}

export async function uploadModel(
  file: File,
  entryPoint?: string
) {
  const formData = new FormData();

  formData.append("model-file", file);

  if (entryPoint) {
    formData.append(
      "model-zip-entrypoint",
      entryPoint
    );
  }

  const { data } = await axiosInstance.post(
    "/api/models",
    formData
  );

  return data;
}