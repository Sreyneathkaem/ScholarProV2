import axios, {
  AxiosInstance,
  AxiosError,
  InternalAxiosRequestConfig,
} from "axios";
import { API_ENDPOINTS } from "./endpoint";
import { useAuthStore } from "@/lib/stores/auth-store";
import { z } from "zod";

let isRefreshing = false;
let refreshQueue: Array<() => void> = [];

function onRefreshed() {
  refreshQueue.forEach((cb) => cb());
  refreshQueue = [];
}

export const apiClient: AxiosInstance = axios.create({
  baseURL: "/api",
  timeout: 60000,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    let token = useAuthStore.getState().accessToken;
    const requestUrl = config.url || "";
    const isPublicAuthRequest =
      requestUrl.includes("/auth/login") ||
      requestUrl.includes("/auth/refresh") ||
      requestUrl.includes("/auth/register/") ||
      requestUrl.includes("/auth/forgot-password");

    // If no access token but we have a refresh cookie, try to refresh first
    if (
      !token &&
      !isPublicAuthRequest &&
      !isRefreshing &&
      typeof window !== "undefined"
    ) {
      try {
        isRefreshing = true;
        console.log("🔄 No access token in memory, attempting auto-refresh...");

        const refreshRes = await axios.post(
          "/api" + API_ENDPOINTS.REFRESH,
          {},
          { withCredentials: true },
        );

        if (refreshRes.data?.token) {
          token = refreshRes.data.token;
          useAuthStore.getState().setAccessToken(token);
        }
      } catch {
      } finally {
        isRefreshing = false;
      }
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (error.response?.status === 429) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !original?._retry) {
      if (isRefreshing) {
        await new Promise<void>((resolve) => refreshQueue.push(resolve));
        return apiClient(original);
      }

      try {
        isRefreshing = true;
        original._retry = true;
        console.log("🔄 Attempting token refresh via HttpOnly cookie...");

        const refreshRes = await axios.post(
          "/api" + API_ENDPOINTS.REFRESH,
          {},
          {
            headers: { "Content-Type": "application/json" },
            withCredentials: true,
          },
        );

        if (refreshRes.status === 200 && refreshRes.data?.token) {
          const newToken = refreshRes.data.token;
          useAuthStore.getState().setAccessToken(newToken);
          console.log("✅ Token refreshed successfully");
          onRefreshed();
          return apiClient(original);
        } else {
          redirectToLogin();
        }
      } catch {
        redirectToLogin();
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

function redirectToLogin() {
  if (typeof window !== "undefined") {
    useAuthStore.getState().clearAuth();

    const publicRoutes = [
      "/login",
      "/forgot-password",
      "/reset-password",
      "/set-forgot-password",
      "/students/login",
      "/students/signup",
      "/students/auth/",
      "/api/v1/auth/", // OAuth callback: browser URL during server-side rewrite
    ];
    const { pathname } = window.location;
    const isPublicRoute = publicRoutes.some((route) =>
      pathname.startsWith(route),
    );

    if (!isPublicRoute) {
      // Student routes always redirect to the student login page
      const loginPath = pathname.startsWith("/students/")
        ? "/students/login"
        : "/login";
      window.location.replace(loginPath);
    }
  }
}

export async function fetchValidatedData<T>(
  url: string,
  schema: z.ZodType<T>,
  config?: InternalAxiosRequestConfig,
): Promise<T> {
  try {
    // Use the existing configured apiClient
    const response = await apiClient.get(url, config);
    const rawData = response.data; // This is the raw JSON data

    // Validate the raw data using Zod at runtime
    const validatedData = schema.parse(rawData);

    return validatedData;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error(`❌ Zod Validation Error for ${url}:`, error.issues);

      throw new Error(`Invalid data structure from API: ${error.message}`);
    }

    throw error;
  }
}

export async function postValidatedData<T, R>(
  url: string,
  data: T,
  responseSchema: z.ZodType<R>,
): Promise<R> {
  const response = await apiClient.post(url, data);

  // Validate the response data
  try {
    return responseSchema.parse(response.data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error(`❌ Zod Validation Error on POST ${url}:`, error.issues);
      throw new Error(
        `Invalid response structure from API after POST: ${error.message}`,
      );
    }
    throw error;
  }
}

export async function putValidatedData<T, R>(
  url: string,
  data: T,
  responseSchema: z.ZodType<R>,
): Promise<R> {
  const response = await apiClient.put(url, data);

  // Validate the response data
  try {
    return responseSchema.parse(response.data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error(`❌ Zod Validation Error on PUT ${url}:`, error.issues);
      throw new Error(
        `Invalid response structure from API after PUT: ${error.message}`,
      );
    }
    throw error;
  }
}
