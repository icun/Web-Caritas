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

    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    const port = window.location.port;

    // En desarrollo: localhost:4200 -> localhost:3000
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return `${protocol}//localhost:3000`;
    }
    
    // En producción: usar el backend de AWS Elastic Beanstalk
    if (hostname.includes('dsdckejume7fb.amplifyapp.com')) {
      return 'http://acogida-backend-env.eba-cwdpkgup.us-east-1.elasticbeanstalk.com';
    }
    
    // Fallback: usar la misma URL raíz
    return `${protocol}//${hostname}${port ? ':' + port : ''}`;
  }

  getApiBaseUrl(): string {
    return this.apiBase;
  }
}
