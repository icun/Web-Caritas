import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ListaCsvService } from './lista-csv.service';

@Component({
  selector: 'app-lista-csv',
  standalone: true,
  templateUrl: './lista-csv.component.html',
  styleUrls: ['./lista-csv.component.css'],
  imports: [FormsModule]
})
export class ListaCsvComponent {
  fecha: string = '';
  tecnico: string = '';
  tecnicos: any[] = [];
  lista: any[] = [];
  columnas: string[] = [];


  constructor(private listaCsvService: ListaCsvService) {}

  filtrar() {
    this.listaCsvService.getLista(this.fecha, this.tecnico).subscribe(data => {
      this.lista = data;
      this.columnas = data.length ? Object.keys(data[0]) : [];
    });
  }
}
