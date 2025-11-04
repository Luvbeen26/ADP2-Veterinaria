import { ChangeDetectorRef, Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, ɵInternalFormsSharedModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
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

  private errorSubject = new BehaviorSubject<string>("");
  
  error$: Observable<string> = this.errorSubject.asObservable();

  constructor(private router:Router,private auth:Auth,private fb:FormBuilder,private cdr: ChangeDetectorRef){}

  ngOnInit(){
    this.RegForm = this.fb.group({
      nombres:['',Validators.required],
      apellidos:['',Validators.required],
      usuario:['',Validators.required],
      correo:['',Validators.required],
      contra:['',Validators.required],
      confirm:['',Validators.required]

    });
  }

  Register(){
    console.log("register")
    this.cdr.detectChanges();
    if(this.RegForm.invalid){
      this.RegForm.markAllAsTouched();
      return;
    }

    this.auth.register(this.RegForm.value).subscribe({
      next: (response) =>{
        console.log("registro exitoso")
        this.router.navigate(["/"]);

      },
      error: (err) =>{
        console.log(err)
        const mensaje = err.error?.detail 
          ? err.error.detail.replace(/^\d+:\s*/, '') 
          : "Error al crear una cuenta";
        
        
        this.errorSubject.next(mensaje);
      }
    });
  }
}
