import { ChangeDetectorRef, Component, DestroyRef, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, ɵInternalFormsSharedModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { BehaviorSubject, Observable, finalize } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { apiFailure, describeApiFailure } from '../../../core/security/api-error';
import { Auth } from '../../../core/services/auth/auth';
import { CommonModule, NgClass } from '@angular/common';


@Component({
  selector: 'app-register',
  imports: [RouterLink, ɵInternalFormsSharedModule,ReactiveFormsModule, NgClass,CommonModule],
  templateUrl: './register.html',
  styleUrl: './register.css'
})
export class Register {
  RegForm!:FormGroup;
  private readonly destroyRef = inject(DestroyRef);
  readonly busy = signal(false);

  private errorSubject = new BehaviorSubject<string>("");
  
  error$: Observable<string> = this.errorSubject.asObservable();

  constructor(private auth:Auth,private fb:FormBuilder,private cdr: ChangeDetectorRef){}

  ngOnInit(){
    this.RegForm = this.fb.group({
      nombres:['',Validators.required],
      apellidos:['',Validators.required],
      usuario:['',Validators.required],
      correo:['',Validators.required],
      contra:['',[Validators.required, Validators.minLength(15)]],
      confirm:['',Validators.required]

    });
  }

  Register(){
    if (this.busy()) return;
    this.cdr.detectChanges();
    if(this.RegForm.invalid){
      this.RegForm.markAllAsTouched();
      return;
    }

    this.busy.set(true);
    this.errorSubject.next('');
    this.auth.register(this.RegForm.value).pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.busy.set(false))).subscribe({
      next: (response) =>{
        this.RegForm.reset();


      },
      error: (err) =>{
        this.errorSubject.next(describeApiFailure(apiFailure(err)));
      }
    });
  }
}
