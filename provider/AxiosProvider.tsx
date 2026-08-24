import axios, {
  AxiosInstance,
  AxiosHeaders,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
} from "axios";
import StorageManager from "./StorageManager";

export const LOCAL_API_URL = "http://localhost:8016/api/v1/managelead";
export const STAGING_API_URL =
  "https://medicine-crm-backend-staging.dynsimulation.com/api/v1/managelead";

export const getBaseURL = (): string => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return LOCAL_API_URL;
    }
    return STAGING_API_URL;
  }
  return process.env.NODE_ENV === "development"
    ? LOCAL_API_URL
    : STAGING_API_URL;
};

class AxiosProvider {
  private static instance: AxiosInstance = axios.create({
    baseURL: getBaseURL(),
  });

  // --- configure interceptors only once ---
  static {
    AxiosProvider.instance.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const headers =
          config.headers instanceof AxiosHeaders
            ? config.headers
            : new AxiosHeaders(config.headers);

        if (typeof window !== "undefined") {
          const storage = new StorageManager();
          let token = storage.getAccessToken?.() || "";
          if (token.startsWith("Bearer ")) token = token.slice(7).trim();
          if (token) headers.set("Authorization", `Bearer ${token}`);
        }

        if (!headers.has("Accept")) headers.set("Accept", "application/json");
        if (!headers.has("Content-Type"))
          headers.set("Content-Type", "application/json");

        config.headers = headers;
        config.baseURL = getBaseURL();
        return config;
      }
    );

    AxiosProvider.instance.interceptors.response.use(
      (res) => res,
      (err) => Promise.reject(err)
    );
  }

  // --- static methods ---
  static get<T = any>(url: string, config?: AxiosRequestConfig) {
    return AxiosProvider.instance.get<T>(url, config);
  }

  static post<T = any>(url: string, data?: any, config?: AxiosRequestConfig) {
    return AxiosProvider.instance.post<T>(url, data, config);
  }

  static put<T = any>(url: string, data?: any, config?: AxiosRequestConfig) {
    return AxiosProvider.instance.put<T>(url, data, config);
  }

  static delete<T = any>(url: string, config?: AxiosRequestConfig) {
    return AxiosProvider.instance.delete<T>(url, config);
  }
}

export default AxiosProvider;
