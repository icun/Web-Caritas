import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ConfigService } from './config.service';

@Injectable({ providedIn: 'root' })
export class TecnicoAcogidaService {
  constructor(private http: HttpClient, private config: ConfigService) {}
  getTecnicos(): Observable<any[]> {  return this.http.get<any[]>(`${this.config.getApiBaseUrl()}/api/tecnicoAcogida`); }
 
}