//app.component.ts

import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterOutlet, Router } from '@angular/router';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { HomeComponent } from './home/home.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterOutlet, HomeComponent],
  templateUrl: './app.component.html'
})
export class AppComponent implements OnInit {
  public showAppHtml = false; // <-- nueva bandera

  // Propiedades del formulario para user@example.com
  fecha_atencion: string | null = null;
  tipo_entrada: string | null = null;
  tipo_persona: string | null = null;
  nombre: string | null = null;
  apellido1: string | null = null;
  apellido2: string | null = null;
  sexo: string | null = null;
  tipo_documento: string | null = null;
  num_documento: string | null = null;
  pais_origen: string | null = null;
  recien_llegado: string | null = null;
  meses_espana: number | null = null;
  movil1: string | null = null;
  movil2: string | null = null;
  correo_electronico: string | null = null;
  direccion_completa: string | null = null;
  centro: string | null = null;
  arciprestazgo: string | null = null;
  tipo_derivacion: string | null = null;
  observaciones: string | null = null;

  tecnicos: any[] = [];
  arciprestazgos: any[] = [];
  centros: any[] = [];

  selectedTecnicoId: string | null = null;
  selectedTecnico: any | null = null;
  isTecnico = false; // <-- nueva propiedad
  currentUserId: any = null; // <-- guardar ID del técnico actual
  registros: any[] = [];
  isAuthenticated$: Observable<boolean>;

  // nuevo: id esperado por el usuario (puede ser DNI, id, etc.)
  private desiredTecnicoId: string | null = null;
  // nuevo: email esperado (si queremos emparejar por correo)
  private desiredTecnicoEmail: string | null = null;

  // edición UI
  editingPanelVisible = false;
  editingPanelTarget: 'tecnicos' | 'arciprestazgos' | 'centros' | null = null;
  // opcional: id que queremos resaltar/centrar en el panel
  editingHighlightId: any = null;
  // nuevos campos temporales para crear
  newTecnicoNombre = '';
  newTecnicoApellidos = '';
  newArciprestazgoNombre = '';
  newCentroNombre = '';

  // nueva propiedad
  isAdmin = false;

  constructor(
    public auth: AuthService,
    private router: Router,
    private http: HttpClient,
    private cd: ChangeDetectorRef
  ) {
    this.isAuthenticated$ = this.auth.auth$;
  }

  ngOnInit(): void {
    this.auth.auth$.subscribe(isAuth => {
      console.log('auth ->', isAuth);
      if (isAuth) {
        let user: any = null;
        try {
          if (typeof this.auth.getCurrentUser === 'function') user = this.auth.getCurrentUser();
          else if ((this.auth as any).currentUser) user = (this.auth as any).currentUser;
        } catch { user = null; }

        if (!user) {
          const token = typeof this.auth.token === 'function' ? this.auth.token() : null;
          if (token) {
            try { user = JSON.parse(atob(String(token).split('.')[1])); } catch { user = null; }
          }
        }

        const userEmail = String(user?.email ?? user?.Email ?? user?.correo ?? '').toLowerCase().trim();
        this.showAppHtml = userEmail === 'user@example.com';
        
        // Detectar si es ADMIN o TECNICO
        this.isAdmin = userEmail === 'admin@example.com';
        this.isTecnico = userEmail !== 'admin@example.com' && userEmail !== 'user@example.com';
        
        // Guardar ID y EMAIL del usuario actual
        this.currentUserId = user?.id ?? user?.ID ?? user?.sub ?? user?.userId ?? null;

        console.log('userEmail=', userEmail, ' showAppHtml=', this.showAppHtml, ' isAdmin=', this.isAdmin, ' isTecnico=', this.isTecnico, ' currentUserId=', this.currentUserId);

        // cargas habituales
        this.loadTecnicos();
        this.loadArciprestazgos();
        this.loadCentros();
        this.loadAppData();

        // Si es técnico, preseleccionar su técnico por EMAIL después de cargar la lista
        if (this.isTecnico) {
          setTimeout(() => {
            const tecnicoActual = this.tecnicos.find(t => 
              String(t.email ?? t._raw?.email ?? t._raw?.Email ?? t._raw?.Correo ?? '').toLowerCase().trim() === userEmail
            );
            if (tecnicoActual) {
              this.selectedTecnicoId = String(tecnicoActual.id);
              console.log('Técnico preseleccionado:', this.selectedTecnicoId, tecnicoActual.nombre);
            } else {
              console.warn('No se encontró técnico con email:', userEmail);
            }
            try { this.cd.detectChanges(); } catch {}
          }, 500);
        }

      } else {
        this.showAppHtml = false;
        this.isAdmin = false;
        this.isTecnico = false;
        this.currentUserId = null;
      }
    });
  }

  // Normaliza y carga técnicos (ya existía, mantén/usa esta versión)
  loadTecnicos(): void {
    const url = 'http://localhost:3000/api/tecnicoAcogida';
    this.http.get<any[]>(url).subscribe({
      next: data => {
        const arr = Array.isArray(data) ? data : [];
        this.tecnicos = arr.map((t, i) => ({
          id: t.id ?? t.ID ?? t._id ?? t.DNI ?? i,
          nombre: (t.Nombre ?? t.nombre ?? '').toString(),
          apellidos: (t.Apellido_1 ?? t.Apellido_2 ?? t.apellidos ?? '').toString(),
          email: (t.email ?? t.Email ?? t.Correo ?? '').toString(),
          _raw: t
        }));
        try { this.cd.detectChanges(); } catch {}
      },
      error: err => {
        console.error('loadTecnicos error', err);
        this.tecnicos = [];
      }
    });
  }

  // Nueva: cargar arciprestazgos
  loadArciprestazgos(): void {
    const url = 'http://localhost:3000/api/arciprestazgos';
    this.http.get<any[]>(url).subscribe({
      next: data => {
        const arr = Array.isArray(data) ? data : [];
        this.arciprestazgos = arr.map((a, i) => ({
          id: a.id ?? a.id_arciprestazgo ?? a._id ?? i,
          nombre: (a.arciprestazgo ?? a.nombre ?? a.name ?? '').toString(),
          _raw: a
        }));
        try { this.cd.detectChanges(); } catch {}
      },
      error: err => {
        console.error('loadArciprestazgos error', err);
        this.arciprestazgos = [];
      }
    });
  }

  // Nueva: cargar centros/servicios
  loadCentros(): void {
    const url = 'http://localhost:3000/api/centros';
    this.http.get<any[]>(url).subscribe({
      next: data => {
        const arr = Array.isArray(data) ? data : [];
        this.centros = arr.map((c, i) => ({
          id: c.id ?? c._id ?? c.id_centro ?? i,
          nombre: (c.centro ?? c.nombre ?? c.name ?? '').toString(),
          _raw: c
        }));
        try { this.cd.detectChanges(); } catch {}
      },
      error: err => {
        console.error('loadCentros error', err);
        this.centros = [];
      }
    });
  }

  // método robusto para seleccionar y mostrar ficha
 

  // conserva el antiguo por compatibilidad si lo usas en otros sitios
  viewTecnico(): void {
    if (!this.selectedTecnicoId) {
      this.selectedTecnico = null;
      return;
    }
    const t = this.tecnicos.find(x => String(x.id) === String(this.selectedTecnicoId));
    this.selectedTecnico = t ?? null;
    // forzar detección si hace falta
    try { this.cd.detectChanges(); } catch {}
  }

  viewTecnicoById(id: string | null): void {
    if (!id) {
      this.selectedTecnico = null;
      this.selectedTecnicoId = null;
      return;
    }
    this.selectedTecnicoId = String(id);
    const t = this.tecnicos.find(x => String(x.id) === String(this.selectedTecnicoId));
    this.selectedTecnico = t ?? null;
    try { this.cd.detectChanges(); } catch {}
  }

  closeFicha(): void {
    // sólo ocultar la ficha (objeto mostrado) pero mantener el id seleccionado en el select
    this.selectedTecnico = null;
    // no limpiar selectedTecnicoId para que el select siga mostrando el técnico seleccionado
    try { this.cd.detectChanges(); } catch {}
  }

  // helper para mostrar nombre + apellidos en la plantilla
  fullName(t: any): string {
    const n = t?.Nombre ?? t?.nombre ?? t?.firstName ?? '';
    const a1 = t?.Apellido_1 ?? t?.apellido ?? t?.lastName ?? '';
    const a2 = t?.Apellido_2 ?? t?.apellido2 ?? '';
    return `${n} ${a1} ${a2}`.trim();
  }

  loadAppData() {
    // carga inicial de registros (sin filtros)
    this.http.get<any[]>('http://localhost:3000/api/registro').subscribe(r => this.registros = r || []);
  }

  // abrir panel específico para la lista correspondiente
  openEditTecnicos(): void {
    this.editingPanelTarget = 'tecnicos';
    this.editingPanelVisible = true;
  }
  openEditArciprestazgos(): void {
    this.editingPanelTarget = 'arciprestazgos';
    this.editingPanelVisible = true;
  }
  openEditCentros(): void {
    this.editingPanelTarget = 'centros';
    this.editingPanelVisible = true;
  }

  closeEditingPanel(): void {
    this.editingPanelVisible = false;
    this.editingPanelTarget = null;
  }
  
  // refrescar todas las listas
  refreshAllLists(): void {
    this.loadTecnicos();
    this.loadArciprestazgos();
    this.loadCentros();
  }
  
  // TECNICOS: add / save / delete
  addTecnico(): void {
    const payload: any = { Nombre: this.newTecnicoNombre, Apellidos: this.newTecnicoApellidos, nombre: this.newTecnicoNombre, apellidos: this.newTecnicoApellidos };
    this.http.post<any>('http://localhost:3000/api/tecnicoAcogida', payload).subscribe({
      next: () => { this.newTecnicoNombre = ''; this.newTecnicoApellidos = ''; this.loadTecnicos(); },
      error: e => console.error('addTecnico error', e)
    });
  }

  // helper: devolver técnico con campos normalizados (y añade propiedades si faltan)
  getTecnicoById(id: any): any | null {
    if (!id) return null;
    const t = this.tecnicos.find(x => String(x.id) === String(id));
    if (!t) return null;
    this.ensureTecnicoFields(t);
    return t;
  }

  ensureTecnicoFields(t: any): void {
    if (!t) t = {};
    const r = t._raw || {};
    t.apellido1 = t.apellido1 ?? (r.Apellido_1 ?? r.apellido ?? '');
    t.apellido2 = t.apellido2 ?? (r.Apellido_2 ?? r.apellido2 ?? '');
    t.DNI = t.DNI ?? (r.DNI ?? r.dni ?? t.id ?? '');
    t.email = t.email ?? (r.Email ?? r.email ?? r.Correo ?? '');
    t.telf1 = t.telf1 ?? (r.Telf_1 ?? r.telefono ?? r.telefono1 ?? r.movil1 ?? '');
    // mantener nombre/apellidos normalizados
    t.nombre = t.nombre ?? (r.Nombre ?? r.nombre ?? '');
    t.apellidos = t.apellidos ?? (r.Apellido_1 ?? r.Apellido_2 ?? r.apellidos ?? '');
  }

  // actualizar saveTecnico para enviar todos los campos relevantes
  saveTecnico(t: any): void {
    if (!t) return;
    // asegurarse de que t tiene campos normalizados
    this.ensureTecnicoFields(t);

    const id = t.id;
    // construir payload combinando _raw con campos editados
    const base = t._raw && typeof t._raw === 'object' ? { ...t._raw } : {};
    const payload: any = {
      ...base,
      Nombre: t.nombre,
      Apellido_1: t.apellido1,
      Apellido_2: t.apellido2,
      DNI: t.DNI,
      Email: t.email,
      Telf_1: t.telf1,
      nombre: t.nombre,
      apellidos: t.apellidos
    };

    const url = id ? `http://localhost:3000/api/tecnicoAcogida/${id}` : 'http://localhost:3000/api/tecnicoAcogida';
    const req = id ? this.http.put<any>(url, payload) : this.http.post<any>(url, payload);
    req.subscribe({
      next: () => {
        this.loadTecnicos();
        // cerrar la ficha destacada si se estaba editando
        if (this.editingHighlightId && String(this.editingHighlightId) === String(id)) {
          this.editingHighlightId = null;
        }
      },
      error: e => console.error('saveTecnico error', e)
    });
  }

  deleteTecnico(id: any): void {
    if (!confirm('Borrar técnico?')) return;
    this.http.delete<any>(`http://localhost:3000/api/tecnicoAcogida/${id}`).subscribe({
      next: () => this.loadTecnicos(),
      error: e => console.error('deleteTecnico error', e)
    });
  }

  // ARCIPRESTAZGOS
  addArciprestazgo(): void {
    const payload = { arciprestazgo: this.newArciprestazgoNombre, nombre: this.newArciprestazgoNombre };
    this.http.post<any>('http://localhost:3000/api/arciprestazgos', payload).subscribe({
      next: () => { this.newArciprestazgoNombre = ''; this.loadArciprestazgos(); },
      error: e => console.error('addArciprestazgo error', e)
    });
  }

  saveArciprestazgo(a: any): void {
    const id = a.id;
    const payload = { arciprestazgo: a.nombre, nombre: a.nombre };
    const url = id ? `http://localhost:3000/api/arciprestazgos/${id}` : 'http://localhost:3000/api/arciprestazgos';
    const req = id ? this.http.put<any>(url, payload) : this.http.post<any>(url, payload);
    req.subscribe({ next: () => this.loadArciprestazgos(), error: e => console.error('saveArciprestazgo error', e) });
  }

  deleteArciprestazgo(id: any): void {
    if (!confirm('Borrar arciprestazgo?')) return;
    this.http.delete<any>(`http://localhost:3000/api/arciprestazgos/${id}`).subscribe({
      next: () => this.loadArciprestazgos(),
      error: e => console.error('deleteArciprestazgo error', e)
    });
  }

  // CENTROS
  addCentro(): void {
    const payload = { centro: this.newCentroNombre, nombre: this.newCentroNombre };
    this.http.post<any>('http://localhost:3000/api/centros', payload).subscribe({
      next: () => { this.newCentroNombre = ''; this.loadCentros(); },
      error: e => console.error('addCentro error', e)
    });
  }

  saveCentro(c: any): void {
    const id = c.id;
    const payload = { centro: c.nombre, nombre: c.nombre };
    const url = id ? `http://localhost:3000/api/centros/${id}` : 'http://localhost:3000/api/centros';
    const req = id ? this.http.put<any>(url, payload) : this.http.post<any>(url, payload);
    req.subscribe({ next: () => this.loadCentros(), error: e => console.error('saveCentro error', e) });
  }

  deleteCentro(id: any): void {
    if (!confirm('Borrar centro?')) return;
    this.http.delete<any>(`http://localhost:3000/api/centros/${id}`).subscribe({
      next: () => this.loadCentros(),
      error: e => console.error('deleteCentro error', e)
    });
  }

  logout(): void {
    try { if (typeof this.auth.logout === 'function') this.auth.logout(); } catch {}
    try { this.router.navigateByUrl('/login'); } catch {}
  }

  guardar(): void {
    // Payload mínimo con los campos del formulario
    const payload: any = {
      fecha_atencion: this.fecha_atencion,
      tipo_entrada: this.tipo_entrada,
      tipo_persona: this.tipo_persona,
      nombre: this.nombre,
      apellido1: this.apellido1,
      apellido2: this.apellido2,
      sexo: this.sexo,
      tipo_documento: this.tipo_documento,
      num_documento: this.num_documento,
      pais_origen: this.pais_origen,
      recien_llegado: this.recien_llegado,
      meses_espana: this.meses_espana,
      movil1: this.movil1,
      movil2: this.movil2,
      correo_electronico: this.correo_electronico,
      direccion_completa: this.direccion_completa,
      centro: this.centro,
      tecnicoId: this.selectedTecnicoId,
      arciprestazgo: this.arciprestazgo,
      tipo_derivacion: this.tipo_derivacion,
      observaciones: this.observaciones
    };

    // Ajusta la URL si tu endpoint es distinto (POST para crear registro)
    this.http.post<any>('http://localhost:3000/api/registro', payload).subscribe({
      next: res => {
        console.log('Registro guardado', res);
        // refrescar datos si procede
        this.loadAppData();
      },
      error: err => {
        console.error('Error guardando registro', err);
      }
    });
  }

  editFichaTecnico(id: any): void {
    if (!id) return;
    // asegurar que tenemos la lista cargada
    if (!this.tecnicos?.length) {
      this.loadTecnicos();
    }
    // seleccionar técncio en el select
    this.selectedTecnicoId = String(id);
    // localizar objeto y asignar selectedTecnico para ficha rápida
    const t = this.tecnicos.find(x => String(x.id) === String(id));
    this.selectedTecnico = t ?? null;

    // abrir panel de edición solo para técnicos
    this.editingPanelTarget = 'tecnicos';
    this.editingPanelVisible = true;
    this.editingHighlightId = id;

    // opcional: scroll al elemento dentro del panel tras abrir (requiere que el template tenga ids)
    setTimeout(() => {
      try {
        const el = document.querySelector(`[data-tecnico-id="${id}"]`);
        if (el) (el as HTMLElement).scrollIntoView({ block: 'center', behavior: 'smooth' });
      } catch (e) { /* ignore */ }
    }, 200);
  }
}

