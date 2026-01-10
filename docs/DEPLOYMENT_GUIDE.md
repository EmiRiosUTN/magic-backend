# Guía de Deployment - Ubuntu VPS

Esta guía te llevará paso a paso para deployar el backend de MagicAI en un VPS con Ubuntu.

## 📋 Prerequisitos

- VPS con Ubuntu 20.04+ (mínimo 2GB RAM)
- Acceso SSH al servidor
- Dominio apuntando al VPS (opcional pero recomendado)
- API Keys de OpenAI y Gemini

---

## 🚀 Paso 1: Preparar el Servidor

### 1.1 Conectar al VPS

```bash
ssh root@your-vps-ip
# o
ssh your-user@your-vps-ip
```

### 1.2 Actualizar el sistema

```bash
sudo apt update && sudo apt upgrade -y
```

### 1.3 Instalar dependencias básicas

```bash
sudo apt install -y curl git ufw
```

### 1.4 Configurar firewall

```bash
# Permitir SSH
sudo ufw allow OpenSSH

# Permitir HTTP y HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Habilitar firewall
sudo ufw enable

# Verificar estado
sudo ufw status
```

---

## 🐳 Paso 2: Instalar Docker

### 2.1 Instalar Docker

```bash
# Descargar script de instalación
curl -fsSL https://get.docker.com -o get-docker.sh

# Ejecutar instalación
sudo sh get-docker.sh

# Agregar usuario al grupo docker
sudo usermod -aG docker $USER

# Aplicar cambios (o reiniciar sesión)
newgrp docker

# Verificar instalación
docker --version
```

### 2.2 Instalar Docker Compose

```bash
# Descargar Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

# Dar permisos de ejecución
sudo chmod +x /usr/local/bin/docker-compose

# Verificar instalación
docker-compose --version
```

---

## 📦 Paso 3: Subir el Código

### Opción A: Usando Git (Recomendado)

```bash
# Crear directorio
mkdir -p ~/apps
cd ~/apps

# Clonar repositorio
git clone https://github.com/your-username/magicai-backend.git
cd magicai-backend/backend
```

### Opción B: Usando SCP

Desde tu máquina local:

```bash
# Comprimir backend
cd "d:\Trabajo\Proyectos\MagicAI PROPIO"
tar -czf backend.tar.gz backend/

# Subir al VPS
scp backend.tar.gz user@your-vps-ip:~/

# En el VPS
cd ~
tar -xzf backend.tar.gz
cd backend
```

---

## ⚙️ Paso 4: Configurar Variables de Entorno

### 4.1 Crear archivo .env

```bash
cp .env.docker .env
nano .env
```

### 4.2 Configurar valores

```env
# Database
DB_NAME=ai_platform
DB_USER=postgres
DB_PASSWORD=TU_PASSWORD_SEGURA_AQUI  # ⚠️ Cambiar!
DB_PORT=5432

# Application
NODE_ENV=production
PORT=3000

# JWT
JWT_SECRET=GENERA_UN_SECRET_LARGO_Y_ALEATORIO_AQUI  # ⚠️ Cambiar!
JWT_EXPIRES_IN=24h

# OpenAI
OPENAI_API_KEY=sk-tu-api-key-de-openai  # ⚠️ Cambiar!

# Gemini
GEMINI_API_KEY=tu-api-key-de-gemini  # ⚠️ Cambiar!

# CORS
CORS_ORIGIN=https://tu-dominio.com  # ⚠️ Cambiar!

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

**Generar JWT Secret seguro:**

```bash
openssl rand -base64 64
```

Guardar con `Ctrl+O`, `Enter`, `Ctrl+X`

---

## 🏗️ Paso 5: Construir y Ejecutar

### 5.1 Construir imágenes Docker

```bash
docker-compose build
```

### 5.2 Iniciar PostgreSQL

```bash
docker-compose up -d postgres

# Esperar a que esté listo
docker-compose logs -f postgres
# Presionar Ctrl+C cuando veas "database system is ready to accept connections"
```

### 5.3 Ejecutar migraciones

```bash
docker-compose run --rm backend npx prisma migrate deploy
```

### 5.4 Poblar base de datos

```bash
docker-compose run --rm backend npm run prisma:seed
```

Esto creará:
- Usuario admin: `admin@magicai.com` / `admin123`
- Categorías de ejemplo
- Agentes de ejemplo

### 5.5 Iniciar todos los servicios

```bash
docker-compose up -d
```

### 5.6 Verificar que todo funciona

```bash
# Ver logs
docker-compose logs -f backend

# Verificar contenedores
docker-compose ps

# Health check
curl http://localhost:3000/health
```

Deberías ver:
```json
{"status":"ok","timestamp":"2026-01-09T..."}
```

---

## 🌐 Paso 6: Configurar Nginx (Reverse Proxy)

### 6.1 Instalar Nginx

```bash
sudo apt install -y nginx
```

### 6.2 Crear configuración

```bash
sudo nano /etc/nginx/sites-available/magicai
```

Pegar:

```nginx
server {
    listen 80;
    server_name tu-dominio.com www.tu-dominio.com;  # ⚠️ Cambiar!

    # Logs
    access_log /var/log/nginx/magicai-access.log;
    error_log /var/log/nginx/magicai-error.log;

    # Proxy settings
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

### 6.3 Habilitar sitio

```bash
# Crear symlink
sudo ln -s /etc/nginx/sites-available/magicai /etc/nginx/sites-enabled/

# Eliminar default si existe
sudo rm /etc/nginx/sites-enabled/default

# Verificar configuración
sudo nginx -t

# Reiniciar Nginx
sudo systemctl restart nginx
```

---

## 🔒 Paso 7: Configurar SSL con Let's Encrypt

### 7.1 Instalar Certbot

```bash
sudo apt install -y certbot python3-certbot-nginx
```

### 7.2 Obtener certificado

```bash
sudo certbot --nginx -d tu-dominio.com -d www.tu-dominio.com
```

Seguir las instrucciones:
1. Ingresar email
2. Aceptar términos
3. Elegir si compartir email (opcional)
4. Elegir opción 2 (redirect HTTP a HTTPS)

### 7.3 Verificar auto-renovación

```bash
sudo certbot renew --dry-run
```

---

## 🔄 Paso 8: Configurar Auto-inicio

### 8.1 Crear servicio systemd (opcional)

Si quieres que Docker Compose inicie automáticamente:

```bash
sudo nano /etc/systemd/system/magicai.service
```

Pegar:

```ini
[Unit]
Description=MagicAI Backend
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/home/your-user/apps/magicai-backend/backend
ExecStart=/usr/local/bin/docker-compose up -d
ExecStop=/usr/local/bin/docker-compose down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
```

Habilitar:

```bash
sudo systemctl enable magicai
sudo systemctl start magicai
```

---

## ✅ Paso 9: Verificación Final

### 9.1 Probar endpoints

```bash
# Health check
curl https://tu-dominio.com/health

# Login (debería devolver token)
curl -X POST https://tu-dominio.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@magicai.com","password":"admin123"}'
```

### 9.2 Verificar logs

```bash
# Logs de backend
docker-compose logs -f backend

# Logs de PostgreSQL
docker-compose logs -f postgres

# Logs de Nginx
sudo tail -f /var/log/nginx/magicai-access.log
sudo tail -f /var/log/nginx/magicai-error.log
```

---

## 🔧 Comandos de Mantenimiento

### Ver estado de servicios

```bash
docker-compose ps
```

### Ver logs

```bash
# Todos los servicios
docker-compose logs -f

# Solo backend
docker-compose logs -f backend

# Últimas 100 líneas
docker-compose logs --tail=100 backend
```

### Reiniciar servicios

```bash
# Reiniciar todo
docker-compose restart

# Solo backend
docker-compose restart backend
```

### Actualizar código

```bash
# Detener servicios
docker-compose down

# Actualizar código (si usas Git)
git pull

# Reconstruir
docker-compose build

# Ejecutar migraciones si hay
docker-compose run --rm backend npx prisma migrate deploy

# Iniciar
docker-compose up -d
```

### Backup de base de datos

```bash
# Crear backup
docker-compose exec postgres pg_dump -U postgres ai_platform > backup_$(date +%Y%m%d_%H%M%S).sql

# Restaurar backup
docker-compose exec -T postgres psql -U postgres ai_platform < backup_20260109.sql
```

### Limpiar Docker

```bash
# Eliminar contenedores detenidos
docker container prune

# Eliminar imágenes sin usar
docker image prune

# Eliminar todo lo no usado
docker system prune -a
```

---

## 🐛 Troubleshooting

### Error: Puerto 3000 ya en uso

```bash
# Ver qué está usando el puerto
sudo lsof -i :3000

# Matar proceso
sudo kill -9 PID
```

### Error: No se puede conectar a PostgreSQL

```bash
# Verificar que PostgreSQL esté corriendo
docker-compose ps postgres

# Ver logs
docker-compose logs postgres

# Reiniciar
docker-compose restart postgres
```

### Error: Migraciones fallan

```bash
# Resetear base de datos (⚠️ CUIDADO: borra datos)
docker-compose down -v
docker-compose up -d postgres
sleep 10
docker-compose run --rm backend npx prisma migrate deploy
docker-compose run --rm backend npm run prisma:seed
```

### Error 502 Bad Gateway en Nginx

```bash
# Verificar que backend esté corriendo
docker-compose ps backend

# Ver logs de backend
docker-compose logs backend

# Verificar configuración de Nginx
sudo nginx -t

# Reiniciar Nginx
sudo systemctl restart nginx
```

### Problemas de memoria

```bash
# Ver uso de recursos
docker stats

# Aumentar límites en docker-compose.yml
# Agregar bajo 'backend':
#   deploy:
#     resources:
#       limits:
#         memory: 1G
```

---

## 📊 Monitoreo

### Ver uso de recursos

```bash
# CPU y memoria de contenedores
docker stats

# Espacio en disco
df -h

# Logs de sistema
sudo journalctl -u docker -f
```

### Configurar alertas (opcional)

Instalar herramientas como:
- Prometheus + Grafana
- Netdata
- Uptime Kuma

---

## 🔐 Seguridad Adicional

### 1. Cambiar puerto SSH

```bash
sudo nano /etc/ssh/sshd_config
# Cambiar Port 22 a otro puerto
sudo systemctl restart sshd
```

### 2. Configurar Fail2Ban

```bash
sudo apt install -y fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### 3. Actualizar regularmente

```bash
# Sistema
sudo apt update && sudo apt upgrade -y

# Docker images
docker-compose pull
docker-compose up -d
```

---

## 📝 Checklist Post-Deployment

- [ ] Cambiar contraseña de admin
- [ ] Cambiar JWT_SECRET
- [ ] Configurar CORS_ORIGIN correcto
- [ ] Verificar que SSL funciona
- [ ] Configurar backups automáticos
- [ ] Configurar monitoreo
- [ ] Documentar credenciales en lugar seguro
- [ ] Probar todos los endpoints principales
- [ ] Configurar alertas de error
- [ ] Revisar logs regularmente

---

## 🎉 ¡Listo!

Tu backend de MagicAI está ahora deployado y corriendo en producción.

**URLs importantes:**
- API: `https://tu-dominio.com/api`
- Health: `https://tu-dominio.com/health`
- Documentación: Ver `docs/API_DOCUMENTATION.md`

**Próximos pasos:**
1. Desarrollar el frontend
2. Conectar frontend con este backend
3. Crear más agentes personalizados
4. Implementar sistema de suscripciones
5. Agregar analytics
