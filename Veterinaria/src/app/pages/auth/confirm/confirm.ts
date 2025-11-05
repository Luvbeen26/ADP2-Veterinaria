import { Component, Input, input } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Auth } from '../../../core/services/auth/auth';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirm',
  imports: [ReactiveFormsModule,CommonModule],
  templateUrl: './confirm.html',
  styleUrl: './confirm.css'
})
export class Confirm {
  correo: string = '';

  codeForm!: FormGroup;

  constructor(private fb:FormBuilder,private auth:Auth,private router:Router){
    this.codeForm=this.fb.group({
      code:['',[Validators.required]]
    });
    const navigation = this.router.getCurrentNavigation();
    this.correo = navigation?.extras?.state?.['correo'] || '';
    console.log(this.correo)
    
  }

  ngOnInit(){
    if (!this.correo) {
      console.warn('No se recibió correo, redirigiendo...');
      this.router.navigate(["/restore"]);
    }
  }

  Send_email(){
    this.auth.send_email(this.codeForm.get('correo')?.value).subscribe({
      next: (response) =>{
        console.log("mandado")
      },
      error: (err) =>{
        console.log(err)
      }
    })
  }

  check_code(){
    console.log("contra")
    if(this.codeForm.invalid){
      this.codeForm.markAllAsTouched();
      return;
    }

    this.auth.check_code(this.codeForm.get('code')?.value,this.correo).subscribe({
      next: (response) =>{

        console.log("chequeado")
        this.router.navigate(["update_password"], { 
          state: { correo: this.correo } 
        });
      },
      error: (err) =>{
        console.log(err)
      }
    })
  }
}
