import { ChangeDetectorRef, Component } from '@angular/core';
import { Router, RouterLink } from "@angular/router";
import { Auth } from '../../../core/services/auth/auth';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { BehaviorSubject, Observable } from 'rxjs';


@Component({
  selector: 'app-login',
  imports: [RouterLink,ReactiveFormsModule,CommonModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
  loginForm!:FormGroup;

  private errorSubject = new BehaviorSubject<string>("");
  
  error$: Observable<string> = this.errorSubject.asObservable();

  constructor(private router:Router,private auth:Auth,private fb:FormBuilder,private cdr: ChangeDetectorRef){}

  ngOnInit(){
    this.loginForm = this.fb.group({
      usuario_mail:['',Validators.required],
      contra:['',Validators.required]
    });
  }

  Login(){
    
    this.cdr.detectChanges();
    if(this.loginForm.invalid){
      this.loginForm.markAllAsTouched();
      return;
    }

    this.auth.login(this.loginForm.value).subscribe({
      next: (response) =>{
        console.log("login exitoso")
        this.router.navigate(["/"]);

      },
      error: (err) =>{
        console.log(err)
        const mensaje = err.error?.detail 
          ? err.error.detail.replace(/^\d+:\s*/, '') 
          : "Error al iniciar sesión";
        
        
        this.errorSubject.next(mensaje);
      }
    });
  }
}
