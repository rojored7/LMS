# Plataforma Multi-Curso - Frontend

Frontend moderno de la plataforma de cursos construido con React, TypeScript y Tailwind CSS.

## Tecnologías

- **React 18** - Framework UI
- **TypeScript** - Tipado estático
- **Vite** - Build tool y dev server
- **React Router v6** - Enrutamiento
- **Zustand** - State management
- **React Query (TanStack Query)** - Data fetching y caché
- **Axios** - Cliente HTTP
- **Tailwind CSS** - Estilos utility-first
- **Zod** - Validación de esquemas
- **ESLint & Prettier** - Linting y formateo

## Estructura del Proyecto

```
frontend/
├── public/                 # Archivos estáticos
│   └── index.html         # HTML template
├── src/
│   ├── components/        # Componentes reutilizables
│   │   ├── common/       # Componentes comunes (Button, Input, etc.)
│   │   └── layout/       # Componentes de layout (Header, Footer, etc.)
│   ├── hooks/            # Custom React hooks
│   ├── pages/            # Páginas de la aplicación
│   ├── services/         # API services
│   ├── store/            # Zustand stores
│   ├── types/            # TypeScript types e interfaces
│   ├── utils/            # Funciones utilitarias
│   ├── App.tsx           # Componente raíz con routing
│   ├── main.tsx          # Entry point
│   └── index.css         # Estilos globales
├── .env.example          # Variables de entorno de ejemplo
├── package.json          # Dependencias
├── tsconfig.json         # Configuración TypeScript
├── vite.config.ts        # Configuración Vite
└── tailwind.config.js    # Configuración Tailwind

```

## Instalación

1. **Instalar dependencias:**

```bash
npm install
```

2. **Configurar variables de entorno:**

```bash
cp .env.example .env
```

Edita `.env` y configura:

```env
VITE_API_URL=http://localhost:3000/api
```

## Scripts Disponibles

```bash
# Desarrollo
npm run dev                 # Inicia servidor de desarrollo (puerto 5173)

# Build
npm run build              # Compila para producción
npm run preview            # Preview de build de producción

# Linting
npm run lint               # Ejecuta ESLint
npm run lint:fix           # Ejecuta ESLint y auto-fix

# Formateo
npm run format             # Formatea código con Prettier
npm run format:check       # Verifica formato sin modificar

# Type checking
npm run type-check         # Verifica tipos TypeScript
```

## Desarrollo

### Iniciar en modo desarrollo

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`

### Hot Module Replacement (HMR)

Vite proporciona HMR instantáneo. Los cambios se reflejan automáticamente sin recargar la página.

## Arquitectura

### State Management

- **Zustand** para estado global (auth, courses, UI)
- **React Query** para estado del servidor (data fetching, caché)
- **useState/useReducer** para estado local de componentes

### Routing

React Router v6 con rutas protegidas:

- **Públicas**: Home, Login, Register, Course Catalog
- **Protegidas**: Dashboard, Profile
- **Admin**: Admin Dashboard (solo ADMIN role)

### API Client

Axios configurado con:

- Interceptores JWT para autenticación
- Refresh token automático
- Manejo centralizado de errores

### Validación

Zod para validación de formularios:

- Login/Register forms
- Profile updates
- Course creation

### Estilos

Tailwind CSS con:

- Dark mode support
- Componentes reutilizables con variantes
- Utilidades personalizadas

## Componentes Principales

### Common Components

- `Button` - Botón con variantes (primary, secondary, outline, ghost, danger)
- `Input` - Campo de entrada con label, error y helper text
- `Card` - Contenedor de contenido con header, body y footer
- `Modal` - Diálogo modal
- `Loader` - Indicador de carga
- `Toast` - Notificaciones
- `Badge` - Etiquetas
- `Avatar` - Avatar de usuario con fallback

### Layout Components

- `Header` - Barra de navegación superior
- `Footer` - Pie de página
- `Sidebar` - Barra lateral para dashboard
- `ProtectedRoute` - HOC para rutas protegidas

### Pages

- `Home` - Landing page
- `Login` - Página de inicio de sesión
- `Register` - Página de registro
- `Dashboard` - Dashboard del estudiante
- `CourseCatalog` - Catálogo de cursos
- `CourseDetail` - Detalle de curso
- `AdminDashboard` - Panel de administración
- `Profile` - Perfil de usuario
- `NotFound` - 404

## Hooks Personalizados

- `useAuth()` - Hook de autenticación
- `useToast()` - Hook de notificaciones
- `useCourses()` - Hook para cursos con React Query
- `useLocalStorage()` - Persistencia en localStorage

## Flujo de Autenticación

1. Usuario hace login/register
2. Backend retorna JWT tokens (access + refresh)
3. Tokens se guardan en localStorage y Zustand
4. Interceptor de Axios agrega JWT a todas las requests
5. Si token expira (401), se intenta refresh automático
6. Si refresh falla, se limpia estado y redirige a login

## Build para Producción

```bash
npm run build
```

El build optimizado se genera en `dist/`:

- Assets con hash para cache busting
- Code splitting automático
- Tree shaking
- Minificación
- Optimización de imágenes

### Preview del Build

```bash
npm run preview
```

## Docker

### Dockerfile incluido

```bash
# Build
docker build -t plataforma-frontend .

# Run
docker run -p 80:80 plataforma-frontend
```

## Variables de Entorno

| Variable                     | Descripción                      | Default                   |
| ---------------------------- | -------------------------------- | ------------------------- |
| `VITE_API_URL`               | URL de la API backend            | http://localhost:3000/api |
| `VITE_API_TIMEOUT`           | Timeout de requests (ms)         | 30000                     |
| `VITE_APP_ENV`               | Entorno (development/production) | development               |
| `VITE_JWT_REFRESH_THRESHOLD` | Umbral para refresh JWT (ms)     | 300000                    |

## Integración con Backend

El frontend espera que el backend exponga:

### Auth Endpoints

- `POST /api/auth/login`
- `POST /api/auth/register`
- `POST /api/auth/logout`
- `POST /api/auth/refresh`
- `GET /api/auth/me`

### User Endpoints

- `GET /api/users/profile`
- `PUT /api/users/profile`
- `GET /api/users` (admin)

### Course Endpoints

- `GET /api/courses`
- `GET /api/courses/:id`
- `POST /api/courses` (instructor/admin)
- `POST /api/courses/:id/enroll`
- `GET /api/courses/enrolled`

Ver documentación del backend para detalles completos.

## Testing

(Por implementar)

```bash
npm run test              # Ejecuta tests
npm run test:coverage     # Cobertura de tests
```

## Consideraciones de Seguridad

- JWT tokens almacenados en localStorage (considera httpOnly cookies para mayor seguridad)
- Validación de inputs con Zod
- Sanitización de datos del usuario
- CORS configurado en backend
- Rate limiting en backend
- HTTPS en producción

## Rendimiento

- Code splitting por rutas
- Lazy loading de imágenes
- React Query para caché inteligente
- Memoización de componentes pesados
- Optimización de re-renders

## Accesibilidad

- Etiquetas semánticas HTML5
- ARIA labels en componentes interactivos
- Navegación por teclado
- Focus visible
- Contraste de colores WCAG AA

## Navegadores Soportados

- Chrome/Edge (últimas 2 versiones)
- Firefox (últimas 2 versiones)
- Safari (últimas 2 versiones)

## Contribuir

1. Fork el proyecto
2. Crea una rama feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## Licencia

Este proyecto es privado y confidencial.

## Soporte

Para soporte, contacta al equipo de desarrollo.
