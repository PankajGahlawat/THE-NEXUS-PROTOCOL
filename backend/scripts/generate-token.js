/**
 * NEXUS PROTOCOL - JWT Token Generator
 * Utility script to generate JWT tokens for testing and development
 * Version: 1.0.0
 */

const jwt = require('jsonwebtoken');
const crypto = require('crypto');
require('dotenv').config();

// Get JWT_SECRET from environment or use default
const JWT_SECRET = process.env.JWT_SECRET || 'nexus-protocol-secret-key';

/**
 * Generate a JWT token for a team
 * @param {string} teamName - Name of the team
 * @param {string} teamType - Type of team ('red' or 'blue')
 * @param {string} expiresIn - Token expiration time (default: '2h')
 * @returns {string} JWT token
 */
function generateToken(teamName, teamType = 'red', expiresIn = '2h') {
  const sessionId = crypto.randomUUID();
  
  const token = jwt.sign(
    {
      teamName,
      teamType,
      timestamp: Date.now(),
      sessionId,
      isBuiltIn: true
    },
    JWT_SECRET,
    {
      expiresIn,
      algorithm: 'HS256',
      issuer: 'nexus-protocol',
      audience: 'nexus-client'
    }
  );

  return token;
}

/**
 * Verify and decode a JWT token
 * @param {string} token - JWT token to verify
 * @returns {object} Decoded token payload
 */
function verifyToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      algorithms: ['HS256'],
      issuer: 'nexus-protocol',
      audience: 'nexus-client'
    });
    return { valid: true, payload: decoded };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}

// CLI Interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];

  if (command === 'generate' || command === 'gen') {
    const teamName = args[1] || 'TestTeam';
    const teamType = args[2] || 'red';
    const expiresIn = args[3] || '2h';

    console.log('\n🔐 NEXUS PROTOCOL - JWT Token Generator\n');
    console.log('Generating token with:');
    console.log(`  Team Name: ${teamName}`);
    console.log(`  Team Type: ${teamType}`);
    console.log(`  Expires In: ${expiresIn}`);
    console.log(`  JWT Secret: ${JWT_SECRET.substring(0, 10)}...`);
    console.log('');

    const token = generateToken(teamName, teamType, expiresIn);
    
    console.log('Generated Token:');
    console.log('─'.repeat(80));
    console.log(token);
    console.log('─'.repeat(80));
    console.log('');
    console.log('Use this token in Authorization header:');
    console.log(`Authorization: Bearer ${token}`);
    console.log('');

  } else if (command === 'verify') {
    const token = args[1];
    
    if (!token) {
      console.error('Error: Please provide a token to verify');
      console.log('Usage: node generate-token.js verify <token>');
      process.exit(1);
    }

    console.log('\n🔐 NEXUS PROTOCOL - JWT Token Verifier\n');
    
    const result = verifyToken(token);
    
    if (result.valid) {
      console.log('✅ Token is VALID\n');
      console.log('Decoded Payload:');
      console.log(JSON.stringify(result.payload, null, 2));
      console.log('');
      
      const expiresAt = new Date(result.payload.exp * 1000);
      const now = new Date();
      const timeLeft = expiresAt - now;
      
      console.log(`Expires at: ${expiresAt.toISOString()}`);
      console.log(`Time left: ${Math.floor(timeLeft / 1000 / 60)} minutes`);
    } else {
      console.log('❌ Token is INVALID\n');
      console.log(`Error: ${result.error}`);
    }
    console.log('');

  } else if (command === 'built-in' || command === 'builtin') {
    console.log('\n🔐 NEXUS PROTOCOL - Built-in Team Tokens\n');
    
    const redToken = generateToken('RedTeam', 'red', '24h');
    const blueToken = generateToken('BlueTeam', 'blue', '24h');
    
    console.log('Red Team Token (24h):');
    console.log('─'.repeat(80));
    console.log(redToken);
    console.log('─'.repeat(80));
    console.log('');
    
    console.log('Blue Team Token (24h):');
    console.log('─'.repeat(80));
    console.log(blueToken);
    console.log('─'.repeat(80));
    console.log('');

  } else {
    console.log('\n🔐 NEXUS PROTOCOL - JWT Token Generator\n');
    console.log('Usage:');
    console.log('  node generate-token.js generate <teamName> <teamType> <expiresIn>');
    console.log('  node generate-token.js verify <token>');
    console.log('  node generate-token.js built-in');
    console.log('');
    console.log('Examples:');
    console.log('  node generate-token.js generate RedTeam red 2h');
    console.log('  node generate-token.js generate BlueTeam blue 24h');
    console.log('  node generate-token.js verify eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...');
    console.log('  node generate-token.js built-in');
    console.log('');
    console.log('Shortcuts:');
    console.log('  gen = generate');
    console.log('  builtin = built-in');
    console.log('');
  }
}

module.exports = {
  generateToken,
  verifyToken
};
