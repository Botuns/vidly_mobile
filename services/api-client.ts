import type { Platform } from "@/stores";
import NetInfo, { type NetInfoState } from "@react-native-community/netinfo";

// const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "https://api.vidly.app";
const API_BASE_URL = "https://api.vidly.app";

const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY_MS = 1000;

export interface VideoMetadata {
  id: string;
  title: string;
  description: string | null;
  thumbnail: string | null;
  duration: number | null;
  platform: Platform;
  author: string | null;
  authorAvatar: string | null;
  uploadDate: string | null;
  viewCount: number | null;
  qualities: VideoQuality[];
}

export interface VideoQuality {
  id: string;
  label: string;
  resolution: string;
  fileSize: number | null;
  format: string;
  hasAudio: boolean;
}

export interface DownloadUrl {
  url: string;
  expiresAt: number | null;
  headers?: Record<string, string>;
}

export interface ExtractResponse {
  success: true;
  metadata: VideoMetadata;
}

export interface DownloadResponse {
  success: true;
  downloadUrl: DownloadUrl;
}

export interface ApiError {
  success: false;
  error: {
    code: ApiErrorCode;
    message: string;
    retryable: boolean;
  };
}

export type ApiErrorCode =
  | "NETWORK_ERROR"
  | "OFFLINE"
  | "TIMEOUT"
  | "SERVER_ERROR"
  | "RATE_LIMITED"
  | "UNSUPPORTED_PLATFORM"
  | "VIDEO_NOT_FOUND"
  | "VIDEO_UNAVAILABLE"
  | "EXTRACTION_FAILED"
  | "INVALID_URL"
  | "UNKNOWN_ERROR";

type ExtractResult = ExtractResponse | ApiError;
type DownloadResult = DownloadResponse | ApiError;

class ApiClient {
  private abortControllers = new Map<string, AbortController>();

  async isOnline(): Promise<boolean> {
    try {
      const state: NetInfoState = await NetInfo.fetch();
      return state.isConnected ?? false;
    } catch {
      return true;
    }
  }

  private async delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private getRetryDelay(attempt: number): number {
    return INITIAL_RETRY_DELAY_MS * Math.pow(2, attempt);
  }

  private createAbortController(requestId: string): AbortController {
    this.cancelRequest(requestId);
    const controller = new AbortController();
    this.abortControllers.set(requestId, controller);
    return controller;
  }

  cancelRequest(requestId: string): void {
    const controller = this.abortControllers.get(requestId);
    if (controller) {
      controller.abort();
      this.abortControllers.delete(requestId);
    }
  }

  private cleanupRequest(requestId: string): void {
    this.abortControllers.delete(requestId);
  }

  private async fetchWithRetry<T>(
    url: string,
    options: RequestInit,
    requestId: string
  ): Promise<T | ApiError> {
    const online = await this.isOnline();
    if (!online) {
      return {
        success: false,
        error: {
          code: "OFFLINE",
          message:
            "No internet connection. Please check your network and try again.",
          retryable: true,
        },
      };
    }

    const controller = this.createAbortController(requestId);
    let lastError: ApiError | null = null;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const timeoutId = setTimeout(() => controller.abort(), 30000);

        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          this.cleanupRequest(requestId);
          return data as T;
        }

        const errorBody = await response.json().catch(() => ({}));
        const errorCode = this.mapStatusToErrorCode(response.status, errorBody);
        const retryable = this.isRetryable(response.status);

        lastError = {
          success: false,
          error: {
            code: errorCode,
            message:
              errorBody.message ?? this.getDefaultErrorMessage(errorCode),
            retryable,
          },
        };

        if (!retryable) {
          break;
        }

        if (attempt < MAX_RETRIES - 1) {
          await this.delay(this.getRetryDelay(attempt));
        }
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          this.cleanupRequest(requestId);
          return {
            success: false,
            error: {
              code: "TIMEOUT",
              message: "Request was cancelled or timed out.",
              retryable: false,
            },
          };
        }

        lastError = {
          success: false,
          error: {
            code: "NETWORK_ERROR",
            message: "Failed to connect to the server. Please try again.",
            retryable: true,
          },
        };

        if (attempt < MAX_RETRIES - 1) {
          await this.delay(this.getRetryDelay(attempt));
        }
      }
    }

    this.cleanupRequest(requestId);
    return (
      lastError ?? {
        success: false,
        error: {
          code: "UNKNOWN_ERROR",
          message: "An unexpected error occurred.",
          retryable: false,
        },
      }
    );
  }

  private mapStatusToErrorCode(
    status: number,
    body: Record<string, unknown>
  ): ApiErrorCode {
    if (body.code && typeof body.code === "string") {
      return body.code as ApiErrorCode;
    }

    switch (status) {
      case 400:
        return "INVALID_URL";
      case 404:
        return "VIDEO_NOT_FOUND";
      case 410:
        return "VIDEO_UNAVAILABLE";
      case 422:
        return "UNSUPPORTED_PLATFORM";
      case 429:
        return "RATE_LIMITED";
      case 500:
      case 502:
      case 503:
      case 504:
        return "SERVER_ERROR";
      default:
        return "UNKNOWN_ERROR";
    }
  }

  private isRetryable(status: number): boolean {
    return status === 429 || status >= 500;
  }

  private getDefaultErrorMessage(code: ApiErrorCode): string {
    const messages: Record<ApiErrorCode, string> = {
      NETWORK_ERROR: "Failed to connect to the server. Please try again.",
      OFFLINE: "No internet connection. Please check your network.",
      TIMEOUT: "Request timed out. Please try again.",
      SERVER_ERROR:
        "Server is temporarily unavailable. Please try again later.",
      RATE_LIMITED: "Too many requests. Please wait a moment and try again.",
      UNSUPPORTED_PLATFORM: "This platform is not currently supported.",
      VIDEO_NOT_FOUND: "Video not found. It may have been deleted.",
      VIDEO_UNAVAILABLE: "This video is no longer available.",
      EXTRACTION_FAILED:
        "Failed to extract video information. Please try again.",
      INVALID_URL: "The provided URL is not valid.",
      UNKNOWN_ERROR: "An unexpected error occurred. Please try again.",
    };
    return messages[code];
  }

  async extractMetadata(sourceUrl: string): Promise<ExtractResult> {
    const requestId = `extract-${Date.now()}`;

    return this.fetchWithRetry<ExtractResponse>(
      `${API_BASE_URL}/v1/extract`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: sourceUrl }),
      },
      requestId
    );
  }

  async getDownloadUrl(
    sourceUrl: string,
    qualityId?: string
  ): Promise<DownloadResult> {
    const requestId = `download-${Date.now()}`;

    return this.fetchWithRetry<DownloadResponse>(
      `${API_BASE_URL}/v1/download`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: sourceUrl,
          qualityId,
        }),
      },
      requestId
    );
  }
}

export const apiClient = new ApiClient();
