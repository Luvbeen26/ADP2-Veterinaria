import { isPlatformBrowser } from '@angular/common';
import { Inject, Injectable, PLATFORM_ID, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  toastMessage = signal<string | null>(null);
  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  show(message: string) {
    this.toastMessage.set(message);
    setTimeout(() => this.toastMessage.set(null), 3000);
  }

  showAfterRedirect(message: string) {
    if (isPlatformBrowser(this.platformId)) {
      sessionStorage.setItem('toast_msg', message);
    }
  }

  checkRedirectMessage():string | null {
    if (isPlatformBrowser(this.platformId)) {
      const msg = sessionStorage.getItem('toast_msg');
      if (msg) {
        this.show(msg);
        sessionStorage.removeItem('toast_msg');
      }
    }
    return null;
  }
}
