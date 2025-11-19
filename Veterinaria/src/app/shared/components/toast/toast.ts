import { Component, Input } from '@angular/core';
import { ToastService } from '../../../core/services/extra/toast-service';

@Component({
  selector: 'app-toast',
  imports: [],
  templateUrl: './toast.html',
  styleUrl: './toast.css'
})
export class Toast {
 constructor(public toastService: ToastService) {}
}
