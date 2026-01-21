import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ConfigService } from './config.service';

@Injectable({ providedIn: 'root' })
export class RegistroService {

  constructor(private http: HttpClient, private config: ConfigService) {}

  private getBase() {
    return `${this.config.getApiBaseUrl()}/api/registro`;
  }

  guardarRegistro(datos: any): Observable<any> {
    return this.http.post<any>(this.getBase(), datos);
  }

  getRegistros(): Observable<any[]> {
    return this.http.get<any[]>(this.getBase());
  }
}