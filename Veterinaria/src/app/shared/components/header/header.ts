import { Component, ElementRef, inject, ViewChild } from '@angular/core';
import { Router, RouterLink } from "@angular/router";
import { UserData } from '../../../core/models/auth';
import { Auth } from '../../../core/services/auth/auth';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-header',
  imports: [RouterLink,CommonModule],
  templateUrl: './header.html',
  styleUrl: './header.css'
})
export class Header {
  
  currentUser$: Observable<UserData | null>; // ✅ Observable directamente
  menuOpen = false;
  @ViewChild("toggle") toggleRef!: ElementRef;
  @ViewChild("items") itemsRef!: ElementRef;
  
  constructor(private authservice: Auth, private router: Router){
    this.currentUser$ = this.authservice.currentUser$; // ✅ Asignar el observable
  }

  closeMenu() {
    this.menuOpen = false;
  }

  log_out(){
    this.authservice.logout();
    this.router.navigate(["/"]);
  }

  toggleMenu() {
    this.itemsRef.nativeElement.classList.toggle("open");
    this.toggleRef.nativeElement.classList.toggle("close");
  }
}
