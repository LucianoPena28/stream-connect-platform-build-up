# Stream Connect — Oracle Cloud Deployment Guide

## Architecture

```
┌────────────────────┐       ┌─────────────────────┐       ┌──────────────┐
│   Browser (SPA)    │──────▶│  Nginx (port 80/443) │──────▶│ Express API  │
│   dist/ folder     │       │  serves static files │       │ (port 3001)  │
└────────────────────┘       │  proxies /api → 3001 │       │ ↕ MySQL      │
                             └─────────────────────┘       └──────────────┘
```

## Step 1: Prepare Oracle Cloud Instance

1. SSH into your Oracle Cloud compute instance
2. Install Node.js 20+, Nginx, and MySQL client (if not already installed)

```bash
# Ubuntu/Oracle Linux
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs nginx
```

## Step 2: Set Up MySQL Schema

Run the schema file against your Oracle MySQL database:

```bash
mysql -h YOUR_MYSQL_HOST -u YOUR_USER -p YOUR_DATABASE < server/schema.sql
```

## Step 3: Clone & Build

```bash
git clone YOUR_REPO_URL /opt/stream-connect
cd /opt/stream-connect

# Create frontend .env
echo 'VITE_API_URL=https://streamconnect.online/api' > .env

# Build frontend
npm install
npm run build
# Output → dist/

# Set up backend
cd server
cp ../.env.example .env
# Edit .env with your Oracle MySQL credentials and secrets
nano .env
npm install
```

## Step 4: Create Backend Service

```bash
sudo tee /etc/systemd/system/stream-connect-api.service > /dev/null <<EOF
[Unit]
Description=Stream Connect API
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/opt/stream-connect/server
ExecStart=/usr/bin/node index.js
Restart=on-failure
EnvironmentFile=/opt/stream-connect/server/.env

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable stream-connect-api
sudo systemctl start stream-connect-api
```

## Step 5: Configure Nginx

```bash
sudo tee /etc/nginx/sites-available/streamconnect > /dev/null <<'EOF'
server {
    listen 80;
    server_name streamconnect.online www.streamconnect.online;

    # Serve frontend static files
    root /opt/stream-connect/dist;
    index index.html;

    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy API requests to Express
    location /api/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

sudo ln -sf /etc/nginx/sites-available/streamconnect /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

## Step 6: SSL with Let's Encrypt

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d streamconnect.online -d www.streamconnect.online
```

## Step 7: DNS (GoDaddy)

Point your domain:
| Type | Name | Value |
|------|------|-------|
| A | @ | YOUR_ORACLE_CLOUD_PUBLIC_IP |
| A | www | YOUR_ORACLE_CLOUD_PUBLIC_IP |

## Step 8: Create First Admin User

```bash
cd /opt/stream-connect/server
node -e "
const bcrypt = require('bcryptjs');
const { v4: uuid } = require('uuid');
(async () => {
  const hash = await bcrypt.hash('YOUR_ADMIN_PASSWORD', 12);
  const userId = uuid();
  console.log(\`INSERT INTO users (id, email, password_hash, full_name) VALUES ('\${userId}', 'luciano.pena@streamconnect.online', '\${hash}', 'Luciano Peña');\`);
  console.log(\`INSERT INTO profiles (id, user_id, full_name, email) VALUES ('\${uuid()}', '\${userId}', 'Luciano Peña', 'luciano.pena@streamconnect.online');\`);
  console.log(\`INSERT INTO user_roles (id, user_id, role) VALUES ('\${uuid()}', '\${userId}', 'admin');\`);
})();
" | mysql -h YOUR_MYSQL_HOST -u YOUR_USER -p YOUR_DATABASE
```

## Environment Variables Summary

### Frontend (.env in project root)
| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Full URL to your API (e.g., `https://streamconnect.online/api`) |

### Backend (server/.env)
| Variable | Description |
|----------|-------------|
| `DB_HOST` | Oracle MySQL hostname |
| `DB_PORT` | MySQL port (default 3306) |
| `DB_USER` | MySQL username |
| `DB_PASSWORD` | MySQL password |
| `DB_NAME` | MySQL database name |
| `JWT_SECRET` | Random 64+ character hex string |
| `TOTP_ENCRYPTION_KEY` | Random 32+ character hex string |
| `PORT` | API server port (default 3001) |
| `CORS_ORIGIN` | Frontend domain for CORS |

## Files That Perform Database Reads/Writes

| File | Purpose |
|------|---------|
| `src/lib/api.ts` | Frontend API client — ALL backend calls go through here |
| `server/db.js` | MySQL connection pool |
| `server/routes/auth.js` | Login, register, password, TOTP |
| `server/routes/profiles.js` | User profile CRUD |
| `server/routes/orders.js` | Order management |
| `server/routes/customers.js` | Customer listing |
| `server/routes/tickets.js` | Support tickets + contact form |
| `server/routes/employees.js` | Employee/role management |
| `server/routes/settings.js` | App settings |
| `server/routes/dashboard.js` | Admin dashboard stats |
| `server/routes/subscriptions.js` | User subscriptions |
| `server/routes/chat.js` | AI chat (placeholder) |

## Build Commands

```bash
# Frontend
npm run build          # outputs to dist/

# Backend
cd server && npm start # runs Express on PORT
```

## Folder to Serve from Nginx

```
/opt/stream-connect/dist/
```
