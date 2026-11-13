# Invoixio — Frontend

Interfaz web de **Invoixio**, sistema de gestión y facturación multi-tenant para empresas que cobran cuotas recurrentes a
grupos de clientes (administradoras de propiedad horizontal, gimnasios, academias, proveedores de internet comunitario).
Consume la API de [invoixio-backend](https://github.com/FreddyB200/invoixio-backend).

React 18 · Vite 5 · React Router 6 · Vitest + Testing Library. Proyecto formativo SENA, Ficha 3186632.

## Pantallas

| Ruta | Qué hace |
|---|---|
| `/login` | Inicio de sesión con JWT |
| `/dashboard` | Resumen del periodo: clientes activos, recaudado, por cobrar, cartera vencida, mayores morosos |
| `/facturas` | Facturación por periodo: generar en lote, emitir, registrar pago, eliminar borradores, marcar vencidas |
| `/cartera` | Cartera vencida por cliente, con días de mora y pago rápido |
| `/clientes` | Directorio de clientes (propietario o responsable de una unidad) |
| `/grupos` | Grupos de clientes: conjunto, sede, zona o plan |
| `/servicios` | Servicios, tarifas por grupo, overrides por cliente y ajuste anual (IPC) |
| `/empleados` | Personal de la empresa (oculto para el rol `CONTADOR`) |

El rol `CONTADOR` ve los maestros y las tarifas en solo lectura y opera las facturas. `ADMIN_GENERAL` elige la empresa
activa en la barra superior (se envía como `X-Empresa-Id`).

## Cómo correrlo

Requiere Node 20+ y el backend corriendo en `http://localhost:8080` (ver el README del backend: `docker compose up -d` y
`./mvnw spring-boot:run`).

```bash
npm install
npm run dev        # http://localhost:3000, reenvía /api al backend
```

Usuario demo (datos sembrados por el backend en perfil `dev`): `admin@serviportenal.com` / `Invoixio#2026`.

| Comando | Uso |
|---|---|
| `npm run dev` | Servidor de desarrollo con proxy `/api` → `http://localhost:8080` |
| `npm test` | Pruebas (Vitest + Testing Library) |
| `npm run build` | Build de producción en `dist/` |

Variables (ver [.env.example](.env.example)): `VITE_API_PROXY` cambia el destino del proxy en desarrollo y `VITE_API_URL`
apunta el build a una API en otro dominio (ese dominio debe estar permitido en el CORS del backend).

## Estructura

```
src/
├── api/          cliente HTTP (JWT, errores RFC 7807) y un módulo por recurso
├── context/      AuthContext: sesión, rol y empresa activa
├── components/   Sidebar, Topbar, estados de pantalla, modales y piezas por módulo
├── pages/        una pantalla por ruta
├── hooks/        useAsync
├── utils/        formato de moneda, fechas y periodos
└── test/         utilidades de prueba (renderWithProviders)
```
