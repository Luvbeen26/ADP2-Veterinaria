import { Component, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { Usercard } from '../../../shared/components/usercard/usercard';
import { User } from '../../../core/models/users';
import { BehaviorSubject, debounceTime, distinctUntilChanged, Subject } from 'rxjs';
import { Users as UserService } from '../../../core/services/vet/users';
import { CommonModule } from '@angular/common';
import { MascotasGetByUser } from '../../../core/models/mascota';
import { MatTooltip, MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink, RouterModule } from "@angular/router";
import { ToastService } from '../../../core/services/extra/toast-service';

@Component({
  selector: 'app-users',
  imports: [MatIconModule, Usercard, CommonModule, MatTooltipModule, RouterModule],
  templateUrl: './users.html',
  styleUrl: './users.css'
})
export class Users {
  user!:User
  private searchSubject = new Subject<string>();
  userService=inject(UserService)
  toast=inject(ToastService)
  usersSubject=new BehaviorSubject<User[]>([])
  users$=this.usersSubject.asObservable();
  petSubject=new BehaviorSubject<MascotasGetByUser[]>([])
  pets$=this.petSubject.asObservable();


  auxid:number | null=null
  ngOnInit(){
    this.getUsers(null);
    this.toast.checkRedirectMessage();
    this.searchSubject.pipe(
      debounceTime(300),  
      distinctUntilChanged()       
    ).subscribe(searchTerm => {
      this.userService.GetUsers(searchTerm).subscribe(res => {
        this.usersSubject.next(res);
      });
    });
  }

  getUsers(event:Event | null){
    let value = "";

    if (event) {
      value = (event.target as HTMLInputElement).value;
    } 

    this.userService.GetUsers(value!).subscribe(res=>{
      this.usersSubject.next(res);
    })
  }


  ShowPetsUser(id:number){
    this.auxid=id;
    this.userService.GetPetsByUser(id).subscribe(res=>{
      this.petSubject.next(res);
    })

    console.log(this.petSubject)
  }

  isSelected(userId: number): boolean {
    return this.auxid === userId;
  }

  ngDestroy(){
    this.searchSubject.complete();
  }
}
