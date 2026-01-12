import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(private auth: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    const user = this.auth.getCurrentUser();
    if (!user) {
      this.router.navigate(['/login']);
      return false;
    }
    const roles = user.roles || [];
    const allowed = roles.includes('admin') || roles.includes('user'); // 'user' = técnico
    if (!allowed) {
      this.router.navigate(['/login']);
      return false;
    }
    return true;
  }
}