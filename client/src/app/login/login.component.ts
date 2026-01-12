import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html'
})
export class LoginComponent implements OnInit, OnDestroy {
  username = '';
  password = '';
  error = '';
  loading = false;
  private sub?: Subscription;

  constructor(public auth: AuthService, private router: Router) {}

  ngOnInit(): void {
    // si ya hay sesión redirige fuera de /login
    if (this.auth.isAuthenticated && this.auth.isAuthenticated()) {
      this.router.navigateByUrl('/');
      return;
    }
    // si cambia a autenticado, redirigir
    this.sub = this.auth.auth$?.subscribe?.((isAuth: boolean) => {
      if (isAuth) this.router.navigateByUrl('/');
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  async submit(e?: Event) {
    if (e) e.preventDefault();
    this.error = '';
    this.loading = true;
    try {
      const ok = await this.auth.login(this.username, this.password);
      if (ok) { await this.router.navigateByUrl('/'); return; }
      this.error = 'Credenciales inválidas';
    } catch {
      this.error = 'Error en login';
    } finally { this.loading = false; }
  }

  logout() {
    this.auth.logout();
    this.router.navigateByUrl('/login');
  }
}