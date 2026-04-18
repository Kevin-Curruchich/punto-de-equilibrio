# Project Definition

Area: Developer (https://www.notion.so/Developer-173f332f56f1807f817dc48e9c16de6a?pvs=21)
Goals: Q2 2026 — React Native: finish course + ship app (https://www.notion.so/Q2-2026-React-Native-finish-course-ship-app-3ba82fa5198844b49ec511584c7aa7e6?pvs=21)
Projects: Physio app — patient progress & visit procedures (React Native) (https://www.notion.so/Physio-app-patient-progress-visit-procedures-React-Native-d196a16483cb4e2d96b8711d2f98db86?pvs=21)

## Objetivo

Construir un MVP de una app móvil (React Native) para fisioterapeutas y pacientes que permita registrar visitas, procedimientos realizados y medir el progreso del paciente con métricas y notas clínicas, hasta poder demostrar un flujo completo con al menos 1 paciente de prueba.

## Contexto y usuario

- Problema: hoy el seguimiento suele quedar en notas sueltas/WhatsApp o en sistemas no móviles; se pierde historial por visita y es difícil mostrar progreso al paciente.
- Usuario objetivo:
  - Fisioterapeutas (registran visitas y planes de tratamiento)
  - Pacientes (ven su progreso y tareas/hábitos indicados)
- Escenario de uso: en cada visita el fisio registra procedimientos y mediciones; el paciente consulta su historial y progreso.

## Alcance (MVP)

Incluye:

- Autenticación simple (email/password o passcode) con 2 roles: Fisio y Paciente
- Gestión de pacientes (lista + perfil)
- Registro de visitas:
  - Fecha, notas
  - Procedimientos realizados (catálogo simple + selección)
  - Medidas/indicadores (ej. dolor 0–10, rango de movimiento, fuerza) configurable a nivel app
- Progreso:
  - Timeline por paciente
  - Gráficas básicas por indicador

No incluye (por ahora):

- Facturación/cobros
- Integración con seguros
- Telemedicina / videollamadas
- Integraciones con EMR/EHR
- Sensores/wearables

## Entregables

- [ ] Repo con app React Native (Expo o RN CLI) y README
- [ ] Demo grabada (2–4 min) mostrando: crear paciente → registrar visita → ver progreso
- [ ] Build publicada (TestFlight/Play Internal Testing) o APK/IPA de prueba

## Criterios de éxito

## Checklist de funcionalidades (criterio de éxito)

### Base (ambos roles)

- [ ] Login / logout
- [ ] Onboarding mínimo (seleccionar rol o asignación de rol)
- [ ] Home con información relevante
  - Fisio: próximos pacientes/visitas, últimos registros
  - Paciente: rutina de hoy, progreso reciente
- [ ] Perfil de usuario + ajustes básicos (nombre, foto opcional)
- [ ] Manejo de estados vacíos y errores (sin datos, sin conexión, etc.)

### Fisio

- [ ] Listado de pacientes + búsqueda
- [ ] Crear / editar paciente (datos mínimos)
- [ ] Perfil del paciente (resumen: diagnósticos/notas, progreso, últimas visitas)
- [ ] Registrar visita
  - Fecha y notas
  - Procedimientos realizados (selección desde catálogo)
  - Medidas/indicadores (dolor 0–10, ROM, fuerza, etc.)
- [ ] Historial de visitas del paciente (lista + detalle)
- [ ] Catálogo básico de procedimientos (CRUD simple)

### Paciente

- [ ] Ver “rutinas” / actividades asignadas
- [ ] Marcar rutina como completada (check-in)
- [ ] Ver su progreso (gráfica simple por indicador)
- [ ] Ver historial de visitas (solo lectura)

### Compartido / opcional (muy recomendable para el MVP)

- [ ] Asignación de paciente ↔ fisio (relación clara)
- [ ] Permisos por rol (paciente no ve datos de otros pacientes)
- [ ] Export/compartir resumen del paciente (texto/PDF simple)
- [ ] Backups / sincronización (si es local-first, al menos export de datos)
