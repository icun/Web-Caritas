import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ConfigService } from '../config.service';

@Injectable({ providedIn: 'root' })
export class ListaCsvService {
  constructor(private http: HttpClient, private config: ConfigService) {}

  getLista(fecha: string, tecnico: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.config.getApiBaseUrl()}/api/lista-csv`, {
      params: { fecha, tecnico }
    });
  }
}