# MagicAI Platform - Backend

Backend para plataforma multi-agente de IA con Node.js, Express, TypeScript, PostgreSQL, OpenAI y Gemini.

## 🚀 Características

- ✅ Autenticación JWT con roles (Admin/Usuario)
- ✅ Gestión de usuarios con contraseñas hasheadas (bcrypt)
- ✅ Sistema de categorías y agentes de IA multiidioma (ES/EN)
- ✅ Integración con OpenAI y Gemini
- ✅ Gestión de conversaciones con límites automáticos
- ✅ Sistema de onboarding con selección de idioma
- ✅ Estadísticas para administradores
- ✅ Dockerizado para deployment fácil
- ✅ Base de datos PostgreSQL con Prisma ORM

## 📋 Requisitos

- Node.js 18+
- PostgreSQL 15+
- Docker y Docker Compose (para deployment)
- API Keys de OpenAI y Gemini

## 🛠️ Instalación Local

### 1. Clonar el repositorio

```bash
cd backend
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Copiar el archivo `.env.example` a `.env`:

```bash
cp .env.example .env
```

Editar `.env` con tus valores:

```env
NODE_ENV=development
PORT=3000
DATABASE_URL="postgresql://user:password@localhost:5432/ai_platform?schema=public"
JWT_SECRET=your-super-secret-jwt-key
OPENAI_API_KEY=sk-your-key
GEMINI_API_KEY=your-key
```

### 4. Configurar base de datos

```bash
# Generar Prisma Client
npm run prisma:generate

# Ejecutar migraciones
npm run prisma:migrate

# Poblar base de datos con datos iniciales
npm run prisma:seed
```

### 5. Ejecutar en desarrollo

```bash
npm run dev
```

El servidor estará disponible en `http://localhost:3000`

## 🐳 Deployment con Docker (Ubuntu VPS)

### Prerequisitos en el VPS

1. **Instalar Docker:**

```bash
# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Agregar usuario al grupo docker
sudo usermod -aG docker $USER

# Reiniciar sesión o ejecutar
newgrp docker
```

2. **Instalar Docker Compose:**

```bash
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
docker-compose --version
```

### Deployment

1. **Subir código al VPS:**

```bash
# Desde tu máquina local
scp -r backend/ user@your-vps-ip:/home/user/magicai/
```

O usar Git:

```bash
# En el VPS
git clone your-repo-url
cd backend
```

2. **Configurar variables de entorno:**

```bash
cp .env.docker .env
nano .env  # Editar con tus valores reales
```

3. **Construir y ejecutar:**

```bash
# Construir imágenes
docker-compose build

# Ejecutar migraciones
docker-compose run --rm backend npx prisma migrate deploy

# Poblar base de datos
docker-compose run --rm backend npm run prisma:seed

# Iniciar servicios
docker-compose up -d
```

4. **Verificar estado:**

```bash
# Ver logs
docker-compose logs -f backend

# Ver contenedores
docker-compose ps

# Health check
curl http://localhost:3000/health
```

### Comandos útiles

```bash
# Detener servicios
docker-compose down

# Reiniciar servicios
docker-compose restart

# Ver logs
docker-compose logs -f

# Ejecutar comandos en el contenedor
docker-compose exec backend sh

# Backup de base de datos
docker-compose exec postgres pg_dump -U postgres ai_platform > backup.sql

# Restaurar base de datos
docker-compose exec -T postgres psql -U postgres ai_platform < backup.sql
```

## 📚 Estructura del Proyecto

```
backend/
├── prisma/
│   ├── schema.prisma       # Esquema de base de datos
│   ├── seed.ts            # Datos iniciales
│   └── migrations/        # Migraciones
├── src/
│   ├── config/            # Configuraciones
│   ├── middleware/        # Middlewares (auth, validation, etc)
│   ├── modules/           # Módulos de la aplicación
│   │   ├── auth/
│   │   ├── users/
│   │   ├── categories/
│   │   ├── agents/
│   │   ├── conversations/
│   │   ├── messages/
│   │   ├── onboarding/
│   │   └── admin/
│   ├── services/          # Servicios (OpenAI, Gemini, Email)
│   ├── utils/             # Utilidades
│   ├── app.ts            # Configuración Express
│   └── server.ts         # Punto de entrada
├── Dockerfile
├── docker-compose.yml
└── package.json
```

## 🔑 Credenciales por Defecto

Después de ejecutar el seed:

- **Email:** admin@magicai.com
- **Password:** admin123

⚠️ **IMPORTANTE:** Cambiar estas credenciales en producción.

## 📖 API Endpoints

Ver documentación completa en [API_DOCUMENTATION.md](./docs/API_DOCUMENTATION.md)

### Principales endpoints:

- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Crear usuario (Admin)
- `GET /api/categories` - Listar categorías
- `GET /api/agents` - Listar agentes
- `POST /api/conversations` - Crear conversación
- `POST /api/messages/:conversationId` - Enviar mensaje
- `GET /api/admin/stats/overview` - Estadísticas (Admin)

## 🔒 Seguridad

- Contraseñas hasheadas con bcrypt (10 rounds)
- JWT con expiración configurable
- Rate limiting configurado
- Helmet para headers de seguridad
- CORS configurado
- Validación de inputs con Zod
- SQL injection prevention (Prisma ORM)

## 🌐 Configurar Nginx (Reverse Proxy)

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

Para SSL con Let's Encrypt:

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## 🐛 Troubleshooting

### Error de conexión a base de datos

```bash
# Verificar que PostgreSQL esté corriendo
docker-compose ps

# Ver logs de PostgreSQL
docker-compose logs postgres

# Reiniciar servicios
docker-compose restart
```

### Error de migraciones

```bash
# Resetear base de datos (⚠️ CUIDADO: borra todos los datos)
docker-compose down -v
docker-compose up -d postgres
docker-compose run --rm backend npx prisma migrate deploy
docker-compose run --rm backend npm run prisma:seed
```

### Problemas con API keys

Verificar que las variables de entorno estén correctamente configuradas:

```bash
docker-compose exec backend printenv | grep API_KEY
```

## 📝 Scripts Disponibles

- `npm run dev` - Desarrollo con hot reload
- `npm run build` - Compilar TypeScript
- `npm start` - Ejecutar en producción
- `npm run prisma:generate` - Generar Prisma Client
- `npm run prisma:migrate` - Ejecutar migraciones
- `npm run prisma:studio` - Abrir Prisma Studio
- `npm run prisma:seed` - Poblar base de datos

## 🤝 Contribuir

1. Fork el proyecto
2. Crear feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push al branch (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

## 📄 Licencia

MIT
