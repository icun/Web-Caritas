import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ArciprestazgoService {
  constructor(private http: HttpClient) {}
  getArciprestazgos(): Observable<any[]> {
    return this.http.get<any[]>('http://localhost:3000/api/arciprestazgos');
  }
}