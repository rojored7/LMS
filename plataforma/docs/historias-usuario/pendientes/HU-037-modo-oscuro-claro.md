# HU-037: Modo Oscuro/Claro Personalizable

**Épica:** Backlog Futuro
**Sprint:** Backlog
**Story Points:** 3
**Prioridad:** Could Have
**Estado:** 🔄 PENDIENTE

---

## Historia de Usuario

**Como** usuario
**Quiero** cambiar entre modo oscuro y claro
**Para** reducir fatiga visual y adaptar la interfaz a mis preferencias

---

## Criterios de Aceptación

- [ ] **AC1:** Toggle visible en navbar para cambiar entre modo oscuro y claro
- [ ] **AC2:** Persistencia de preferencia en localStorage del navegador
- [ ] **AC3:** Transición suave y animada entre temas (300ms)
- [ ] **AC4:** Variables CSS (CSS custom properties) para gestionar colores de ambos temas
- [ ] **AC5:** Respeto automático por preferencia del sistema operativo usando prefers-color-scheme
- [ ] **AC6:** Todos los componentes de la aplicación adaptados a ambos temas
- [ ] **AC7:** Sintaxis highlighting del editor de código con tema correspondiente
- [ ] **AC8:** Carga del tema preferido antes de renderizar la aplicación (prevenir flash)

---

## Definición de Hecho (DoD)

- [ ] Código implementado (frontend)
- [ ] Tests unitarios escritos y pasando (>80% coverage)
- [ ] Tests de integración escritos y pasando
- [ ] Todos los criterios de aceptación cumplidos
- [ ] Code review realizado y aprobado
- [ ] Documentación técnica actualizada
- [ ] Validado en entorno Docker local
- [ ] Sin warnings de linter ni TypeScript errors

---

## Detalles Técnicos

### Frontend

**Implementación con Tailwind CSS:**

```typescript
// hooks/useTheme.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type Theme = 'light' | 'dark' | 'system'

interface ThemeState {
  theme: Theme
  setTheme: (theme: Theme) => void
  actualTheme: 'light' | 'dark'
}

export const useTheme = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'system',
      actualTheme: getSystemTheme(),

      setTheme: (theme) => {
        set({ theme })

        const actualTheme = theme === 'system' ? getSystemTheme() : theme

        // Aplicar clase al documento
        if (actualTheme === 'dark') {
          document.documentElement.classList.add('dark')
        } else {
          document.documentElement.classList.remove('dark')
        }

        set({ actualTheme })
      }
    }),
    {
      name: 'theme-preference',
      onRehydrateStorage: () => (state) => {
        // AC8: Aplicar tema antes de renderizar
        if (state) {
          const actualTheme = state.theme === 'system'
            ? getSystemTheme()
            : state.theme

          if (actualTheme === 'dark') {
            document.documentElement.classList.add('dark')
          }
        }
      }
    }
  )
)

function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light'

  // AC5: Detectar preferencia del sistema
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

// AC5: Listener para cambios en preferencia del sistema
if (typeof window !== 'undefined') {
  window.matchMedia('(prefers-color-scheme: dark)')
    .addEventListener('change', (e) => {
      const state = useTheme.getState()
      if (state.theme === 'system') {
        state.setTheme('system') // Re-aplicar
      }
    })
}
```

**Componente ThemeToggle:**

```typescript
// components/ThemeToggle.tsx
import { Moon, Sun, Monitor } from 'lucide-react'
import { useTheme } from '@/hooks/useTheme'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Cambiar tema</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme('light')}>
          <Sun className="mr-2 h-4 w-4" />
          <span>Claro</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('dark')}>
          <Moon className="mr-2 h-4 w-4" />
          <span>Oscuro</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('system')}>
          <Monitor className="mr-2 h-4 w-4" />
          <span>Sistema</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
```

**Variables CSS (Tailwind Config):**

```typescript
// tailwind.config.ts
export default {
  darkMode: 'class', // AC4: Usar clase 'dark' en html element
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))'
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))'
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))'
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))'
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))'
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))'
      }
    }
  }
}
```

**CSS Variables (globals.css):**

```css
/* AC4: Variables CSS para ambos temas */
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 222.2 84% 4.9%;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --primary: 210 40% 98%;
    --primary-foreground: 222.2 47.4% 11.2%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 212.7 26.8% 83.9%;
  }
}

/* AC3: Transiciones suaves */
* {
  transition-property: background-color, border-color, color, fill, stroke;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 300ms;
}
```

**Monaco Editor Theme:**

```typescript
// AC7: Adaptar editor de código al tema
import { useTheme } from '@/hooks/useTheme'
import Editor from '@monaco-editor/react'

export function CodeEditor({ code, onChange }: Props) {
  const { actualTheme } = useTheme()

  return (
    <Editor
      theme={actualTheme === 'dark' ? 'vs-dark' : 'vs-light'}
      value={code}
      onChange={onChange}
      options={{
        // otras opciones
      }}
    />
  )
}
```

---

## Tests a Implementar

### Tests Unitarios

```typescript
describe('HU-037: Modo Oscuro/Claro', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.classList.remove('dark')
  })

  it('AC1: Debe permitir cambiar tema', () => {
    const { result } = renderHook(() => useTheme())

    act(() => {
      result.current.setTheme('dark')
    })

    expect(result.current.theme).toBe('dark')
    expect(result.current.actualTheme).toBe('dark')
  })

  it('AC2: Debe persistir preferencia en localStorage', () => {
    const { result } = renderHook(() => useTheme())

    act(() => {
      result.current.setTheme('dark')
    })

    const stored = JSON.parse(localStorage.getItem('theme-preference')!)
    expect(stored.state.theme).toBe('dark')
  })

  it('AC4: Debe aplicar clase dark al documento', () => {
    const { result } = renderHook(() => useTheme())

    act(() => {
      result.current.setTheme('dark')
    })

    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('AC5: Tema "system" debe respetar preferencia del OS', () => {
    // Mock window.matchMedia
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(query => ({
        matches: query === '(prefers-color-scheme: dark)',
        media: query,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn()
      }))
    })

    const { result } = renderHook(() => useTheme())

    act(() => {
      result.current.setTheme('system')
    })

    expect(result.current.actualTheme).toBe('dark')
  })
})
```

### Tests Frontend

```typescript
describe('ThemeToggle Component', () => {
  it('AC1: Debe mostrar botón de toggle en navbar', () => {
    render(<Navbar />)

    const themeToggle = screen.getByRole('button', { name: /cambiar tema/i })
    expect(themeToggle).toBeInTheDocument()
  })

  it('Debe mostrar opciones de tema al hacer click', async () => {
    render(<ThemeToggle />)

    const toggleButton = screen.getByRole('button')
    await userEvent.click(toggleButton)

    expect(screen.getByText(/claro/i)).toBeInTheDocument()
    expect(screen.getByText(/oscuro/i)).toBeInTheDocument()
    expect(screen.getByText(/sistema/i)).toBeInTheDocument()
  })

  it('AC6: Todos los componentes deben adaptarse al tema', () => {
    render(<App />)

    const html = document.documentElement

    // Modo claro
    expect(html.classList.contains('dark')).toBe(false)
    expect(getComputedStyle(html).getPropertyValue('--background')).toBeDefined()

    // Cambiar a modo oscuro
    act(() => {
      html.classList.add('dark')
    })

    expect(html.classList.contains('dark')).toBe(true)
  })
})
```

---

## Notas Adicionales

**UX/UI:**
- Icono animado en toggle (sol/luna con transición)
- Tooltip explicativo en toggle
- Opción "Sistema" para usuarios que prefieren seguir su OS
- Mantener consistencia visual en ambos temas

**Accesibilidad:**
- Suficiente contraste en ambos temas (WCAG AA)
- Screen readers deben anunciar cambio de tema
- Focus visible en ambos temas

**Performance:**
- Cargar tema preferido antes de renderizar (evitar flash)
- CSS transitions solo en propiedades específicas
- Lazy load de temas no utilizados

**Componentes a Adaptar:**
- Todos los componentes de Shadcn/ui (ya soportan dark mode)
- Editor de código Monaco
- Gráficos de Chart.js
- Tablas y formularios
- Modales y tooltips

**Mejoras Futuras:**
- Temas personalizados (más allá de claro/oscuro)
- Accent color selector
- Scheduled theme switching (automático según hora del día)

---

## Referencias

- Tailwind Dark Mode: https://tailwindcss.com/docs/dark-mode
- Shadcn/ui Theming: https://ui.shadcn.com/docs/theming
- prefers-color-scheme: https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-color-scheme
