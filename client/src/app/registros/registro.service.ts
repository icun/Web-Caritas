import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ConfigService } from '../config.service';

@Injectable({ providedIn: 'root' })
export class RegistroService {
  constructor(private http: HttpClient, private config: ConfigService) {}

  private getBase() {
    return `${this.config.getApiBaseUrl()}/api`;
  }

  getRegistros(): Observable<any[]> {
    return this.http.get<any[]>(`${this.getBase()}/registro`);
  }

  guardarRegistro(datos: any): Observable<any> {
    return this.http.post<any>(`${this.getBase()}/registro`, datos);
  }

  // util: descarga CSV con filtros
  getListaCsv(fecha?: string, tecnico?: string): Observable<Blob> {
    const params = new URLSearchParams();
    if (fecha) params.set('fecha', fecha);
    if (tecnico) params.set('tecnico', tecnico);
    const q = params.toString() ? `?${params.toString()}` : '';
    return this.http.get(`${this.getBase()}/lista-csv${q}`, { responseType: 'blob' });
  }
}