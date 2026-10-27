# Diagnóstico Zero Trust y contratos de API para Angular

Fecha de revisión: 25 de octubre de 2026. Estado: diseño propuesto, sin implementación.

## 1. Alcance y conclusión

El backend dispone de contraseñas con bcrypt, JWT firmados, MFA TOTP y comprobaciones parciales de propietario y rol. No dispone de una frontera de autenticación uniforme, sesiones revocables, recuperación de contraseña vinculada a una prueba ni protección observable contra fuerza bruta. Primero deben cerrarse las rutas de acceso y cambio de contraseña; agregar sesiones sobre la autorización actual dejaría vías de evasión.

Este documento es el entregable para Backend y Frontend. Las secciones **actual** describen código inspeccionado; las secciones **propuesta** definen contratos futuros y no garantizan disponibilidad. No se ejecutaron migraciones, peticiones contra datos reales, correcciones ni pruebas ofensivas. Los cambios locales anteriores forman parte del estado inspeccionado y deben conservarse.

Referencia funcional: archivo Word `4aab4c31-de31-430c-9408-e42394a2bc82_Mirsa.docx`, apartados Mirsa y Mirsa1. Se extrajeron sus párrafos y tablas OOXML; no se evaluó su diseño visual. Sus actividades son requisitos de referencia, no instrucciones para ejecutar cambios. Solo contiene controles 4, 5, 7, 8, 9, 10, 11 y 12; no se atribuyen controles adicionales al documento. El 10 se plantea como evaluación de viabilidad y el 12 como investigación.

### Límites de la revisión

- Inspección estática de `main.py`, `router.py`, todos los módulos de `app/api`, esquemas Pydantic, dependencias, utilidades JWT, modelos de identidad/citas/consultas, servicios de correo e IA, requisitos y pruebas disponibles.
- Inventario obtenido de decoradores y firmas reales. No se usó una API supuesta ni se levantó el servidor para inferir contratos.
- No se leyó `.env` ni se publican secretos. No se inspeccionó el esquema desplegado, sus datos, infraestructura, Angular, proxy, certificados, permisos de BD o política de copias de seguridad.
- SQLAlchemy recibe `BD_URL`. El uso de `date_format` y la dependencia PyMySQL apuntan a MySQL; motor, versión, aislamiento y soporte de bloqueos deben verificarse antes del DDL. Los modelos no prueban que las columnas existentes coincidan.
- No hay configuración de migraciones, despliegue TLS, CI de seguridad ni middleware de límites en los archivos revisados. Esto no prueba su ausencia fuera del repositorio.

## 2. Arquitectura actual

```text
Cliente HTTP / Angular (no inspeccionado)
  -> FastAPI en main.py: CORS + manejador de validación 422
  -> router.py: diez routers de negocio y autenticación
  -> funciones de app/api: acceso SQLAlchemy y reglas mezcladas
  -> get_db: Session por petición, close al finalizar
  -> BD configurada mediante BD_URL
  -> servicios externos: SMTP y Google GenAI para resúmenes clínicos
```

No hay prefijo global `/api` ni `/v1`. `app/api/api.py` y `app/services/services.py` no aportan rutas; el router de `algorithm_topsis.py` no se monta en `router.py`. `mark_accept_cita` es una función interna llamada desde consultas; su decorador HTTP está comentado.

### 2.1 Autenticación y JWT actuales

| Mecanismo | Evidencia y comportamiento real | Deficiencia |
|---|---|---|
| Registro | `app/api/auth.py:create_user`; `RegisterUser`; bcrypt con salt y 12 rondas; rol fijado en `C`, activo en verdadero | Sin política de contraseña, límites de longitud o verificación de correo; emite acceso inmediatamente |
| Login | Busca correo o usuario; compara bcrypt; verifica `activo`; bifurca por `twofa_habilitado` | `except Exception` captura incluso HTTPException y convierte 401/403 en 400; puede revelar excepciones |
| JWT de acceso | `app/utils/security.py:write_access_token`: HS256, clave compartida, `exp` a 30 días; contiene id, usuario, correo, rol y nombre | Sin `sid`, `jti`, `iat`, `iss`, `aud` ni tipo explícito; datos personales legibles en payload; sin revocación |
| JWT MFA | `mfa_token`: misma clave y HS256, id, `purpose=mfa`, 3 minutos | Dependencia común no comprueba propósito: el desafío MFA puede funcionar como bearer antes de completar el segundo factor |
| Resolución de identidad | `get_current_user` decodifica con algoritmo de settings y busca usuario en BD | Devuelve `None` por cabecera ausente/JWT inválido; no exige `activo`, `exp` como claim obligatorio ni token de acceso; parseo `split` e `int` pueden lanzar errores no tratados |
| Verificación de token | `/auth/verify_token` usa HTTPBearer y `validate_token` | No verifica sesión ni cuenta; algoritmo HS256 fijo frente a configuración variable; mensajes de expirado/inválido invertidos; doble decode |
| TOTP | QR; secreto temporal por 10 minutos; confirmación y login con ventana ±1 intervalo | Secretos en texto en BD; secreto temporal impreso; `ultimo_uso_totp` existe pero no se utiliza; no hay consumo de desafío ni rechazo de repetición |
| Desactivar TOTP | Compara contraseña en `/totp/desactivar` | Reautenticación parcial solo aquí; no exige TOTP, no revoca sesiones; dependencia puede devolver `None` |
| Recuperación | `/send_code` guarda hash y `/enter_code` compara el último | No verifica expiración ni `usado`; código generado con `random`; hash bcrypt no cabe en `String(10)` del modelo; marca usado pero no genera autorización de restablecimiento |
| Cambio de contraseña | `/auth/update_password` actualiza por `email` y nueva contraseña | Público, sin sesión ni código ni ticket; permite intentar cambiar contraseña de cualquier correo conocido |

Las importaciones de `jwt` y `settings` ya están presentes en el `totp.py` inspeccionado. El NameError reportado anteriormente no sigue presente en esta copia, aunque subsisten los problemas de control de acceso.

### 2.2 Sesiones y autorización actuales

No se encontraron logout, refresh, tabla de sesiones, revocación de JWT ni cierre de otras sesiones. Cerrar Angular o borrar su token no invalida el JWT. Cambiar contraseña, desactivar MFA o desactivar una cuenta no revoca los tokens emitidos; la dependencia común no rechaza cuentas inactivas. `Session` de SQLAlchemy es una transacción de BD y no una sesión de autenticación.

Los únicos roles observados en reglas son `C` y `V`. No se observó un rol administrador ni un sistema de permisos. Algunas rutas comparan propietario o permiten cualquier veterinario; no verifican siempre asignación de mascota/cita al profesional. Los filtros Angular no constituyen autorización del servidor.

## 3. Inventario real de endpoints

Todos los caminos siguientes son literales. **Público** significa que la función carece de autenticación obligatoria en el código; no expresa que sea una política adecuada. **Dependencia** significa que recibe `get_current_user`, que por sí sola no obliga a estar autenticado. Las rutas privadas requieren corrección transversal aunque aquí se indique una comprobación local.

### 3.1 Identidad actual y formatos actuales

| Método y ruta | JSON de entrada o cabecera actual | Respuesta de éxito actual | Fallos relevantes actuales |
|---|---|---|---|
| POST `/auth/create_user` | `{usuario,nombre,apellidos,correo_electronico,contra,confirm}`; acepta alias `nombres` y `correo` | 200 `{access_token}` | 400 duplicado/contraseñas distintas; 422 validación |
| POST `/auth/login` | `{usuario_mail,contra}` | 200 `{access_token}` o `{requires_2fa:true,mfa_token,message}` | Credenciales erróneas y cuenta inactiva terminan en 400 por captura general |
| POST `/auth/send_code` | `{email}` | 200 `{success,message,correo}` | 400 correo inexistente; errores SMTP/BD pueden devolverse con 200 `{mensaje}` |
| POST `/auth/enter_code` | `{email,code}` | 200 `{msg:"bien"}` | 404 usuario/sin códigos; 400 código distinto |
| PATCH `/auth/update_password` | `{email,contra}` | 200 `{msg}` | No requiere autorización; no comprueba filas actualizadas |
| POST `/auth/verify_token` | `Authorization: Bearer <JWT>`; sin body | 200 payload JWT decodificado | 401 de decode; rechazo HTTPBearer cuando falta cabecera |
| POST `/totp/configurar` | Bearer; sin body | 200 `{success,message,qr_code:"data:image/png;base64,..."}` | 400 ya habilitado; 500 con texto de excepción; no valida identidad nula |
| POST `/totp/confirmar` | Bearer; `{code:"123456"}` | 200 `{success,message}` | 400 expiración/no configurado/código inválido; 422 patrón |
| POST `/totp/verificar-2fa` | `{token:"<mfa_token>",code:"123456"}` | 200 `{access_token}` | 401 JWT expirado/inválido; 400 propósito/MFA/código; 404 usuario; sin validar activo |
| POST `/totp/desactivar` | Bearer; `{contrasena}` | 200 `{success,message}` | 400 no habilitado; 401 contraseña; 404 usuario; identidad nula puede fallar |
| GET `/totp/have2fa` | Bearer | 200 `{Habilitado:true}` | Identidad nula o registro ausente puede causar 500 |

Los tipos y obligatoriedad reales están en `app/schemas/user.py`. `EmailUser.email` es `str`, no `EmailStr`. Los códigos de TOTP son cadenas de seis dígitos, para conservar ceros iniciales.

### 3.2 Negocio actual y política de destino

La columna destino es **propuesta**. `Propietario` significa relación comprobada en BD; `V asignado` exige relación mediante `Veterinario.id_usuario` y la cita, no basta con rol `V`. Para atención sin cita/asignación se necesitará un flujo explícito de autorización clínica, pendiente de decisión; no se debe habilitar acceso global como sustituto.

| Método y ruta real | Control actual | Destino propuesto |
|---|---|---|
| GET `/` | Público; `{Hello:"World"}` | Público, sin datos operativos |
| GET `/users/get/All_users?name=` | Público; devuelve id y nombre de clientes activos | Permiso `clients:read`; búsqueda limitada y paginada |
| GET `/users/get/petsById?id=` | Público; mascotas de un usuario elegido | Propietario o permiso `clients:read` con alcance clínico |
| GET `/pet/pets` | Público; todas las mascotas | Retirar uso global por clientes; permiso explícito y paginación |
| GET `/pet/pets/{pet_id}` | Propietario o cualquier V | Propietario o V asignado |
| GET `/pet/petsByUserLogged` | Identidad exigida localmente; 404 si vacío | Usuario activo; lista propia vacía con 200 |
| GET `/petpetsByUser/{id_user}` | Público; falta `/` en decorador | Corregir a `/pet/petsByUser/{id_user}` con control de alcance |
| POST `/pet/create` | Dependencia; accede a id antes de comprobar identidad | Propietario autenticado; dueño fijado por servidor |
| PUT `/pet/update/{pet_id}` | Propietario; asigna solo campos de MascotaUpdate | Propietario; validación estricta; proteger atributos administrativos |
| DELETE `/pet/delete/{pet_id}` | Compara dueño pero no valida identidad nula | Propietario + reautenticación; preservar historial por política |
| GET `/pet/cartilla/{id_mascota}` | Público; propietario con correo e historial clínico | Propietario o V asignado; auditar lectura sensible |
| POST `/pet/create_byuser` | Cualquier usuario identificado puede elegir `id_user` | Permiso `pets:create_for_client` con alcance autorizado |
| GET `/pet/get/specie?id=` | Público; sin validar resultado nulo | Propietario o V asignado |
| POST `/citas/create` | Exige identidad; comprueba existencia de mascota/V; no propiedad de mascota | Propietario; estado `P` fijado por servidor; V permitido según agenda |
| GET `/citas/` | Público; todas con datos anidados | Permiso `appointments:read_all` y alcance, paginado |
| GET `/citas/my_citas` | Usuario identificado; filtra id_usuario | Usuario activo; solo propias |
| GET `/citas/{id_cita}` | Propietario o cualquier V | Propietario o V asignado |
| PATCH `/citas/update/{id_cita}` | Propietario o cualquier V; fecha/hora | Propietario o V asignado; solo pendiente; validar disponibilidad |
| PATCH `/citas/cancelarCita/{id_cita}` | Solo propietario | Propietario; transición desde pendiente |
| DELETE `/citas/delete/{id_cita}` | Público | Permiso de eliminación restringido + reautenticación; priorizar cancelación |
| GET `/citas/show/citas?status=P` | Usuario; filtra dueño o V encontrado | Usuario activo y alcance; enum P/A/N/C |
| GET `/citas/ranking/citas` | Busca V de usuario; solo sus pendientes | V asignado; minimizar notas clínicas |
| PATCH `/citas/mark/refused/{id_cita}` | Recibe identidad pero no la comprueba ni usa | Solo V asignado; transición P a N |
| GET `/citas/horas-disponibles/{servicio}?fecha=` | Público; excluye toda cita ocupante, incluso cancelada | Público con límite y datos mínimos; excluir canceladas y validar agenda |
| GET `/consultas/` | Público; historial y relaciones | Permiso clínico y alcance, paginación; nunca público |
| GET `/consultas/{id_mascota}` | Solo V, sin asignación | V asignado; propietario consume cartilla con DTO mínimo |
| POST `/consultas/create` | Recibe identidad pero no la comprueba ni usa; marca cita A | Solo V asignado a cita pendiente; operación transaccional |
| DELETE `/consultasdelete/{id_consulta}` | Público; falta `/` en decorador; éxito 204 | Corregir a `/consultas/delete/{id_consulta}`; permiso clínico de eliminación + reautenticación |
| PATCH `/consultas/generarResumenClinico/{id_mascota}` | Solo V, sin asignación; envía contenido clínico a GenAI | V asignado; permiso de uso de IA y minimización; auditar |
| GET `/consultas/cita_data/{id_cita}` | Público; datos de mascota/profesional | V asignado |
| GET `/consultas/get/recomendaciones` | Usa identidad sin comprobar `None`; propias por consulta | Usuario activo; filtrar propias; minimizar comparación entre pacientes |
| GET `/veterinario/veterinarios` | Público; incluye UserOut con correo y usuario | Directorio público mínimo si se aprueba: id y nombre profesional |
| GET `/razas/?especie=` | Público | Público; enum de especie, límites de consulta |
| GET `/color/colors` | Público | Público; catálogo mínimo |
| GET `/statistics/` | Público; finanzas, clientes y actividad global | Permiso `statistics:read`; sin atribuirlo automáticamente a C o V |

No existe actualmente un perfil para administrar seguridad o finanzas. Los permisos propuestos deben asignarse explícitamente mediante un proceso de administración; quedan denegados hasta definirlo. No se crea un supuesto rol `A`.

### 3.3 Validación y datos sensibles

- Pydantic valida tipos, fechas y el correo del registro; TOTP tiene patrón; Color usa Literal. El registro impone `rol=C` y no toma `rol` del body. `MascotaUpdate` excluye dueño y rol, por lo que no permite modificar esos atributos directamente mediante `setattr`.
- Los esquemas no prohíben extras de forma general: Pydantic los ignora por defecto. No equivale a escalada de rol en el registro, pero conviene rechazarlos con 422. Faltan límites equivalentes a columnas, IDs positivos, textos no vacíos, reglas de peso/fecha y enums de servicio, estado, sexo y especie según catálogo confirmado.
- CitaCreate acepta `estado` libre. La validación de duplicados bloquea si ya hay P para la mascota con bloqueo de fila; no comprueba propiedad, no fuerza que la nueva cita sea P y no hay unicidad equivalente declarada en el modelo. Las pruebas actuales usan mocks, no prueban concurrencia real.
- ConsultaCreate permite elegir cualquier `id_cita`; la ruta no comprueba autenticación, rol o asignación. Faltan reglas de transición y coherencia de cuidados/tratamientos.
- El ORM usa filtros SQLAlchemy parametrizados en las rutas inspeccionadas; no se observó concatenación de SQL ejecutable. Eso no protege de acceso horizontal a IDs ajenos.
- `UserOut` excluye contraseña y secretos, pero expone correo/usuario/nombre en respuestas anidadas de veterinarios y citas. Cartilla expone correo del propietario e información clínica. Las listas carecen de paginación general.
- `/totp/configurar` imprime el secreto temporal. Hay comentarios con material de configuración de correo en `app/services/email.py`; revisar si contienen credenciales reales, retirar y rotar si procede, sin copiarlos al informe.
- bcrypt se guarda como bytes en una columna String y se lee usando `.encode()`: normalizar a texto ASCII. Con bcrypt 5, contraseñas superiores a 72 bytes requieren manejo explícito para evitar errores; no truncar silenciosamente. Proponer Argon2id con verificación y migración gradual de hashes bcrypt.
- El modelo de códigos usa `String(10)` para un hash bcrypt, que normalmente requiere 60 caracteres. La BD real puede truncar o rechazar: verificar sin asumir que está migrada.
- `GenerarResumenIA` envía motivo, diagnóstico, observaciones y tratamiento a Google GenAI. No incluye IDs en el prompt construido, pero los textos libres pueden contener datos personales. Evaluar proveedor, retención y base de autorización antes de usarlo en producción.
- CORS permite `*` con credenciales. No se observó obligación HTTPS, política de hosts, cabeceras de seguridad ni confianza explícita en proxy; TLS podría estar terminado externamente y debe verificarse. CORS no sustituye autenticación ni evita clientes fuera del navegador.
- El manejador 422 genera request_id y registra loc/type sin body. No registra usuario, operaciones exitosas ni accesos denegados; no constituye una auditoría completa. Otros errores aún usan `str(e)` y no tienen formato uniforme.

## 4. Matriz de controles del documento

| Control de referencia | Estado | Evidencia actual | Mejora o ausencia | Prioridad |
|---|---|---|---|---|
| 4 Registro de auditoría | Parcial | Logs Uvicorn y auditoría 422 en `validation_audit.py` | Eventos con usuario, fecha UTC, acción, recurso, resultado, denegación; almacenamiento protegido y consulta restringida | P0 base; P1 consulta |
| 5 Ciclo de vida de sesiones | Parcial | exp de 30 días/3 minutos | Tipo y claims obligatorios, acceso corto, sesiones, refresh rotatorio, revocación inmediata, expiración absoluta/inactividad | P0 separar tokens; P1 sesiones |
| 7 Fuerza bruta | Ausente en código | Sin contadores o límites; Redis solo en dependencias | Límites distribuidos de login, MFA, recuperación y reautenticación; restricciones temporales y Retry-After | P0 |
| 8 Datos sensibles | Parcial | bcrypt con salt; DTOs excluyen hash; settings en .env ignorado por Git | HTTPS verificable, mínimos DTOs y permisos, cifrar secretos TOTP, eliminar logs sensibles, endurecer recuperación y configuración | P0/P1 |
| 9 Reautenticación crítica | Parcial | Contraseña en desactivación TOTP | Prueba reciente vinculada a usuario/sesión/acción/recurso; MFA si habilitado; consumo de un solo uso | P2 tras sesiones |
| 10 Detección y respuesta | No implementado; viabilidad pendiente | No motor de eventos/alertas | Evaluar reglas simples con auditoría; alertas restringidas, revocación y bloqueo temporal con revisión | P3 opcional |
| 11 Validación backend | Parcial | Pydantic, rol C fijado, propietarios en algunas rutas, duplicado P | DTOs estrictos, reglas de dominio, permisos por objeto, control de campos y transiciones | P0/P1 |
| 12 Evaluación continua | Parcial en pruebas funcionales; investigación pendiente | 7 pruebas de validación/duplicados; sin suite Zero Trust o CI visible | Pruebas de acceso horizontal, MFA, revocación/concurrencia y contratos; análisis estático/dependencias; DAST en entorno de pruebas | Transversal |

## 5. Arquitectura de destino propuesta

1. Dependencia obligatoria única: validar firma, algoritmo configurado, tipo, issuer, audience, tiempos y sesión; buscar usuario activo y permisos actuales en BD. Falla cerrada si no se puede comprobar revocación.
2. Autorización por acción y recurso: propietario o profesional asignado, permisos especiales explícitos, denegación por defecto. Autenticar no concede acceso a toda la tabla.
3. Separar tokens de acceso, desafíos MFA, recuperación y reautenticación. Ninguno es intercambiable. Solo el access JWT entra por Authorization en negocio; retos y tickets viajan en bodies específicos.
4. Crear una capa de servicios para transacciones de identidad, auditoría y reglas de citas; evitar copiar políticas en cada endpoint. Registrar denegaciones y operaciones sensibles con un request_id común.
5. Persistir sesiones y decisiones críticas; Redis puede acelerar límites, pero no es por sí solo la fuente de revocación. No depender de contadores por proceso Uvicorn.

### Parámetros iniciales propuestos

Son valores de diseño revisables por configuración; no están implementados ni exigidos numéricamente por el Word.

| Parámetro | Propuesta |
|---|---|
| Access JWT | 15 minutos; sin nombre, correo ni historia clínica |
| Sesión | Máximo absoluto 7 días; inactividad 30 minutos, comprobada por servidor |
| Refresh | Opaco aleatorio de al menos 256 bits, rotado en cada uso; nunca prolonga el máximo absoluto |
| Desafío MFA | 3 minutos, 5 fallos máximo; consumo al completar |
| Configuración TOTP | Temporal 10 minutos; ventana ±1 intervalo; rechazo atómico de timestep ya usado |
| Reautenticación | Prueba 5 minutos, un uso, vinculada a sesión/acción/recurso |
| Recuperación | Desafío 10 minutos, 5 intentos; ticket de reset 5 minutos, un uso |
| Login | 5 fallos por identidad normalizada en 15 minutos: restricción 15 minutos; 30 intentos por IP en 5 minutos: restricción 5 minutos |
| Recuperación de correo | 3 solicitudes por identidad por hora y 20 por IP por hora; respuesta genérica para identidad existente/inexistente |
| MFA/reautenticación | 5 fallos por desafío o sesión en 5 minutos; restricción 5 minutos y consumo del desafío al agotar intentos |

Contar identidades desconocidas con la misma política; no revelar existencia ni contadores exactos. Considerar NAT, IPv6, abuso para bloquear víctimas y límites globales. La IP proviene solo de proxies configurados como confiables. Si Redis falla, rechazar temporalmente operaciones de autenticación limitadas con 503; no desactivar límites silenciosamente.

## 6. Convenciones de contratos futuros

Los contratos de esta sección en adelante son **PROPUESTOS**. Mantener rutas existentes donde resulte seguro, pero los cambios de body/respuesta son incompatibles: Backend y Angular deben desplegarlos coordinadamente. No mantener una variante pública vulnerable del cambio de contraseña como compatibilidad.

- JSON UTF-8; timestamps UTC ISO 8601 con `Z`; ids de negocio enteros positivos, ids de sesión/desafío opacos UUID; null solo cuando se indica. Ejemplos con `<...>` son valores ilustrativos, no tokens utilizables.
- Todos los endpoints privados exigen `Authorization: Bearer <access_token>`; comprobar usuario activo y sesión en cada petición. No guardar access token en localStorage/sessionStorage; mantenerlo en memoria Angular.
- `X-Request-ID` generado por servidor en todas las respuestas; devolver también request_id en errores. No confiar sin validación en un id enviado por cliente. `Cache-Control: no-store` para identidad, MFA, sesiones y datos clínicos.
- 401: autenticación ausente, expirada, revocada o inválida; `WWW-Authenticate: Bearer` en recursos con bearer. 403: identidad válida sin permiso o cuenta restringida. 404: recurso inexistente o fuera del alcance para evitar enumeración. 409: conflicto de estado/dominio. 422: tipos/campos/reglas inválidos. 429: límite temporal, con `Retry-After` en segundos. 500: error genérico sin excepción interna; 503: dependencia de seguridad no disponible.
- Esos códigos comunes aplican a todos los contratos relevantes, además de los particulares de sus tablas. 204 no lleva body. No retornar fallos de envío o autenticación con 200.
- Validadores: `extra=forbid`, límites de longitud, listas acotadas, enums y coherencia entre referencias. Jamás devolver `input`, contraseñas, cookies, tokens o secretos en errores/logs.

### Error único propuesto

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Revisa los campos indicados",
    "fields": [{"path": "body.correo_electronico", "code": "invalid_email"}],
    "retry_after_seconds": null
  },
  "request_id": "<uuid>"
}
```

`fields` siempre es array, vacío si no aplica; `retry_after_seconds` entero positivo en 429 y null en otros casos. Códigos estables: `INVALID_CREDENTIALS`, `INVALID_TOKEN`, `TOKEN_EXPIRED`, `SESSION_REVOKED`, `SESSION_EXPIRED`, `ACCOUNT_RESTRICTED`, `FORBIDDEN`, `NOT_FOUND`, `VALIDATION_ERROR`, `RATE_LIMITED`, `REAUTH_REQUIRED`, `INVALID_REAUTH_PROOF`, `INVALID_CHALLENGE`, `ACTIVE_APPOINTMENT_EXISTS`, `STATE_CONFLICT`, `SECURITY_DEPENDENCY_UNAVAILABLE`, `INTERNAL_ERROR`. El mensaje es para presentación; Angular decide flujo usando code y HTTP, no texto traducido.

```json
{
  "error": {
    "code": "RATE_LIMITED",
    "message": "Intenta de nuevo más tarde",
    "fields": [],
    "retry_after_seconds": 300
  },
  "request_id": "<uuid>"
}
```

### Cookies, refresh y CSRF propuestos

Topología elegida para este diseño: Angular y API bajo el mismo sitio HTTPS, preferentemente mismo origen mediante proxy. Verificar dominios reales antes de implementar. Refresh en cookie `__Host-vet_refresh`, `HttpOnly; Secure; SameSite=Lax; Path=/`, sin Domain. Su caducidad nunca supera la sesión. No se devuelve refresh en JSON. Cookie CSRF `__Host-vet_csrf`, `Secure; SameSite=Lax; Path=/`, sin Domain, legible por cliente si comparten origen; el endpoint CSRF también devuelve el valor en JSON para orígenes distintos autorizados.

Refresh y logout basados en cookie exigen `Origin` permitido y `X-CSRF-Token` vinculado a la cookie y sesión. Login/registro/MFA también verifican Origin en navegador y usan bootstrap CSRF antes de establecer cookies, para evitar login CSRF. Un refresh rota cookie y CSRF; el backend valida el token anterior antes de rotar. Angular usa `withCredentials: true` y cabecera explícita para estos endpoints; su interceptor XSRF por defecto no basta para una API en otro origen.

CORS: lista exacta de orígenes; credenciales solo para esos orígenes; permitir Authorization, Content-Type, X-CSRF-Token, X-Reauth-Token; exponer X-Request-ID y Retry-After. Si el despliegue exige sitios diferentes, revisar SameSite/CSRF y restricciones de cookies antes de adoptar esta propuesta. No cambiar a SameSite=None sin esa revisión.

## 7. Contratos de autenticación y sesiones propuestos

### 7.1 Formatos compartidos

`UsuarioActual`: id_usuario, usuario, nombre, apellidos, correo_electronico, rol (`C` o `V` observados; no ampliar sin migración), twofa_habilitado y permissions (array de permisos efectivos calculados por servidor).

Respuesta autenticada `AuthenticatedResponse` de login sin MFA, completar MFA, registro y refresh:

```json
{
  "status": "authenticated",
  "access_token": "<access-jwt>",
  "token_type": "bearer",
  "expires_in": 900,
  "session_id": "<uuid>",
  "csrf_token": "<csrf-token>",
  "user": {
    "id_usuario": 7,
    "usuario": "cliente",
    "nombre": "Ana",
    "apellidos": "Pérez",
    "correo_electronico": "ana@example.com",
    "rol": "C",
    "twofa_habilitado": false,
    "permissions": ["pets:read_own", "appointments:create_own"]
  }
}
```

La respuesta establece/rota las cookies correspondientes. Los permisos sirven para presentar UI; el servidor vuelve a comprobarlos. El JWT propuesto contiene `sub` (id de usuario como string), `sid`, `jti`, `token_use=access`, `iat`, `nbf`, `exp`, `iss` y `aud`; no contiene permisos confiables sin revalidación. Issuer y audience se fijan en configuración de entorno, no se aceptan del cliente.

### 7.2 Operaciones

| Método y ruta | Situación | Entrada | Salida y códigos específicos |
|---|---|---|---|
| GET `/auth/csrf` | Nueva | Sin body; Origin autorizado | 200 `{csrf_token:"<token>"}` y cookie CSRF; 403 origen no permitido |
| POST `/auth/create_user` | Existente, contrato modificado | Registro canónico de abajo, CSRF | 201 AuthenticatedResponse; 409 `STATE_CONFLICT` identidad no disponible, sin distinguir correo/usuario; 422; 429 |
| POST `/auth/login` | Existente, contrato modificado | `{usuario_mail,contra}`, CSRF | 200 AuthenticatedResponse o MfaRequiredResponse; 401 INVALID_CREDENTIALS; 403 ACCOUNT_RESTRICTED solo después de prueba válida; 429 |
| POST `/totp/verificar-2fa` | Existente, contrato modificado | `{challenge_id,code}`, CSRF; no bearer | 200 AuthenticatedResponse; 401 INVALID_CHALLENGE para reto/código inválido/expirado/consumido; 429 |
| GET `/auth/me` | Nueva | Bearer; sin body | 200 UsuarioActual; 401; 403 cuenta restringida |
| POST `/auth/refresh` | Nueva | Sin body; cookies refresh/CSRF, X-CSRF-Token | 200 AuthenticatedResponse y rotación; 401 expirado/revocado/reutilizado; 403 CSRF; 429 |
| POST `/auth/logout` | Nueva | Sin body; refresh y CSRF; access opcional | 204, revoca sesión y borra ambas cookies; idempotente si sesión ya no existe; 403 CSRF |
| GET `/auth/sessions` | Nueva | Bearer | 200 SessionListResponse, solo sesiones propias |
| DELETE `/auth/sessions/{session_id}` | Nueva | Bearer; sin body | 204 revocada; 404 ajena/inexistente; si era actual Angular limpia estado y servidor borra cookies de esa sesión |
| POST `/auth/sessions/revoke-all` | Nueva | Bearer, `{include_current:true}`, X-Reauth-Token | 204; revoca todas o todas menos actual según booleano requerido; 403 REAUTH_REQUIRED; borra cookies si incluye actual |
| POST `/auth/verify_token` | Existente, deprecación propuesta | Bearer; sin body | Durante transición 200 `{valid:true,expires_at:"<UTC>"}` tras verificar sesión; Angular migra a me; no devolver payload libre |

`MfaRequiredResponse` no emite access token, refresh ni sesión autenticada:

```json
{
  "status": "mfa_required",
  "challenge_id": "<uuid>",
  "expires_in": 180,
  "methods": ["totp"]
}
```

Se reemplaza el actual `{token: mfa_token,code}` por `{challenge_id,code}`; Angular debe adaptar el formulario. El desafío opaco debe estar ligado a la autenticación previa y al contexto CSRF; la restricción por cuenta se mantiene aunque se pidan nuevos desafíos. Al completarlo se vuelve a comprobar cuenta activa y se consume atómicamente.

Registro canónico propuesto; todos requeridos:

```json
{
  "usuario": "cliente",
  "nombre": "Ana",
  "apellidos": "Pérez",
  "correo_electronico": "ana@example.com",
  "contra": "<nueva-contraseña>",
  "confirm": "<nueva-contraseña>"
}
```

Longitudes propuestas: usuario 3–50, nombre/apellidos 1–100, correo válido hasta 100 para compatibilidad con modelo actual. Contraseña nueva 15–128 caracteres, sin reglas arbitrarias de composición, evaluando contraseñas comprometidas. Este máximo requiere Argon2id; mientras siga bcrypt, documentar y validar el máximo de 72 bytes, nunca truncar. Login debe verificar contraseñas heredadas sin imponerles el mínimo nuevo. Alias `nombres`/`correo` solo durante transición explícita; rechazar colisiones de alias con valores diferentes y atributos como rol, activo y permisos. Rol/activo se fijan en servidor.

`SessionListResponse` propuesto:

```json
{
  "items": [
    {
      "session_id": "<uuid>",
      "created_at": "2026-10-25T12:00:00Z",
      "last_seen_at": "2026-10-25T12:05:00Z",
      "expires_at": "2026-11-01T12:00:00Z",
      "is_current": true,
      "device_label": "Navegador de escritorio",
      "ip_masked": "192.0.2.x"
    }
  ]
}
```

No exponer refresh hashes, tokens, IP completa ni huellas únicas. Revocar una sesión invalida access y refresh asociados inmediatamente. Detectar refresh reutilizado revoca toda su familia; usar transacción/bloqueo para consumo único. Angular serializa refresh y coordina pestañas; solo reintenta una vez tras TOKEN_EXPIRED y no renueva ante SESSION_REVOKED o FORBIDDEN. Una renovación no demuestra presencia humana ni elimina la caducidad por inactividad real.

## 8. Recuperación y cambio de contraseña propuestos

Estos contratos reemplazan los cuerpos actuales inseguros. No habilitar un fallback `{email,contra}`. La recuperación no crea sesión automáticamente y revoca todas las sesiones al concluir.

| Método y ruta | Entrada | Éxito | Fallos |
|---|---|---|---|
| POST `/auth/send_code` existente modificado | `{email:"ana@example.com"}` | 202 `{message:"Si la cuenta existe, recibirás instrucciones",challenge_id:"<uuid>",expires_in:600}` | 422, 429; misma forma y tiempos comparables para correo inexistente; reto sintético para no enumerar |
| POST `/auth/enter_code` existente modificado | `{challenge_id:"<uuid>",code:"123456"}` | 200 `{reset_token:"<opaque-token>",expires_in:300}` | 401 INVALID_CHALLENGE, 422, 429; consumo atómico del código |
| PATCH `/auth/update_password` existente modificado | `{reset_token:"<opaque-token>",contra:"<nueva>",confirm:"<nueva>"}` | 204; consume ticket y revoca todas las sesiones del usuario vinculado al ticket | 401 INVALID_TOKEN, 422 política/confirmación, 429 |
| PATCH `/auth/password` nueva para usuario conectado | Bearer, X-Reauth-Token; `{contra:"<nueva>",confirm:"<nueva>"}` | 204; revoca todas las sesiones, incluida actual, borra cookies; Angular vuelve a login | 403 REAUTH_REQUIRED/INVALID_REAUTH_PROOF; 422; 429 |

Generar códigos con CSPRNG. Vincular desafío a usuario, propósito, expiración, intentos y uso; almacenar digest seguro, sin código en claro. Para códigos de baja entropía usar HMAC con clave separada fuera de BD y comparación constante, además del límite de intentos. No basta con un hash rápido sin clave. Tickets de reset aleatorios de alta entropía se guardan solo como digest. Correo solo al iniciar recuperación, nunca como prueba para finalizarla. El envío debe desacoplarse con cola/outbox para respuesta genérica y consistencia; nunca registrar el contenido del correo de recuperación.

## 9. Reautenticación y MFA propuestos

### 9.1 Prueba reciente

Nueva `POST /auth/reauthenticate`, bearer obligatorio:

```json
{
  "action": "mfa:disable",
  "resource_id": null,
  "contrasena": "<contraseña-actual>",
  "code": "123456"
}
```

`action` enum permitido: `mfa:configure`, `mfa:disable`, `password:change`, `sessions:revoke_all`, `pet:delete`, `appointment:delete`, `consultation:delete`, `security:restrict_user`. `resource_id` string del ID para acciones por recurso y null para acciones sobre sí mismo. `code` es requerido si MFA está habilitado y se omite en caso contrario; `contrasena` siempre requerida. Verificar primero que el usuario puede ejecutar la acción sobre el recurso. MFA no concede permisos adicionales.

200:

```json
{"reauth_token":"<opaque-proof>","expires_in":300,"action":"mfa:disable","resource_id":null}
```

401 INVALID_CREDENTIALS con mensaje genérico para contraseña/TOTP; 403 FORBIDDEN; 429 RATE_LIMITED. La acción crítica presenta `X-Reauth-Token`, no la contraseña otra vez. Prueba vinculada a usuario, sesión y parámetros de alcance, consumo único dentro de la misma transacción de la operación exitosa; caduca si cambia sesión, contraseña o MFA. Falta de prueba: 403 REAUTH_REQUIRED; inválida/consumida: 403 INVALID_REAUTH_PROOF. No repetir automáticamente una mutación con prueba consumida.

### 9.2 Administración TOTP

| Ruta existente con contrato propuesto | Entrada | Éxito | Fallos particulares |
|---|---|---|---|
| POST `/totp/configurar` | Bearer, X-Reauth-Token acción mfa:configure; sin body | 200 `{success:true,qr_code:"data:image/png;base64,...",expires_at:"<UTC>"}` | 409 si ya habilitado; 403 prueba; 429 |
| POST `/totp/confirmar` | Bearer; `{code:"123456"}` | 200 `{success:true,twofa_habilitado:true}` | 409 sin configuración temporal; 401 código incorrecto/temporal expirado; 429 |
| POST `/totp/desactivar` | Bearer, X-Reauth-Token acción mfa:disable; sin body | 204; limpia secretos temporales/definitivo y revoca todas las sesiones; borra cookies | 409 no habilitado; 403 prueba; 429 |
| GET `/totp/have2fa` | Bearer; sin body | 200 `{twofa_habilitado:true}` | 401; sustituye clave actual `Habilitado` |

Tras confirmar MFA, invalidar otras sesiones y rotar la actual preservando la identidad autenticada; no exigir reingresar el mismo OTP en el mismo intervalo para terminar el flujo. Después de desactivarlo, Angular solicita nuevo login. Nunca devolver secreto crudo además del QR ni registrarlo; el QR ya contiene la semilla y debe tratarse como secreto. Cifrar las semillas de forma reversible con clave fuera de BD, porque verificar TOTP requiere recuperarlas. Evitar uso repetido del timestep mediante actualización atómica de `ultimo_uso_totp`. Los códigos de recuperación MFA no están implementados y quedan fuera del alcance inicial; definir un proceso humano de recuperación antes de imponer MFA obligatorio.

## 10. Contratos de negocio afectados para Angular

Mantener DTOs de respuesta actuales de `app/schemas` en la primera fase salvo eliminación de datos innecesarios acordada con Angular. Todas las rutas de negocio no públicas de la sección 3 requieren bearer y pueden responder 401/403/404 conforme a sección 6. No se agregan endpoints de CRUD no observados. Cambios mínimos explícitos:

### Citas

POST `/citas/create`, propuesta sin `estado` ni `id_usuario`:

```json
{
  "servicio": "consulta",
  "id_mascota": 12,
  "fecha": "2026-11-01",
  "hora": "09:00:00",
  "id_veterinario": 3,
  "notas": null
}
```

201:

```json
{
  "id_cita": 41,
  "servicio": "consulta",
  "id_mascota": 12,
  "fecha": "2026-11-01",
  "hora": "09:00:00",
  "id_veterinario": 3,
  "estado": "P",
  "notas": null
}
```

`servicio` enum consulta/salon/adoptar según ramas existentes; consulta exige mascota propia y V válido, salon exige mascota propia y V null, adoptar exige ambos null. El servidor fija P y el dueño. Rechazar datos incompatibles en lugar de reasignarlos silenciosamente. Notas hasta 200 caracteres; fecha/hora según zona de negocio confirmada, independiente del UTC de seguridad. 409 ACTIVE_APPOINTMENT_EXISTS si ya hay P de esa mascota; 409 STATE_CONFLICT si agenda ocupada; 422 entradas incompatibles; 404 referencias inaccesibles. La regla de una cita activa es por mascota, sin importar fecha, servicio o veterinario; A/N/C no bloquean. No aplicar UNIQUE simple a id_mascota, porque impediría conservar historial.

PATCH `/citas/update/{id_cita}` mantiene `{fecha,hora}`; PATCH `/citas/cancelarCita/{id_cita}` y PATCH `/citas/mark/refused/{id_cita}` sin body. Éxito 200 con CitaResponse actual; transición inválida 409 STATE_CONFLICT. Cancelar requiere propietario; marcar N requiere V asignado. Para cancelación ya aplicada devolver 200 con el estado actual sin repetir efectos. DELETE `/citas/delete/{id_cita}` propone 204 y exige permiso especial + prueba `appointment:delete` para el id. La alternativa preferida es cancelar para preservar historia.

### Mascotas y consultas

DELETE `/pet/delete/{pet_id}` propone 204, propietario y prueba `pet:delete`; 409 si la política de retención impide borrar historial. No implementar borrado en cascada de datos clínicos sin decisión expresa. Puede resolverse con baja lógica y contrato acordado en la fase clínica.

POST `/consultas/create` conserva la entrada real siguiente, pero exige V asignado y cita P:

```json
{
  "id_cita": 41,
  "motivo": "Revisión",
  "diagnostico": null,
  "observaciones": null,
  "tratamientos": [{"tipo":"indicacion","descripcion":"Cuidados indicados"}],
  "cuidados": [{"id_cuidado":2}]
}
```

Propuesta de éxito 201 `{id_consulta:22,id_cita:41,estado_cita:"A"}`; hoy retorna null. 404 cita fuera de alcance; 409 si no P o consulta duplicada; 422 referencias/tratamientos inválidos. Consulta y transición a A deben confirmarse en una misma transacción. Limitar motivo/diagnóstico/observaciones y longitud/número de tratamientos/cuidados en diseño clínico antes de implementar; no aceptar textos o arrays sin tope.

Corregir rutas literales defectuosas: GET `/petpetsByUser/{id_user}` a `/pet/petsByUser/{id_user}` y DELETE `/consultasdelete/{id_consulta}` a `/consultas/delete/{id_consulta}`. La eliminación de consulta devuelve 204, requiere permiso explícito y prueba `consultation:delete`; nunca dejar el alias previo público. Angular migra ambas URLs en el mismo despliegue. Mantener temporalmente alias solo si comparten exactamente las mismas dependencias y servicios seguros.

GET `/pet/cartilla/{id_mascota}` mantiene MascotaCartillaOut inicialmente, solo propietario o V asignado; acordar retirar correo de propietario si la pantalla no lo necesita. GET `/veterinario/veterinarios` propone directorio mínimo `[{id_veterinario:3,nombre:"Nombre profesional"}]`, incompatible con el UserOut anidado actual. Las listas sensibles globales se restringen antes de añadir paginación; propuesta posterior `?limit=20&cursor=<opaque>` con `{items:[],next_cursor:null}`. No cambiar masivamente listas actuales sin actualizar consumidores y contratos específicos.

## 11. Auditoría y detección propuestas

Control 4 no obliga a exponer una consola al cliente. Los siguientes endpoints se proponen solo para una pantalla de seguridad con permisos explícitos; no forman parte del perfil cliente estándar. No se permiten escrituras de eventos arbitrarias desde Angular.

### Auditoría base

GET `/security/audit-events?from=<UTC>&to=<UTC>&action=auth.login&outcome=denied&actor_id=7&limit=20&cursor=<opaque>` — **nuevo**, permiso `security:audit:read`. from/to requeridos, ventana máxima 31 días; resto opcional, limit 1–100 (20 por defecto), cursor opaco ligado a filtros. 200:

```json
{
  "items": [
    {
      "event_id": "<uuid>",
      "occurred_at": "2026-10-25T12:00:00Z",
      "actor_id": 7,
      "action": "auth.login",
      "resource_type": "authentication",
      "resource_id": null,
      "outcome": "denied",
      "reason_code": "INVALID_CREDENTIALS",
      "request_id": "<uuid>",
      "ip_masked": "192.0.2.x"
    }
  ],
  "next_cursor": null
}
```

401/403/422/429 comunes. `actor_id` null si identidad no verificada; no atribuir un login fallido a un usuario autenticado solo por el correo declarado. Guardar la identidad intentada como HMAC normalizado cuando se necesite correlación. Audit outcome enum success/denied/failure; se registran login/MFA, reset/cambio de contraseña, revocación, configuración MFA, lecturas clínicas, modificaciones/borrados, denegaciones y consulta de auditoría. Evento con timestamp UTC del servidor, actor, acción, recurso, resultado y request_id. IP completa solo en almacén restringido si hay necesidad y retención definida, no en respuestas generales.

No guardar cuerpos, JWT, cookies, códigos, QR, contraseñas, semillas, diagnóstico ni texto médico en la auditoría. Sanitizar metadatos y evitar inyección de logs. Registrar cambios sensibles con outbox en la misma transacción; registrar denegaciones sin depender de la transacción rechazada. Credencial de aplicación sin permiso de UPDATE/DELETE sobre el almacén de auditoría; retención mediante identidad operativa separada. Propuesta inicial: auditoría 90 días, alertas 90 días, señales IP completas 30 días; confirmar privacidad, necesidad y política antes de fijar producción. Si falla el registro durable de una mutación crítica, abortar la mutación con 503; para lecturas/denegaciones disponer de buffer protegido y alerta operativa sin exponer datos.

### Control 10 opcional tras evaluar viabilidad

Reglas deterministas iniciales: fallos repetidos por cuenta/IP, reutilización de refresh, sucesivas denegaciones por IDs ajenos y cambios de MFA seguidos de múltiples sesiones nuevas. No tratar un cambio de IP aislado como prueba suficiente. Medir falsos positivos antes de restricciones automáticas.

| Endpoint nuevo opcional | Contrato | Resultado |
|---|---|---|
| GET `/security/alerts?status=open&limit=20&cursor=` | Bearer + `security:alerts:read`; status open/resolved, límite 1–100 | 200 AlertListResponse |
| PATCH `/security/alerts/{alert_id}` | Bearer + `security:alerts:manage`; `{status:"resolved",resolution_code:"reviewed"}` | 200 Alert; 404/409/422 |
| POST `/security/users/{id_usuario}/restrictions` | Bearer + `security:users:restrict`, prueba security:restrict_user con id; `{duration_seconds:900,reason_code:"suspected_compromise"}` | 201 Restriction; revoca sesiones; 404/409/422 |

`AlertListResponse`: `{items:[Alert],next_cursor:null}`. `Alert` = `{alert_id,created_at,rule_code,severity,actor_id,status,resolution_code,resolved_at}`; fechas UTC, actor nullable, severity low/medium/high, status open/resolved, resolution_code y resolved_at null mientras open. Al resolver: resolution_code enum reviewed/false_positive/mitigated y resolved_at del servidor. Ningún campo contiene tokens o texto clínico. `Restriction` = `{restriction_id,id_usuario,reason_code,starts_at,expires_at}`; duración 60–86400 segundos propuesta, reason_code enum suspected_compromise/manual_review. Expiración temporal automática; revertir una restricción anticipadamente requerirá contrato separado si se aprueba ese caso. No permitir bloqueo permanente por este endpoint.

No prometer estas rutas a Angular en el primer incremento. La aprobación de viabilidad debe definir responsable, permisos, canal de notificación y capacidad de respuesta; sin ello se conserva solo auditoría y límites automáticos de autenticación.

## 12. Cambios de base de datos propuestos

No se ejecuta SQL. Aplicar con migraciones versionadas (por ejemplo Alembic), respaldo verificado y revisión previa del esquema/datos reales. Nombres nuevos son propuestas, no tablas existentes. Usar fechas UTC consistentes; no mezclar datetime local con UTC ingenuo.

| Entidad actual o nueva | Campos y restricciones propuestas | Índices y consideraciones |
|---|---|---|
| `usuarios` existente | Mantener id, rol, activo, hash y MFA; agregar `password_changed_at`, `auth_version` entero no nulo default 1; cifrar secreto_totp/secreto_totp_temp con versión de clave; usar `ultimo_uso_totp` atómicamente | Mantener uniques de usuario/correo; verificar collation y normalización antes de deduplicar; no transformar contraseñas |
| `auth_sessions` nueva | id UUID PK, id_usuario FK, created_at, last_seen_at, idle_expires_at, absolute_expires_at, revoked_at nullable, revoke_reason nullable, auth_version, authenticated_at, mfa_verified_at nullable, device_label, metadatos mínimos de red | Índices usuario+revoked_at, expiración; check expiraciones coherentes. Fuente de revocación de access y refresh |
| `refresh_tokens` nueva | id UUID PK, session_id FK, family_id, token_hash único, created_at, expires_at, consumed_at, revoked_at, replaced_by nullable | Hash de token aleatorio de alta entropía; lock/consumo atómico; conservar consumidos hasta caducidad de familia para detectar replay |
| `mfa_challenges` nueva | id UUID PK, id_usuario FK, created_at, expires_at, failed_attempts, consumed_at, contexto CSRF; propósito fijo login | Índices usuario+expiración; no guardar bearer que sirva como acceso |
| `codigos_verificacion` existente | Migrar o reemplazar `codigo String(10)` por digest/version de clave; agregar id de desafío opaco, propósito, created_at, failed_attempts y consumed_at; verificar/migrar fecha_expiracion/usado | Invalidar códigos antiguos en despliegue; no intentar recuperar/truncar hashes. Índices usuario+propósito+expiración y desafío único |
| `password_reset_tickets` nueva | id, id_usuario FK, source_challenge_id, token_hash único, created_at, expires_at, consumed_at | Ticket solo puede autorizar reset del usuario ligado al desafío; consumo + contraseña + revocación en transacción |
| `reauth_proofs` nueva | id, token_hash único, user_id FK, session_id FK, action, resource_id nullable, created_at, expires_at, consumed_at, auth_version | Verificar alcance y consumir junto a operación; limpiar tras expiración |
| `security_audit_events` nueva | id UUID, occurred_at, actor_id nullable, action, resource_type/id, outcome, reason_code, request_id, network metadata minimizados | Índices fecha+id, actor+fecha, action+fecha, request_id; no cascada destructiva desde usuarios; actor puede conservar referencia histórica sin FK obligatoria |
| `security_outbox` nueva | id, tipo, payload permitido sin secretos, created_at, delivered_at, attempts | Publicación idempotente; cola de correo sensible debe cifrar payload temporal y borrarlo tras entrega |
| Permisos nuevos | Catálogo `permissions` y unión `user_permissions` con clave usuario+permiso; o servicio equivalente documentado | No inferir administración por rol V; sembrar permisos por proceso operativo revisado |
| `security_alerts`, `security_restrictions` opcionales | Alertas/reglas/estado/resolución y restricciones con usuario/autor/razón/inicio/fin | Solo fase viable control 10; auditar cambios; no confundir restricciones temporales con `activo` |
| Límites de autenticación | Contadores TTL Redis por identidad HMAC, IP y acción; operaciones atómicas | No almacenar passwords/códigos; Redis requiere acceso privado y autenticación. Alternativa SQL transaccional si no se despliega Redis |
| `citas` existente | Índice (id_mascota,estado); checks de estado/servicio y referencias según motor; asegurar una sola P por mascota | No UNIQUE(id_mascota). En MySQL compatible, columna generada nullable `mascota_activa_id = CASE WHEN estado='P' THEN id_mascota ELSE NULL END` e índice UNIQUE sobre ella; en PostgreSQL, índice único parcial. Elegir solo tras confirmar motor/version |

Migración de citas: detectar grupos con múltiples P, revisar y resolver con negocio antes de crear unicidad; no cancelar ni borrar automáticamente. Mantener bloqueo de mascota como defensa adicional y traducir violación de unicidad a 409. La restricción de BD también debe cubrir cualquier futura transición de vuelta a P. Evaluar unicidad de consulta por cita si negocio confirma esa relación; el modelo actual permite varias consultas y no se cambia sin decisión.

No ampliar el alcance a un sistema completo de roles dinámicos si C/V más permisos explícitos son suficientes. La clave de cifrado de semillas y la clave HMAC de códigos deben ser diferentes de JWT_ACCESS_KEY y almacenarse fuera de la BD; política de rotación y recuperación obligatoria. No cifrar contraseñas de forma reversible.

## 13. Plan por fases con dependencias y criterios de aceptación

| Fase | Trabajo propuesto | Dependencias | Criterio de salida |
|---|---|---|---|
| 0 Diagnóstico y contratos — esta entrega | Inventario, matriz de controles, contratos futuros y decisiones de despliegue | Código y Word | Revisión Backend/Frontend; sin cambios funcionales |
| 1 Cierre de vías críticas P0 | Recuperación con prueba de un uso y límites mínimos distribuidos para login/MFA/recuperación; dependencia obligatoria con tipo/exp/cuenta activa; denegar tokens MFA en negocio; proteger todas las rutas sensibles con propiedad/asignación; errores seguros; retirar secretos de logs | Confirmar política de acceso C/V, esquema real, almacén compartido de límites y migraciones de recuperación | Sin cambios de contraseña por correo solo; token MFA rechazado en negocio; ninguna operación clínica anónima; ID ajeno no accesible; intentos repetidos restringidos |
| 2 Fundamentos y sesiones P1 | Migraciones de sesiones/tokens; access corto; refresh/CSRF, logout/revocación; límites distribuidos; auditoría base/outbox; secretos cifrados; HTTPS/CORS y DTOs mínimos; reforzar validación | Fase 1; dominios HTTPS; motor/version; claves y almacenamiento operativo | Revocación inmediata; límites comunes entre workers; replay de refresh revoca familia; expiración absoluta/inactividad verificadas; no secretos en logs |
| 3 Operaciones críticas P2 | Reautenticación vinculada a acción/recurso, endurecer MFA y repetición, UI de sesiones y cambios de contraseña, unicidad P por mascota | Sesiones, auditoría, límites y migración de datos | Prueba expirada/ajena/consumida falla; solo una P incluso en concurrencia; historia A/C/N preservada |
| 4 Detección P3 opcional | Medir reglas y falsos positivos; alertas y respuesta temporal; permisos de seguridad y pantalla restringida | Auditoría confiable, responsable de respuesta y aprobación de viabilidad | Reglas reproducibles; restricciones auditadas y con vencimiento; sin bloqueo por cambio de IP aislado |
| Transversal control 12 | Investigar herramientas, automatizar pruebas negativas/contratos/migraciones, SAST y dependencias, DAST en staging | Desde fase 1; datos sintéticos y CI | Evidencia por control en cada release; controles sin regresión |

El orden entre fases 1 y 2 exige entregas coordinadas: no publicar una recuperación modificada sin sus tablas y límites; no publicar cookies refresh sin CSRF ni TLS. Antes de migrar sesiones, invalidar los JWT heredados o cambiar su criterio de aceptación para que no sobrevivan 30 días. No aceptar tokens sin sid/tipo mediante un fallback indefinido. Comunicar cierre de sesión y exigir nuevo login al corte. Mantener rollback operativo, pero nunca reabrir rutas vulnerables como mecanismo de reversión; detener el servicio afectado si hace falta.

### Evidencia de verificación que deberá producir la implementación

- Matriz de todos los endpoints: anónimo, C propietario, C ajeno, V asignado, V no asignado, cuenta inactiva/restringida y sesión revocada. Las rutas públicas de catálogo deben seguir disponibles sin exponer identidad.
- JWT con propósito MFA/reset/reauth en Authorization rechazados; claims ausentes, firma/algoritmo incorrectos y cabecera malformada responden controladamente, sin 500.
- Login devuelve 401 real, no 400 por excepción genérica; no distingue usuarios inexistentes por texto/cuerpo de error; recuperación nunca cambia contraseña sin ticket.
- Reutilizar código, desafío MFA, ticket reset, refresh o prueba reauth falla; operaciones concurrentes solo pueden consumir una vez. Bloqueos compartidos entre al menos dos workers y sin evadirlos reiniciando procesos.
- Revocación, logout, cambio de contraseña/MFA y restricción afectan inmediatamente todos los tokens vinculados; refresh no revive una sesión caducada o revocada.
- CSRF ausente/incorrecto/origen ajeno bloqueado; CORS usa lista exacta; cookies con atributos previstos; tokens no aparecen en URL, almacenamiento persistente ni logs.
- Validación rechaza rol/activo/permisos enviados en registro, dueño arbitrario, estado de cita manipulado, IDs negativos, arrays excesivos y referencias fuera de alcance; persistencia no cambia ante 401/403/422.
- Dos creaciones concurrentes de P para la misma mascota: exactamente una exitosa y otra 409 en el motor real; A/C/N permiten agendar otra P. Probar también rollback y traducción de IntegrityError.
- Auditoría contiene actor verificado o null, UTC, acción, resultado y request_id; registra denegación y operación exitosa sin datos clínicos, tokens o claves. Fallo del colector no pierde mutaciones críticas sin señal.
- Pruebas de migración sobre copia sanitizada y rollback técnico; no ejecutar DAST o fuerza bruta contra producción.

Herramientas a evaluar para control 12, no instaladas en esta etapa: unittest/pytest y TestClient para matriz de autorización; pruebas SQLAlchemy con el mismo motor desplegado para concurrencia; pip-audit para dependencias, Bandit/Semgrep para análisis estático, escaneo de secretos y OWASP ZAP para staging. Fijar versiones y alcance tras evaluar integración; no confundir un escaneo exitoso con cobertura de políticas de negocio.

## 14. Guía de integración para el agente Frontend

1. Tomar esta especificación como diseño pendiente. Hoy solo están disponibles los contratos actuales de la sección 3; no asumir que me, refresh, sesiones, reauth o seguridad existen.
2. Implementar estados explícitos: anonymous, authenticating, mfa_required, authenticated, reauth_required, rate_limited. Usar discriminante `status` en login futuro; challenge_id no se coloca en Authorization.
3. Mantener access en memoria. Inicializar CSRF y, si hay sesión renovable, intentar refresh una sola vez al arrancar. Cerrar estado local ante 401 definitivo o revocación. No depender del contenido del JWT para decidir autorización real.
4. En 429 mostrar espera de Retry-After; no reintentar en bucle. En 403 distinguir FORBIDDEN de REAUTH_REQUIRED. Abrir modal de contraseña/TOTP solo para reauth y conservar la acción/recurso original; enviar la prueba solo a esa acción.
5. Mostrar listado y revocación de sesiones propias. No renderizar rutas de auditoría/alertas sin permisos expresos, y aun así asumir que el servidor puede denegar por alcance.
6. Modificar recuperación a desafío -> código -> reset_token -> contraseña; nunca completar usando email como autorización. Tras reset/cambio de contraseña/desactivar MFA volver a login.
7. Para citas, retirar `estado` del alta futura; presentar el 409 ACTIVE_APPOINTMENT_EXISTS como regla de una P por mascota. No bloquear nueva cita por historial cancelado/atendido/no asistido.
8. Acordar la fecha de corte para cambios incompatibles, rutas sin slash, `Habilitado` a `twofa_habilitado`, UserOut del directorio, creación de consulta y formato de errores. Generar OpenAPI y tipos Angular a partir de esquemas nuevos una vez implementados; CI debe comprobar divergencias con este contrato.

### Decisiones que deben cerrarse antes de implementar

- Dominios/orígenes Angular/API, proxy TLS y zona de agenda; el diseño de cookies supone mismo sitio HTTPS.
- Motor/version y esquema real, collation, datos duplicados y comportamiento de bloqueo; estrategia de migraciones.
- Asignación clínica para pacientes sin cita y permisos de recepción, finanzas y seguridad; no concederlos implícitamente a cualquier veterinario.
- Política de conservación/baja de mascotas y consultas; retención de auditoría/IP y uso de proveedor IA.
- Política de contraseñas final, migración Argon2id, recuperación MFA, responsables y custodia/rotación de claves.
- Viabilidad del control 10 y canal operativo de alertas. Su falta de aprobación no retrasa los cierres P0.

## 15. Referencias y trazabilidad

### Código local inspeccionado

- `main.py`, `router.py`: montaje, CORS y excepciones.
- `app/utils/dependencies.py:get_current_user`, `app/utils/security.py`: autenticación, expiración, claims y firma.
- `app/api/auth.py`, `app/api/totp.py`, `app/schemas/user.py`: contratos actuales de identidad y recuperación/MFA.
- `app/api/cita.py`, `app/api/mascota.py`, `app/api/consultas.py`: reglas de propiedad, estados y acceso clínico; rutas literales defectuosas.
- `app/api/user.py`, `app/api/statistics.py`, `app/api/veterinario.py`, `app/api/raza.py`, `app/api/color.py`: exposición de listas, finanzas y catálogos.
- `app/schemas/cita.py`, `mascotas.py`, `consultas.py`, `veterinario.py`, `color.py`, `raza.py`: validación y serialización actuales.
- `app/models/usuario.py`, `codigo.py`, `cita.py`, `consulta.py`, `mascota.py`; `app/utils/database.py`, `app/core/core.py`: persistencia y configuración.
- `app/utils/validation_audit.py`, `tests/test_validation_audit.py`, `tests/test_cita_duplicates.py`: cobertura y auditoría parcial actual.
- `app/services/email.py`, `app/api/consultas.py:build_prompt`, `app/services/algorithm_topsis.py`: flujos externos y cálculos. `requirements.txt` y `.gitignore`: dependencias y exclusión de configuración local.

### Referencias técnicas externas

Las recomendaciones complementan el Word y no describen funcionalidades ya instaladas:

- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html): límites de autenticación y comprobación reciente de identidad en acciones sensibles.
- [OWASP Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html): expiración e invalidación de sesiones controladas por servidor.
- [OWASP Logging Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html): eventos de seguridad y exclusión de secretos en logs.

Los nombres de tablas nuevas, rutas nuevas, tiempos, límites y contratos futuros son decisiones de diseño de este informe, no requisitos textuales de OWASP ni del Word.
