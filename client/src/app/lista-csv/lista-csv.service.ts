import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ListaCsvService {
  constructor(private http: HttpClient) {}

  getLista(fecha: string, tecnico: string): Observable<any[]> {
    return this.http.get<any[]>('http://localhost:3000/api/lista-csv', {
      params: { fecha, tecnico }
    });
  }
}