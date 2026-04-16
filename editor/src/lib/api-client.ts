import type { User, SignatureField } from '@/types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Response types
interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken?: string;
}

interface DocumentListResponse {
  documents: Array<{
    id: string;
    fileName: string;
    originalFileName: string;
    fileSize: number;
    pageCount: number;
    createdAt: string;
    status: string;
  }>;
  total: number;
  page: number;
  limit: number;
}

interface DocumentResponse {
  id: string;
  fileName: string;
  originalFileName: string;
  fileSize: number;
  pageCount: number;
  s3Key: string;
  status: string;
  createdAt: string;
  metadata?: Record<string, any>;
}

interface SigningRequestResponse {
  id: string;
  documentId: string;
  status: string;
  fields: SignatureField[];
  accessToken: string;
  deadline?: string;
}

interface PaymentConfigResponse {
  publishableKey: string;
  enabled: boolean;
}

interface CheckoutSessionResponse {
  sessionId: string;
  url: string;
}

export class ApiClient {
  private accessToken: string | null = null;

  setToken(token: string | null) {
    this.accessToken = token;
  }

  private async request<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE}${path}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (options.headers instanceof Headers) {
      options.headers.forEach((value, key) => {
        headers[key] = value;
      });
    } else if (options.headers && typeof options.headers === 'object') {
      Object.assign(headers, options.headers);
    }

    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `API error: ${response.status}`);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return response.json();
  }

  private async requestFormData<T>(
    path: string,
    formData: FormData,
    options: Omit<RequestInit, 'body' | 'method'> = {}
  ): Promise<T> {
    const url = `${API_BASE}${path}`;
    const headers: Record<string, string> = {};

    if (options.headers instanceof Headers) {
      options.headers.forEach((value, key) => {
        headers[key] = value;
      });
    } else if (options.headers && typeof options.headers === 'object') {
      Object.assign(headers, options.headers);
    }

    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    const response = await fetch(url, {
      method: 'POST',
      ...options,
      body: formData,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `API error: ${response.status}`);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return response.json();
  }

  // Auth methods
  auth = {
    register: async (
      email: string,
      password: string,
      name: string
    ): Promise<AuthResponse> =>
      this.request('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password, name }),
      }),

    login: async (email: string, password: string): Promise<AuthResponse> =>
      this.request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),

    loginWithGoogle: async (idToken: string): Promise<AuthResponse> =>
      this.request('/auth/google', {
        method: 'POST',
        body: JSON.stringify({ idToken }),
      }),

    logout: async (): Promise<void> =>
      this.request('/auth/logout', {
        method: 'POST',
      }),

    getProfile: async (): Promise<User> =>
      this.request('/auth/profile', {
        method: 'GET',
      }),

    verifyEmail: async (token: string): Promise<{ success: boolean }> =>
      this.request('/auth/verify-email', {
        method: 'POST',
        body: JSON.stringify({ token }),
      }),

    resendVerification: async (email: string): Promise<{ success: boolean }> =>
      this.request('/auth/resend-verification', {
        method: 'POST',
        body: JSON.stringify({ email }),
      }),

    forgotPassword: async (email: string): Promise<{ success: boolean }> =>
      this.request('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      }),

    resetPassword: async (
      token: string,
      password: string
    ): Promise<{ success: boolean }> =>
      this.request('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, password }),
      }),

    refreshToken: async (): Promise<AuthResponse> =>
      this.request('/auth/refresh', {
        method: 'POST',
      }),
  };

  // Document methods
  documents = {
    upload: async (
      file: File,
      metadata?: Record<string, string>
    ): Promise<DocumentResponse> => {
      const formData = new FormData();
      formData.append('file', file);
      if (metadata) {
        formData.append('metadata', JSON.stringify(metadata));
      }
      return this.requestFormData('/documents/upload', formData);
    },

    list: async (params?: {
      page?: number;
      limit?: number;
    }): Promise<DocumentListResponse> => {
      const query = new URLSearchParams();
      if (params?.page) query.append('page', params.page.toString());
      if (params?.limit) query.append('limit', params.limit.toString());
      const queryStr = query.toString() ? `?${query}` : '';
      return this.request(`/documents${queryStr}`, { method: 'GET' });
    },

    get: async (id: string): Promise<DocumentResponse> =>
      this.request(`/documents/${id}`, { method: 'GET' }),

    getDownloadUrl: async (id: string): Promise<{ url: string }> =>
      this.request(`/documents/${id}/download-url`, { method: 'GET' }),

    delete: async (id: string): Promise<void> =>
      this.request(`/documents/${id}`, { method: 'DELETE' }),
  };

  // E-sign methods
  esign = {
    prepare: async (file: File): Promise<SigningRequestResponse> => {
      const formData = new FormData();
      formData.append('file', file);
      return this.requestFormData('/esign/prepare', formData);
    },

    detectFields: async (
      documentId: string
    ): Promise<{ fields: SignatureField[] }> =>
      this.request(`/esign/${documentId}/detect-fields`, {
        method: 'GET',
      }),

    getRequest: async (requestId: string): Promise<SigningRequestResponse> =>
      this.request(`/esign/${requestId}`, { method: 'GET' }),

    saveFields: async (
      requestId: string,
      fields: SignatureField[]
    ): Promise<{ success: boolean }> =>
      this.request(`/esign/${requestId}/fields`, {
        method: 'POST',
        body: JSON.stringify({ fields }),
      }),

    sign: async (
      requestId: string,
      signatureData: {
        signatures: Array<{
          fieldId: string;
          value: string;
          type: 'draw' | 'type';
        }>;
      }
    ): Promise<{ success: boolean; documentId: string }> =>
      this.request(`/esign/${requestId}/sign`, {
        method: 'POST',
        body: JSON.stringify(signatureData),
      }),

    finalize: async (
      requestId: string,
      file: File
    ): Promise<{ documentId: string; s3Key: string }> => {
      const formData = new FormData();
      formData.append('file', file);
      return this.requestFormData(`/esign/${requestId}/finalize`, formData);
    },
  };

  // Convert methods
  convert = {
    getFormats: async (): Promise<{
      inputFormats: string[];
      outputFormats: string[];
    }> =>
      this.request('/convert/formats', { method: 'GET' }),

    uploadAndConvert: async (
      file: File,
      targetFormat: string
    ): Promise<{ downloadUrl: string; fileName: string }> => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('targetFormat', targetFormat);
      return this.requestFormData('/convert', formData);
    },
  };

  // Payment methods
  payments = {
    getConfig: async (): Promise<PaymentConfigResponse> =>
      this.request('/payments/config', { method: 'GET' }),

    createCheckout: async (
      documentId: string,
      amount: number,
      description: string
    ): Promise<CheckoutSessionResponse> =>
      this.request('/payments/create-checkout', {
        method: 'POST',
        body: JSON.stringify({ documentId, amount, description }),
      }),

    getStatus: async (
      paymentId: string
    ): Promise<{ status: string; paidAt?: string }> =>
      this.request(`/payments/${paymentId}`, { method: 'GET' }),

    getByDocument: async (
      documentId: string
    ): Promise<{ paymentId: string; status: string } | null> =>
      this.request<{ paymentId: string; status: string }>(`/payments/document/${documentId}`, { method: 'GET' }).catch(
        () => null
      ),
  };
}

export const api = new ApiClient();
