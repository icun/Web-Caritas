import { Component , OnInit} from '@angular/core';
import { TecnicoService } from './tecnico.service';

@Component({
  selector: 'app-tecnico-list',
  standalone: true,
  templateUrl: './tecnico-list.component.html',
  styleUrls: ['./tecnico-list.component.css']
})
export class TecnicoListComponent implements OnInit {
  tecnicos: any[] = [];
  constructor(private tecnicoService: TecnicoService) {}
  ngOnInit() {
    this.tecnicoService.getTecnicos().subscribe(data => this.tecnicos = data);
  }}