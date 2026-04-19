export class ApiClient {
  constructor(baseUrl = 'http://127.0.0.1:5000', timeoutMs = 8000) {
    this.baseUrl = baseUrl;
    this.timeoutMs = timeoutMs;
  }

  async request(path, options = {}) {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), options.timeoutMs || this.timeoutMs);

    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(options.headers || {}),
        },
        signal: controller.signal,
        ...options,
      });

      const contentType = response.headers.get('content-type') || '';
      const data = contentType.includes('application/json') ? await response.json() : await response.text();

      if (!response.ok) {
        return this.raiseError(data?.message || data?.error || 'Request failed', response.status, data);
      }

      return data;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      if (error.name === 'AbortError') {
        throw new ApiError('Request timed out', 408, null, 'timeout');
      }
      throw new ApiError(error.message || 'Network error', 0, null, 'network');
    } finally {
      window.clearTimeout(timeoutId);
    }
  }

  raiseError(message, status, payload) {
    const extra = payload ? ` | payload=${JSON.stringify(payload)}` : '';
    throw new ApiError(`${message}${extra}`, status, payload);
  }
}

export class ApiError extends Error {
  constructor(message, status = 0, payload = null, kind = 'server') {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.payload = payload;
    this.kind = kind;
  }
}

// Shared singleton for current and future feature modules.
export const apiClient = new ApiClient();
