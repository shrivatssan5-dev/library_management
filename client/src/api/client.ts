const API_BASE = '/api';

function getToken(): string | null {
  return localStorage.getItem('token');
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || 'Request failed');
  }

  return data as T;
}

export interface Librarian {
  id: number;
  email: string;
  name: string;
}

export interface Book {
  id: number;
  title: string;
  author: string;
  isbn: string | null;
  genre: string | null;
  copies_total: number;
  copies_available: number;
}

export interface Member {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  membership_number: string;
}

export interface Borrowing {
  id: number;
  book_id: number;
  member_id: number;
  due_date: string;
  status: 'active' | 'returned' | 'overdue';
  borrowed_at: string;
  returned_at: string | null;
  book_title?: string;
  book_author?: string;
  member_name?: string;
  membership_number?: string;
  librarian_name?: string;
}

export interface DashboardStats {
  totalBooks: number;
  totalMembers: number;
  activeBorrowings: number;
  overdueBorrowings: number;
  upcomingDue: Array<{
    id: number;
    title: string;
    member_name: string;
    due_date: string;
    status: string;
  }>;
}

export const api = {
  login: (email: string, password: string) =>
    request<{ token: string; librarian: Librarian }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  me: () => request<{ librarian: Librarian }>('/auth/me'),

  getBooks: (search = '') =>
    request<Book[]>(`/books?search=${encodeURIComponent(search)}`),

  createBook: (data: Omit<Book, 'id' | 'copies_available'>) =>
    request<Book>('/books', { method: 'POST', body: JSON.stringify(data) }),

  updateBook: (id: number, data: Partial<Book>) =>
    request<Book>(`/books/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  deleteBook: (id: number) =>
    request<void>(`/books/${id}`, { method: 'DELETE' }),

  getMembers: (search = '') =>
    request<Member[]>(`/members?search=${encodeURIComponent(search)}`),

  createMember: (data: Omit<Member, 'id'>) =>
    request<Member>('/members', { method: 'POST', body: JSON.stringify(data) }),

  updateMember: (id: number, data: Partial<Member>) =>
    request<Member>(`/members/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  deleteMember: (id: number) =>
    request<void>(`/members/${id}`, { method: 'DELETE' }),

  getBorrowings: (status = 'all') =>
    request<Borrowing[]>(`/borrowings?status=${status}`),

  issueBook: (data: { book_id: number; member_id: number; due_date: string }) =>
    request<Borrowing>('/borrowings', { method: 'POST', body: JSON.stringify(data) }),

  returnBook: (id: number) =>
    request<Borrowing>(`/borrowings/${id}/return`, { method: 'POST' }),

  getDashboardStats: () => request<DashboardStats>('/dashboard/stats'),
};
