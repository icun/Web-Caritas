//api.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ConfigService } from './config.service';

@Injectable({
    providedIn: 'root'
})
export class ApiService {
    constructor(private http: HttpClient, private config: ConfigService) { }
    getMessage() {
        return this.http.get(
            `${this.config.getApiBaseUrl()}/api/message`);
    }
    getUsuarios(): Observable<any[]> {
    return this.http.get<any[]>(`${this.config.getApiBaseUrl()}/api/usuarios`);
  }
}