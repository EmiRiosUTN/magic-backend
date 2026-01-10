# Database Schema Documentation

## 📊 Diagrama de Relaciones

```
┌─────────────────────┐
│  subscription_types │
└──────────┬──────────┘
           │
           │ 1:N
           │
┌──────────▼──────────┐         ┌──────────────────┐
│       users         │◄────────┤  user_settings   │
└──────────┬──────────┘   1:1   └──────────────────┘
           │
           │ 1:N
           │
┌──────────▼──────────┐
│   conversations     │
└──────────┬──────────┘
           │
           │ 1:N
           │
┌──────────▼──────────┐
│     messages        │
└─────────────────────┘

┌─────────────────────┐
│    categories       │
└──────────┬──────────┘
           │
           │ 1:N
           │
┌──────────▼──────────┐
│      agents         │◄────────┐
└──────────┬──────────┘         │
           │                    │ created_by
           │ 1:N                │
           │                    │
           └────────────────────┤
                                │
                         ┌──────┴──────┐
                         │    users    │
                         └─────────────┘
```

---

## 📋 Tablas

### users

Almacena las cuentas de usuario con control de acceso basado en roles.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | Primary key |
| email | VARCHAR(255) | Email único del usuario |
| password_hash | VARCHAR(255) | Contraseña hasheada con bcrypt |
| full_name | VARCHAR(255) | Nombre completo |
| role | ENUM | Rol del usuario (ADMIN, USER) |
| subscription_type_id | UUID | FK a subscription_types |
| is_active | BOOLEAN | Estado activo/inactivo |
| onboarding_completed | BOOLEAN | Si completó el onboarding |
| created_at | TIMESTAMP | Fecha de creación |
| updated_at | TIMESTAMP | Última actualización |

**Índices:**
- PRIMARY KEY (id)
- UNIQUE (email)
- INDEX (subscription_type_id)

**Relaciones:**
- N:1 con subscription_types
- 1:1 con user_settings
- 1:N con conversations
- 1:N con agents (como creador)

---

### subscription_types

Define los niveles de suscripción con diferentes límites.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | Primary key |
| name | VARCHAR(100) | Nombre del plan |
| max_conversations_per_agent | INTEGER | Límite de conversaciones por agente |
| max_messages_per_conversation | INTEGER | Límite de mensajes por conversación |
| max_agents_access | INTEGER | Límite de agentes (NULL = ilimitado) |
| created_at | TIMESTAMP | Fecha de creación |
| updated_at | TIMESTAMP | Última actualización |

**Valores por defecto:**
- Free: 5 conversaciones, 100 mensajes, acceso ilimitado

---

### user_settings

Almacena preferencias del usuario (idioma, etc).

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | FK a users (UNIQUE) |
| language | ENUM | Idioma preferido (ES, EN) |
| created_at | TIMESTAMP | Fecha de creación |
| updated_at | TIMESTAMP | Última actualización |

**Relaciones:**
- 1:1 con users (CASCADE DELETE)

---

### categories

Categorías de agentes de IA.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | Primary key |
| name_es | VARCHAR(255) | Nombre en español |
| name_en | VARCHAR(255) | Nombre en inglés |
| description_es | TEXT | Descripción en español |
| description_en | TEXT | Descripción en inglés |
| icon | VARCHAR(100) | Icono o emoji |
| display_order | INTEGER | Orden de visualización |
| is_active | BOOLEAN | Estado activo/inactivo |
| created_at | TIMESTAMP | Fecha de creación |
| updated_at | TIMESTAMP | Última actualización |

**Relaciones:**
- 1:N con agents

---

### agents

Agentes de IA individuales dentro de categorías.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | Primary key |
| category_id | UUID | FK a categories |
| name_es | VARCHAR(255) | Nombre en español |
| name_en | VARCHAR(255) | Nombre en inglés |
| description_es | TEXT | Descripción en español |
| description_en | TEXT | Descripción en inglés |
| system_prompt | TEXT | Instrucciones del sistema para la IA |
| ai_provider | ENUM | Proveedor de IA (OPENAI, GEMINI) |
| model_name | VARCHAR(100) | Nombre del modelo (ej: gpt-4o-mini) |
| has_tools | BOOLEAN | Si tiene herramientas/funciones |
| tools_config | JSONB | Configuración de herramientas |
| is_active | BOOLEAN | Estado activo/inactivo |
| created_by_id | UUID | FK a users (creador) |
| created_at | TIMESTAMP | Fecha de creación |
| updated_at | TIMESTAMP | Última actualización |

**Relaciones:**
- N:1 con categories (CASCADE DELETE)
- N:1 con users (creador)
- 1:N con conversations

---

### conversations

Conversaciones de usuarios con agentes específicos.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | FK a users |
| agent_id | UUID | FK a agents |
| title | VARCHAR(255) | Título de la conversación |
| message_count | INTEGER | Contador de mensajes |
| last_message_at | TIMESTAMP | Fecha del último mensaje |
| created_at | TIMESTAMP | Fecha de creación |
| updated_at | TIMESTAMP | Última actualización |

**Índices:**
- PRIMARY KEY (id)
- INDEX (user_id, agent_id, created_at DESC) - Para ordenar y limitar

**Relaciones:**
- N:1 con users (CASCADE DELETE)
- N:1 con agents (CASCADE DELETE)
- 1:N con messages

---

### messages

Mensajes individuales dentro de conversaciones.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | Primary key |
| conversation_id | UUID | FK a conversations |
| role | ENUM | Rol del mensaje (USER, ASSISTANT, SYSTEM) |
| content | TEXT | Contenido del mensaje |
| tokens_used | INTEGER | Tokens utilizados (para tracking) |
| created_at | TIMESTAMP | Fecha de creación |

**Índices:**
- PRIMARY KEY (id)
- INDEX (conversation_id, created_at ASC) - Para ordenar cronológicamente

**Relaciones:**
- N:1 con conversations (CASCADE DELETE)

---

### email_config

Configuración SMTP para envío de emails.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | Primary key |
| smtp_host | VARCHAR(255) | Host SMTP |
| smtp_port | INTEGER | Puerto SMTP |
| smtp_user | VARCHAR(255) | Usuario SMTP |
| smtp_password | VARCHAR(255) | Contraseña SMTP (encriptada) |
| from_email | VARCHAR(255) | Email remitente |
| from_name | VARCHAR(255) | Nombre remitente |
| is_active | BOOLEAN | Configuración activa |
| created_at | TIMESTAMP | Fecha de creación |
| updated_at | TIMESTAMP | Última actualización |

---

## 🔐 Enums

### UserRole
- `ADMIN` - Administrador con acceso completo
- `USER` - Usuario regular

### Language
- `ES` - Español
- `EN` - Inglés

### AIProvider
- `OPENAI` - OpenAI (GPT models)
- `GEMINI` - Google Gemini

### MessageRole
- `USER` - Mensaje del usuario
- `ASSISTANT` - Respuesta de la IA
- `SYSTEM` - Mensaje del sistema

---

## 📝 Migraciones

### Crear nueva migración

```bash
# Después de modificar schema.prisma
npx prisma migrate dev --name nombre_de_la_migracion
```

### Aplicar migraciones en producción

```bash
npx prisma migrate deploy
```

### Resetear base de datos (desarrollo)

```bash
npx prisma migrate reset
```

---

## 🔍 Queries Útiles

### Usuarios más activos

```sql
SELECT 
  u.id,
  u.email,
  u.full_name,
  COUNT(c.id) as conversation_count,
  COUNT(m.id) as message_count
FROM users u
LEFT JOIN conversations c ON u.id = c.user_id
LEFT JOIN messages m ON c.id = m.conversation_id
GROUP BY u.id
ORDER BY message_count DESC
LIMIT 10;
```

### Agentes más utilizados

```sql
SELECT 
  a.id,
  a.name_es,
  a.ai_provider,
  COUNT(c.id) as conversation_count
FROM agents a
LEFT JOIN conversations c ON a.id = c.agent_id
GROUP BY a.id
ORDER BY conversation_count DESC;
```

### Conversaciones por usuario y agente

```sql
SELECT 
  u.email,
  a.name_es as agent_name,
  COUNT(c.id) as conversation_count
FROM conversations c
JOIN users u ON c.user_id = u.id
JOIN agents a ON c.agent_id = a.id
GROUP BY u.id, a.id
ORDER BY conversation_count DESC;
```

---

## 🛡️ Seguridad

1. **Contraseñas:** Hasheadas con bcrypt (10 salt rounds)
2. **Soft Deletes:** Categorías y agentes usan `is_active` en lugar de eliminación física
3. **Cascade Deletes:** Configurados para mantener integridad referencial
4. **UUIDs:** Usados como primary keys para mayor seguridad
5. **Índices:** Optimizados para queries frecuentes

---

## 📊 Backup y Restore

### Backup

```bash
# Usando Docker
docker-compose exec postgres pg_dump -U postgres ai_platform > backup_$(date +%Y%m%d).sql

# Directo
pg_dump -U postgres -h localhost ai_platform > backup.sql
```

### Restore

```bash
# Usando Docker
docker-compose exec -T postgres psql -U postgres ai_platform < backup.sql

# Directo
psql -U postgres -h localhost ai_platform < backup.sql
```

---

## 🔧 Mantenimiento

### Vacuum y Analyze

```sql
VACUUM ANALYZE;
```

### Reindexar

```sql
REINDEX DATABASE ai_platform;
```

### Ver tamaño de tablas

```sql
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```
