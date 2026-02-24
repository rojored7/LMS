# HU-010: Asignar/Modificar Perfil de Usuario

**Épica:** EP-002 - Dashboard Administrativo
**Sprint:** 2
**Story Points:** 3
**Prioridad:** Must Have
**Estado:** 🔄 PENDIENTE

---

## Historia de Usuario

**Como** administrador
**Quiero** asignar o modificar el perfil de entrenamiento de un usuario
**Para** personalizar la ruta de aprendizaje según rol del estudiante

---

## Criterios de Aceptación

- [ ] **AC1:** Opción "Asignar Perfil" disponible en tabla de usuarios (HU-006)
- [ ] **AC2:** Dropdown con lista de perfiles activos disponibles
- [ ] **AC3:** Al asignar perfil, auto-inscribir al usuario en todos los cursos del perfil
- [ ] **AC4:** Confirmación visual con toast notification tras cambio exitoso
- [ ] **AC5:** Email de notificación automático al usuario informando del nuevo perfil asignado
- [ ] **AC6:** Historial de cambios de perfil almacenado para auditoría (tabla ProfileHistory)
- [ ] **AC7:** Endpoint PATCH /api/admin/users/:id/assign-profile con body: { profileId }
- [ ] **AC8:** Validación de que el perfil existe y está activo

---

## Definición de Hecho (DoD)

- [ ] Código implementado (backend y frontend)
- [ ] Tests unitarios escritos y pasando (>80% coverage)
- [ ] Tests de integración escritos y pasando
- [ ] Todos los criterios de aceptación cumplidos
- [ ] Code review realizado y aprobado
- [ ] Documentación técnica actualizada (JSDoc/Swagger)
- [ ] Validado en entorno Docker local
- [ ] Sin warnings de linter ni TypeScript errors

---

## Detalles Técnicos

### Backend

**Endpoints:**
- `PATCH /api/admin/users/:id/assign-profile`

**Modelos (Prisma):**
```prisma
model User {
  id        String   @id @default(uuid())
  profileId String?
  profile   Profile? @relation(fields: [profileId], references: [id])
  profileHistory ProfileHistory[]
}

model ProfileHistory {
  id         String   @id @default(uuid())
  userId     String
  user       User     @relation(fields: [userId], references: [id])
  profileId  String
  profile    Profile  @relation(fields: [profileId], references: [id])
  assignedBy String   // Admin user ID
  assignedAt DateTime @default(now())
  reason     String?
}
```

**Servicios:**
```typescript
class ProfileAssignmentService {
  static async assignProfile(userId: string, profileId: string, assignedBy: string) {
    // Verificar que perfil existe y está activo
    const profile = await prisma.profile.findUnique({
      where: { id: profileId },
      include: { courses: true }
    })

    if (!profile || !profile.active) {
      throw new Error('Perfil no encontrado o inactivo')
    }

    // Actualizar usuario
    await prisma.user.update({
      where: { id: userId },
      data: { profileId }
    })

    // Crear registro en historial
    await prisma.profileHistory.create({
      data: {
        userId,
        profileId,
        assignedBy,
        reason: 'Asignación manual desde panel admin'
      }
    })

    // Auto-inscribir en cursos del perfil
    for (const course of profile.courses) {
      await this.enrollUserInCourse(userId, course.id)
    }

    // Enviar email de notificación
    await EmailService.sendProfileAssignmentEmail(userId, profile.name)

    return { success: true }
  }
}
```

### Frontend

**Componentes:**
- `AssignProfileModal.tsx` - Modal para asignar perfil
- `ProfileHistoryTimeline.tsx` - Timeline de cambios de perfil

**Hooks:**
```typescript
export function useAssignProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId, profileId }: { userId: string; profileId: string }) =>
      adminApi.assignProfile(userId, profileId),
    onSuccess: () => {
      queryClient.invalidateQueries(['users'])
      toast.success('Perfil asignado exitosamente')
    }
  })
}
```

### Base de Datos

**Migraciones:**
```sql
CREATE TABLE profile_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id),
  assigned_by UUID NOT NULL REFERENCES users(id),
  assigned_at TIMESTAMP DEFAULT NOW(),
  reason TEXT
);

CREATE INDEX idx_profile_history_user ON profile_history(user_id);
CREATE INDEX idx_profile_history_date ON profile_history(assigned_at);
```

---

## Dependencias

**Depende de:**
- HU-006: Vista de Lista de Usuarios
- HU-009: Gestión de Perfiles de Entrenamiento

**Bloqueante para:**
- Ninguna

---

## Tests a Implementar

### Tests Unitarios

```typescript
describe('HU-010: Asignar Perfil de Usuario', () => {
  it('AC3: Debe auto-inscribir en cursos del perfil', async () => {
    const user = await createTestUser()
    const profile = await createTestProfile({
      courses: [course1, course2, course3]
    })

    await ProfileAssignmentService.assignProfile(user.id, profile.id, 'admin-123')

    const enrollments = await prisma.userCourseEnrollment.findMany({
      where: { userId: user.id }
    })

    expect(enrollments).toHaveLength(3)
    expect(enrollments.map(e => e.courseId)).toEqual(
      expect.arrayContaining([course1.id, course2.id, course3.id])
    )
  })

  it('AC6: Debe crear registro en historial', async () => {
    const user = await createTestUser()
    const profile = await createTestProfile()

    await ProfileAssignmentService.assignProfile(user.id, profile.id, 'admin-123')

    const history = await prisma.profileHistory.findMany({
      where: { userId: user.id }
    })

    expect(history).toHaveLength(1)
    expect(history[0].profileId).toBe(profile.id)
    expect(history[0].assignedBy).toBe('admin-123')
  })

  it('AC8: Debe rechazar perfil inactivo', async () => {
    const user = await createTestUser()
    const inactiveProfile = await createTestProfile({ active: false })

    await expect(
      ProfileAssignmentService.assignProfile(user.id, inactiveProfile.id, 'admin-123')
    ).rejects.toThrow('Perfil no encontrado o inactivo')
  })

  it('AC5: Debe enviar email de notificación', async () => {
    const mockEmail = jest.spyOn(EmailService, 'sendProfileAssignmentEmail')
    const user = await createTestUser()
    const profile = await createTestProfile()

    await ProfileAssignmentService.assignProfile(user.id, profile.id, 'admin-123')

    expect(mockEmail).toHaveBeenCalledWith(user.id, profile.name)
  })
})
```

### Tests de Integración

```typescript
describe('[Assign Profile] Integration Tests', () => {
  it('AC7: Flujo completo de asignación de perfil', async () => {
    const adminToken = await getAdminToken()
    const user = await createTestUser()
    const profile = await createTestProfile({ courses: [course1, course2] })

    const response = await request(app)
      .patch(`/api/admin/users/${user.id}/assign-profile`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ profileId: profile.id })
      .expect(200)

    expect(response.body.success).toBe(true)

    // Verificar usuario actualizado
    const updatedUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: { profile: true }
    })
    expect(updatedUser.profileId).toBe(profile.id)

    // Verificar inscripciones
    const enrollments = await prisma.userCourseEnrollment.count({
      where: { userId: user.id }
    })
    expect(enrollments).toBe(2)
  })

  it('Solo ADMIN puede asignar perfiles', async () => {
    const studentToken = await getStudentToken()
    const user = await createTestUser()
    const profile = await createTestProfile()

    await request(app)
      .patch(`/api/admin/users/${user.id}/assign-profile`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ profileId: profile.id })
      .expect(403)
  })
})
```

### Tests Frontend

```typescript
describe('AssignProfileModal', () => {
  it('AC1, AC2: Debe mostrar dropdown con perfiles disponibles', async () => {
    const mockProfiles = [
      { id: '1', name: 'SOC Analyst' },
      { id: '2', name: 'Pentester' }
    ]
    mockApi.getProfiles.mockResolvedValue(mockProfiles)

    render(<AssignProfileModal userId="user-123" />)

    const dropdown = await screen.findByRole('combobox')
    expect(dropdown).toBeInTheDocument()

    const options = await screen.findAllByRole('option')
    expect(options).toHaveLength(2)
  })

  it('AC4: Debe mostrar confirmación tras asignación exitosa', async () => {
    mockApi.assignProfile.mockResolvedValue({ success: true })

    render(<AssignProfileModal userId="user-123" />)

    await userEvent.selectOptions(screen.getByRole('combobox'), 'profile-1')
    await userEvent.click(screen.getByRole('button', { name: /asignar/i }))

    expect(await screen.findByText(/perfil asignado exitosamente/i)).toBeInTheDocument()
  })
})
```

---

## Notas Adicionales

**Seguridad:**
- Validar que el admin tiene permisos para modificar usuarios
- No permitir que un usuario se asigne perfil a sí mismo (evitar escalación)
- Logging de todos los cambios de perfil para auditoría

**UX/UI:**
- Preview de los cursos incluidos en el perfil antes de asignar
- Confirmación si el usuario ya tiene cursos en progreso (advertencia de cambios)
- Opción de "desasignar" perfil (volver a null)

**Performance:**
- Auto-inscripción en cursos debe ser en transacción (rollback si falla)
- Queue asíncrona para inscripciones si el perfil tiene muchos cursos (>10)

**Email Template:**
```html
<h2>Nuevo Perfil de Entrenamiento Asignado</h2>
<p>Hola {userName},</p>
<p>Se te ha asignado el perfil: <strong>{profileName}</strong></p>
<p>Esto incluye acceso a los siguientes cursos:</p>
<ul>
  {courseList}
</ul>
<p>Puedes comenzar tu capacitación desde tu dashboard.</p>
```

---

## Referencias

- Documento de Arquitectura: `docs/arquitectura.md`
- Backlog: `docs/backlog.md` - Sprint 2, HU-010
- HU-006: Vista de Lista de Usuarios
- HU-009: Gestión de Perfiles
