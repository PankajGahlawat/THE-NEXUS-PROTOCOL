/**
 * Input Validation and Sanitization
 * 
 * Provides validation and sanitization for all user inputs.
 * Prevents XSS, SQL injection, and other injection attacks.
 * 
 * Requirements: 9.5, 9.6
 */

class InputValidator {
  constructor() {
    // Common validation patterns
    this.patterns = {
      uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      alphanumeric: /^[a-zA-Z0-9]+$/,
      alphanumericDash: /^[a-zA-Z0-9-_]+$/,
      email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      ip: /^(\d{1,3}\.){3}\d{1,3}$/,
      port: /^\d{1,5}$/
    };
    
    // XSS dangerous patterns
    this.xssPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<iframe/gi,
      /<object/gi,
      /<embed/gi
    ];
  }

  /**
   * Validate round ID
   */
  validateRoundId(roundId) {
    if (!roundId || typeof roundId !== 'string') {
      return { valid: false, error: 'Round ID is required' };
    }
    
    if (!this.patterns.uuid.test(roundId)) {
      return { valid: false, error: 'Invalid round ID format' };
    }
    
    return { valid: true, value: roundId };
  }

  /**
   * Validate agent ID
   */
  validateAgentId(agentId) {
    if (!agentId || typeof agentId !== 'string') {
      return { valid: false, error: 'Agent ID is required' };
    }
    
    const validAgents = ['ARCHITECT', 'SPECTER', 'ORACLE', 'SENTINEL', 'WARDEN', 'RESTORER'];
    if (!validAgents.includes(agentId.toUpperCase())) {
      return { valid: false, error: 'Invalid agent ID' };
    }
    
    return { valid: true, value: agentId.toUpperCase() };
  }

  /**
   * Validate team
   */
  validateTeam(team) {
    if (!team || typeof team !== 'string') {
      return { valid: false, error: 'Team is required' };
    }
    
    const validTeams = ['RED', 'BLUE'];
    if (!validTeams.includes(team.toUpperCase())) {
      return { valid: false, error: 'Invalid team' };
    }
    
    return { valid: true, value: team.toUpperCase() };
  }

  /**
   * Validate IP address
   */
  validateIP(ip) {
    if (!ip || typeof ip !== 'string') {
      return { valid: false, error: 'IP address is required' };
    }
    
    if (!this.patterns.ip.test(ip)) {
      return { valid: false, error: 'Invalid IP address format' };
    }
    
    // Validate octets
    const octets = ip.split('.');
    for (const octet of octets) {
      const num = parseInt(octet, 10);
      if (num < 0 || num > 255) {
        return { valid: false, error: 'Invalid IP address range' };
      }
    }
    
    return { valid: true, value: ip };
  }

  /**
   * Validate port number
   */
  validatePort(port) {
    const portNum = parseInt(port, 10);
    
    if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
      return { valid: false, error: 'Invalid port number' };
    }
    
    return { valid: true, value: portNum };
  }

  /**
   * Validate string input
   */
  validateString(value, options = {}) {
    const {
      minLength = 0,
      maxLength = 1000,
      pattern = null,
      allowEmpty = false
    } = options;
    
    if (value === null || value === undefined) {
      if (allowEmpty) {
        return { valid: true, value: '' };
      }
      return { valid: false, error: 'Value is required' };
    }
    
    const str = String(value);
    
    if (!allowEmpty && str.length === 0) {
      return { valid: false, error: 'Value cannot be empty' };
    }
    
    if (str.length < minLength) {
      return { valid: false, error: `Value must be at least ${minLength} characters` };
    }
    
    if (str.length > maxLength) {
      return { valid: false, error: `Value must be at most ${maxLength} characters` };
    }
    
    if (pattern && !pattern.test(str)) {
      return { valid: false, error: 'Value format is invalid' };
    }
    
    return { valid: true, value: str };
  }

  /**
   * Validate number input
   */
  validateNumber(value, options = {}) {
    const {
      min = -Infinity,
      max = Infinity,
      integer = false
    } = options;
    
    const num = Number(value);
    
    if (isNaN(num)) {
      return { valid: false, error: 'Value must be a number' };
    }
    
    if (integer && !Number.isInteger(num)) {
      return { valid: false, error: 'Value must be an integer' };
    }
    
    if (num < min) {
      return { valid: false, error: `Value must be at least ${min}` };
    }
    
    if (num > max) {
      return { valid: false, error: `Value must be at most ${max}` };
    }
    
    return { valid: true, value: num };
  }

  /**
   * Sanitize string for XSS prevention
   * Requirements: 9.5
   */
  sanitizeString(value) {
    if (!value || typeof value !== 'string') {
      return '';
    }
    
    let sanitized = value;
    
    // Remove XSS patterns
    for (const pattern of this.xssPatterns) {
      sanitized = sanitized.replace(pattern, '');
    }
    
    // HTML encode special characters
    sanitized = sanitized
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
    
    return sanitized;
  }

  /**
   * Sanitize object recursively
   */
  sanitizeObject(obj) {
    if (obj === null || obj === undefined) {
      return obj;
    }
    
    if (typeof obj === 'string') {
      return this.sanitizeString(obj);
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObject(item));
    }
    
    if (typeof obj === 'object') {
      const sanitized = {};
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = this.sanitizeObject(value);
      }
      return sanitized;
    }
    
    return obj;
  }

  /**
   * Validate and sanitize request body
   */
  validateRequestBody(schema) {
    return (req, res, next) => {
      const errors = [];
      const validated = {};
      
      for (const [field, rules] of Object.entries(schema)) {
        const value = req.body[field];
        
        // Check required
        if (rules.required && (value === null || value === undefined)) {
          errors.push({ field, message: `${field} is required` });
          continue;
        }
        
        // Skip validation if optional and not provided
        if (!rules.required && (value === null || value === undefined)) {
          continue;
        }
        
        // Validate based on type
        let result;
        switch (rules.type) {
          case 'string':
            result = this.validateString(value, rules);
            break;
          case 'number':
            result = this.validateNumber(value, rules);
            break;
          case 'uuid':
            result = this.validateRoundId(value);
            break;
          case 'ip':
            result = this.validateIP(value);
            break;
          case 'port':
            result = this.validatePort(value);
            break;
          case 'team':
            result = this.validateTeam(value);
            break;
          case 'agent':
            result = this.validateAgentId(value);
            break;
          default:
            result = { valid: true, value };
        }
        
        if (!result.valid) {
          errors.push({ field, message: result.error });
        } else {
          validated[field] = rules.sanitize !== false 
            ? this.sanitizeObject(result.value)
            : result.value;
        }
      }
      
      if (errors.length > 0) {
        return res.status(400).json({
          error: {
            type: 'VALIDATION_ERROR',
            message: 'Invalid input data',
            details: errors
          }
        });
      }
      
      // Replace request body with validated data
      req.validatedBody = validated;
      next();
    };
  }

  /**
   * Prevent SQL injection in raw queries
   * Requirements: 9.6
   */
  sanitizeSQL(value) {
    if (!value || typeof value !== 'string') {
      return value;
    }
    
    // Remove SQL injection patterns
    return value
      .replace(/'/g, "''")  // Escape single quotes
      .replace(/;/g, '')     // Remove semicolons
      .replace(/--/g, '')    // Remove SQL comments
      .replace(/\/\*/g, '')  // Remove block comments
      .replace(/\*\//g, '');
  }
}

module.exports = InputValidator;
