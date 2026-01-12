import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class RegistroService {
  private base = 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

  getRegistros(): Observable<any[]> {
    return this.http.get<any[]>('http://localhost:3000/api/registro'); // relativo -> proxy redirige a :3000
  }

  guardarRegistro(datos: any): Observable<any> {
    return this.http.post<any>(`http://localhost:3000/api/registro`, datos);
  }

  // util: descarga CSV con filtros
  getListaCsv(fecha?: string, tecnico?: string): Observable<Blob> {
    const params = new URLSearchParams();
    if (fecha) params.set('fecha', fecha);
    if (tecnico) params.set('tecnico', tecnico);
    const q = params.toString() ? `?${params.toString()}` : '';
    return this.http.get(`http://localhost:3000/api/lista-csv${q}`, { responseType: 'blob' });
  }
}