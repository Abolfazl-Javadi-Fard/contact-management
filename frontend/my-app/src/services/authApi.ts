
const API_BASE_URL = "https://contact-management-3kkf.vercel.app";
export interface LoginRequest {
  identifier: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: {
    id: number;
    email: string | null;
    phone: string;
    role: string;
  };
}

export async function login(
  data: LoginRequest
): Promise<LoginResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      typeof result.detail === "string"
        ? result.detail
        : "ورود ناموفق بود. اطلاعات واردشده را بررسی کنید."
    );
  }

  return result as LoginResponse;
}

export interface SignupRequest {
  first_name: string;
  last_name: string;
  phone: string;
  email?: string;
  password: string;
}

export interface SignupResponse {
  message: string;
  user: {
    id: number;
    first_name: string;
    last_name: string;
    phone: string;
    email: string | null;
    role: string;
  };
}

export async function signup(
  data: SignupRequest,
): Promise<SignupResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/signup`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      typeof result.detail === "string"
        ? result.detail
        : "ثبت‌نام انجام نشد. اطلاعات واردشده را بررسی کنید.",
    );
  }

  return result as SignupResponse;
}

export interface UserAccount {
  id: number;
  first_name: string;
  last_name: string;
  phone: string;
  email: string | null;
  role: string;
}

const getAuthHeaders = () => {
  const token = sessionStorage.getItem("access_token");

  if (!token) {
    throw new Error("لطفاً ابتدا وارد حساب کاربری شوید.");
  }

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};

async function handleResponse<T>(response: Response): Promise<T> {
  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      typeof result.detail === "string"
        ? result.detail
        : "عملیات انجام نشد."
    );
  }

  return result as T;
}

export async function getMyAccount(): Promise<UserAccount> {
  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    headers: getAuthHeaders(),
  });

  return handleResponse<UserAccount>(response);
}

export async function getUser(userId: number): Promise<UserAccount> {
  const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
    headers: getAuthHeaders(),
  });

  return handleResponse<UserAccount>(response);
}

export async function updateUser(
  userId: number,
  data: Omit<UserAccount, "id" | "role">
): Promise<UserAccount> {
  const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });

  return handleResponse<UserAccount>(response);
}

export async function changePassword(
  current_password: string,
  new_password: string
): Promise<{ message: string }> {
  const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ current_password, new_password }),
  });

  return handleResponse<{ message: string }>(response);
}
