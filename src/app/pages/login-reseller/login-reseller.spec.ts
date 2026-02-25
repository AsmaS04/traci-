import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LoginReseller } from './login-reseller';

describe('LoginReseller', () => {
  let component: LoginReseller;
  let fixture: ComponentFixture<LoginReseller>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginReseller]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LoginReseller);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
