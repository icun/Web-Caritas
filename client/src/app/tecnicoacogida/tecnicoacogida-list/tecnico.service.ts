import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ 
  providedIn: 'root' 
})
export class TecnicoAcogidaService {
  constructor(private http: HttpClient) {}
  getTecnicos(): Observable<any[]> {
    return this.http.get<any[]>('http://localhost:3000/api/tecnicoAcogida');
  }
}