#!/bin/bash
# Nexus Protocol - Portable Package Creator
# Creates a complete offline installation package

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║                                                               ║"
echo "║   ███╗   ██╗███████╗██╗  ██╗██╗   ██╗███████╗                ║"
echo "║   ████╗  ██║██╔════╝╚██╗██╔╝██║   ██║██╔════╝                ║"
echo "║   ██╔██╗ ██║█████╗   ╚███╔╝ ██║   ██║███████╗                ║"
echo "║   ██║╚██╗██║██╔══╝   ██╔██╗ ██║   ██║╚════██║                ║"
echo "║   ██║ ╚████║███████╗██╔╝ ██╗╚██████╔╝███████║                ║"
echo "║   ╚═╝  ╚═══╝╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝                ║"
echo "║                                                               ║"
echo "║           PORTABLE PACKAGE CREATOR                           ║"
echo "║                                                               ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo

PACKAGE_NAME="nexus-protocol-portable"
PACKAGE_DIR="$PACKAGE_NAME"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

echo "📦 Creating portable package: $PACKAGE_NAME"
echo "🕒 Timestamp: $TIMESTAMP"
echo

# Create package directory
if [ -d "$PACKAGE_DIR" ]; then
    echo "🧹 Cleaning existing package directory..."
    rm -rf "$PACKAGE_DIR"
fi

mkdir -p "$PACKAGE_DIR"
echo "✅ Created package directory: $PACKAGE_DIR"

# Copy source code (excluding node_modules and build artifacts)
echo
echo "📁 Copying source code..."

# Copy backend (excluding node_modules)
echo "  📡 Copying backend..."
cp -r backend "$PACKAGE_DIR/"
rm -rf "$PACKAGE_DIR/backend/node_modules"
echo "  ✅ Backend copied"

# Copy frontend (excluding node_modules and dist)
echo "  🎮 Copying frontend..."
cp -r frontend "$PACKAGE_DIR/"
rm -rf "$PACKAGE_DIR/frontend/node_modules"
rm -rf "$PACKAGE_DIR/frontend/dist"
echo "  ✅ Frontend copied"

# Copy documentation
echo "  📚 Copying documentation..."
cp -r docs "$PACKAGE_DIR/"
echo "  ✅ Documentation copied"

# Copy assets
echo "  🎨 Copying assets..."
cp -r assets "$PACKAGE_DIR/"
echo "  ✅ Assets copied"

# Copy prototypes
echo "  🔬 Copying prototypes..."
cp -r prototypes "$PACKAGE_DIR/"
echo "  ✅ Prototypes copied"

# Copy root files
echo "  📄 Copying root files..."
cp README.md "$PACKAGE_DIR/"
cp NEXUS_PROTOCOL_MASTER_DOCUMENTATION.md "$PACKAGE_DIR/"
cp PROJECT_STATUS.md "$PACKAGE_DIR/"
cp LAN_SETUP_GUIDE.md "$PACKAGE_DIR/"
cp WORKSPACE_UPGRADE_SUMMARY.md "$PACKAGE_DIR/"
cp requirements.txt "$PACKAGE_DIR/"
cp nexus_monitor_server.py "$PACKAGE_DIR/"
cp nexus_protocol.db "$PACKAGE_DIR/" 2>/dev/null || true
echo "  ✅ Root files copied"

# Copy installation and startup scripts
echo "  🚀 Copying scripts..."
cp install.bat "$PACKAGE_DIR/"
cp install.sh "$PACKAGE_DIR/"
cp start-all.bat "$PACKAGE_DIR/"
cp start-client.bat "$PACKAGE_DIR/"
cp start-server.bat "$PACKAGE_DIR/"
cp network-test.bat "$PACKAGE_DIR/"
echo "  ✅ Scripts copied"

echo
echo "📦 Downloading dependencies for offline installation..."

# Create offline npm cache for backend
echo "  📡 Caching backend dependencies..."
cd backend
npm ci --cache "../$PACKAGE_DIR/npm-cache" --prefer-offline
cd ..
echo "  ✅ Backend dependencies cached"

# Create offline npm cache for frontend
echo "  🎮 Caching frontend dependencies..."
cd frontend
npm ci --cache "../$PACKAGE_DIR/npm-cache" --prefer-offline
cd ..
echo "  ✅ Frontend dependencies cached"

echo
echo "📝 Creating offline installation scripts..."

# Create offline installer for Windows
cat > "$PACKAGE_DIR/install-offline.bat" << 'WINEOF'
@echo off
REM Nexus Protocol - Offline Installation Script

echo ╔═══════════════════════════════════════════════════════════════╗
echo ║              NEXUS PROTOCOL OFFLINE INSTALLER                ║
echo ╚═══════════════════════════════════════════════════════════════╝
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js is not installed. Please install Node.js 18+ first.
    echo    Visit: https://nodejs.org/
    pause
    exit /b 1
)

echo ✅ Node.js detected
node -v
echo.

REM Install backend dependencies from cache
echo 📦 Installing backend dependencies from offline cache...
cd backend
call npm ci --cache ..\npm-cache --prefer-offline --no-audit
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Failed to install backend dependencies
    pause
    exit /b 1
)
echo ✅ Backend dependencies installed successfully

REM Create environment file for backend
if not exist .env (
    echo 🔧 Creating backend environment configuration...
    copy .env.example .env
    echo ✅ Backend .env file created
)
cd ..

REM Install frontend dependencies from cache
echo 📦 Installing frontend dependencies from offline cache...
cd frontend
call npm ci --cache ..\npm-cache --prefer-offline --no-audit
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Failed to install frontend dependencies
    pause
    exit /b 1
)
echo ✅ Frontend dependencies installed successfully
cd ..

echo 🎯 Offline Installation Complete!
echo.
echo ╔═══════════════════════════════════════════════════════════════╗
echo ║                    QUICK START GUIDE                          ║
echo ╠═══════════════════════════════════════════════════════════════╣
echo ║  1. Start the complete system: start-all.bat                 ║
echo ║  2. Access: http://localhost:5173                             ║
echo ║  3. Demo: Team=Ghost, Code=1234                               ║
echo ╚═══════════════════════════════════════════════════════════════╝
pause
WINEOF

# Create Linux/Mac offline installer
cat > "$PACKAGE_DIR/install-offline.sh" << 'EOF'
#!/bin/bash
# Nexus Protocol - Offline Installation Script

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║              NEXUS PROTOCOL OFFLINE INSTALLER                ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    echo "   Visit: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js detected"
node -v
echo

# Install backend dependencies from cache
echo "📦 Installing backend dependencies from offline cache..."
cd backend
npm ci --cache ../npm-cache --prefer-offline --no-audit
if [ $? -ne 0 ]; then
    echo "❌ Failed to install backend dependencies"
    exit 1
fi
echo "✅ Backend dependencies installed successfully"

# Create environment file for backend
if [ ! -f .env ]; then
    echo "🔧 Creating backend environment configuration..."
    cp .env.example .env
    echo "✅ Backend .env file created"
fi
cd ..

# Install frontend dependencies from cache
echo "📦 Installing frontend dependencies from offline cache..."
cd frontend
npm ci --cache ../npm-cache --prefer-offline --no-audit
if [ $? -ne 0 ]; then
    echo "❌ Failed to install frontend dependencies"
    exit 1
fi
echo "✅ Frontend dependencies installed successfully"
cd ..

echo "🎯 Offline Installation Complete!"
echo
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║                    QUICK START GUIDE                          ║"
echo "╠═══════════════════════════════════════════════════════════════╣"
echo "║  1. Start: ./start-all.sh                                     ║"
echo "║  2. Access: http://localhost:5173                             ║"
echo "║  3. Demo: Team=Ghost, Code=1234                               ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
EOF

chmod +x "$PACKAGE_DIR/install-offline.sh"
echo "  ✅ Offline installation scripts created"

echo
echo "📋 Creating README for portable package..."# C
reate comprehensive README for the portable package
cat > "$PACKAGE_DIR/PORTABLE_README.md" << 'EOF'
# Nexus Protocol - Portable Installation Package

**Version**: 1.0.0 | **Package Date**: $(date) | **Status**: Production Ready

This is a complete offline installation package for the Nexus Protocol cyber-heist simulation game.
All dependencies are included for installation without internet access.

## 🎯 What's Included

✅ **Complete Source Code** - Frontend & Backend applications
✅ **Offline Dependencies** - All npm packages cached locally
✅ **Documentation** - Complete project documentation
✅ **Installation Scripts** - Automated setup for Windows/Linux/Mac
✅ **Startup Scripts** - Easy launch scripts for all platforms
✅ **Assets & Prototypes** - All game assets and prototype files

## 🚀 Quick Installation

### Prerequisites
- **Node.js 18+** - Download from https://nodejs.org/
- **npm** - Included with Node.js

### Windows Installation
```bash
# 1. Extract this package to your desired location
# 2. Run the offline installer
install-offline.bat

# 3. Start the complete system
start-all.bat
```

### Linux/Mac Installation
```bash
# 1. Extract this package to your desired location
# 2. Make scripts executable and run installer
chmod +x install-offline.sh
./install-offline.sh

# 3. Start the complete system
chmod +x start-all.sh
./start-all.sh
```

## 🌐 Access Points

After installation and startup:

- **Game Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **Monitor Server**: http://localhost:8000

## 🎮 Demo Credentials

- **Team Name**: Ghost
- **Access Code**: 1234

## 📁 Package Structure

```
nexus-protocol-portable/
├── backend/                 # Backend Node.js application
├── frontend/                # Frontend React application
├── docs/                    # Complete documentation
├── assets/                  # Game assets and images
├── prototypes/              # HTML/CSS/JS prototypes
├── npm-cache/               # Offline npm dependencies
├── install-offline.bat      # Windows offline installer
├── install-offline.sh       # Linux/Mac offline installer
├── start-all.bat           # Windows startup script
├── start-all.sh            # Linux/Mac startup script
└── PORTABLE_README.md       # This file
```

## 🔧 Troubleshooting

### Common Issues

**Node.js Not Found**
- Install Node.js 18+ from https://nodejs.org/
- Restart your terminal/command prompt

**Port Already in Use**
- Close any applications using ports 3000, 5173, or 8000
- Or modify the port configuration in the respective config files

**Installation Fails**
- Ensure you have write permissions in the installation directory
- Try running the installer as administrator (Windows) or with sudo (Linux/Mac)

### Network Setup

For LAN multiplayer setup, see `LAN_SETUP_GUIDE.md` for detailed instructions.

## 📚 Documentation

Complete documentation is available in the `docs/` directory:

- `README.md` - Main project documentation
- `docs/01_COMPLETE_PROJECT_GUIDE.md` - Comprehensive project guide
- `docs/02_TECHNICAL_IMPLEMENTATION.md` - Technical implementation details
- `docs/06_API_REFERENCE.md` - API documentation
- `LAN_SETUP_GUIDE.md` - Network setup instructions

## 🎯 Game Features

- **Three Agent Roles**: Hacker, Infiltrator, Analyst
- **Multiple Mission Types**: False Flag, Biometric Bluff, Core Extraction
- **Real-time Multiplayer**: WebSocket-based live updates
- **Performance Scoring**: S-RANK to F-RANK classification
- **Cyberpunk UI**: Arcane-inspired visual design
- **Mission Phases**: 3-phase mission structure with time limits

-------

**The Protocol is watching. Every action is logged.**
EOF

echo "  ✅ Portable README created"

echo
echo "🗜️ Creating compressed archive..."

# Create a compressed archive
if command -v zip &> /dev/null; then
    zip -r "${PACKAGE_NAME}_${TIMESTAMP}.zip" "$PACKAGE_DIR"
    echo "✅ Compressed archive created: ${PACKAGE_NAME}_${TIMESTAMP}.zip"
elif command -v tar &> /dev/null; then
    tar -czf "${PACKAGE_NAME}_${TIMESTAMP}.tar.gz" "$PACKAGE_DIR"
    echo "✅ Compressed archive created: ${PACKAGE_NAME}_${TIMESTAMP}.tar.gz"
else
    echo "⚠️  No compression tool found, archive folder is ready: $PACKAGE_DIR"
fi

echo
echo "📊 Package Summary:"
echo "  📁 Package Directory: $PACKAGE_DIR"
echo "  🕒 Created: $TIMESTAMP"

# Calculate package size
PACKAGE_SIZE=$(du -sh "$PACKAGE_DIR" | cut -f1)
echo "  📏 Package Size: $PACKAGE_SIZE"

echo
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║                    PACKAGE CREATED SUCCESSFULLY               ║"
echo "╠═══════════════════════════════════════════════════════════════╣"
echo "║                                                               ║"
echo "║  📦 Your portable Nexus Protocol package is ready!           ║"
echo "║                                                               ║"
echo "║  📁 Folder: $PACKAGE_DIR                                      ║"
echo "║  🗜️ Archive: ${PACKAGE_NAME}_${TIMESTAMP}.*                   ║"
echo "║                                                               ║"
echo "║  🚀 To install on any PC:                                    ║"
echo "║     1. Copy the folder or extract the archive                ║"
echo "║     2. Run install-offline.bat (Windows)                     ║"
echo "║        or install-offline.sh (Linux/Mac)                     ║"
echo "║     3. Run start-all.bat to launch the game                  ║"
echo "║                                                               ║"
echo "║  🌐 Access: http://localhost:5173                             ║"
echo "║  🎮 Demo: Team=Ghost, Code=1234                               ║"
echo "║                                                               ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo
echo "🎯 The portable package includes everything needed for offline installation!"
echo