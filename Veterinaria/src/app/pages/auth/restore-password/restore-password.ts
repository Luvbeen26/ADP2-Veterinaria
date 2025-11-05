import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Auth } from '../../../core/services/auth/auth';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { BehaviorSubject, Observable } from 'rxjs';

@Component({
  selector: 'app-restore-password',
  imports: [ReactiveFormsModule, CommonModule, RouterLink],
  templateUrl: './restore-password.html',
  styleUrl: './restore-password.css'
})
export class RestorePassword {
  emailForm!: FormGroup;
  private errorSubject = new BehaviorSubject<string>("");
    
  error$: Observable<string> = this.errorSubject.asObservable();


  constructor(private fb:FormBuilder,private auth:Auth,private router:Router){
    this.emailForm=this.fb.group({
      correo:['',[Validators.required,Validators.email]]
    });
  }

  Send_email(){
    if(this.emailForm.invalid){
      this.emailForm.markAllAsTouched();
      return;
    }
    const correo=this.emailForm.get('correo')?.value
    this.auth.send_email(correo).subscribe({
      next: (response) =>{
        console.log("mandado")
        this.router.navigate(["/confirm-code"], { 
          state: { correo: correo } 
        });
      },
      error: (err) =>{
        console.log(err)
        const mensaje = err.error?.detail 
          ? err.error.detail.replace(/^\d+:\s*/, '') 
          : "Error al iniciar sesión";
        
        
        this.errorSubject.next(mensaje);
      }
    })

  }

  check_code(){

  }
  

}
