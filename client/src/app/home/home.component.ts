import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../auth.service';
import { TecnicoAcogidaService } from '../tecnicoacogida/tecnicoacogida-list/tecnico.service';
import { CentroService } from '../parroquias/parroquia-list/centro.service';
import { ArciprestazgoService } from '../arciprestazgos/arciprestazgo-list/arciprestazgo.service';
import { Router } from '@angular/router'; // <-- añadido

@Component({
  selector: 'app-home',
  standalone: true,
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  imports: [CommonModule, FormsModule]
})
export class HomeComponent implements OnInit {
  fecha: string = '';
  tecnico_acogida: string = '';
  tecnicos: Array<{ id: string, nombre: string }> = [];
  centros: Array<{ id: string, nombre: string }> = [];
  arciprestazgos: Array<{ id: string, nombre: string }> = [];

  sendingEmail = false;

  constructor(
    private tecnicoService: TecnicoAcogidaService,
    private centroService: CentroService,
    private arciprestazgoService: ArciprestazgoService,
    private http: HttpClient,
    private auth: AuthService,
    private router: Router // <-- inyectado
  ) {}

  ngOnInit() {
    // cargar técnicos
    this.tecnicoService.getTecnicos().subscribe((data: any[]) => {
      this.tecnicos = (data || []).map((t: any, i: number) => {
        const id = t.DNI ?? t.id ?? String(i);
        const nombreParts: string[] = [];
        if (t.Nombre) nombreParts.push(t.Nombre);
        if (t.Apellido_1) nombreParts.push(t.Apellido_1);
        if (t.Apellido_2) nombreParts.push(t.Apellido_2);
        const nombre = nombreParts.length ? nombreParts.join(' ') : (t.nombre_tecnico ?? t.nombre ?? t.Email ?? 'Sin nombre');
        return { id, nombre };
      });

      // si es técnico, auto-seleccionar su id (si coincide con algún técnico)
      if (this.isTecnico()) {
        const user = this.auth.getCurrentUser();
        const match = this.tecnicos.find(t => String(t.id) === String(user?.username) || t.nombre === user?.username);
        if (match) this.tecnico_acogida = match.id;
      }
    }, (err: any) => console.error('error getTecnicos', err));

    // cargar centros / arciprestazgos (si los usas)
    this.centroService.getCentros().subscribe((data: any[]) => {
      this.centros = (data || []).map((c: any, i: number) => ({
        id: c.idunidad ?? c.id ?? String(i),
        nombre: c.nombre ?? c.Nombre ?? c.nombre_centro ?? 'Sin nombre'
      }));
    }, (err: any) => console.error('error getCentros', err));

    this.arciprestazgoService.getArciprestazgos().subscribe((data: any[]) => {
      this.arciprestazgos = (data || []).map((a: any, i: number) => ({
        id: a.id_arciprestazgo ?? a.id ?? String(i),
        nombre: a.arciprestazgo ?? a.nombre ?? 'Sin nombre'
      }));
    }, (err: any) => console.error('error getArciprestazgos', err));
  }

  isAdmin(): boolean {
    const u = this.auth.getCurrentUser();
    return !!(u && (u.roles || []).includes('admin'));
  }

  isTecnico(): boolean {
    const u = this.auth.getCurrentUser();
    return !!(u && (u.roles || []).includes('user'));
  }

  // descarga CSV general (admin puede filtrar por técnico; técnico descarga su CSV usando this.tecnico_acogida)
  downloadCsv(): void {
    const params: string[] = [];
    if (this.fecha) params.push(`fecha=${encodeURIComponent(this.fecha)}`);
    if (this.tecnico_acogida) params.push(`tecnico=${encodeURIComponent(this.tecnico_acogida)}`);
    const url = 'http://localhost:3000/api/lista-csv' + (params.length ? '?' + params.join('&') : '');

    const tecnicoNombre = (this.tecnicos.find(t => t.id === this.tecnico_acogida)?.nombre) ?? 'todos';
    const fechaSafe = this.fecha || new Date().toISOString().slice(0,10);
    const filename = `lista_${tecnicoNombre}_${fechaSafe}.csv`.replace(/\s+/g,'_').replace(/[^a-zA-Z0-9_\-\.]/g,'');

    this.http.get(url, { responseType: 'blob' }).subscribe({
      next: (blob: Blob) => {
        const link = document.createElement('a');
        const objUrl = URL.createObjectURL(blob);
        link.href = objUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(objUrl);
      },
      error: (err: any) => {
        console.error('Error descargando CSV', err);
        alert('Error al descargar CSV: ' + (err?.message || err));
      }
    });
  }

  // admin -> envía CSV (fecha+tecnico) al email indicado
  sendCsvToEmailAdmin(): void {
    if (!this.isAdmin()) { alert('No autorizado'); return; }
    const tecnicoNombre = this.tecnicos.find(t => t.id === this.tecnico_acogida)?.nombre ?? 'Todos';
    const fechaSafe = this.fecha || 'todas las fechas';
    const email = window.prompt(`Email destinatario para (${tecnicoNombre} - ${fechaSafe}):`, '');
    if (!email) return;
    if (!confirm(`Enviar CSV a ${email}?\nTécnico: ${tecnicoNombre}\nFecha: ${fechaSafe}`)) return;

    this.sendingEmail = true;
    this.http.post('/api/email-csv-filter', { fecha: this.fecha, tecnico: this.tecnico_acogida, email }).subscribe({
      next: () => { this.sendingEmail = false; alert('Correo enviado correctamente'); },
      error: (err: any) => { this.sendingEmail = false; console.error(err); alert('Error al enviar correo'); }
    });
  }

  logout() {
    this.auth.logout();
    this.router.navigateByUrl('/login');
  }

  // técnico -> envía su CSV por fecha al email indicado (envía usando su id)
  sendCsvToEmailTecnico(): void {
    if (!this.isTecnico()) { alert('No autorizado'); return; }
    if (!this.fecha) { alert('Selecciona una fecha'); return; }

    // asegurar tecnico_acogida está definido como su id
    const user = this.auth.getCurrentUser();
    if (!this.tecnico_acogida) {
      // intentar resolver
      const match = this.tecnicos.find(t => String(t.id) === String(user?.username) || t.nombre === user?.username);
      if (match) this.tecnico_acogida = match.id;
    }

    const tecnicoNombre = this.tecnicos.find(t => t.id === this.tecnico_acogida)?.nombre ?? (user?.username ?? 'técnico');
    const fechaSafe = this.fecha;
    const email = window.prompt(`Email destinatario para (${tecnicoNombre} - ${fechaSafe}):`, '');
    if (!email) return;
    if (!confirm(`Enviar CSV a ${email}?\nTécnico: ${tecnicoNombre}\nFecha: ${fechaSafe}`)) return;

    this.sendingEmail = true;
    this.http.post('/api/email-csv-filter', { fecha: this.fecha, tecnico: this.tecnico_acogida, email }).subscribe({
      next: () => { this.sendingEmail = false; alert('Correo enviado correctamente'); },
      error: (err: any) => { this.sendingEmail = false; console.error(err); alert('Error al enviar correo'); }
    });
  }
}