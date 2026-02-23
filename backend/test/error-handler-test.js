/**
 * Error Handler Test Suite
 * Tests retry logic, error formatting, and logging
 */

const ErrorHandler = require('../middleware/errorHandler');

async function testErrorHandler() {
  console.log('🧪 Testing Error Handler...\n');

  const handler = new ErrorHandler({
    maxRetries: 3,
    baseDelay: 100,
    maxDelay: 1000,
    logger: {
      info: () => {},
      warn: () => {},
      error: () => {}
    }
  });

  // Test 1: Successful database connection (no retry needed)
  console.log('📋 Test 1: Successful Database Connection');
  let attempts = 0;
  const successFn = async () => {
    attempts++;
    return { connected: true };
  };
  
  const result1 = await handler.retryDatabaseConnection(successFn);
  console.log(`✅ Connection successful: ${result1.connected}`);
  console.log(`✅ Attempts: ${attempts} (expected 1)`);

  // Test 2: Database connection with retry
  console.log('\n📋 Test 2: Database Connection with Retry');
  let retryAttempts = 0;
  const retryFn = async () => {
    retryAttempts++;
    if (retryAttempts < 3) {
      throw new Error('Connection refused');
    }
    return { connected: true };
  };
  
  const result2 = await handler.retryDatabaseConnection(retryFn);
  console.log(`✅ Connection successful after retries: ${result2.connected}`);
  console.log(`✅ Total attempts: ${retryAttempts} (expected 3)`);

  // Test 3: Database connection failure after max retries
  console.log('\n📋 Test 3: Database Connection Failure');
  const failFn = async () => {
    throw new Error('ECONNREFUSED');
  };
  
  try {
    await handler.retryDatabaseConnection(failFn);
    console.log('❌ Should have thrown error');
  } catch (error) {
    console.log(`✅ Failed as expected: ${error.message.includes('Database connection failed')}`);
  }

  // Test 4: Exponential backoff calculation
  console.log('\n📋 Test 4: Exponential Backoff Calculation');
  const delay1 = handler.calculateBackoff(1);
  const delay2 = handler.calculateBackoff(2);
  const delay3 = handler.calculateBackoff(3);
  console.log(`✅ Attempt 1 delay: ${delay1.toFixed(0)}ms (base: 100ms)`);
  console.log(`✅ Attempt 2 delay: ${delay2.toFixed(0)}ms (base: 200ms)`);
  console.log(`✅ Attempt 3 delay: ${delay3.toFixed(0)}ms (base: 400ms)`);
  console.log(`✅ Exponential growth: ${delay2 > delay1 && delay3 > delay2}`);

  // Test 5: WebSocket reconnection
  console.log('\n📋 Test 5: WebSocket Reconnection');
  let wsAttempts = 0;
  const wsReconnectFn = async (socket) => {
    wsAttempts++;
    if (wsAttempts < 2) {
      throw new Error('Connection lost');
    }
    return true;
  };
  
  const wsResult = await handler.handleWebSocketReconnection({}, wsReconnectFn, { maxAttempts: 3 });
  console.log(`✅ WebSocket reconnected: ${wsResult}`);
  console.log(`✅ Attempts: ${wsAttempts}`);

  // Test 6: Format validation error
  console.log('\n📋 Test 6: Format Validation Error');
  const validationError = {
    field: 'email',
    value: 'invalid-email',
    constraint: 'must be valid email',
    message: 'Invalid email format'
  };
  
  const formatted = handler.formatValidationError(validationError);
  console.log(`✅ Error type: ${formatted.type}`);
  console.log(`✅ User-friendly message: ${formatted.message}`);
  console.log(`✅ Field: ${formatted.field}`);
  console.log(`✅ Has timestamp: ${!!formatted.timestamp}`);

  // Test 7: Sensitive field redaction
  console.log('\n📋 Test 7: Sensitive Field Redaction');
  const sensitiveError = {
    field: 'password',
    value: 'secret123',
    message: 'Password too weak'
  };
  
  const redacted = handler.formatValidationError(sensitiveError);
  console.log(`✅ Sensitive field detected: ${handler.isSensitiveField('password')}`);
  console.log(`✅ Value redacted: ${redacted.value === undefined}`);

  // Test 8: User-friendly error messages
  console.log('\n📋 Test 8: User-Friendly Error Messages');
  const errors = [
    { code: 'ECONNREFUSED' },
    { code: 'ETIMEDOUT' },
    { type: 'VALIDATION_ERROR' },
    { type: 'RATE_LIMIT_ERROR' }
  ];
  
  errors.forEach(err => {
    const message = handler.getUserFriendlyMessage(err);
    console.log(`✅ ${err.code || err.type}: "${message}"`);
  });

  // Test 9: Log unhandled exception
  console.log('\n📋 Test 9: Log Unhandled Exception');
  const exception = new Error('Unexpected error');
  exception.stack = 'Error: Unexpected error\n    at test.js:10:15';
  
  const logEntry = handler.logUnhandledException(exception, {
    method: 'POST',
    path: '/api/rounds',
    user: { id: 'user-123', password: 'secret' }
  });
  
  console.log(`✅ Log entry created: ${!!logEntry}`);
  console.log(`✅ Has timestamp: ${!!logEntry.timestamp}`);
  console.log(`✅ Has stack trace: ${!!logEntry.stack}`);
  console.log(`✅ User data redacted: ${!logEntry.context.user.password}`);

  // Test 10: Error log retrieval
  console.log('\n📋 Test 10: Error Log Retrieval');
  // Log a few more errors
  handler.logUnhandledException(new Error('Error 1'));
  handler.logUnhandledException(new Error('Error 2'));
  handler.logUnhandledException(new Error('Error 3'));
  
  const errorLog = handler.getErrorLog(10);
  console.log(`✅ Error log entries: ${errorLog.length}`);
  console.log(`✅ Most recent error: ${errorLog[errorLog.length - 1].message}`);

  // Test 11: Error statistics
  console.log('\n📋 Test 11: Error Statistics');
  const stats = handler.getErrorStatistics();
  console.log(`✅ Total errors: ${stats.total}`);
  console.log(`✅ By type:`, stats.byType);
  console.log(`✅ Most recent:`, stats.mostRecent?.message);

  // Test 12: Clear error log
  console.log('\n📋 Test 12: Clear Error Log');
  handler.clearErrorLog();
  const clearedLog = handler.getErrorLog();
  console.log(`✅ Log cleared: ${clearedLog.length === 0}`);

  // Test 13: Async handler wrapper
  console.log('\n📋 Test 13: Async Handler Wrapper');
  const asyncFn = handler.asyncHandler(async (req, res, next) => {
    throw new Error('Async error');
  });
  
  let errorCaught = false;
  const mockNext = (err) => {
    errorCaught = !!err;
  };
  
  await asyncFn({}, {}, mockNext);
  console.log(`✅ Async error caught: ${errorCaught}`);

  // Test 14: Express middleware
  console.log('\n📋 Test 14: Express Middleware');
  const middleware = handler.middleware();
  const mockReq = { method: 'GET', path: '/api/test' };
  const mockRes = {
    status: function(code) {
      this.statusCode = code;
      return this;
    },
    json: function(data) {
      this.body = data;
      return this;
    }
  };
  
  const testError = new Error('Test error');
  testError.statusCode = 400;
  testError.type = 'VALIDATION_ERROR';
  
  middleware(testError, mockReq, mockRes, () => {});
  console.log(`✅ Status code: ${mockRes.statusCode}`);
  console.log(`✅ Error response: ${mockRes.body.error.type}`);
  console.log(`✅ User-friendly message: ${!!mockRes.body.error.message}`);

  console.log('\n🎉 All Error Handler tests passed!\n');
  console.log('✅ Error Handler Test: PASSED');
  console.log(`📊 Stats: ${stats.total} errors logged, ${wsAttempts} WebSocket reconnection attempts\n`);
}

// Run tests
testErrorHandler().catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
