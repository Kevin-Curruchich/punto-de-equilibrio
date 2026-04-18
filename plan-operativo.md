Plan operativo por sprint — MVP Fisio/Paciente
Total estimado: ~50h (6 sprints)

Sprint Foco Horas est. Acumulado
S0 Limpieza + Arquitectura base 6h 6h
S1 UI foundation + Stack técnico 8h 14h
S2 Auth + Navegación por rol 6h 20h
S3 Features fisioterapeuta 16.5h 36.5h
S4 Features paciente + Progreso 10h 46.5h
S5 Calidad, seed, demo y build 6h 52.5h
Sprint 0 — Limpieza y Arquitectura base 6h

# Tarea Horas Notas

0.1 Eliminar pantallas y componentes demo del template (explore, parallax, hello-wave, etc.) y simplificar (tabs) 1h Dejar sólo estructura de archivos vacíos orientada al producto
0.2 Crear estructura de carpetas definitiva: app/(auth), app/(app)/(physio), app/(app)/(patient), src/features, src/ui, src/store, src/services, src/types, src/lib 1h El alias @/\* de tsconfig ya apunta correctamente
0.3 Copiar tipos de domain.md a src/types/domain.ts y agregar tipos de DTO/ViewModel mínimos (PatientSummary, SessionDetail, PatientProfile) 1.5h Solo transcribir + organizar, sin lógica
0.4 Configurar variables de entorno (app.config.ts + .env.local) para credenciales de Firebase y valores sensibles 0.5h Nunca hardcodear keys en fuente
0.5 Actualizar README.md con stack, comandos y estructura del repo 0.5h
0.6 Commitear baseline limpio con git y crear ramas feat/s1-stack, feat/s2-auth, etc. 0.5h Un commit por sprint
0.7 Validar que TypeScript compila sin errores: npx tsc --noEmit + npm run lint 0.5h
Definition of Done S0

npm start arranca sin errores con pantallas en blanco (sin contenido demo)
Estructura de carpetas creada y gittracked
src/types/domain.ts compila sin errores
Lint y typecheck en verde
Sprint 1 — UI Foundation + Stack técnico 8h

# Tarea Horas Notas

1.1 Instalar Gluestack UI v5 y sus pares para Expo (@gluestack-ui/themed, @gluestack-style/react, nativewind si Gluestack v5 lo requiere, o las dependencias que dicte la documentación oficial) 1h Verificar Expo compatibility antes
1.2 Configurar GluestackUIProvider con config base en \_layout.tsx 0.5h Wrappear todo el árbol
1.3 Crear src/ui/theme.ts con tokens visuales: paleta de salud (azul-verde neutro), tipografía, radios y spacing 1h Referencia: theme.ts existente
1.4 Crear componentes custom de dominio base: PatientCard, SessionItem, MetricChip, EmptyState (en src/ui/components/) 2h Solo UI, sin lógica de negocio
1.5 Instalar y configurar Zustand + slice de UI global (src/store/ui.ts: loading, toast, modal) 0.5h
1.6 Instalar TanStack Query v5 y envolver el árbol con QueryClientProvider en \_layout.tsx, configurar defaults (staleTime, retry) 0.5h
1.7 Instalar Firebase SDK (firebase), crear src/services/firebase/client.ts con initializeApp, Firestore y Auth 1h Leer env vars para las credenciales
1.8 Instalar react-hook-form + zod y crear src/lib/validation/ con schemas mínimos de auth y paciente 0.5h
1.9 Instalar utilidades de soporte: @react-native-async-storage/async-storage, dayjs, react-native-svg 0.5h
Definition of Done S1

GluestackUIProvider activo — botón/texto de Gluestack renderiza en simulador iOS y Android
QueryClientProvider visible en React DevTools
Firebase conecta sin error (log de inicialización exitosa)
npx tsc --noEmit y lint sin errores
Sprint 2 — Auth + Navegación por rol 6h

# Tarea Horas Notas

2.1 Crear store de auth en Zustand (src/store/auth.ts): campos user, role, status (loading | authenticated | unauthenticated) + acciones signIn, signOut 1h Persiste UID con AsyncStorage
2.2 Implementar app/(auth)/\_layout.tsx + pantallas login.tsx y register.tsx (con react-hook-form + zod para cada form) 2h Usando componentes Gluestack
2.3 Implementar guardia de navegación en \_layout.tsx: si no autenticado → redirect a /auth/login; si autenticado → redirect a stack de rol 1h Usar useSegments + useRouter de Expo Router
2.4 Crear app/(app)/\_layout.tsx con split de rol: fisioterapeuta → (physio), paciente → (patient) 0.5h
2.5 Crear layouts vacíos con bottom tabs de cada rol: app/(app)/(physio)/\_layout.tsx y app/(app)/(patient)/\_layout.tsx 0.5h Tabs relevantes por rol
2.6 Implementar logout y manejo de sesión expirada (listener onAuthStateChanged de Firebase) 0.5h
2.7 Test manual: login->rol correcto, logout, sesión persistida si cierra app 0.5h
Definition of Done S2

Login con email/password funciona contra Firebase Auth
Usuario no autenticado no puede acceder a rutas de app
Fisioterapeuta y paciente entran a tabs distintos tras login
Logout limpia estado y redirige a /auth/login
Error de credenciales muestra mensaje en UI
Sprint 3 — Features fisioterapeuta 14h

# Tarea Horas Notas

3.1 Crear servicio Firestore para pacientes (src/services/firebase/patients.ts): getPatients, createPatient, updatePatient, getPatientById 1.5h Modelar contra Patient + User del dominio
3.2 Crear hooks TanStack Query: usePatients, usePatient, useCreatePatient, useMutatePatient en src/features/patients/api.ts 1h Invalidación por ['patients'] key
3.3 Pantalla: listado de pacientes con búsqueda (app/(app)/(physio)/patients/index.tsx) 2h Usar PatientCard de S1
3.4 Pantalla: perfil del paciente con resumen clínico, diagnósticos y últimas visitas (app/(app)/(physio)/patients/[id].tsx) 1.5h
3.5 Pantalla: crear/editar paciente (form react-hook-form + zod, campos: nombre, fecha nacimiento, teléfono, historial) 1.5h
3.5a Servicio de fotos para diagnósticos (src/services/firebase/photos.ts): uploadProgressPhoto, getPhotosByCondition; integración con cámara nativa y galería (react-native-image-picker o expo-image-picker) + permisos 2.5h Upload a Firebase Storage, guardar metadatos en Firestore
3.6 Servicio Firestore para procedimientos (src/services/firebase/procedures.ts): catálogo simple + createProcedure 1h Precarga catálogo por defecto en Fase 5
3.7 Servicio Firestore para sesiones (src/services/firebase/sessions.ts): createSession, getSessions, getSession con procedimientos y mediciones embebidos 2h Modelar contra CreateSessionInput del dominio
3.8 Pantalla: registrar visita — stepper o form multiparte: fecha/notas → selección de procedimientos → mediciones (app/(app)/(physio)/sessions/new.tsx) 3h Tarea más compleja del sprint
3.9 Pantalla: historial de visitas del paciente en lista con detalle (app/(app)/(physio)/sessions/[id].tsx) 1h Solo lectura en esta pantalla
3.10 Test manual: full flow fisio — crear paciente → registrar visita con 2 procedimientos y 2 mediciones → confirmar datos en Firestore 0.5h
Definition of Done S3

Fisio puede crear/editar pacientes y verlos en lista con búsqueda
Fisio puede registrar una visita con procedimientos del catálogo y mediciones numéricas
Datos persisten en Firestore y se recargan al volver a la pantalla
Lista de pacientes y sesiones usan TanStack Query (loading/error/data states visibles)
Sprint 4 — Features paciente + Progreso 10h

# Tarea Horas Notas

4.1 Servicio Firestore + hooks para tareas del paciente (src/features/tasks/): getTodayTasks, completeTask 1.5h Modelo PatientTask del dominio
4.2 Pantalla: rutina del día del paciente con lista de tareas y check-in (app/(app)/(patient)/index.tsx) 2h Feedback visual al marcar completada
4.3 Pantalla: historial de visitas del paciente en solo lectura (app/(app)/(patient)/sessions/index.tsx) 1h Reutilizar componentes de S3
4.4 Instalar librería de charts compatible: victory-native (o react-native-gifted-charts como alternativa más ligera) + react-native-svg 0.5h
4.5 Servicio + hooks para métricas/mediciones (src/features/metrics/api.ts): getMetricProgress — datos por condición con histórico por sesión 1.5h
4.6 Pantalla: gráfica de progreso por indicador (dolor, ROM, fuerza) con selector de métrica (app/(app)/(patient)/progress/index.tsx) 2.5h Usar MetricProgress DTO del dominio
4.7 Pantalla: acceso de fisio a la vista progreso desde el perfil del paciente (app/(app)/(physio)/patients/[id]/progress.tsx) 0.5h Reutilizar componentes de 4.6
4.8 Test manual: full flow paciente — login como paciente → ver rutina → check-in → ver gráfica de progreso 0.5h
Definition of Done S4

Paciente ve sus tareas del día y puede marcar como completadas (persiste en Firestore)
Gráfica de al menos 1 indicador (dolor 0–10) visible con datos reales
Fisio puede ver el progreso de un paciente desde su perfil
Historial de visitas visible en solo lectura desde la vista paciente
Sprint 5 — Calidad, Seed, Demo y Build 6h

# Tarea Horas Notas

5.1 Implementar EmptyState screens coherentes en: lista de pacientes vacía, sin sesiones, sin progreso, sin tareas 0.5h
5.2 Implementar manejo de errores global: error boundary en root layout + toast de error en mutaciones críticas 1h Usar store de ui.ts del S1
5.3 Crear script de seed para Firestore: 1 fisioterapeuta + 1 paciente + 3 sesiones + métricas + tareas de ejemplo (scripts/seed.ts) 1.5h Ejecutable en local vía ts-node
5.4 Smoke test manual siguiendo el guion de demo: create account (physio) → create patient → record session → view progress (physio) → login as patient → see tasks + progress 1h Usar checklist del project-definition.md
5.5 Generar build de prueba: eas build --profile preview para iOS (TestFlight) o Android (APK) 1h Requiere EAS CLI + cuenta Expo
5.6 Actualizar README.md con instrucciones de setup, variables de entorno y pasos del guion de demo 0.5h
5.7 Verificar exportar resumen de paciente en texto plano (Share nativo) — feature bonus del checklist 0.5h Opcional si tiempo alcanza
Definition of Done S5 (= Done del MVP)

App supera el smoke test manual de demo end-to-end sin errores críticos
States vacíos y errores de red visibles en todas las pantallas clave
Build instalable en dispositivo real (iOS o Android)
README permite a alguien más arrancar el proyecto desde cero
Checklist de funcionalidades del project-definition.md completado al ≥ 80%
