# Orelis Hub — AWS Server Setup Guide

## Prerequisites
- Ubuntu 22.04 EC2 instance (t3.small or larger recommended)
- Node.js 18+ installed
- Domain name (optional but recommended for HTTPS)

---

## Step 1 — Install Node.js on EC2

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
node -v   # should print v20.x.x
```

---

## Step 2 — Upload the project

From your local machine:
```bash
scp -r ./orelis-hub ubuntu@YOUR_EC2_IP:/home/ubuntu/orelis-hub
```

Or clone from your git repo:
```bash
git clone https://github.com/YOUR_ORG/orelis-hub.git
cd orelis-hub
```

---

## Step 3 — Install dependencies

```bash
cd /home/ubuntu/orelis-hub
npm install
```

This installs: `pdf-parse`, `bcryptjs`, `jose`, and all existing dependencies.

---

## Step 4 — Configure environment variables

```bash
cp .env.local.example .env.local   # or create from scratch
nano .env.local
```

Set these values:

```
GROQ_API_KEY=gsk_your_actual_groq_key_here

# Generate a secure random secret:
# node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET=paste_64_char_random_hex_here

# Where user data and uploaded docs are stored
DATA_DIR=/var/orelis/data

NODE_ENV=production
```

---

## Step 5 — Create the data directory

```bash
sudo mkdir -p /var/orelis/data/documents
sudo chown -R ubuntu:ubuntu /var/orelis/data
chmod 700 /var/orelis/data
```

This is where `users.json` and all extracted PDF text files live.

---

## Step 6 — Build the app

```bash
npm run build
```

---

## Step 7 — Run with PM2 (keeps app alive on reboot)

```bash
sudo npm install -g pm2
pm2 start "npm start" --name orelis-hub
pm2 startup    # follow the printed command to auto-start on reboot
pm2 save
```

Check it's running:
```bash
pm2 status
pm2 logs orelis-hub
```

App is now running on port 3000.

---

## Step 8 — Expose port 80/443 with Nginx (recommended)

```bash
sudo apt install nginx -y
sudo nano /etc/nginx/sites-available/orelis
```

Paste:
```nginx
server {
    listen 80;
    server_name YOUR_DOMAIN_OR_IP;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/orelis /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## Step 9 — HTTPS with Let's Encrypt (if you have a domain)

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d yourdomain.com
```

Certbot auto-renews. Done.

---

## Step 10 — EC2 Security Group

In AWS Console → EC2 → Security Groups, allow inbound:
- Port 22 (SSH) — your IP only
- Port 80 (HTTP) — 0.0.0.0/0
- Port 443 (HTTPS) — 0.0.0.0/0

---

## Data backup

User data is in `/var/orelis/data/`. Back it up regularly:

```bash
# Add to crontab: daily backup to S3
crontab -e
# Add this line:
0 2 * * * aws s3 sync /var/orelis/data s3://YOUR_BUCKET/orelis-backup/$(date +\%Y-\%m-\%d) --quiet
```

Or just use EBS snapshots via AWS Console.

---

## Upgrading to Postgres (optional, future)

All DB logic is in `lib/db.ts`. To swap to Postgres:
1. Install `pg` or `@prisma/client`
2. Replace the functions in `lib/db.ts` with SQL queries
3. No changes needed to any page or API routes — they all call the same functions

---

## Troubleshooting

**PDF extraction fails:**
```bash
# Make sure pdf-parse is installed
npm list pdf-parse
# If missing:
npm install pdf-parse
```

**Auth errors:**
- Check `JWT_SECRET` is set and at least 32 chars
- Clear browser cookies and try again

**Permission errors on /var/orelis/data:**
```bash
sudo chown -R ubuntu:ubuntu /var/orelis/data
```

**PM2 app crashing:**
```bash
pm2 logs orelis-hub --lines 50
```
