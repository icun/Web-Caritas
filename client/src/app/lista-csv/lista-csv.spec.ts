import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListaCsvComponent} from  './lista-csv.component';

describe('ListaCsv', () => {
  let component: ListaCsvComponent;
  let fixture: ComponentFixture<ListaCsvComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListaCsvComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListaCsvComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
