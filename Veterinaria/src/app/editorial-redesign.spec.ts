import { Component, Provider, Type, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';
import { Auth } from './core/services/auth/auth';
import { Totp } from './core/services/auth/totp';
import { Consulta } from './core/services/vet/consulta';
import { CitaService } from './core/services/vet/cita-service';
import { Statistics } from './core/services/vet/statistics';
import { Services } from './core/services/vet/services';
import { VetService } from './core/services/vet/vet-service';
import { Users as UsersService } from './core/services/vet/users';
import { Mascota } from './core/services/mascota/mascota';
import { Color } from './core/services/mascota/color';
import { RazaService } from './core/services/mascota/raza';
import { ToastService } from './core/services/extra/toast-service';
import { Consultas } from './pages/vet/consultas/consultas';
import { RegConsulta } from './pages/vet/reg-consulta/reg-consulta';
import { HistorialMedico } from './pages/vet/historial-medico/historial-medico';
import { Estadisticas } from './pages/vet/estadisticas/estadisticas';
import { Users } from './pages/vet/users/users';
import { Login } from './pages/auth/login/login';
import { RegisterPet } from './pages/pets/register-pet/register-pet';
import { Appointment } from './pages/pets/appointment/appointment';
import { CardMyPet } from './shared/components/pet/card-my-pet/card-my-pet';
import { Profile } from './pages/profile/profile';

@Component({ template: '' })
class Destination {}

const route = (id: string | null = '1', mode = 'register') => ({
  snapshot: { paramMap: convertToParamMap(id ? { id } : {}), data: { mode } }, queryParams: of({})
});
const patient = { id_mascota: 1, nombre: 'Luna', especie: 'P', resumen_IA: '', fecha_nacimiento: '2022-01-01', sexo: 'H', peso: 8 };
const appointment = { id_cita: 1, servicio: 'consulta', fecha: '2026-10-25', hora: '09:00', estado: 'P', notas: '', mascota: patient, usuario: { nombre: 'Ana', apellidos: 'Pérez' } };
const report = {
  estadisticas: { ingresos_totales: 120, clientes_activos: 1, total_mascotas: 2, promedio_por_cliente: 60 },
  finanzas: { ingreso_mensual_por_servicio: [{ servicio: 'consulta', mes: 'Octubre', total: 120 }], distribucion_egresos: [{ motivo: 'Servicios', total: 20 }], rentabilidad_servicios: [{ servicio: 'consulta', ingresos: 120, costos: 20, porcentaje: 80 }] },
  clientes_mascotas: { nuevos_clientes_6_meses: [{ mes: 'Octubre', total: 1 }], promedio_clientes_6_meses: 1, mascotas_por_especie: [{ especie: 'P', total: 2 }], frecuencia_visitas: 1, tasa_retencion: 50 },
  servicios: { mas_solicitados: [{ servicio: 'consulta', visitas: 1 }], promedio_gasto: { por_visita: 60, mensual: 60, anual: 120 }, tendencia_6_meses: [{ mes: 'Octubre', total: 120 }] }
};

describe('Editorial Care UI integration', () => {
  let role: string;
  let consult: any;
  let auth: any;
  let users: any;
  let totp: any;
  beforeEach(() => {
    role = 'V';
    auth = {
      security: {enabled: false}, getToken: () => null, cancelMfa: () => {},
      get_userRol: () => role, getCurrentUser: () => ({ rol: role, nombre: 'Ana', correo: 'ana@example.test' }),
      currentUser$: of({ rol: role }),
      login: jasmine.createSpy().and.returnValue(of({ requires_2fa: true, mfa_token: 'challenge' })),
      verifyTwoFactor: jasmine.createSpy().and.returnValue(of({ access_token: 'access' }))
    };
    consult = {
      getConsultasUrgentes: jasmine.createSpy().and.returnValue(of([])), get_pendient_citas: jasmine.createSpy().and.returnValue(of([appointment])),
      GetCita: () => of({ id_mascota: 1, especie: 'P', pet_name: 'Luna', vet_name: 'Ana' }),
      GetTratamientos: () => ({ vacunas: ['Rabia'], medicamentos: ['Tratamiento existente'] }),
      createConsulta: jasmine.createSpy().and.returnValue(of({})),
      getConsultasByMascotaId: () => of([{ id_consulta: 1, motivo: 'Revisión', diagnostico: 'Dato clínico', observaciones: 'Observación', tratamientos: [{ tipo: 'vacuna', descripcion: 'Rabia' }], cita: appointment }]),
      generarResumenIA: jasmine.createSpy().and.returnValue(of({ ...patient, resumen_IA: 'Resumen recibido de la API' }))
    };
    users = { GetUsers: () => of([{ id: 7, name: 'Ana' }]), GetPetsByUser: jasmine.createSpy().and.returnValue(of([{ id: 1, nombre: 'Luna', especie: 'P' }])) };
    totp = { have2fa: () => of(false), configurar: () => of({ qr_code: 'data:image/png;base64,AA==' }) };
  });
  async function render<T>(component: Type<T>, extra: Provider[] = []) {
    await TestBed.configureTestingModule({ imports: [component], providers: [
      provideZonelessChangeDetection(), provideRouter([{ path: '**', component: Destination }]),
      { provide: Auth, useValue: auth }, { provide: Consulta, useValue: consult },
      { provide: MatDialog, useValue: { open: jasmine.createSpy() } },
      { provide: ToastService, useValue: { checkRedirectMessage: () => null, showAfterRedirect: jasmine.createSpy(), show: jasmine.createSpy() } },
      { provide: UsersService, useValue: users }, { provide: Totp, useValue: totp },
      { provide: Statistics, useValue: { getStatistics: () => of(report) } },
      { provide: Mascota, useValue: { getMascotas: () => of([patient]), getMascotaById: () => of(patient) } },
      { provide: Color, useValue: { getColors: () => of([]) } },
      { provide: RazaService, useValue: { getRazas: () => of([]) } },
      { provide: VetService, useValue: { getVeterinarios: () => of([]) } },
      { provide: Services, useValue: { getServices: () => [{ id: 'consulta', name: 'Consulta médica' }] } },
      { provide: CitaService, useValue: { obtenerHorasDisponibles: () => of({ horas_disponibles: ['09:00'] }) } },
      ...extra
    ] }).compileComponents();
    const fixture = TestBed.createComponent(component);
    fixture.detectChanges(); await fixture.whenStable(); fixture.detectChanges();
    return fixture;
  }
  function fits(element: HTMLElement) {
    expect(element.getBoundingClientRect().right).toBeLessThanOrEqual(window.innerWidth + 1);
    expect(element.scrollWidth).toBeLessThanOrEqual(element.clientWidth + 1);
  }

  it('renders veterinarian consultations with four filters and existing workflow destinations', async () => {
    const f = await render(Consultas);
    expect(f.nativeElement.querySelector('h1').textContent).toBe('Consultas');
    expect(consult.getConsultasUrgentes).toHaveBeenCalledTimes(1);
    expect(f.nativeElement.querySelectorAll('.filter-btn').length).toBe(4);
    expect(f.nativeElement.querySelector('.buttons').textContent).toContain('Crear registro');
    expect(f.nativeElement.querySelector('.buttons').textContent).toContain('No asistió');
    f.nativeElement.querySelectorAll('.filter-btn')[2].click(); await f.whenStable();
    expect(consult.get_pendient_citas).toHaveBeenCalledWith('N');
    fits(f.nativeElement.querySelector('main'));
  });

  it('keeps customer appointment actions separate from veterinarian actions', async () => {
    role = 'C'; auth.currentUser$ = of({rol: role});
    const f = await render(Consultas);
    expect(f.nativeElement.querySelector('h1').textContent).toBe('Mis citas');
    expect(consult.getConsultasUrgentes).not.toHaveBeenCalled();
    f.componentInstance.get_citas_urgentes();
    expect(consult.getConsultasUrgentes).not.toHaveBeenCalled();
    expect(consult.get_pendient_citas).toHaveBeenCalledWith('P');
    expect(f.nativeElement.querySelector('.buttons').textContent).toContain('Cancelar');
    expect(f.nativeElement.querySelector('.buttons').textContent).not.toContain('Crear registro');
    expect(f.nativeElement.querySelector('a[href="/pets/edit-appointment/1"]')).toBeTruthy();
  });

  it('preserves the login and 2FA submission flow', async () => {
    const f = await render(Login);
    f.componentInstance.loginForm.patchValue({ usuario_mail: 'ana', contra: 'password' });
    f.componentInstance.Login(); f.detectChanges();
    expect(f.nativeElement.querySelector('input[autocomplete="one-time-code"]')).toBeTruthy();
    f.componentInstance.codeForm.patchValue({ code: '123456' });
    f.componentInstance.verifyTwoFactor();
    expect(auth.verifyTwoFactor).toHaveBeenCalledWith('challenge', '123456');
    f.componentInstance.errorMessage.set('Error de prueba'); f.detectChanges();
    expect(f.nativeElement.querySelector('.login-content .alert')).toBeTruthy();
    fits(f.nativeElement.querySelector('main'));
  });

  it('keeps the clinical record payload unchanged', async () => {
    const f = await render(RegConsulta, [{ provide: ActivatedRoute, useValue: route() }]);
    f.componentInstance.recordForm.patchValue({ motivo: 'Revisión', diagnostico: 'Dato clínico', observaciones: 'Observación' });
    f.componentInstance.toggleCuidado(24);
    f.componentInstance.toggleTratamiento('vacuna', 'Rabia');
    f.componentInstance.onSubmit();
    expect(consult.createConsulta).toHaveBeenCalledWith({ id_cita: 1, motivo: 'Revisión', diagnostico: 'Dato clínico', observaciones: 'Observación', tratamientos: [{ tipo: 'vacuna', descripcion: 'Rabia' }], cuidados: [{ id_cuidado: 24 }] });
    const ids = Array.from(f.nativeElement.querySelectorAll('textarea')).map((e: any) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('renders pet registration fields at the active viewport', async () => {
    const f = await render(RegisterPet, [{ provide: ActivatedRoute, useValue: route(null) }]);
    expect(f.nativeElement.querySelectorAll('input[type="radio"]').length).toBe(4);
    expect(f.nativeElement.querySelector('input[formControlName="peso"]')).toBeTruthy();
    fits(f.nativeElement.querySelector('main'));
    fits(f.nativeElement.querySelector('.register-container'));
  });

  it('uses keyboard-operable hours without changing the selected value', async () => {
    const f = await render(Appointment, [{ provide: ActivatedRoute, useValue: route(null) }]);
    f.componentInstance.citaForm.patchValue({ servicio: 'consulta' }); f.detectChanges();
    const hour = f.nativeElement.querySelector('.hour') as HTMLButtonElement;
    expect(hour.tagName).toBe('BUTTON'); expect(hour.type).toBe('button');
    hour.click(); f.detectChanges();
    expect(f.componentInstance.citaForm.get('hora')?.value).toBe('09:00');
    expect(hour.getAttribute('aria-pressed')).toBe('true');
    fits(f.nativeElement.querySelector('main'));
  });

  it('keeps the owner-selection event and pet lookup intact', async () => {
    const f = await render(Users);
    const owner = f.nativeElement.querySelector('.mascotas-user-item') as HTMLButtonElement;
    expect(owner.tagName).toBe('BUTTON'); owner.click(); f.detectChanges();
    expect(users.GetPetsByUser).toHaveBeenCalledWith(7);
    expect(f.nativeElement.querySelector('.mascotas-pet-name').textContent).toBe('Luna');
    fits(f.nativeElement.querySelector('.mascotas-container'));
  });

  it('renders statistics and equivalent API values without fabricated trends', async () => {
    const f = await render(Estadisticas);
    expect(f.nativeElement.querySelectorAll('canvas').length).toBeGreaterThan(0);
    expect(f.nativeElement.querySelector('.data-table').textContent).toContain('120');
    expect(f.nativeElement.textContent).not.toContain('420,000');
    expect(f.nativeElement.textContent).not.toContain('+12.5%');
    fits(f.nativeElement.querySelector('main'));
  });

  it('keeps medical data and generates the summary through the existing service', async () => {
    const f = await render(HistorialMedico, [{ provide: ActivatedRoute, useValue: route() }]);
    expect(f.nativeElement.querySelector('table').textContent).toContain('Dato clínico');
    f.componentInstance.generarResumenIA(1); f.detectChanges();
    expect(consult.generarResumenIA).toHaveBeenCalledWith(1);
    expect(f.nativeElement.querySelector('.resumen-ia').textContent).toContain('Resumen recibido de la API');
    fits(f.nativeElement.querySelector('main'));
  });

  it('opens and closes the existing security dialog with focus-trap semantics', async () => {
    const f = await render(Profile);
    f.componentInstance.openTwoFactorSetup(); f.detectChanges(); await f.whenStable();
    expect(f.nativeElement.querySelector('[role="dialog"][aria-modal="true"]')).toBeTruthy();
    f.nativeElement.querySelector('.modal-close').click(); f.detectChanges();
    expect(f.nativeElement.querySelector('[role="dialog"]')).toBeNull();
    fits(f.nativeElement.querySelector('main'));
  });
  it('keeps the pet menu out of the identity layout', async () => {
    const f = await render(CardMyPet);
    f.componentRef.setInput('mascota', patient); f.detectChanges();
    const image = f.nativeElement.querySelector('.image-pet').getBoundingClientRect();
    const info = f.nativeElement.querySelector('.card-info').getBoundingClientRect();
    expect(info.left).toBeGreaterThanOrEqual(image.right);
    fits(f.nativeElement.querySelector('.card'));
  });

});
