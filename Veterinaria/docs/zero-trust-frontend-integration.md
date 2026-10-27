# Integración Zero Trust del frontend

Fecha: 25 de octubre de 2026. Fuente: [contratos de Backend](zero-trust-api-contracts.md), copia íntegra del documento adjunto. Ese documento declara «diseño propuesto, sin implementación». Esta entrega no confirma disponibilidad de sus propuestas.

## Corrección de CSRF en registro

El alta todavía enviaba POST `/auth/create_user` por la rama antigua, sin bootstrap ni cookies/CSRF. Registro ahora comparte la capacidad pública `ZERO_TRUST_LOGIN_ENABLED`: GET `/auth/csrf` con credenciales seguido de POST canónico con X-CSRF-Token y withCredentials, sin bearer ni campos rol/activo/permisos. La respuesta 201 AuthenticatedResponse actualiza identidad, access y CSRF en memoria. No se ejecuta login automático ni se duplica la navegación.

Se comparte una sola creación en vuelo entre suscriptores. Un fallo de bootstrap no envía el alta. Se verifica confirmación y política real de Backend (mínimo 15 caracteres, máximo 72 bytes UTF-8), sin truncar la contraseña. El formulario conserva su diseño, cancela suscripciones al destruirse y presenta errores locales con referencia. Los avisos amarillos globales siguen eliminados.

Las cuatro regresiones nuevas fallaron antes de corregir el flujo; la ejecución final pasó **119/119 pruebas** y `ng build` fue correcto con las advertencias CommonJS existentes. Se modificaron contracts.ts (descripción de la capacidad), zero-trust-api.ts, auth.ts, auth.spec.ts, register.ts y register.html. No hubo cambios en Backend, dependencias ni verificación de cookies en navegador real.

## Avisos globales retirados por preferencia del usuario

Se eliminó de App la franja amarilla global que mostraba avisos de seguridad y cierre de sesión, junto con sus estilos e inyecciones dedicadas. La autenticación, revocación y manejo de errores continúan operando; sus estados internos no se presentan como banner global. Se conservan los errores propios de formularios y los controles de seguridad de cada pantalla. Esta preferencia visual prevalece sobre las descripciones históricas de avisos globales incluidas abajo.

## Corrección del 403 al configurar 2FA desde Perfil

El perfil seguía utilizando la rama antigua de Totp: POST `/totp/configurar` con bearer, pero sin la prueba de `mfa:configure` exigida por el Backend actual. No era necesario cambiar CORS ni desactivar permisos; faltaba conectar la reautenticación del frontend.

`ZERO_TRUST_MFA_SETUP_ENABLED=true` activa únicamente estado, configuración y confirmación de MFA del perfil. Reauthentication y ZeroTrustApi permiten `mfa:configure` bajo esa capacidad. El perfil abre primero el diálogo de identidad y solo muestra el QR después del POST configurar con X-Reauth-Token. Cancelar no envía configurar. Los errores de configuración presentan el mensaje seguro y request_id disponibles.

GET `/totp/have2fa` ahora interpreta `twofa_habilitado` y sincroniza la identidad en memoria. POST `/totp/confirmar` conserva el código como cadena, utiliza withCredentials para aceptar las cookies rotadas y verifica success/twofa_habilitado. Tras éxito actualiza la identidad, borra el CSRF anterior de memoria y deja que la siguiente operación con cookies obtenga el valor vigente mediante GET `/auth/csrf`. No intenta leer la cookie HttpOnly ni inventa un access token en la respuesta de confirmación. El QR y el código se limpian al cerrar o completar el diálogo.

Validación de esta corrección: las cuatro regresiones nuevas fallaron antes del cambio; después, `npm run test:security` pasó **115/115** y `ng build` terminó correctamente con las advertencias CommonJS existentes. No se modificó Backend ni se validaron cookies en un navegador real. Archivos: contracts.ts, zero-trust-api.ts, reauthentication.ts, auth.ts, totp.ts, profile.ts y pruebas de seguridad, además de este documento. Otros flujos del perfil quedan fuera de esta corrección.

## Estado vigente: sesiones, cierre remoto y auditoría conectados

Actualización del 26 de octubre de 2026. Se contrastó con `C:/GithubRepos/Backend-VeterinariaMF/docs/zero-trust-implementation.md` y `app/api/auth.py` del backend. El documento de implementación prevalece sobre el diagnóstico propuesto original. Los apartados históricos que siguen no deben interpretarse como indisponibilidad actual de los endpoints de sesiones.

### Capacidades activas

- `ZERO_TRUST_LOGIN_ENABLED=true`: login, bootstrap CSRF y MFA confirmados.
- `ZERO_TRUST_SESSION_ENABLED=true`: restauración/refresh, logout, listado y revocación de sesiones, y reautenticación exclusivamente para `sessions:revoke_all`.
- `ZERO_TRUST_MFA_SETUP_ENABLED=true`: configuración, confirmación y lectura del estado MFA del perfil, con reautenticación para `mfa:configure`.
- `ZERO_TRUST_AUDIT_ENABLED=true`: lectura de auditoría, además del permiso efectivo `security:audit:read` emitido por Backend. Ningún rol obtiene ese permiso automáticamente.
- `ZERO_TRUST_ENABLED=false` se conserva para no activar de golpe otros flujos que requieren adaptar su frontend al documento de implementación (por ejemplo contratos de registro, recuperación y contraseña del perfil). Esto no declara esos endpoints pendientes en Backend: son integraciones de frontend fuera de este cambio.

### Pantalla disponible

Desde **Mi perfil → Sesiones y acceso**, ruta `/account/security`, ambos roles pueden:

1. Consultar sus sesiones vigentes mediante GET `/auth/sessions` con bearer. Se presentan fechas, etiqueta devuelta por servidor e indicador de sesión actual. `ip_masked` admite null; la UI indica que no se registró IP y no inventa datos del dispositivo.
2. Cerrar otra sesión mediante DELETE `/auth/sessions/{session_id}`. La fila solo se elimina tras una respuesta de éxito. Un rechazo conserva la información y presenta error y referencia de petición.
3. Cerrar el navegador actual mediante POST `/auth/logout`, sin body, con cookies y X-CSRF-Token. También es el comportamiento del botón del Header.
4. Cerrar las demás sesiones (`include_current:false`) o incluir la actual (`true`). El diálogo solicita contraseña y muestra el campo de Authenticator únicamente si la identidad indica MFA habilitado. Siempre exige un código nuevo de seis dígitos, conservando los ceros iniciales. Si MFA está deshabilitado, `code` se omite incluso si una variable del cliente conservase texto.
5. POST `/auth/reauthenticate` lleva `action:sessions:revoke_all`, `resource_id:null` y credenciales. Se valida la acción/recurso de la prueba recibida y se usa inmediatamente una sola vez en X-Reauth-Token del POST revoke-all. No se almacena la prueba ni se repite automáticamente una mutación fallida. Cancelar no revoca sesiones.
6. El resultado 204 de revoke-all conserva la identidad actual con false y la limpia con true. La UI distingue lo confirmado por servidor de la simple eliminación del acceso local. Se mantiene una generación de autenticación independiente del token: un refresh de la misma sesión no cancela la reautenticación y una respuesta antigua de revoke-all no borra una identidad posterior.

DELETE de sesión y revoke-all usan bearer y withCredentials para que el navegador también procese la eliminación de cookies cuando corresponda; logout/refresh emplean el contexto CSRF y cookies. No se escribe ni se intenta leer la cookie HttpOnly de refresh desde JavaScript.

### Semántica del cierre

Cerrar sesión elimina inmediatamente el acceso local, pero muestra **confirmación pendiente** mientras llega la respuesta del servidor. Solo tras éxito anuncia **cierre confirmado por el servidor**. Ante error, anuncia **acceso cerrado solo en este navegador** y que no pudo confirmar la revocación; advierte que la cookie podría permitir restauración al recargar. Se impide iniciar otro login mientras hay un logout pendiente para reducir carreras entre cookies antiguas y nuevas.

El arranque utiliza `provideAppInitializer`: bootstrap CSRF y refresh compartido terminan antes de renderizar Header/pantallas. Un 401 definitivo limpia identidad y navega a login, sin POST automático de usuario/contraseña ni bucle de refresh. No se restauran cookies JavaScript heredadas, localStorage ni sessionStorage. La sesión expira según Backend: 30 minutos de inactividad HTTP y 7 días absolutos; refresh no amplía la inactividad.

### Auditoría

`/security/audit` queda restringida por guard y permiso efectivo. Consulta GET `/security/audit-events` con fechas UTC obligatorias, ventana máxima de 31 días, filtros documentados y cursor opaco. No se generan registros de auditoría desde Angular ni se envían eventos ficticios: el registro sigue siendo responsabilidad de Backend.

### Alcance y validación pendiente

Los tests usan HttpTestingController y DOM de Angular. No demuestran que el navegador real acepte o reenvíe cookies Secure/SameSite/HttpOnly. Tampoco prueban contención entre pestañas, red real ni CORS/TLS del despliegue. No se modificó Backend, no se concedieron permisos y no se instalaron dependencias. Mantener las comprobaciones de navegador y coordinación entre pestañas descritas por Backend.

Validación de esta actualización: `npm run test:security` pasó **111/111 pruebas**, incluidos listado/DELETE, logout confirmado y fallido, revoke-all true/false, MFA condicional, cancelación, credenciales erróneas, permisos de auditoría y dos regresiones de concurrencia detectadas en revisión. `ng build` de producción pasó (bundle inicial 446.77 kB), con advertencias CommonJS existentes. La revisión focalizada no dejó hallazgos pendientes y `git diff --check` no detectó errores.

Archivos de esta actualización: core/security/contracts.ts, zero-trust-api.ts, reauthentication.ts y security-ui.spec.ts; core/services/auth/auth.ts y auth.spec.ts; core/guards/auth/session-guard.ts; pages/security/security-center/security-center.ts/html; shared/components/reauth-dialog/reauth-dialog.html; esta documentación. Se conserva la identidad Editorial Care y la navegación existente.

## Corrección de login y MFA confirmados

El mensaje de Backend confirma ahora GET `/auth/csrf`, POST `/auth/login` y POST `/totp/verificar-2fa`, junto con AuthenticatedResponse y MfaRequiredResponse. La causa del 403 era que el indicador global seguía en false: Auth enviaba el login antiguo, sin bootstrap, credenciales de cookies ni cabecera CSRF.

Se añadió `ZERO_TRUST_LOGIN_ENABLED` con valor predeterminado true, separado de `ZERO_TRUST_ENABLED` (false). Así se activa únicamente el contrato confirmado de login/MFA. No se consideran confirmados refresh, sesiones, registro modificado, recuperación, auditoría ni reautenticación por este cambio. El modo legado de login solo sigue disponible por configuración explícita y en sus pruebas de compatibilidad; no es el comportamiento predeterminado.

- Cada intento explícito de login comienza con GET auth/csrf usando withCredentials. Su JSON proporciona el valor de X-CSRF-Token; Angular no lee ni escribe la cookie de refresh.
- RxJS encadena POST login después del GET, con withCredentials y únicamente usuario_mail/contra. Múltiples suscripciones/llamadas mientras hay login en curso comparten ambas peticiones.
- El desafío MFA se conserva en memoria, sin crear acceso ni redirigir. La pantalla existente envía challenge_id y el código como string con withCredentials y el CSRF del mismo contexto.
- AuthenticatedResponse utiliza user, access_token y csrf_token recibidos. El acceso y el CSRF se conservan únicamente en memoria. Tanto login como MFA actualizan el CSRF para la siguiente operación con cookies.
- 403 presenta error.code/error.message y request_id como referencia; no renueva CSRF ni reintenta automáticamente. Un nuevo intento del usuario sí vuelve a obtener bootstrap. 429 presenta Retry-After y bloquea nuevos intentos antes del bootstrap mientras dure la espera.
- El interceptor sigue limitado al origen/prefijo de environment.apiurl y excluye bearer de endpoints públicos de autenticación. Se verificaron por búsqueda los usos de almacenamiento/consola en autenticación: no hay persistencia localStorage/sessionStorage ni logs de credenciales/tokens.

### Desarrollo, origen y cookies Secure

Existe un solo environment: `src/environments/environment.ts`, con `apiurl: 'http://localhost:8000/'`. Ambas solicitudes de autenticación utilizan esa misma propiedad; no se cambió a 127.0.0.1 ni se agregó un prefijo /api. `npm start` fija `http://localhost:4200`, coincidente con el CORS_ORIGINS predeterminado indicado por Backend. No está disponible en este repositorio su configuración desplegada, por lo que no se afirma haber comprobado sus valores efectivos. Tampoco se encontró `zero-trust-implementation.md`; se usaron el contrato local y la confirmación del usuario.

Se agregó `npm run start:https` (`ng serve --host localhost --port 4200 --ssl`) como opción de desarrollo para cookies Secure. Antes de usarlo, deben estar coordinados estos ajustes externos:

1. La API debe servir HTTPS con un certificado de desarrollo confiable para localhost (o quedar detrás de un proxy HTTPS del mismo sitio). Cambiar environment.apiurl al origen HTTPS real de la API solo cuando exista; mantener el mismo host localhost en frontend y API. **HTTPS solo en Angular y API en HTTP no resuelve el intercambio**: las cookies SameSite y el esquema también importan.
2. Backend debe permitir exactamente `https://localhost:4200` en CORS_ORIGINS si se usa ese comando, con credenciales habilitadas, métodos correspondientes y X-CSRF-Token/Content-Type/Authorization permitidos. Para HTTP, el origen permitido debe seguir siendo exactamente `http://localhost:4200`. Exponer Retry-After y X-Request-ID.
3. Confiar los certificados de ambos orígenes en el navegador. No desactivar CSRF, Secure, HttpOnly ni validaciones TLS como solución.
4. En DevTools del navegador comprobar el Set-Cookie de GET auth/csrf, cualquier razón de bloqueo en Cookies/Issues y el reenvío de __Host-vet_csrf en POST login/MFA, junto con X-CSRF-Token y el Origin correcto. Al autenticarse, comprobar el establecimiento de refresh HttpOnly sin intentar leerlo o crearlo desde JavaScript. No copiar valores de cookies/tokens a consola ni informes.

**Límite de validación:** HttpTestingController comprueba orden, cabeceras, withCredentials, formatos, rotación, errores y exclusión de terceros; no ejecuta el almacén real de cookies del navegador ni CORS/TLS. No se confirmó que un navegador acepte o reenvíe estas cookies en el despliegue local. La API/CORS y esa comprobación real siguen pendientes. No se modificó el backend ni se instalaron dependencias.

Validación de esta corrección: `npm run test:security` pasó **90/90 pruebas**, incluido el modo de producción con login confirmado y los demás contratos desactivados. `ng build` de producción terminó correctamente, con las advertencias CommonJS existentes. Se verificó `git diff --check` para los archivos de esta corrección.

Archivos de esta corrección: core/security/contracts.ts, zero-trust-api.ts y api-error.ts; core/services/auth/auth.ts y auth.spec.ts; core/interceptors/auth/auth-interceptor.ts; pages/auth/login/login.ts; package.json; este documento. El resto de la documentación siguiente describe la integración anterior y las propuestas aún pendientes, sujetas a la separación de activación aclarada arriba.

## Arquitectura inspeccionada y reutilización

Angular 20.3, componentes standalone, detección zoneless, Router con carga diferida, HttpClient con fetch/interceptor funcional, Reactive Forms/Forms, RxJS, jwt-decode y CookieService. CDK/Material ya están instalados; se reutiliza CDK para foco del diálogo. Se mantienen Source Sans 3, Newsreader, tokens Editorial Care, Header y estilos encapsulados. No se instalaron dependencias.

```text
App + Header + Toast + avisos de seguridad + ReauthDialog
  Router -> guards de rol / sesión / permisos efectivos
  Componentes existentes -> Auth / Totp / servicios de negocio
  Auth -> API actual o ZeroTrustApi (propuesta desactivada)
  Reauthentication -> prueba de acción/recurso -> operación explícita
  HttpClient -> interceptor (ámbito API, errores, cooldown y renovación)
```

Rutas existentes conservadas:

| Área | Rutas / componentes |
|---|---|
| Pública | `/` Home; `/auth/login`, `register`, `restore`, `confirm-code`, `update_password` |
| Cliente | `/services`; `/pets`, `register-pet`, `edit-pet/:id`, `appointment`, `edit-appointment/:id`, `myappointments`, `confirm-appointment` |
| Veterinario | `/vet`, `medical-history/:id`, `statistics`, `users-list`, `register-pet-foruser/:id`, `registrar-consulta`, `registrar-consulta/:id`, `edit-appointment/:id` |
| Cuenta | `/profile`; ahora accesible a C y V autenticados, consistente con el enlace ya existente del Header |
| Nuevas | `/account/security` para ambos roles; `/security/audit` requiere permiso efectivo explícito |

`Consultas` se comparte entre `/vet` y `/pets/myappointments`; no se rediseñó ni cambió su lógica. `Appointment` se reutiliza para agendar y reagendar. También se reutilizan Profile y sus formularios MFA, formularios de acceso/recuperación, botones/tokens y navegación existentes. Los servicios Consulta, CitaService, Users, Statistics, VetService, Services, Color y Raza conservan contratos/lógica. En Mascota únicamente se preparó la cabecera de reautenticación del DELETE documentado, bajo activación explícita; su petición actual se conserva.

### Hallazgos previos corregidos

- El interceptor agregaba bearer a cualquier destino y a login/MFA.
- Access token persistente en cookie JavaScript; expiración opcional y sin cierre automático.
- JWT usa `id_usuario`; el frontend consumía `id` sin normalización.
- Guards permitían rutas privadas durante ejecución en servidor y redirigían mediante efectos imperativos. El guard C impedía abrir el perfil del veterinario.
- Recuperación tipaba respuestas como entradas; trataba cualquier HTTP 200 como éxito, incluso `{mensaje}` de error SMTP. Confirmación reenviaba un correo inexistente del formulario.
- El correo de recuperación transitaba por estado del historial; no existía una prueba de autorización para actualizar contraseña.
- No había manejo uniforme de 401/403/409/422/429, sesiones remotas ni permisos efectivos. No existe rol administrador documentado.

## Comportamiento habilitado con Backend actual

- Login/registro/MFA conservan los endpoints y formatos actuales. Registro serializa únicamente usuario, nombre, apellidos, correo_electronico, contra y confirm; no envía rol/activo/permisos. Login admite contraseñas existentes; registro respeta el límite bcrypt actual de 72 bytes sin truncarlas.
- JWT se usa en memoria. Se exige exp válido, identidad y rol C/V, y se rechazan tokens con propósito MFA o tipo distinto de acceso. Decodificar NO verifica firmas: la autorización y verificación criptográfica corresponden al servidor.
- Se elimina la cookie JavaScript heredada. Recargar/cerrar la pestaña requiere login mientras no exista refresh seguro. No se usa localStorage/sessionStorage para credenciales, desafíos, códigos o tickets.
- Expiración local controlada; respuestas tardías de acceso/refresh y 401 de una sesión anterior no reemplazan ni cierran una sesión nueva.
- Bearer solamente en URLs absolutas dentro del origen y prefijo de API configurado, excluidos los endpoints públicos de identidad/MFA. Nunca en recursos relativos del frontend o terceros.
- 403 no cierra sesión ni concede acceso; 401 protegido invalida acceso. Un 401 por contraseña incorrecta al desactivar MFA/reautenticar no se confunde con expiración del bearer. Restricción de cuenta invalida la sesión.
- Errores se presentan con mensajes locales; no se muestran excepciones arbitrarias del backend. Referencias X-Request-ID se validan. 429 respeta Retry-After en segundos, muestra espera y bloquea reenvíos del mismo método/ruta durante el intervalo. No es un limitador de fuerza bruta de servidor.
- MFA acepta seis dígitos como cadena (incluidos ceros iniciales), conserva desafío solo en memoria y exige completar el segundo factor antes de crear sesión.
- Recuperación conserva envío y comprobación actuales, valida success y msg, y corrige el reenvío. Un código legado correcto no se transforma en un ticket inventado.
- **El PATCH legado por email no se ejecuta.** Se conserva la pantalla de recuperación y se explica la dependencia del ticket seguro. El cambio de contraseña del perfil queda visible, deshabilitado y explicado hasta contar con reautenticación segura. Mantener habilitada esa llamada permitiría cambiar contraseñas sin prueba; el frontend no puede reparar la vulnerabilidad pública del servidor.
- Cierre local inmediato; no se afirma que invalide el JWT en Backend. Sesiones y acceso presenta esa limitación sin consultar endpoints propuestos.

## Integración propuesta, implementada pero desactivada

`ZERO_TRUST_ENABLED` tiene factory `false`. Todos los métodos de ZeroTrustApi comprueban el indicador al suscribirse. No hay detección por tanteo, llamadas de prueba, fallback 404 ni conversión de una respuesta actual en propuesta.

| Control futuro | Implementación frontend | Dependencia Backend |
|---|---|---|
| CSRF / cookies | Bootstrap GET auth/csrf; withCredentials y X-CSRF-Token en login/registro/MFA/refresh/logout; token CSRF en memoria y rotación al aceptar identidad | TLS, orígenes, CORS, cookies HttpOnly/Secure/SameSite y CSRF vinculados |
| Identidad | AuthenticatedResponse, desafío challenge_id, identidad/permisos devueltos por servidor, comprobación de forma de claims futuros | JWT access tipado, sid/jti/sub/iat/nbf/iss/aud/exp y emisión consistente; issuer/audience y validación reales en servidor |
| Renovación | Restauración inicial y guards comparten un único refresh en vuelo por instancia | Refresh rotatorio, detección de reutilización, expiración/revocación atómicas |
| Reintentos | Un solo reintento automático para GET/HEAD/OPTIONS tras TOKEN_EXPIRED. Mutaciones no se repiten automáticamente; pruebas X-Reauth-Token no se reenvían | Autenticación previa a efectos y resolución explícita de conflictos |
| Recuperación | challenge_id -> reset_token con expiración en memoria -> PATCH con contra/confirm, sin email ni auto-login | Tickets únicos, consumo atómico, código expirado/usado, política 15–128 y revocación de sesiones |
| Reautenticación | Diálogo con foco atrapado/restaurado, contraseña/TOTP borrados; prueba ligada a acción/recurso/sesión, uso inmediato único | auth/reauthenticate y validación/consumo de X-Reauth-Token |
| Operaciones críticas | Cambio de contraseña, configurar/desactivar MFA, revoke-all y eliminar mascota usan coordinador de reautenticación | Contratos y cabeceras propuestos de cada operación; no se inventaron otras rutas DELETE |
| Sesiones | Listar, cerrar individual, incluir/excluir actual al cerrar todas, mensajes/estados vacíos | auth/sessions, DELETE por session_id, revoke-all, logout idempotente y revocación inmediata |
| Auditoría | Consulta paginada, cursor opaco ligado a filtros, fechas UTC hasta 31 días, límite 20, filtros acción/resultado/actor | security/audit-events y permiso security:audit:read efectivo |
| Permisos | Auditoría denegada en legado. En modo confirmado estadísticas, usuarios y alta para propietario requieren statistics:read, clients:read y pets:create_for_client; links del Header se filtran sin cambiar su diseño | Catálogo/asignación explícita y autorización por recurso en Backend; V no obtiene administración/finanzas automáticamente |

No se escriben eventos de auditoría desde Angular: su fuente debe ser el servidor. Alertas/restricciones administrativas opcionales de fase 3 no se presentan como disponibles. No se modificaron DTO de citas, reglas clínicas, estados, cálculos financieros ni respuestas de consultas/directorio; sus propuestas requieren migración coordinada adicional.

### Activación pendiente

No activar por tener esta UI terminada. Backend debe confirmar los contratos anteriores, aportar entorno de integración HTTPS, cookies/CORS/CSRF, política real de permisos y resolución de issuer/audience. Después se puede proveer explícitamente `{provide: ZERO_TRUST_ENABLED, useValue: true}` en la configuración Angular y ejecutar pruebas de integración contra ese despliegue. Este cambio no se realizó.

Antes de producción deben validarse con Backend: refresh simultáneo entre pestañas (la deduplicación implementada es por instancia), carreras refresh/logout/login, cookies en la topología final, revocación absoluta/inactividad real, cambio de permisos/cuenta activa, autorización de propietario/asignación clínica y errores estandarizados. Los controles de servidor no se sustituyen con timers, guards ni validaciones del cliente.

## Archivos de esta entrega

| Grupo | Archivos |
|---|---|
| Contratos / integración | core/security/contracts.ts, api-error.ts, zero-trust-api.ts, reauthentication.ts |
| Autenticación | core/models/auth.ts; core/services/auth/auth.ts, totp.ts |
| Acceso / HTTP | core/guards/auth/{auth-cliente-guard,auth-veterinario-guard,noauth-guard,session-guard}.ts; core/interceptors/auth/auth-interceptor.ts |
| Integración de aplicación | app.ts, app.html, app.css, app.routes.ts; pages/vet/vet.routes.ts; Header TS/HTML (solo permisos, aspecto conservado) |
| Formularios reutilizados | pages/auth/{login,register,restore-password,confirm,update-password} TS/HTML según cambios; pages/profile/profile.ts y profile.html |
| Interfaces nuevas | pages/security/security-center/*; shared/components/reauth-dialog/* |
| Operación crítica | core/services/mascota/mascota.ts (solo DELETE condicionado) |
| Pruebas | core/services/auth/auth.spec.ts; core/security/security-ui.spec.ts; editorial-redesign.spec.ts (fixture Auth actualizado); karma.security.cjs; script test:security en package.json |
| Documentación | Este archivo y zero-trust-api-contracts.md |

Las demás diferencias preexistentes de rediseño e imagen consulta.png no corresponden a esta integración y se conservaron.

## Validación

Desde Veterinaria: `npm run test:security` ejecuta la selección de pruebas con Karma/Jasmine y Chrome Headless usando las dependencias existentes. Los contratos propuestos se habilitan SOLO dentro de fixtures, con HttpTestingController; no se enviaron peticiones a una API real. Cobertura funcional: credenciales en memoria, formatos actuales/propuestos, ausencia de llamadas futuras en modo actual, CSRF, MFA, expiración local, permisos y guards concurrentes, 401/403/429, errores sin filtraciones, respuestas tardías, tickets expirados y pruebas de reautenticación de uso único. Incluye pruebas DOM de interfaces y regresión del Header/Editorial Care.

Una ejecución inicial ampliada con Home pasó 75/76: la expectativa de tamaño de la fotografía exige 712x474 pero consulta.png preexistente mide 1536x1024. No se cambió la imagen ni esa prueba ajena al alcance. La ejecución final reproducible con `npm run test:security` pasó **81/81**, incluidos los ajustes finales de permisos y navegación.

`ng build` final de producción pasó: bundle inicial 443.58 kB, con las advertencias CommonJS existentes. El sandbox bloqueó inicialmente la descarga de Google Fonts; se ejecutó con acceso autorizado a las fuentes existentes. No se cambiaron fuentes ni dependencias para eludirlo. No se afirma validación visual manual, conectividad con API real, escaneo de seguridad del servidor ni validación de todos los specs históricos del repositorio.
