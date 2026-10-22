
const API_BASE_URL = "http://127.0.0.1:8000";

export interface Contact {
  id: number;
  user_id: number | null;
  first_name: string;
  last_name: string;
  phone: string;
  email: string | null;
  notes: string | null;
  deleted_flag: boolean;
  created_at: string;
}

export interface ContactCreate {
  first_name: string;
  last_name: string;
  phone: string;
  email?: string | null;
  notes?: string | null;
}

async function apiRequest(
  path: string,
  options: RequestInit = {},
): Promise<Response> {
  const token = sessionStorage.getItem("access_token");

  const headers = new Headers(options.headers);

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    sessionStorage.removeItem("access_token");
    sessionStorage.removeItem("user");

    if (window.location.pathname !== "/login") {
      window.location.replace("/login");
    }

    throw new Error("نشست شما منقضی شده است. دوباره وارد شوید.");
  }

  return response;
}

export async function getContacts(): Promise<Contact[]> {
  const response = await apiRequest("/contacts");

  if (!response.ok) {
    throw new Error("دریافت مخاطبان ناموفق بود.");
  }

  return response.json();
}

export async function createContact(
  data: ContactCreate,
): Promise<Contact> {
  const response = await apiRequest("/contacts", {
    method: "POST",
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(
      response.status === 403
        ? "شما اجازهٔ ثبت مخاطب را ندارید."
        : "ثبت مخاطب ناموفق بود.",
    );
  }

  return response.json();
}

export async function updateContact(
  id: number,
  data: ContactCreate,
): Promise<Contact> {
  const response = await apiRequest(`/contacts/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error("ویرایش مخاطب ناموفق بود.");
  }

  return response.json();
}

export async function deleteContact(id: number): Promise<void> {
  const response = await apiRequest(`/contacts/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("حذف مخاطب ناموفق بود.");
  }
}
