import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { TecnicoListComponent } from './tecnicos/tecnico-list/tecnico-list.component';
import { ArciprestazgoListComponent } from './arciprestazgos/arciprestazgo-list/arciprestazgo-list.component';
import { ParroquiaListComponent } from './parroquias/parroquia-list/parroquia-list.component';
import { ListaCsvComponent } from './lista-csv/lista-csv.component';

const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'tecnicos', component: TecnicoListComponent },
  { path: 'arciprestazgos', component: ArciprestazgoListComponent },
  { path: 'parroquias', component: ParroquiaListComponent },
   { path: 'lista-csv', component: ListaCsvComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}