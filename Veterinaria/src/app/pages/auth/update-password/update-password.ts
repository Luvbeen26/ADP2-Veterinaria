import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Auth } from '../../../core/services/auth/auth';
import { Router } from '@angular/router';

@Component({
  selector: 'app-update-password',
  imports: [ReactiveFormsModule,CommonModule],
  templateUrl: './update-password.html',
  styleUrl: './update-password.css'
})
export class UpdatePassword {
  correo: string = '';

  passwordForm!: FormGroup;

  constructor(private fb:FormBuilder,private auth:Auth,private router:Router){
    this.passwordForm=this.fb.group({
      contra:['',[Validators.required]]
    });
    const navigation = this.router.getCurrentNavigation();
    this.correo = navigation?.extras?.state?.['correo'] || '';
    console.log(this.correo)
    
  }

  ngOnInit(){
    if (!this.correo) {
      console.warn('No se recibió correo, redirigiendo...');
      this.router.navigate(["/auth/restore"]);
    }
  }

  change_password(){
    console.log("contra")
    if(this.passwordForm.invalid){
      this.passwordForm.markAllAsTouched();
      return;
    }

    this.auth.change_password(this.passwordForm.get('contra')?.value,this.correo).subscribe({
      next: (response) =>{
        this.router.navigate(["/auth/login"])
        console.log("cambiado")
      },
      error: (err) =>{
        console.log(err)
      }
    })
  }

}
