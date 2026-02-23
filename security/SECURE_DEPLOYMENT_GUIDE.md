# 🔒 NEXUS PROTOCOL - Secure Deployment Guide

## ⚡ Quick Start (5 Minutes)

### Step 1: Generate Secure Credentials
```bash
# Linux/Mac
chmod +x setup-security.sh
./setup-security.sh

# Windows
setup-security.bat
```

This creates a `.env` file with:
- 64-byte cryptographically secure JWT secret
- 32-byte secure database password
- Your CORS configuration

### Step 2: Verify Configuration
```bash
# Check .env was created
ls -la .env

# Verify it has secure permissions (Linux/Mac)
# Should show: -rw------- (600)
```

### Step 3: Deploy
```bash
docker-compose up -d
```

### Step 4: Verify Security
```bash
# Check logs for security validation
docker-compose logs backend | grep "✅"

# Should see:
# ✅ Database connection established
# ✅ Enhanced Game Engine initialized
# ✅ Security middleware initialized
```

---

## 🚨 CRITICAL: What Changed

### ❌ OLD (INSECURE):
```yaml
# docker-compose.yml
POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-changeme}  # BAD!
JWT_SECRET: ${JWT_SECRET:-weak-secret}             # BAD!
privileged: true                                    # DANGEROUS!
```

### ✅ NEW (SECURE):
```yaml
# docker-compose.yml
POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}  # Required from .env
JWT_SECRET: ${JWT_SECRET}                # Required from .env
cap_add: [SYS_ADMIN, NET_ADMIN]         # Specific capabilities only
```

**Result:** Server will NOT start without secure credentials!

---

## 🔐 Security Features Enabled

### 1. Mandatory Strong Credentials
- JWT secret must be 32+ characters
- Database password required
- No default fallbacks

### 2. Startup Validation
```javascript
// Server checks on startup:
✓ JWT_SECRET exists and is strong
✓ POSTGRES_PASSWORD is set
✓ CORS_ORIGIN is configured
```

### 3. Restricted CORS
```javascript
// Only explicitly allowed origins
CORS_ORIGIN=http://localhost:3000,https://yourdomain.com
```

### 4. Request Size Limits
```javascript
// Reduced from 10MB to 1MB
// Prevents DoS attacks
```

### 5. Security Headers
```http
Strict-Transport-Security: max-age=31536000
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Content-Security-Policy: default-src 'self'
```

---

## 📋 Pre-Deployment Checklist

### Required ✅
- [ ] Run `setup-security.sh` or `setup-security.bat`
- [ ] Verify `.env` file exists
- [ ] Check JWT_SECRET is 64+ characters
- [ ] Confirm POSTGRES_PASSWORD is set
- [ ] Review CORS_ORIGIN (only trusted domains)
- [ ] Verify no "changeme" in docker-compose.yml

### Recommended ✅
- [ ] Enable HTTPS with valid SSL certificate
- [ ] Configure firewall (allow only 80/443)
- [ ] Set up log monitoring
- [ ] Create backup procedures
- [ ] Document incident response plan
- [ ] Test disaster recovery

---

## 🧪 Security Testing

### Test 1: Startup Validation
```bash
# Remove .env file
rm .env

# Try to start (should fail)
docker-compose up -d

# Expected: Error about missing JWT_SECRET
```

### Test 2: CORS Protection
```bash
# Test blocked origin
curl -H "Origin: http://evil.com" \
     http://localhost:3001/health

# Expected: CORS error

# Test allowed origin
curl -H "Origin: http://localhost:3000" \
     http://localhost:3001/health

# Expected: Success (if in CORS_ORIGIN)
```

### Test 3: Request Size Limit
```bash
# Try to send large payload (>1MB)
dd if=/dev/zero bs=1M count=2 | \
  curl -X POST \
       -H "Content-Type: application/json" \
       -d @- \
       http://localhost:3001/api/test

# Expected: 413 Payload Too Large
```

---

## 🔧 Configuration Options

### Environment Variables (.env)

#### Required (Server won't start without these):
```bash
JWT_SECRET=<64-byte-hex-string>
POSTGRES_PASSWORD=<32-byte-hex-string>
```

#### Security Settings:
```bash
# CORS - comma-separated list of allowed origins
CORS_ORIGIN=http://localhost:3000,https://yourdomain.com

# Rate Limiting
RATE_LIMIT_WINDOW=60000  # 1 minute
RATE_LIMIT_MAX=100       # requests per window

# Request Size
MAX_REQUEST_SIZE=1mb     # Maximum request body size
```

#### Optional Overrides:
```bash
# Database
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_DB=nexus_protocol
POSTGRES_USER=nexus

# Server
NODE_ENV=production
BACKEND_PORT=3001
FRONTEND_PORT=3000
```

---

## 🚨 Troubleshooting

### Error: "JWT_SECRET environment variable is required"
**Solution:** Run `setup-security.sh` or create `.env` file manually

### Error: "CORS not configured"
**Solution:** Set `CORS_ORIGIN` in `.env` file
```bash
CORS_ORIGIN=http://localhost:3000
```

### Error: "JWT_SECRET must be at least 32 characters"
**Solution:** Generate a stronger secret:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Container keeps restarting
**Check logs:**
```bash
docker-compose logs backend
```

**Common causes:**
- Missing environment variables
- Database connection failed
- Invalid JWT_SECRET

---

## 📊 Security Monitoring

### Check Security Status
```bash
# View security-related logs
docker-compose logs backend | grep -i "security\|error\|warning"

# Check failed authentication attempts
docker-compose logs backend | grep "Authentication error"

# Monitor CORS rejections
docker-compose logs backend | grep "CORS: Rejected"
```

### Health Checks
```bash
# Backend health
curl http://localhost:3001/health

# Check security headers
curl -I http://localhost:3001/health | grep -i "security\|frame\|content"
```

---

## 🔄 Credential Rotation

### Rotate JWT Secret (Every 90 days recommended)
```bash
# 1. Generate new secret
NEW_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")

# 2. Update .env
sed -i "s/JWT_SECRET=.*/JWT_SECRET=$NEW_SECRET/" .env

# 3. Restart services
docker-compose restart backend

# 4. All users will need to re-authenticate
```

### Rotate Database Password
```bash
# 1. Generate new password
NEW_PASSWORD=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")

# 2. Update database
docker-compose exec postgres psql -U nexus -d nexus_protocol \
  -c "ALTER USER nexus WITH PASSWORD '$NEW_PASSWORD';"

# 3. Update .env
sed -i "s/POSTGRES_PASSWORD=.*/POSTGRES_PASSWORD=$NEW_PASSWORD/" .env

# 4. Restart services
docker-compose restart
```

---

## 📞 Security Contacts

**Security Issues:**
- Email: security@nexus-protocol.local
- Emergency: Use kill switch endpoint

**Documentation:**
- Security Audit: `SECURITY_AUDIT_REPORT.md`
- Fixes Applied: `SECURITY_FIXES_APPLIED.md`
- Operator Guide: `documentation/OPERATOR_GUIDE.md`

---

## ✅ Production Readiness

### Before Going Live:
1. ✅ Run security setup script
2. ✅ Enable HTTPS/TLS
3. ✅ Configure firewall
4. ✅ Set up monitoring
5. ✅ Test backup/recovery
6. ✅ Review all security settings
7. ✅ Conduct security audit
8. ✅ Train operators

### Ongoing:
- Monitor logs daily
- Rotate credentials quarterly
- Update dependencies monthly
- Security audit annually
- Incident response drills quarterly

---

**Last Updated:** February 23, 2026  
**Version:** 1.0 (Post-Security-Fixes)
