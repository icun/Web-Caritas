//api.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class ApiService {
    constructor(private http: HttpClient) { }
    getMessage() {
        return this.http.get(
            'http://localhost:3000/api/message');
    }
    getUsuarios(): Observable<any[]> {
    return this.http.get<any[]>(`http://localhost:3000/api/usuarios`);
  }
}