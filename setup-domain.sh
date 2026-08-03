#!/bin/bash
set -e

echo "=== BizForce domain setup for bizforce.online ==="

# 1. Build frontend for production
echo "[1/5] Building frontend production bundle..."
cd /home/ubuntu/crm/packages/frontend
npm run build 2>&1 | tail -3

# 2. Enable Apache modules
echo "[2/5] Enabling Apache modules..."
a2enmod proxy proxy_http proxy_wstunnel rewrite ssl headers

# 3. Create vhost
echo "[3/5] Creating vhost for bizforce.online..."
cat > /etc/apache2/sites-available/bizforce.conf <<'EOF'
<VirtualHost *:80>
    ServerName bizforce.online
    ServerAlias www.bizforce.online

    DocumentRoot /home/ubuntu/crm/packages/frontend/dist

    <Directory /home/ubuntu/crm/packages/frontend/dist>
        AllowOverride All
        Require all granted
        Options -Indexes
    </Directory>

    # SPA fallback
    RewriteEngine On
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule ^ /index.html [L]

    # API + uploads -> backend
    ProxyPreserveHost On
    ProxyPass /api http://localhost:3000/api
    ProxyPassReverse /api http://localhost:3000/api
    ProxyPass /uploads http://localhost:3000/uploads
    ProxyPassReverse /uploads http://localhost:3000/uploads

    ErrorLog ${APACHE_LOG_DIR}/bizforce-error.log
    CustomLog ${APACHE_LOG_DIR}/bizforce-access.log combined
</VirtualHost>
EOF

# 4. Activate site
echo "[4/5] Activating site..."
a2dissite 000-default.conf
a2ensite bizforce.conf
apache2ctl configtest
systemctl reload apache2

# 5. SSL via certbot
echo "[5/5] Installing certbot + SSL (requires DNS to point here)..."
which certbot || apt-get install -y certbot python3-certbot-apache
certbot --apache -d bizforce.online -d www.bizforce.online --non-interactive --agree-tos --redirect \
    -m admin@bizforce.online || echo "CERTBOT FAILED - ensure DNS A record points to 39.49.150.73 first"

echo ""
echo "=== Done ==="
echo "Access: https://bizforce.online"
