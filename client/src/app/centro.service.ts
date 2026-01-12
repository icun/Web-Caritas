import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
@Injectable({ providedIn: 'root' })
export class CentroService {  
    constructor(private http: HttpClient) {}  
    getCentros() : Observable<any[]> {
    return this.http.get<any[]>('http://localhost:3000/api/centros'); // relativo -> proxy redirige a :3000
  }
}