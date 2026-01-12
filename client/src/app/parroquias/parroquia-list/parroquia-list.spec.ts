import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ParroquiaListComponent } from './parroquia-list.component';

describe('ParroquiaList', () => {
  let component: ParroquiaListComponent;
  let fixture: ComponentFixture<ParroquiaListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ParroquiaListComponent]
      
    })
    .compileComponents();

    fixture = TestBed.createComponent(ParroquiaListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
