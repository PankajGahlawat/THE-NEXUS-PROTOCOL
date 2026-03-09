# 🚀 NexusBank - Quick Start Guide

## ⚡ Fastest Way to Start

### Windows
```bash
start-windows.bat
```

### Linux/Mac
```bash
chmod +x start.sh
./start.sh
```

## 🌐 Access the Applications

Once all servers are running, open these URLs in your browser:

| Branch | URL | Login |
|--------|-----|-------|
| 🏦 Branch A (Andheri) | http://localhost:5173 | alice / password |
| 🏦 Branch B (Bandra) | http://localhost:5174 | priya / priya123 |
| 🏦 Branch C (Colaba) | http://localhost:5175 | kavya / kavya123 |

## 🔑 Quick Login Credentials

### Branch A - Andheri
- **Customer**: alice / password
- **Admin**: admin / admin123

### Branch B - Bandra
- **Customer**: priya / priya123
- **Admin**: admin / admin@bandra

### Branch C - Colaba
- **Customer**: kavya / kavya123
- **Admin**: admin / admin (⚠️ default credentials!)

## 🛠️ Manual Setup (If Scripts Don't Work)

### Step 1: Install Dependencies
```bash
# Branch A
cd branch-a/backend && npm install
cd ../frontend && npm install
cd ../..

# Branch B
cd branch-b/backend && npm install
cd ../frontend && npm install
cd ../..

# Branch C
cd branch-c/backend && npm install
cd ../frontend && npm install
cd ../..
```

### Step 2: Start Servers (Open 6 Terminals)

**Terminal 1 - Branch A Backend:**
```bash
cd branch-a/backend
node server.js
```

**Terminal 2 - Branch B Backend:**
```bash
cd branch-b/backend
node server.js
```

**Terminal 3 - Branch C Backend:**
```bash
cd branch-c/backend
node server.js
```

**Terminal 4 - Branch A Frontend:**
```bash
cd branch-a/frontend
npm run dev
```

**Terminal 5 - Branch B Frontend:**
```bash
cd branch-b/frontend
npm run dev
```

**Terminal 6 - Branch C Frontend:**
```bash
cd branch-c/frontend
npm run dev
```

## 🔍 Verify Setup

Run the verification script:
```bash
node verify-setup.js
```

## ❌ Troubleshooting

### Port Already in Use
```bash
# Kill all ports
npx kill-port 3001 3002 3003 5173 5174 5175
```

### npm install fails
```bash
npm install --legacy-peer-deps
```

### SQLite build error (Windows)
```bash
npm install --build-from-source
```

### Can't find node/npm
Make sure Node.js is installed:
- Download from: https://nodejs.org/
- Verify: `node --version` and `npm --version`

## 📚 More Information

- **Full Documentation**: See `README.md`
- **Improvements Made**: See `IMPROVEMENTS.md`
- **Setup Instructions**: See `SETUP_INSTRUCTIONS.txt`

## 🎯 What to Do After Starting

1. Open all three branch URLs in different browser tabs
2. Try logging in with the credentials above
3. Explore the different features in each branch
4. Look for security vulnerabilities (this is a training app!)

## 🔐 Security Note

This application contains intentional security vulnerabilities for educational purposes. Do NOT use this code in production!

## 💡 Tips

- Use different browser profiles or incognito windows for each branch
- Check the browser console for errors
- Look at Network tab to see API calls
- Inspect cookies and local storage
- Try different user roles (customer vs admin)

---

**Need Help?** Check the full README.md or IMPROVEMENTS.md for detailed information.
