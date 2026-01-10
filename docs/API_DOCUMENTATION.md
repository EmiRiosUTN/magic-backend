# API Documentation - MagicAI Platform

Base URL: `http://localhost:3000/api`

## 📋 Tabla de Contenidos

- [Autenticación](#autenticación)
- [Usuarios](#usuarios)
- [Onboarding](#onboarding)
- [Categorías](#categorías)
- [Agentes](#agentes)
- [Conversaciones](#conversaciones)
- [Mensajes](#mensajes)
- [Admin](#admin)

---

## 🔐 Autenticación

Todos los endpoints (excepto login y health check) requieren autenticación mediante JWT.

**Header requerido:**
```
Authorization: Bearer <token>
```

### POST /auth/login

Iniciar sesión.

**Request:**
```json
{
  "email": "admin@magicai.com",
  "password": "admin123"
}
```

**Response:** `200 OK`
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "admin@magicai.com",
    "fullName": "Admin User",
    "role": "ADMIN",
    "onboardingCompleted": true,
    "subscriptionType": {
      "id": "uuid",
      "name": "Free",
      "maxConversationsPerAgent": 5,
      "maxMessagesPerConversation": 100
    }
  }
}
```

**Errores:**
- `401` - Credenciales inválidas
- `400` - Validación fallida

---

### POST /auth/register

Crear nuevo usuario (solo Admin).

**Requiere:** Admin

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "fullName": "John Doe",
  "role": "USER",
  "subscriptionTypeId": "uuid"
}
```

**Response:** `201 Created`
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "fullName": "John Doe",
  "role": "USER",
  "subscriptionType": { ... }
}
```

---

### POST /auth/forgot-password

Solicitar recuperación de contraseña.

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response:** `200 OK`
```json
{
  "message": "If the email exists, a reset link will be sent"
}
```

---

## 👤 Usuarios

### GET /users/me

Obtener perfil del usuario actual.

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "fullName": "John Doe",
  "role": "USER",
  "onboardingCompleted": true,
  "subscriptionType": { ... },
  "language": "ES"
}
```

---

### PUT /users/me

Actualizar perfil del usuario actual.

**Request:**
```json
{
  "fullName": "John Smith"
}
```

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "fullName": "John Smith",
  ...
}
```

---

### GET /users

Listar todos los usuarios (solo Admin).

**Requiere:** Admin

**Response:** `200 OK`
```json
{
  "users": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "fullName": "John Doe",
      "role": "USER",
      "isActive": true,
      "onboardingCompleted": true,
      "subscriptionType": { ... },
      "createdAt": "2026-01-09T14:00:00Z"
    }
  ]
}
```

---

## 🎯 Onboarding

### GET /onboarding/status

Obtener estado del onboarding.

**Response:** `200 OK`
```json
{
  "onboardingCompleted": false,
  "language": "ES"
}
```

---

### POST /onboarding/language

Configurar idioma del usuario.

**Request:**
```json
{
  "language": "ES"
}
```

**Valores permitidos:** `ES`, `EN`

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "userId": "uuid",
  "language": "ES",
  "createdAt": "2026-01-09T14:00:00Z",
  "updatedAt": "2026-01-09T14:00:00Z"
}
```

---

### POST /onboarding/complete

Marcar onboarding como completado.

**Response:** `200 OK`
```json
{
  "onboardingCompleted": true
}
```

---

## 📁 Categorías

### GET /categories

Listar todas las categorías activas.

**Response:** `200 OK`
```json
{
  "categories": [
    {
      "id": "uuid",
      "name": "Creación de Imágenes",
      "description": "Genera imágenes especializadas...",
      "icon": "🎨",
      "displayOrder": 1,
      "agentCount": 5
    }
  ]
}
```

**Nota:** El nombre y descripción se devuelven en el idioma del usuario (ES/EN).

---

### GET /categories/:id

Obtener detalles de una categoría.

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "name": "Creación de Imágenes",
  "description": "Genera imágenes especializadas...",
  "icon": "🎨",
  "displayOrder": 1,
  "agentCount": 5
}
```

---

### POST /categories

Crear nueva categoría (solo Admin).

**Requiere:** Admin

**Request:**
```json
{
  "nameEs": "Nueva Categoría",
  "nameEn": "New Category",
  "descriptionEs": "Descripción en español",
  "descriptionEn": "Description in English",
  "icon": "🚀",
  "displayOrder": 7
}
```

**Response:** `201 Created`
```json
{
  "id": "uuid",
  "nameEs": "Nueva Categoría",
  "nameEn": "New Category",
  ...
}
```

---

### PUT /categories/:id

Actualizar categoría (solo Admin).

**Requiere:** Admin

**Request:**
```json
{
  "nameEs": "Categoría Actualizada",
  "isActive": true
}
```

---

### DELETE /categories/:id

Eliminar categoría (soft delete - solo Admin).

**Requiere:** Admin

**Response:** `200 OK`
```json
{
  "message": "Category deleted successfully"
}
```

---

## 🤖 Agentes

### GET /agents

Listar todos los agentes activos.

**Response:** `200 OK`
```json
{
  "agents": [
    {
      "id": "uuid",
      "name": "Asistente de Redacción",
      "description": "Ayuda con textos profesionales...",
      "aiProvider": "OPENAI",
      "hasTools": false,
      "category": {
        "id": "uuid",
        "name": "Redacción y Contenido"
      }
    }
  ]
}
```

---

### GET /agents/by-category?categoryId=uuid

Listar agentes por categoría.

**Query params:**
- `categoryId` (required): UUID de la categoría

**Response:** `200 OK`
```json
{
  "agents": [
    {
      "id": "uuid",
      "name": "Asistente de Redacción",
      "description": "Ayuda con textos profesionales...",
      "aiProvider": "OPENAI",
      "hasTools": false
    }
  ]
}
```

---

### GET /agents/:id

Obtener detalles de un agente.

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "name": "Asistente de Redacción",
  "description": "Ayuda con textos profesionales...",
  "aiProvider": "OPENAI",
  "modelName": "gpt-4o-mini",
  "hasTools": false,
  "category": {
    "id": "uuid",
    "name": "Redacción y Contenido"
  }
}
```

---

### POST /agents

Crear nuevo agente (solo Admin - solo agentes simples sin tools).

**Requiere:** Admin

**Request:**
```json
{
  "categoryId": "uuid",
  "nameEs": "Mi Agente",
  "nameEn": "My Agent",
  "descriptionEs": "Descripción del agente",
  "descriptionEn": "Agent description",
  "systemPrompt": "Eres un asistente experto en...",
  "aiProvider": "OPENAI",
  "modelName": "gpt-4o-mini"
}
```

**Valores permitidos para aiProvider:** `OPENAI`, `GEMINI`

**Modelos sugeridos:**
- OpenAI: `gpt-4o-mini`, `gpt-4o`, `gpt-4-turbo`
- Gemini: `gemini-pro`, `gemini-pro-vision`

**Response:** `201 Created`

---

### PUT /agents/:id

Actualizar agente (solo Admin).

**Requiere:** Admin

---

### DELETE /agents/:id

Eliminar agente (soft delete - solo Admin).

**Requiere:** Admin

---

## 💬 Conversaciones

### GET /conversations

Listar conversaciones del usuario.

**Query params:**
- `agentId` (optional): Filtrar por agente específico

**Response:** `200 OK`
```json
{
  "conversations": [
    {
      "id": "uuid",
      "title": "Conversación sobre marketing",
      "messageCount": 12,
      "lastMessageAt": "2026-01-09T14:00:00Z",
      "createdAt": "2026-01-08T10:00:00Z",
      "agent": {
        "id": "uuid",
        "nameEs": "Asistente de Redacción",
        "nameEn": "Writing Assistant"
      }
    }
  ]
}
```

---

### GET /conversations/:id

Obtener detalles de una conversación.

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "userId": "uuid",
  "agentId": "uuid",
  "title": "Conversación sobre marketing",
  "messageCount": 12,
  "lastMessageAt": "2026-01-09T14:00:00Z",
  "createdAt": "2026-01-08T10:00:00Z",
  "agent": { ... }
}
```

---

### POST /conversations

Crear nueva conversación.

**Request:**
```json
{
  "agentId": "uuid",
  "title": "Mi nueva conversación",
  "confirmDelete": false
}
```

**Response (sin límite alcanzado):** `201 Created`
```json
{
  "id": "uuid",
  "title": "Mi nueva conversación",
  "agentId": "uuid",
  "createdAt": "2026-01-09T14:00:00Z"
}
```

**Response (límite alcanzado - requiere confirmación):** `200 OK`
```json
{
  "requiresConfirmation": true,
  "warning": "Has alcanzado el límite de 5 conversaciones para este agente. La conversación 'Conversación antigua' será eliminada al crear una nueva.",
  "oldestConversation": {
    "id": "uuid",
    "title": "Conversación antigua"
  }
}
```

**Para confirmar eliminación:**
```json
{
  "agentId": "uuid",
  "title": "Mi nueva conversación",
  "confirmDelete": true
}
```

---

### DELETE /conversations/:id

Eliminar conversación.

**Response:** `200 OK`
```json
{
  "message": "Conversation deleted successfully"
}
```

---

### PUT /conversations/:id/title

Actualizar título de conversación.

**Request:**
```json
{
  "title": "Nuevo título"
}
```

---

## 💭 Mensajes

### GET /messages/:conversationId

Obtener mensajes de una conversación.

**Query params:**
- `limit` (optional, default: 50): Número de mensajes
- `offset` (optional, default: 0): Offset para paginación

**Response:** `200 OK`
```json
{
  "messages": [
    {
      "id": "uuid",
      "role": "USER",
      "content": "Hola, necesito ayuda con...",
      "createdAt": "2026-01-09T14:00:00Z"
    },
    {
      "id": "uuid",
      "role": "ASSISTANT",
      "content": "¡Hola! Claro, estaré encantado de ayudarte...",
      "createdAt": "2026-01-09T14:00:05Z"
    }
  ],
  "total": 12,
  "limit": 50,
  "offset": 0
}
```

---

### POST /messages/:conversationId

Enviar mensaje al agente de IA.

**Request:**
```json
{
  "content": "Ayúdame a escribir un email profesional"
}
```

**Response:** `201 Created`
```json
{
  "userMessage": {
    "id": "uuid",
    "role": "USER",
    "content": "Ayúdame a escribir un email profesional",
    "createdAt": "2026-01-09T14:00:00Z"
  },
  "assistantMessage": {
    "id": "uuid",
    "role": "ASSISTANT",
    "content": "Por supuesto, estaré encantado de ayudarte...",
    "createdAt": "2026-01-09T14:00:05Z"
  }
}
```

**Errores:**
- `400` - Límite de mensajes alcanzado
- `404` - Conversación no encontrada

---

## 📊 Admin

### GET /admin/stats/overview

Obtener estadísticas generales de la plataforma.

**Requiere:** Admin

**Response:** `200 OK`
```json
{
  "totalUsers": 150,
  "activeUsers": 120,
  "totalConversations": 1250,
  "totalMessages": 15000,
  "mostUsedAgent": {
    "id": "uuid",
    "nameEs": "Asistente de Redacción",
    "nameEn": "Writing Assistant",
    "usageCount": 450
  }
}
```

---

### GET /admin/stats/users

Obtener estadísticas de usuarios.

**Requiere:** Admin

**Response:** `200 OK`
```json
{
  "users": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "fullName": "John Doe",
      "conversationCount": 15,
      "isActive": true,
      "createdAt": "2026-01-01T10:00:00Z"
    }
  ]
}
```

---

### GET /admin/stats/agents

Obtener estadísticas de agentes.

**Requiere:** Admin

**Response:** `200 OK`
```json
{
  "agents": [
    {
      "id": "uuid",
      "nameEs": "Asistente de Redacción",
      "nameEn": "Writing Assistant",
      "categoryName": "Redacción y Contenido",
      "conversationCount": 450,
      "aiProvider": "OPENAI"
    }
  ]
}
```

---

## 🔄 Códigos de Estado HTTP

- `200 OK` - Solicitud exitosa
- `201 Created` - Recurso creado exitosamente
- `400 Bad Request` - Error de validación o solicitud inválida
- `401 Unauthorized` - No autenticado o token inválido
- `403 Forbidden` - No tiene permisos (requiere admin)
- `404 Not Found` - Recurso no encontrado
- `500 Internal Server Error` - Error del servidor

---

## 📝 Notas Importantes

1. **Idioma:** Los endpoints que devuelven contenido multiidioma (categorías, agentes) automáticamente devuelven el contenido en el idioma configurado del usuario.

2. **Límites de conversaciones:** El sistema automáticamente gestiona el límite de conversaciones por agente según el tipo de suscripción del usuario.

3. **Límites de mensajes:** Cada conversación tiene un límite de mensajes configurado en el tipo de suscripción.

4. **AI Providers:** Los agentes pueden usar OpenAI o Gemini. El sistema automáticamente enruta las solicitudes al proveedor correcto.

5. **Contexto de conversación:** El sistema mantiene las últimas 20 mensajes como contexto para las respuestas de IA.
