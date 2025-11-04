import { Component, ElementRef, ViewChild } from '@angular/core';
import { Router, RouterLink } from "@angular/router";
import { UserData } from '../../../core/models/auth';
import { Auth } from '../../../core/services/auth/auth';

@Component({
  selector: 'app-header',
  imports: [RouterLink],
  templateUrl: './header.html',
  styleUrl: './header.css'
})
export class Header {
  currentUser: UserData | null = null;
  menuOpen = false;
  @ViewChild("toggle") toggleRef!:ElementRef;
  @ViewChild("items") itemsRef!:ElementRef;
  
  constructor(private authservice:Auth,private router:Router){}

  ngOnInit(){
    this.authservice.currentUser$.subscribe(usuario=>{
      this.currentUser=usuario;
    })
  }

  closeMenu() {
    this.menuOpen = false;
  }

  log_out(){
    this.authservice.logout();
  }

  toggleMenu() {
    this.itemsRef.nativeElement.classList.toggle("open");
    this.toggleRef.nativeElement.classList.toggle("close");
  }
}
