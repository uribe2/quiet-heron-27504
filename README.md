# ClientBrain

CRM operativo para freelancers independientes: clientes, comunicaciones, pipeline, proyectos, entregables, registro de tiempo, cotizaciones, facturas, pagos, reuniones, documentos y un asistente de IA, en una sola aplicación.

Proyecto del curso **ISIS 3710 — Programación con Tecnologías Web**, Grupo 7, **Ciclo 1**: solo front-end, datos en estado de React + `localStorage` y respuestas de IA simuladas.

Documentación completa en la [wiki del repositorio](https://github.com/isis3710-uniandes/ISIS3710_202620_S3_E07_Front/wiki).

## Equipo

| Rol | Integrante | Funcionalidades |
|---|---|---|
| M1 — Relación | _por completar_ | F01 Clientes · F02 Comunicaciones · F03 Pipeline |
| M2 — Ejecución | _por completar_ | F04 Proyectos · F05 Entregables · F06 Registro de tiempo |
| M3 — Cierre | _por completar_ | F07 Cotizaciones · F08 Facturas · F09 Pagos |
| M4 — Organización e Inteligencia | _por completar_ | F10 Reuniones · F11 Documentos · F12 Resumen IA |

## Ejecutar con Docker

**Requisitos:** Docker Desktop (o Docker Engine + Docker Compose v2) en ejecución.

```bash
docker compose up --build
```

La aplicación queda en **http://localhost:3000**.

| Acción | Comando |
|---|---|
| Detener | `Ctrl + C`, o `docker compose down` si corre en segundo plano |
| Correr en segundo plano | `docker compose up --build -d` |
| Reconstruir tras cambios | `docker compose up --build` |
| Reconstruir sin caché | `docker compose build --no-cache && docker compose up` |

La imagen usa un build multi-etapa (instalar dependencias → `next build` → ejecutar `node server.js`) con la salida `standalone` de Next.js, así la imagen final solo contiene lo necesario para correr.

## Desarrollo local

**Requisitos:** Node.js 20 o superior y npm.

```bash
npm install
npm run dev        # http://localhost:3000
```

| Script | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` / `npm start` | Build de producción y servidor |
| `npm run lint` | ESLint (incluye reglas de accesibilidad `jsx-a11y`) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run test` | Pruebas con Vitest |
| `npm run test:watch` | Pruebas en modo observación |
| `npm run verify` | lint + typecheck + pruebas |

Los datos de demostración se generan relativos a la fecha actual. Se pueden restablecer desde **Configuración → Restablecer datos de demostración**.

## Justificaciones técnicas

- **Next.js App Router + TypeScript estricto.** Rutas por carpeta, layouts compartidos y páginas de error y "no encontrado" por convención. Crear y editar se hace en un *drawer* sobre la lista, sin rutas extra.
- **Context + `useReducer`.** Un único `DataProvider` con acciones genéricas (`ADD`, `UPDATE`, `REMOVE`, `RESTORE`, `RESET`…). Para un solo usuario con datos locales no hace falta Redux ni Zustand.
- **Un hook por funcionalidad** (`useClients`, `useInvoices`…). Es la única capa que modifica el estado; los componentes llaman al hook. Los flujos entre módulos se hacen llamando al hook del módulo destino.
- **Reglas de negocio como funciones puras** en `logic.ts` (totales, estado derivado de facturas, progreso, salud del cliente, alertas). Fuera del JSX y fáciles de probar.
- **React Hook Form + Zod.** Un esquema por formulario y tipos inferidos con `z.infer`. Los errores son claves de i18n que explican el formato correcto.
- **i18n con Context propio.** `es.ts` es la fuente y `en.ts` está tipado como `typeof es`, así que una clave faltante rompe la verificación de tipos. Moneda y fechas con `Intl`.
- **Datos simulados en `localStorage`.** La semilla se genera relativa a hoy para que alertas y vencimientos siempre tengan sentido.
- **IA simulada lista para el Ciclo 2.** Toda la lógica vive en `src/features/ai/mock-ai.ts`; en el Ciclo 2 solo se reemplaza ese archivo por llamadas reales y el hook `useAI()` y la interfaz no cambian.
- **Docker standalone.** Imagen pequeña con solo lo necesario para correr `node server.js`.
- **Accesibilidad según la auditoría del equipo.** HTML semántico, etiquetas visibles, foco visible, botones de ícono de 44 px con `aria-label`, estados siempre con texto, colores con contraste AA, drawers y diálogos con manejo de foco y `Esc`, avisos en regiones `aria-live`.

Más detalle en la página [Arquitectura](https://github.com/isis3710-uniandes/ISIS3710_202620_S3_E07_Front/wiki/Arquitectura) de la wiki.

## Estructura de carpetas

```
src/
  app/                    rutas (una carpeta por ruta) + layout, error, not-found
  components/ui/          kit de UI (Button, Drawer, ConfirmDialog, FormField, Table, BarChart…)
  components/layout/      Sidebar, Header, AppShell
  context/                datos, idioma y avisos
  features/<feature>/     components/, use-<feature>.ts, logic.ts, schema.ts, types.ts, __tests__/
  hooks/                  useDisclosure, useUndoableDelete, useTimer, useDebounce
  lib/                    fechas, formato, dinero, ids, semilla
  i18n/                   es.ts, en.ts
  test/                   configuración y utilidades de pruebas
```

## Pruebas

Vitest + React Testing Library + user-event + jsdom. Cada historia de usuario tiene al menos 3 pruebas agrupadas con su ID (`describe('HU-07.2 Crear cotización', …)`), en `src/features/<feature>/__tests__/`. Se prueban sobre todo las funciones puras y los hooks (con `renderWithProviders`, que arranca con una semilla nueva en cada prueba), más componentes para formularios e interacciones clave.

```bash
npm run test
```

El conteo por historia de usuario está en la página [Pruebas](https://github.com/isis3710-uniandes/ISIS3710_202620_S3_E07_Front/wiki/Pruebas) de la wiki.
