# Guía: PostgreSQL en VPS + Backend Local

Esta guía te ayudará a deployar solo PostgreSQL en tu VPS Ubuntu y conectarte desde tu PC local.

---

## 🎯 Objetivo

- PostgreSQL corriendo en VPS Ubuntu
- Backend corriendo en tu PC local
- Conexión segura entre ambos

---

## 📋 Paso 1: Conectar al VPS

```bash
ssh root@your-vps-ip
# o
ssh your-user@your-vps-ip
```

---

## 🐳 Paso 2: Instalar Docker (si no lo tienes)

```bash
# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Agregar usuario al grupo docker
sudo usermod -aG docker $USER
newgrp docker

# Verificar
docker --version
```

---

## 🗄️ Paso 3: Crear PostgreSQL con Docker

### 3.1 Crear directorio para PostgreSQL

```bash
mkdir -p ~/postgres-magicai
cd ~/postgres-magicai
```

### 3.2 Crear docker-compose.yml

```bash
nano docker-compose.yml
```

Pegar este contenido:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: magicai-postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: ai_platform
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
    driver: local
```

Guardar con `Ctrl+O`, `Enter`, `Ctrl+X`

### 3.3 Crear archivo .env

```bash
nano .env
```

Pegar:

```env
DB_PASSWORD=TU_PASSWORD_SEGURA_AQUI
```

⚠️ **Cambiar por una contraseña segura!**

Guardar con `Ctrl+O`, `Enter`, `Ctrl+X`

### 3.4 Iniciar PostgreSQL

```bash
docker-compose up -d
```

### 3.5 Verificar que está corriendo

```bash
# Ver logs
docker-compose logs -f postgres

# Ver contenedor
docker-compose ps
```

Deberías ver: `database system is ready to accept connections`

---

## 🔒 Paso 4: Configurar Firewall

### 4.1 Permitir PostgreSQL desde tu IP

```bash
# Instalar UFW si no lo tienes
sudo apt install -y ufw

# Permitir SSH (IMPORTANTE - hazlo primero!)
sudo ufw allow OpenSSH

# Permitir PostgreSQL solo desde tu IP
sudo ufw allow from TU_IP_PUBLICA to any port 5432

# Habilitar firewall
sudo ufw enable

# Verificar reglas
sudo ufw status
```

**Para obtener tu IP pública:**
- Visita: https://www.whatismyip.com/
- O ejecuta en tu PC: `curl ifconfig.me`

### 4.2 Alternativa: Permitir desde cualquier IP (menos seguro)

```bash
sudo ufw allow 5432/tcp
```

---

## 💻 Paso 5: Configurar Backend en tu PC

### 5.1 Editar .env en tu PC

En tu PC, navega a:
```
d:\Trabajo\Proyectos\MagicAI PROPIO\backend
```

Edita el archivo `.env`:

```env
NODE_ENV=development
PORT=3000

# Conexión a PostgreSQL en VPS
DATABASE_URL="postgresql://postgres:TU_PASSWORD@IP_DE_TU_VPS:5432/ai_platform?schema=public"

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_EXPIRES_IN=24h

# OpenAI
OPENAI_API_KEY=sk-your-openai-api-key

# Gemini
GEMINI_API_KEY=your-gemini-api-key

# CORS
CORS_ORIGIN=http://localhost:3001

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

⚠️ **Reemplazar:**
- `TU_PASSWORD` - La contraseña que pusiste en el VPS
- `IP_DE_TU_VPS` - La IP pública de tu VPS
- Las API keys de OpenAI y Gemini

---

## 🚀 Paso 6: Ejecutar Migraciones desde tu PC

### 6.1 Instalar dependencias (si no lo hiciste)

```powershell
cd "d:\Trabajo\Proyectos\MagicAI PROPIO\backend"
npm install
```

### 6.2 Generar Prisma Client

```powershell
npm run prisma:generate
```

### 6.3 Ejecutar migraciones

```powershell
npm run prisma:migrate
```

Si te pregunta por el nombre de la migración, escribe: `init`

### 6.4 Poblar base de datos

```powershell
npm run prisma:seed
```

Esto creará:
- Usuario admin: `admin@magicai.com` / `admin123`
- Categorías de ejemplo
- Agentes de ejemplo

---

## ▶️ Paso 7: Ejecutar Backend en tu PC

```powershell
npm run dev
```

Deberías ver:

```
✅ Database connected successfully
🚀 Server running on port 3000
📝 Environment: development
🔗 Health check: http://localhost:3000/health
```

---

## ✅ Paso 8: Verificar Conexión

### 8.1 Health Check

En tu navegador o con curl:

```powershell
curl http://localhost:3000/health
```

Deberías ver:
```json
{"status":"ok","timestamp":"2026-01-09T..."}
```

### 8.2 Probar Login

```powershell
curl -X POST http://localhost:3000/api/auth/login `
  -H "Content-Type: application/json" `
  -d '{\"email\":\"admin@magicai.com\",\"password\":\"admin123\"}'
```

Deberías recibir un token JWT.

---

## 🔧 Comandos Útiles

### En el VPS

```bash
# Ver logs de PostgreSQL
cd ~/postgres-magicai
docker-compose logs -f postgres

# Reiniciar PostgreSQL
docker-compose restart

# Detener PostgreSQL
docker-compose down

# Iniciar PostgreSQL
docker-compose up -d

# Backup de base de datos
docker-compose exec postgres pg_dump -U postgres ai_platform > backup.sql

# Restaurar backup
docker-compose exec -T postgres psql -U postgres ai_platform < backup.sql

# Conectarse a PostgreSQL (para debugging)
docker-compose exec postgres psql -U postgres -d ai_platform
```

### En tu PC

```powershell
# Ver estado de la base de datos con Prisma Studio
npm run prisma:studio
```

Esto abrirá una interfaz web en `http://localhost:5555` donde puedes ver y editar datos.

---

## 🐛 Troubleshooting

### Error: "Can't reach database server"

**Problema:** No se puede conectar a PostgreSQL en el VPS.

**Soluciones:**

1. **Verificar que PostgreSQL esté corriendo en el VPS:**
   ```bash
   docker-compose ps
   ```

2. **Verificar firewall:**
   ```bash
   sudo ufw status
   ```
   Debe aparecer la regla para el puerto 5432.

3. **Verificar que PostgreSQL escucha en todas las interfaces:**
   Por defecto Docker ya lo configura así, pero puedes verificar:
   ```bash
   docker-compose exec postgres psql -U postgres -c "SHOW listen_addresses;"
   ```
   Debe mostrar `*` o `0.0.0.0`

4. **Probar conexión desde tu PC:**
   ```powershell
   # Instalar psql en Windows (opcional)
   # O usar telnet para probar el puerto
   Test-NetConnection -ComputerName IP_DE_TU_VPS -Port 5432
   ```

### Error: "password authentication failed"

**Problema:** Contraseña incorrecta.

**Solución:**
- Verifica que la contraseña en `.env` de tu PC coincida con la del VPS
- Verifica que no haya espacios extra en el DATABASE_URL

### PostgreSQL usa mucha memoria

**Solución:** Limitar recursos en docker-compose.yml:

```yaml
services:
  postgres:
    # ... resto de la configuración
    deploy:
      resources:
        limits:
          memory: 512M
```

Luego:
```bash
docker-compose down
docker-compose up -d
```

---

## 🔒 Seguridad Adicional

### 1. Usar túnel SSH (Más seguro)

En lugar de exponer PostgreSQL directamente, puedes usar un túnel SSH:

**En tu PC (PowerShell):**

```powershell
ssh -L 5432:localhost:5432 user@IP_DE_TU_VPS -N
```

Luego en `.env`:
```env
DATABASE_URL="postgresql://postgres:PASSWORD@localhost:5432/ai_platform?schema=public"
```

Y **NO** necesitas abrir el puerto 5432 en el firewall del VPS.

### 2. Cambiar puerto de PostgreSQL

En `docker-compose.yml` del VPS:

```yaml
ports:
  - "54320:5432"  # Puerto externo diferente
```

Luego en `.env` de tu PC:
```env
DATABASE_URL="postgresql://postgres:PASSWORD@IP_VPS:54320/ai_platform?schema=public"
```

---

## 📊 Monitoreo

### Ver conexiones activas

En el VPS:

```bash
docker-compose exec postgres psql -U postgres -d ai_platform -c "SELECT * FROM pg_stat_activity;"
```

### Ver tamaño de la base de datos

```bash
docker-compose exec postgres psql -U postgres -d ai_platform -c "SELECT pg_size_pretty(pg_database_size('ai_platform'));"
```

---

## 🎉 ¡Listo!

Ahora tienes:

✅ PostgreSQL corriendo en tu VPS
✅ Backend corriendo en tu PC local
✅ Conexión funcionando entre ambos
✅ Base de datos poblada con datos iniciales

**Próximos pasos:**
1. Desarrollar el frontend
2. Cuando esté listo para producción, subir también el backend al VPS
3. Configurar backups automáticos de la base de datos

---

## 📝 Notas Importantes

1. **Backups:** Configura backups automáticos de PostgreSQL regularmente
2. **Contraseñas:** Usa contraseñas fuertes y guárdalas en un gestor de contraseñas
3. **Firewall:** Mantén el firewall activo y solo permite las IPs necesarias
4. **Actualizaciones:** Mantén PostgreSQL actualizado
5. **Logs:** Revisa los logs regularmente para detectar problemas

---

## 🔄 Migrar a Producción (Futuro)

Cuando quieras subir también el backend al VPS:

1. Cerrar el puerto 5432 en el firewall (ya no será necesario)
2. Modificar docker-compose.yml para incluir el backend
3. Backend y PostgreSQL se comunicarán por la red interna de Docker
4. Configurar Nginx como reverse proxy
5. Configurar SSL con Let's Encrypt

Ver guía completa: [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
