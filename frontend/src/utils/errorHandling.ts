/**
 * Error handling utilities
 * Provides consistent error logging and user-friendly error messages
 */

import { error as logError } from "./logger";

export class AppError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = "AppError";
  }
}

/**
 * Handle errors consistently across the application
 */
export function handleError(error: unknown): string {
  if (error instanceof AppError) {
    return error.message;
  }

  if (error instanceof Error) {
    logError("Application error:", error);
    return error.message;
  }

  logError("Unknown error:", error);
  return "Ocorreu um erro inesperado. Por favor, tente novamente.";
}

/**
 * Safe JSON parse with error handling
 */
export function safeJSONParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T;
  } catch (err) {
    logError("JSON parse error:", err);
    return fallback;
  }
}

/**
 * Validate required fields
 */
export function validateRequiredFields(
  data: Record<string, unknown>,
  fields: string[]
): { valid: boolean; missingFields: string[] } {
  const missingFields = fields.filter((field) => {
    const value = data[field];
    return value === undefined || value === null || value === "";
  });

  return {
    valid: missingFields.length === 0,
    missingFields,
  };
}

/**
 * Retry function with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: Error | null = null;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (i < maxRetries - 1) {
        await new Promise((resolve) => setTimeout(resolve, delayMs * Math.pow(2, i)));
      }
    }
  }

  throw lastError || new Error("Max retries reached");
}

