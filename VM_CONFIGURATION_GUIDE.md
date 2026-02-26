# VM Configuration Guide - Connect to NEXUS PROTOCOL

## 🎯 Overview

This guide explains how to configure VirtualBox VMs to connect to the NEXUS PROTOCOL website for SSH terminal access, mission gameplay, and scoring.

## 📋 Prerequisites

- VirtualBox installed (6.1+ recommended)
- Linux VM (Ubuntu 20.04/22.04, Debian, Kali Linux, etc.)
- NEXUS PROTOCOL backend running (SSH proxy on port 3002)
- Network connectivity between host and VM

## 🔧 VM Configuration Methods

### Method 1: Bridged Adapter (Recommended for LAN)

**Best for**: Multiple players on same network, production deployments

#### Step 1: Configure VM Network

1. Open VirtualBox
2. Select your VM → Settings → Network
3. Adapter 1:
   - Enable Network Adapter: ✓
   - Attached to: **Bridged Adapter**
   - Name: Select your physical network adapter (e.g., "Ethernet", "Wi-Fi")
   - Promiscuous Mode: Allow All
   - Cable Connected: ✓

4. Click OK

#### Step 2: Start VM and Get IP

```bash
# Start VM
VBoxManage startvm "Your-VM-Name" --type headless

# Or start with GUI
VBoxManage startvm "Your-VM-Name"

# Get VM IP address (run inside VM)
ip addr show
# Or
ifconfig

# Look for IP like: 192.168.1.100
```

#### Step 3: Configure SSH Server (Inside VM)

```bash
# Install SSH server
sudo apt update
sudo apt install openssh-server -y

# Enable and start SSH
sudo systemctl enable ssh
sudo systemctl start ssh

# Check status
sudo systemctl status ssh

# Configure SSH (optional - for security)
sudo nano /etc/ssh/sshd_config

# Recommended settings:
PermitRootLogin yes  # For CTF/training scenarios
PasswordAuthentication yes
PubkeyAuthentication yes
Port 22

# Restart SSH
sudo systemctl restart ssh
```

#### Step 4: Test Connection from Host

```bash
# Test SSH connection
ssh root@192.168.1.100

# If successful, you're ready!
```

#### Step 5: Configure in NEXUS PROTOCOL

In the terminal connection form:
```
Host: 192.168.1.100
Port: 22
Username: root
Password: your-vm-password
```

---

### Method 2: NAT with Port Forwarding (Single Player)

**Best for**: Single player, development, testing

#### Step 1: Configure VM Network

1. VirtualBox → VM Settings → Network
2. Adapter 1:
   - Attached to: **NAT**
   - Advanced → Port Forwarding

3. Add Port Forwarding Rule:
   - Name: SSH
   - Protocol: TCP
   - Host IP: 127.0.0.1
   - Host Port: 2222
   - Guest IP: (leave empty)
   - Guest Port: 22

4. Click OK

#### Step 2: Configure SSH (Inside VM)

```bash
# Same as Method 1
sudo apt install openssh-server -y
sudo systemctl enable ssh
sudo systemctl start ssh
```

#### Step 3: Test Connection

```bash
# Connect via forwarded port
ssh -p 2222 root@localhost
# Or
ssh -p 2222 root@127.0.0.1
```

#### Step 4: Configure in NEXUS PROTOCOL

```
Host: localhost (or 127.0.0.1)
Port: 2222
Username: root
Password: your-vm-password
```

---

### Method 3: Host-Only Adapter (Isolated Network)

**Best for**: Isolated testing, security training

#### Step 1: Create Host-Only Network

1. VirtualBox → File → Host Network Manager
2. Create new network or use existing
3. Note the IP range (e.g., 192.168.56.0/24)
4. Enable DHCP Server (optional)

#### Step 2: Configure VM Network

1. VM Settings → Network
2. Adapter 1:
   - Attached to: **Host-only Adapter**
   - Name: Select your host-only network (e.g., vboxnet0)

3. Click OK

#### Step 3: Configure Static IP (Inside VM)

```bash
# Edit netplan (Ubuntu 18.04+)
sudo nano /etc/netplan/01-netcfg.yaml

# Add configuration:
network:
  version: 2
  ethernets:
    enp0s3:  # Your interface name
      addresses:
        - 192.168.56.10/24
      nameservers:
        addresses:
          - 8.8.8.8
          - 8.8.4.4

# Apply configuration
sudo netplan apply

# Verify
ip addr show
```

#### Step 4: Configure SSH and Test

```bash
# Install SSH (same as above)
sudo apt install openssh-server -y
sudo systemctl enable ssh
sudo systemctl start ssh

# Test from host
ssh root@192.168.56.10
```

#### Step 5: Configure in NEXUS PROTOCOL

```
Host: 192.168.56.10
Port: 22
Username: root
Password: your-vm-password
```

---

## 🔐 VM Security Configuration

### Create CTF User (Recommended)

```bash
# Create dedicated user for CTF
sudo useradd -m -s /bin/bash ctfuser
sudo passwd ctfuser

# Add to sudo group (if needed)
sudo usermod -aG sudo ctfuser

# Configure SSH for this user
# In NEXUS PROTOCOL:
Username: ctfuser
Password: ctfuser-password
```

### Configure Firewall

```bash
# Install UFW
sudo apt install ufw -y

# Allow SSH
sudo ufw allow 22/tcp

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

### Install Common CTF Tools

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install common tools
sudo apt install -y \
  nmap \
  netcat \
  curl \
  wget \
  git \
  vim \
  net-tools \
  iputils-ping \
  traceroute \
  tcpdump \
  wireshark \
  john \
  hydra \
  sqlmap \
  nikto \
  dirb \
  gobuster \
  metasploit-framework

# Install Python tools
sudo apt install -y python3 python3-pip
pip3 install requests beautifulsoup4
```

---

## 📸 VM Snapshot Configuration

### Create Clean Snapshot

```bash
# Power off VM first
VBoxManage controlvm "Your-VM-Name" poweroff

# Wait for shutdown
sleep 5

# Take snapshot
VBoxManage snapshot "Your-VM-Name" take "clean" \
  --description "Clean state for mission start"

# List snapshots
VBoxManage snapshot "Your-VM-Name" list

# Start VM
VBoxManage startvm "Your-VM-Name" --type headless
```

### Register VM with NEXUS PROTOCOL

```javascript
// In backend, register VM
vmController.registerVM('vm1', {
  name: 'Ubuntu-CTF-1',
  snapshotName: 'clean',
  host: '192.168.1.100',
  port: 22,
  username: 'root',
  password: 'password'
});
```

---

## 🌐 Network Troubleshooting

### Check VM Network

```bash
# Inside VM - check network interface
ip addr show
ip link show

# Check routing
ip route show

# Test connectivity
ping 8.8.8.8
ping google.com

# Check DNS
nslookup google.com
```

### Check SSH Service

```bash
# Check if SSH is running
sudo systemctl status ssh

# Check SSH port
sudo netstat -tulpn | grep :22
# Or
sudo ss -tulpn | grep :22

# Check SSH logs
sudo tail -f /var/log/auth.log
```

### Test from Host

```bash
# Test network connectivity
ping 192.168.1.100

# Test SSH port
telnet 192.168.1.100 22
# Or
nc -zv 192.168.1.100 22

# Test SSH connection
ssh -v root@192.168.1.100
```

### Common Issues

**Issue 1: Cannot connect to VM**
```bash
# Check VM is running
VBoxManage list runningvms

# Check VM network
VBoxManage showvminfo "Your-VM-Name" | grep NIC

# Restart VM networking (inside VM)
sudo systemctl restart networking
# Or
sudo netplan apply
```

**Issue 2: SSH connection refused**
```bash
# Inside VM - restart SSH
sudo systemctl restart ssh

# Check firewall
sudo ufw status
sudo ufw allow 22/tcp

# Check SSH config
sudo nano /etc/ssh/sshd_config
# Ensure: PermitRootLogin yes
```

**Issue 3: Authentication failed**
```bash
# Reset password (inside VM)
sudo passwd root

# Or create new user
sudo useradd -m -s /bin/bash newuser
sudo passwd newuser
```

---

## 🎮 Mission VM Configuration

### Scenario 1: Red Team VM

```bash
# Install offensive tools
sudo apt install -y \
  nmap \
  metasploit-framework \
  sqlmap \
  hydra \
  john \
  nikto \
  dirb \
  gobuster

# Configure for CTF
# - Vulnerable services
# - Hidden flags
# - Privilege escalation paths
```

### Scenario 2: Blue Team VM

```bash
# Install defensive tools
sudo apt install -y \
  fail2ban \
  aide \
  rkhunter \
  chkrootkit \
  lynis

# Configure monitoring
sudo systemctl enable fail2ban
sudo systemctl start fail2ban

# Setup logging
sudo apt install -y rsyslog
```

### Scenario 3: Forensics VM

```bash
# Install forensics tools
sudo apt install -y \
  autopsy \
  sleuthkit \
  foremost \
  binwalk \
  volatility

# Mount evidence
# Analyze artifacts
```

---

## 🔄 Automated VM Setup Script

```bash
#!/bin/bash
# vm-setup.sh - Automated VM configuration for NEXUS PROTOCOL

echo "🔧 NEXUS PROTOCOL - VM Setup"
echo "=============================="

# Update system
echo "Updating system..."
sudo apt update && sudo apt upgrade -y

# Install SSH
echo "Installing SSH server..."
sudo apt install -y openssh-server

# Configure SSH
echo "Configuring SSH..."
sudo sed -i 's/#PermitRootLogin prohibit-password/PermitRootLogin yes/' /etc/ssh/sshd_config
sudo sed -i 's/#PasswordAuthentication yes/PasswordAuthentication yes/' /etc/ssh/sshd_config

# Restart SSH
sudo systemctl restart ssh
sudo systemctl enable ssh

# Install common tools
echo "Installing CTF tools..."
sudo apt install -y \
  nmap \
  netcat \
  curl \
  wget \
  git \
  vim \
  net-tools \
  iputils-ping

# Configure firewall
echo "Configuring firewall..."
sudo apt install -y ufw
sudo ufw allow 22/tcp
sudo ufw --force enable

# Get IP address
IP=$(ip -4 addr show | grep -oP '(?<=inet\s)\d+(\.\d+){3}' | grep -v '127.0.0.1' | head -1)

echo ""
echo "✅ Setup Complete!"
echo "=================="
echo "VM IP: $IP"
echo "SSH Port: 22"
echo ""
echo "Test connection:"
echo "  ssh root@$IP"
echo ""
echo "Configure in NEXUS PROTOCOL:"
echo "  Host: $IP"
echo "  Port: 22"
echo "  Username: root"
echo "  Password: [your-password]"
echo ""
```

Save and run:
```bash
chmod +x vm-setup.sh
sudo ./vm-setup.sh
```

---

## 📊 Quick Reference

### VirtualBox Commands

```bash
# List VMs
VBoxManage list vms

# Start VM
VBoxManage startvm "VM-Name" --type headless

# Stop VM
VBoxManage controlvm "VM-Name" poweroff

# Get VM info
VBoxManage showvminfo "VM-Name"

# Take snapshot
VBoxManage snapshot "VM-Name" take "snapshot-name"

# Restore snapshot
VBoxManage snapshot "VM-Name" restore "snapshot-name"

# List snapshots
VBoxManage snapshot "VM-Name" list
```

### Network Configuration Summary

| Method | Use Case | Host IP | VM IP | Port |
|--------|----------|---------|-------|------|
| Bridged | LAN/Production | N/A | 192.168.1.x | 22 |
| NAT | Single Player | 127.0.0.1 | 10.0.2.15 | 2222→22 |
| Host-Only | Isolated | N/A | 192.168.56.x | 22 |

### Connection Test Checklist

- [ ] VM is running
- [ ] VM has IP address
- [ ] SSH service is running
- [ ] Firewall allows port 22
- [ ] Can ping VM from host
- [ ] Can SSH to VM from host
- [ ] Can connect from NEXUS PROTOCOL terminal

---

## 🎯 Next Steps

1. Configure your VM using one of the methods above
2. Test SSH connection from host machine
3. Open NEXUS PROTOCOL: http://localhost:5173/terminal
4. Enter VM connection details
5. Click "Connect"
6. Start executing commands!

## 📞 Support

If you encounter issues:
1. Check VM is running: `VBoxManage list runningvms`
2. Check SSH service: `sudo systemctl status ssh`
3. Check firewall: `sudo ufw status`
4. Check logs: `sudo tail -f /var/log/auth.log`
5. Test connection: `ssh -v user@vm-ip`

---

**Your VM is now ready to connect to NEXUS PROTOCOL!** 🚀
