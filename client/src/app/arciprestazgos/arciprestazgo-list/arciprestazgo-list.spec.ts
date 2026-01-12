import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ArciprestazgoListComponent } from './arciprestazgo-list.component';

describe('ArciprestazgoList', () => {
  let component: ArciprestazgoListComponent;
  let fixture: ComponentFixture<ArciprestazgoListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ArciprestazgoListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ArciprestazgoListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
