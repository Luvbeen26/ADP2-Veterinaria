import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Home } from './home';
import { Auth } from '../../../core/services/auth/auth';
import { Consulta } from '../../../core/services/vet/consulta';
import { GetRecomendaciones } from '../../../core/models/mascota';

describe('Home presentation', () => {
  let fixture: ComponentFixture<Home>;
  const care = (name: string, vet: string[], other: string[]): GetRecomendaciones => ({
    nombre_mascota: name, id_mascota: 1, id_consulta: 1,
    cuidados_veterinario: vet.map((descripcion, i) => ({ id_cuidado: i, descripcion })),
    cuidados_recomendadas: other.map((descripcion, i) => ({ id_cuidado: i, descripcion }))
  });
  const renderCare = async (records: GetRecomendaciones[]) => {
    fixture.componentInstance.mascotas_recomendaciones.set(records);
    fixture.detectChanges();
    await fixture.whenStable();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Home],
      providers: [
        provideZonelessChangeDetection(),
        { provide: Auth, useValue: { getCurrentUser: () => null } },
        { provide: Consulta, useValue: {} }
      ]
    }).compileComponents();
    fixture = TestBed.createComponent(Home);
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('keeps the three existing services and their descriptions without adding actions', () => {
    const entries = fixture.nativeElement.querySelectorAll('.service-entry');
    expect(entries.length).toBe(3);
    fixture.componentInstance.servicios.forEach((service, index) => {
      expect(entries[index].querySelector('h2').textContent.trim()).toBe(service.title);
      expect(entries[index].querySelector('p').textContent.trim()).toBe(service.description);
    });
    expect(fixture.nativeElement.querySelectorAll('.services-section a, .services-section button').length).toBe(0);
  });

  it('hides the recommendations section for both unloaded and empty results', async () => {
    expect(fixture.nativeElement.querySelector('.care-section')).toBeNull();
    await renderCare([]);
    expect(fixture.nativeElement.querySelector('.care-section')).toBeNull();
  });

  it('keeps care grouped by pet and distinguishes both sources', async () => {
    await renderCare([care('Luna', ['Cuidado indicado'], ['Cuidado de otras consultas']), care('Sol', ['Reposo'], [])]);
    const records = fixture.nativeElement.querySelectorAll('.pet-care');
    expect(records.length).toBe(2);
    expect(records[0].querySelector('.pet-name').textContent.trim()).toBe('Luna');
    expect(records[0].querySelectorAll('.care-source').length).toBe(2);
    expect(records[0].querySelectorAll('li')[0].textContent.trim()).toBe('Cuidado indicado');
    expect(records[1].querySelector('.pet-name').textContent.trim()).toBe('Sol');
    expect(records[1].querySelectorAll('.care-source').length).toBe(1);
  });

  it('preserves the empty-pet condition and the other-consultations-only case', async () => {
    await renderCare([care('Sin cuidados', [], []), care('Luna', [], ['Cuidado disponible'])]);
    const records = fixture.nativeElement.querySelectorAll('.pet-care');
    expect(records.length).toBe(1);
    expect(records[0].querySelector('.pet-name').textContent.trim()).toBe('Luna');
    expect(records[0].querySelector('h4').textContent.trim()).toBe('Basados en otras consultas');
  });

  it('preserves contact values and loads the existing photograph', async () => {
    const contact = fixture.nativeElement.querySelector('.contact-section');
    expect(contact.textContent).toContain('+52 668 137 5871');
    expect(contact.textContent).toContain('Mascotas_felicesLM@gmail.com');
    expect(contact.textContent).toContain('Av. Reforma 123, Col. Centro');
    expect(contact.querySelector('img')).toBeNull();
    const photo = fixture.nativeElement.querySelector('.opening-photo img') as HTMLImageElement;
    expect(photo.getAttribute('src')).toBe('consulta.png');
    photo.loading = 'eager';
    await photo.decode();
    expect(photo.naturalWidth).toBe(712);
    expect(photo.naturalHeight).toBe(474);
  });

  it('reflows service and contact columns for the actual browser viewport', () => {
    const services = fixture.nativeElement.querySelector('.services-editorial');
    const contact = fixture.nativeElement.querySelector('.contact-details');
    const columns = (element: Element) => getComputedStyle(element).gridTemplateColumns.split(' ').length;
    expect(columns(services)).toBe(window.innerWidth <= 599 ? 1 : 2);
    expect(columns(contact)).toBe(window.innerWidth <= 599 ? 1 : 3);
    expect(getComputedStyle(fixture.nativeElement.querySelector('main')).fontFamily).toContain('Source Sans 3');
    console.info('Home layout checked at viewport width:', window.innerWidth);
  });

  it('keeps long pet names and care text inside the viewport', async () => {
    await renderCare([care('Mascota'.repeat(40), ['Recomendación'.repeat(60)], ['Texto '.repeat(200)])]);
    const main = fixture.nativeElement.querySelector('main');
    const mainBounds = main.getBoundingClientRect();
    for (const element of Array.from(main.querySelectorAll('.pet-name, .care-source, .contact-info, .service-entry')) as HTMLElement[]) {
      const bounds = element.getBoundingClientRect();
      expect(bounds.left).toBeGreaterThanOrEqual(0);
      expect(bounds.right).toBeLessThanOrEqual(window.innerWidth + 1);
      expect(element.scrollWidth).toBeLessThanOrEqual(element.clientWidth + 1);
    }
    expect(mainBounds.width).toBeLessThanOrEqual(window.innerWidth);
    for (const element of Array.from(main.querySelectorAll('li, dt')) as HTMLElement[]) {
      expect(getComputedStyle(element).fontFamily).toContain('Source Sans 3');
    }
  });
});
