import { Component, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Auth } from '../../../core/services/auth/auth';
import { Router, RouterLink } from '@angular/router';
import { apiFailure } from '../../../core/security/api-error';
import { CommonModule } from '@angular/common';
import { BehaviorSubject, Observable, finalize } from 'rxjs';

@Component({
  selector: 'app-restore-password',
  imports: [ReactiveFormsModule, CommonModule, RouterLink],
  templateUrl: './restore-password.html',
  styleUrl: './restore-password.css'
})
export class RestorePassword {
  emailForm!: FormGroup;
  readonly busy = signal(false);
  private errorSubject = new BehaviorSubject<string>("");
    
  error$: Observable<string> = this.errorSubject.asObservable();


  constructor(private fb:FormBuilder,private auth:Auth,private router:Router){
    this.emailForm=this.fb.group({
      correo:['',[Validators.required,Validators.email]]
    });
  }

  Send_email(){
    if (this.busy()) return;
    if(this.emailForm.invalid){
      this.emailForm.markAllAsTouched();
      return;
    }
    const correo=this.emailForm.get('correo')?.value
    this.busy.set(true);
    this.errorSubject.next('');
    this.auth.send_email(correo).pipe(finalize(() => this.busy.set(false))).subscribe({
      next: (response) =>{
        void this.router.navigate(["/auth/confirm-code"]);
      },
      error: (err) =>{
        this.errorSubject.next(apiFailure(err).message);
      }
    })

  }

  check_code(){

  }
  

}
