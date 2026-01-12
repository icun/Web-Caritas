import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class RegistroService {

   private base = 'http://localhost:3000/api/registro';

  constructor(private http: HttpClient) {}

  guardarRegistro(datos: any): Observable<any> {
    return this.http.post<any>(this.base, datos);
  }

  getRegistros(): Observable<any[]> {
    return this.http.get<any[]>(this.base);
  }
}