import { Component, EventEmitter, Input, Output } from '@angular/core';
import { User } from '../../../core/models/users';


@Component({
  selector: 'app-usercard',
  imports: [],
  templateUrl: './usercard.html',
  styleUrl: './usercard.css'
})
export class Usercard {
  @Input() user!:User
  @Input() isSelected:boolean=false
  @Output() Userselect=new EventEmitter<number>();

  ngOnInit(){
  }

  selectedUser(){
    this.Userselect.emit(this.user.id!);
  }

}
