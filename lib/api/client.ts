import axios from "axios";
import { apiUrl } from "@/lib/utils";

export const apiRequest = axios.create({
  baseURL: apiUrl,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});
