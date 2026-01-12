import { provideRouter, Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { TecnicoListComponent } from './tecnicos/tecnico-list/tecnico-list.component';
import { ArciprestazgoListComponent } from './arciprestazgos/arciprestazgo-list/arciprestazgo-list.component';
import { ParroquiaListComponent } from './parroquias/parroquia-list/parroquia-list.component';
import { provideHttpClient } from '@angular/common/http';

const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'tecnicos', component: TecnicoListComponent },
  { path: 'arciprestazgos', component: ArciprestazgoListComponent },
  { path: 'parroquias', component: ParroquiaListComponent }
];

export const appConfig = {
  providers: [
  provideRouter(routes),
   provideHttpClient()
  ]
};