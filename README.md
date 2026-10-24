# Marketplace musical

Marketplace P2P de instrumentos y equipos de música usados para Argentina.

- `web/` — front en Angular 22 con SSR.
- `api/` — backend en NestJS 12 con Prisma 7 y PostgreSQL.
- La especificación del MVP vive en el documento del proyecto.

## Requisitos

- **Node.js 24 LTS** (mínimo 22.22.3). Trae npm 11, necesario: npm 10 falla al instalar la API.
- **PostgreSQL 16** instalado en Windows (o con Docker, opcional).

En Windows conviene usar la terminal **Command Prompt (CMD)** de VS Code: PowerShell bloquea `npm` por la política de ejecución de scripts. Alternativa: `Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned`.

Verificar versiones:

```bash
node -v   # v24.x
npm -v    # 11.x
```

## Primera puesta en marcha

### 1. Base de datos

**PostgreSQL en Windows (opción usada en desarrollo):** instalar PostgreSQL 16 desde postgresql.org, con una contraseña para `postgres` solo de letras y números. No hace falta crear la base: `db:migrate` la crea.

**Con Docker (opcional):** `docker compose up -d` desde la raíz levanta la base con usuario y contraseña `marketplace`.

### 2. API

```bash
cd api
copy .env.example .env        # luego editar DATABASE_URL con su usuario y contraseña
npm install                   # genera también el cliente de Prisma
npm run db:migrate -- --name init
npm run db:seed
npm run admin:make -- su-email@ejemplo.com   # después de registrarse en la web: da rol de administrador
npm run start:dev
```

Mientras no haya un servicio de email configurado, los emails (confirmación de cuenta, recupero de contraseña) **se muestran en la terminal de la API** con el enlace para copiar en el navegador.

La API queda en http://localhost:3000/api. Probar: http://localhost:3000/api/health

### 3. Web

En otra terminal:

```bash
cd web
npm install
npm start
```

Abrir http://localhost:4200. La pantalla de inicio muestra el estado de front, API y base.

## Scripts útiles (api)

| Comando | Qué hace |
| --- | --- |
| `npm run start:dev` | API con recarga automática |
| `npm run db:migrate -- --name <nombre>` | Crea y aplica una migración tras cambiar `prisma/schema.prisma` |
| `npm run db:seed` | Carga categorías, marcas y configuración inicial |
| `npm run db:studio` | Abre Prisma Studio para ver los datos |
| `npm run admin:make -- <email>` | Da rol de administrador a una cuenta (`--quitar` para sacarlo) |
| `npm test` | Tests unitarios |

## Estado

- [x] Bloque 1 — Base técnica y modelo de datos
- [x] Bloque 2 — Cuentas
- [x] Bloque 3 — Administración base
- [ ] Bloque 4 — Perfil de vendedor
- [ ] Bloque 5 — Publicaciones
- [ ] Bloque 6 — Descubrimiento y contacto
- [ ] Bloque 7 — Pulido previo al lanzamiento
