import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  pages: number;
}

export interface AdminUser {
  id: string;
  email: string;
  displayName: string;
  province: string | null;
  city: string | null;
  role: 'USER' | 'ADMIN';
  status: 'ACTIVO' | 'SUSPENDIDO' | 'ELIMINADO';
  emailVerifiedAt: string | null;
  createdAt: string;
  sellerProfile: { accountType: string; status: string } | null;
  _count: { listings: number; reportsReceived: number };
}

export interface AdminCategory {
  id: string;
  parentId: string | null;
  name: string;
  slug: string;
  order: number;
  active: boolean;
  _count?: { listings: number };
  children?: AdminCategory[];
}

export interface AdminBrand {
  id: string;
  name: string;
  slug: string;
  active: boolean;
  _count: { listings: number };
}

export interface AdminSetting {
  key: string;
  label: string;
  description: string;
  value: any;
  updatedAt: string | null;
}

export interface AuditItem {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  before: unknown;
  after: unknown;
  reason: string | null;
  createdAt: string;
  actor: { id: string; displayName: string; email: string } | null;
}

const clean = (o: Record<string, string | number | undefined>) => {
  let p = new HttpParams();
  for (const [k, v] of Object.entries(o)) if (v !== undefined && v !== '') p = p.set(k, String(v));
  return p;
};

@Injectable({ providedIn: 'root' })
export class AdminApi {
  private readonly http = inject(HttpClient);
  private readonly base = '/api/admin';

  users(q: { q?: string; status?: string; page?: number }) {
    return firstValueFrom(this.http.get<Page<AdminUser>>(`${this.base}/users`, { params: clean(q) }));
  }
  setUserStatus(id: string, status: 'ACTIVO' | 'SUSPENDIDO', reason: string) {
    return firstValueFrom(this.http.patch<AdminUser>(`${this.base}/users/${id}/status`, { status, reason }));
  }

  categories() {
    return firstValueFrom(this.http.get<AdminCategory[]>(`${this.base}/categories`));
  }
  createCategory(data: { name: string; parentId?: string | null; order?: number }) {
    return firstValueFrom(this.http.post<AdminCategory>(`${this.base}/categories`, data));
  }
  updateCategory(id: string, data: Partial<Pick<AdminCategory, 'name' | 'parentId' | 'order' | 'active'>>) {
    return firstValueFrom(this.http.patch<AdminCategory>(`${this.base}/categories/${id}`, data));
  }

  brands() {
    return firstValueFrom(this.http.get<AdminBrand[]>(`${this.base}/brands`));
  }
  createBrand(name: string) {
    return firstValueFrom(this.http.post<AdminBrand>(`${this.base}/brands`, { name }));
  }
  updateBrand(id: string, data: Partial<Pick<AdminBrand, 'name' | 'active'>>) {
    return firstValueFrom(this.http.patch<AdminBrand>(`${this.base}/brands/${id}`, data));
  }

  settings() {
    return firstValueFrom(this.http.get<AdminSetting[]>(`${this.base}/settings`));
  }
  updateSetting(key: string, value: unknown, reason?: string) {
    return firstValueFrom(this.http.put(`${this.base}/settings/${key}`, { value, reason }));
  }

  audit(q: { page?: number; entityType?: string }) {
    return firstValueFrom(this.http.get<Page<AuditItem>>(`${this.base}/audit`, { params: clean(q) }));
  }
}
