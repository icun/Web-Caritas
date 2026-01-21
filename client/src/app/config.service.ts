import { Injectable } from '@angular/core';

// API Configuration Service for dynamic backend URL routing
// Backend: Elastic Beanstalk endpoint for production

@Injectable({
  providedIn: 'root'
})
export class ConfigService {
  private apiBase: string;

  constructor() {
    this.apiBase = this.getApiUrl();
    console.log('ConfigService initialized with API URL:', this.apiBase);
  }

  private getApiUrl(): string {
    if (typeof window === 'undefined') {
      // SSR fallback
      return 'http://localhost:3000';
    }

    const protocol = window.location.protocol; // 'https:' o 'http:'
    const hostname = window.location.hostname;
    const port = window.location.port;

    // En desarrollo: localhost:4200 -> localhost:3000
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return `${protocol}//localhost:3000`;
    }
    
    // En producción: usar proxy local a través de Amplify
    // Esto evita problemas de Mixed Content (HTTPS -> HTTP)
    // El proxy está configurado en amplify.yml para redirigir /api/* a EB
    if (hostname.includes('dsdckejume7fb.amplifyapp.com')) {
      // Usar mismo dominio (HTTPS) - el proxy en Amplify redirige a EB
      return `${protocol}//${hostname}/api`;
    }
    
    // Fallback: usar la misma URL raíz
    return `${protocol}//${hostname}${port ? ':' + port : ''}`;
  }

  getApiBaseUrl(): string {
    return this.apiBase;
  }
}
