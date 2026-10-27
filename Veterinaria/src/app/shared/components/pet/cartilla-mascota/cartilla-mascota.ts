import { CdkTrapFocus } from '@angular/cdk/a11y';
import { DatePipe } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { CartillaMascotaOut } from '../../../../core/models/mascota';

@Component({
  selector: 'app-cartilla-mascota',
  imports: [DatePipe, CdkTrapFocus],
  templateUrl: './cartilla-mascota.html',
  styleUrl: './cartilla-mascota.css'
})
export class CartillaMascota {
  @Input() cartilla!: CartillaMascotaOut;
  @Output() closed = new EventEmitter<void>();

  close() {
    this.closed.emit();
  }

  async downloadPDF() {
    const content = document.getElementById('pdf-content');

    if (!content) return;

    const canvas = await html2canvas(content, {
      scale: 3,
      useCORS: true
    });

    const img = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');

    const width = 190; // margen de 10mm
    const ratio = canvas.height / canvas.width;
    const height = width * ratio;

    pdf.addImage(img, 'PNG', 10, 10, width, height);
    pdf.save(`Cartilla-${this.cartilla.nombre}.pdf`);
  }
}
