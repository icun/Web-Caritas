import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, BehaviorSubject, Observable } from 'rxjs';
import * as jwt_decode from 'jwt-decode'; // usar namespace import
const API_BASE = 'http://localhost:3000'; // <--- add
@Injectable({ providedIn: 'root' })
export class AuthService {
  private storageKey = 'app_jwt';
  private _auth$: BehaviorSubject<boolean>;
  public auth$: Observable<boolean>;
  

  constructor(private http: HttpClient) {
    // no llamar a localStorage en tiempo de declaración (evita SSR crash)
    const hasToken = (typeof window !== 'undefined' && !!window.localStorage.getItem(this.storageKey));
    this._auth$ = new BehaviorSubject<boolean>(hasToken);
    this.auth$ = this._auth$.asObservable();
    console.log('AuthService initialized, hasToken=', hasToken);
  }

  token(): string | null {
    if (typeof window === 'undefined') return null;
    try {
      return window.localStorage.getItem(this.storageKey);
    } catch {
      return null;
    }
  }

  setToken(t: string | null) {
    if (typeof window !== 'undefined') {
      try {
        if (t) window.localStorage.setItem(this.storageKey, t);
        else window.localStorage.removeItem(this.storageKey);
      } catch (e) {
        console.error('setToken error', e);
      }
    }
    this._auth$.next(!!t);
    console.log('AuthService.setToken ->', !!t);
  }

 

  async login(email: string, password: string): Promise<boolean> {
    try {
       
      const resp = await firstValueFrom(this.http.post<{ token: string }>(
        `${API_BASE}/api/login`, // <-- use full backend URL
        { email, password }
      ));
      console.log('AuthService.login response', resp);
      if (resp && resp.token) {
        this.setToken(resp.token);
        return true;
      }
      return false;
    } catch (err) {
      console.error('AuthService.login error', err);
      return false;
    }
  }

  logout() {
    this.setToken(null);
  }

  isAuthenticated(): boolean {
    return !!this.token();
  }

  getCurrentUser(): any | null {
    const t = this.token();
    if (!t) return null;
    try { return (jwt_decode as any)(t); } catch { return null; }
  }
}