# JWT Token Generator - Quick Guide

## Generate Built-in Team Tokens

```bash
cd backend
node scripts/generate-token.js built-in
```

## Generate Custom Token

```bash
node scripts/generate-token.js generate <teamName> <teamType> <expiresIn>
```

Examples:
- `node scripts/generate-token.js generate RedTeam red 2h`
- `node scripts/generate-token.js generate BlueTeam blue 24h`

## Verify Token

```bash
node scripts/generate-token.js verify <token>
```

## Built-in Credentials

- RedTeam / redteam123
- BlueTeam / blueteam123
