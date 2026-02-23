// Message Queue for NEXUS PROTOCOL
// Handles message batching and buffering for optimal performance

class MessageQueue {
  constructor(options = {}) {
    this.queues = new Map(); // queueId -> queue data
    
    // Configuration
    this.config = {
      maxQueueSize: options.maxQueueSize || 100,
      batchSize: options.batchSize || 10,
      flushInterval: options.flushInterval || 50, // ms
      priorityLevels: ['critical', 'high', 'normal', 'low'],
      ...options
    };
    
    // Statistics
    this.stats = {
      messagesQueued: 0,
      messagesProcessed: 0,
      batchesSent: 0,
      droppedMessages: 0,
      averageQueueSize: 0
    };
    
    // Auto-flush timers
    this.flushTimers = new Map();
  }

  /**
   * Create a queue for a specific identifier
   * @param {string} queueId - Queue identifier (e.g., roundId)
   * @param {Object} options - Queue options
   */
  createQueue(queueId, options = {}) {
    if (this.queues.has(queueId)) {
      return this.queues.get(queueId);
    }

    const queue = {
      id: queueId,
      messages: [],
      priorityQueues: {
        critical: [],
        high: [],
        normal: [],
        low: []
      },
      createdAt: new Date(),
      lastFlush: new Date(),
      options: {
        ...this.config,
        ...options
      }
    };

    this.queues.set(queueId, queue);
    return queue;
  }

  /**
   * Enqueue a message
   * @param {string} queueId - Queue identifier
   * @param {Object} message - Message to enqueue
   * @param {string} priority - Priority level ('critical', 'high', 'normal', 'low')
   * @returns {boolean} Success status
   */
  enqueue(queueId, message, priority = 'normal') {
    let queue = this.queues.get(queueId);
    if (!queue) {
      queue = this.createQueue(queueId);
    }

    // Validate priority
    if (!this.config.priorityLevels.includes(priority)) {
      priority = 'normal';
    }

    // Add timestamp if not present
    if (!message.timestamp) {
      message.timestamp = new Date().toISOString();
    }

    // Add to priority queue
    const priorityQueue = queue.priorityQueues[priority];
    priorityQueue.push(message);

    // Add to main queue (for size tracking)
    queue.messages.push({ ...message, priority });

    this.stats.messagesQueued++;

    // Check queue size limit
    if (queue.messages.length > queue.options.maxQueueSize) {
      // Drop lowest priority messages
      this.dropLowPriorityMessages(queue);
    }

    // Schedule auto-flush if not already scheduled
    if (!this.flushTimers.has(queueId)) {
      this.scheduleFlush(queueId, queue.options.flushInterval);
    }

    // Immediate flush for critical messages
    if (priority === 'critical') {
      this.flush(queueId);
    }

    return true;
  }

  /**
   * Dequeue messages (get and remove)
   * @param {string} queueId - Queue identifier
   * @param {number} count - Number of messages to dequeue
   * @returns {Array} Dequeued messages
   */
  dequeue(queueId, count = null) {
    const queue = this.queues.get(queueId);
    if (!queue) {
      return [];
    }

    const messages = [];
    const batchSize = count || queue.options.batchSize;

    // Dequeue by priority
    for (const priority of this.config.priorityLevels) {
      const priorityQueue = queue.priorityQueues[priority];
      
      while (messages.length < batchSize && priorityQueue.length > 0) {
        messages.push(priorityQueue.shift());
      }
      
      if (messages.length >= batchSize) {
        break;
      }
    }

    // Update main queue
    queue.messages = queue.messages.slice(messages.length);

    this.stats.messagesProcessed += messages.length;

    return messages;
  }

  /**
   * Peek at messages without removing them
   * @param {string} queueId - Queue identifier
   * @param {number} count - Number of messages to peek
   * @returns {Array} Messages
   */
  peek(queueId, count = 10) {
    const queue = this.queues.get(queueId);
    if (!queue) {
      return [];
    }

    const messages = [];
    
    // Peek by priority
    for (const priority of this.config.priorityLevels) {
      const priorityQueue = queue.priorityQueues[priority];
      const available = Math.min(count - messages.length, priorityQueue.length);
      
      messages.push(...priorityQueue.slice(0, available));
      
      if (messages.length >= count) {
        break;
      }
    }

    return messages;
  }

  /**
   * Flush queue (process all messages)
   * @param {string} queueId - Queue identifier
   * @param {Function} processor - Message processor function
   * @returns {Object} Flush result
   */
  flush(queueId, processor = null) {
    const queue = this.queues.get(queueId);
    if (!queue) {
      return { success: false, error: 'QUEUE_NOT_FOUND' };
    }

    // Cancel scheduled flush
    this.cancelScheduledFlush(queueId);

    // Get all messages
    const messages = this.dequeue(queueId, queue.messages.length);
    
    if (messages.length === 0) {
      return { success: true, messageCount: 0 };
    }

    // Process messages if processor provided
    if (processor && typeof processor === 'function') {
      try {
        processor(messages);
      } catch (error) {
        console.error('Message processor error:', error);
        return { success: false, error: 'PROCESSOR_ERROR', messageCount: messages.length };
      }
    }

    queue.lastFlush = new Date();
    this.stats.batchesSent++;

    return {
      success: true,
      messageCount: messages.length,
      timestamp: queue.lastFlush
    };
  }

  /**
   * Schedule automatic flush
   * @param {string} queueId - Queue identifier
   * @param {number} delay - Delay in milliseconds
   */
  scheduleFlush(queueId, delay) {
    // Cancel existing timer
    this.cancelScheduledFlush(queueId);

    // Schedule new flush
    const timer = setTimeout(() => {
      this.flush(queueId);
      this.flushTimers.delete(queueId);
    }, delay);

    this.flushTimers.set(queueId, timer);
  }

  /**
   * Cancel scheduled flush
   * @param {string} queueId - Queue identifier
   */
  cancelScheduledFlush(queueId) {
    const timer = this.flushTimers.get(queueId);
    if (timer) {
      clearTimeout(timer);
      this.flushTimers.delete(queueId);
    }
  }

  /**
   * Drop low priority messages when queue is full
   * @param {Object} queue - Queue object
   */
  dropLowPriorityMessages(queue) {
    const maxSize = queue.options.maxQueueSize;
    let currentSize = queue.messages.length;

    // Drop from lowest priority first
    for (let i = this.config.priorityLevels.length - 1; i >= 0 && currentSize > maxSize; i--) {
      const priority = this.config.priorityLevels[i];
      const priorityQueue = queue.priorityQueues[priority];
      
      while (priorityQueue.length > 0 && currentSize > maxSize) {
        priorityQueue.shift();
        currentSize--;
        this.stats.droppedMessages++;
      }
    }

    // Update main queue
    queue.messages = queue.messages.slice(-maxSize);
  }

  /**
   * Get queue size
   * @param {string} queueId - Queue identifier
   * @returns {number} Queue size
   */
  size(queueId) {
    const queue = this.queues.get(queueId);
    return queue ? queue.messages.length : 0;
  }

  /**
   * Check if queue is empty
   * @param {string} queueId - Queue identifier
   * @returns {boolean} True if empty
   */
  isEmpty(queueId) {
    return this.size(queueId) === 0;
  }

  /**
   * Clear queue
   * @param {string} queueId - Queue identifier
   */
  clear(queueId) {
    const queue = this.queues.get(queueId);
    if (queue) {
      this.cancelScheduledFlush(queueId);
      queue.messages = [];
      for (const priority of this.config.priorityLevels) {
        queue.priorityQueues[priority] = [];
      }
    }
  }

  /**
   * Delete queue
   * @param {string} queueId - Queue identifier
   */
  deleteQueue(queueId) {
    this.cancelScheduledFlush(queueId);
    this.queues.delete(queueId);
  }

  /**
   * Get queue info
   * @param {string} queueId - Queue identifier
   * @returns {Object} Queue information
   */
  getQueueInfo(queueId) {
    const queue = this.queues.get(queueId);
    if (!queue) {
      return null;
    }

    return {
      id: queue.id,
      size: queue.messages.length,
      priorityBreakdown: {
        critical: queue.priorityQueues.critical.length,
        high: queue.priorityQueues.high.length,
        normal: queue.priorityQueues.normal.length,
        low: queue.priorityQueues.low.length
      },
      createdAt: queue.createdAt,
      lastFlush: queue.lastFlush,
      hasScheduledFlush: this.flushTimers.has(queueId)
    };
  }

  /**
   * Get all queue IDs
   * @returns {Array} Queue IDs
   */
  getQueueIds() {
    return Array.from(this.queues.keys());
  }

  /**
   * Get statistics
   * @returns {Object} Statistics
   */
  getStats() {
    const queueSizes = Array.from(this.queues.values()).map(q => q.messages.length);
    const averageQueueSize = queueSizes.length > 0
      ? queueSizes.reduce((sum, size) => sum + size, 0) / queueSizes.length
      : 0;

    return {
      ...this.stats,
      activeQueues: this.queues.size,
      scheduledFlushes: this.flushTimers.size,
      averageQueueSize: Math.round(averageQueueSize * 100) / 100,
      totalQueuedMessages: queueSizes.reduce((sum, size) => sum + size, 0)
    };
  }

  /**
   * Cleanup all queues and timers
   */
  cleanup() {
    // Cancel all scheduled flushes
    for (const queueId of this.flushTimers.keys()) {
      this.cancelScheduledFlush(queueId);
    }

    // Clear all queues
    this.queues.clear();
    
    console.log('Message queue cleanup completed');
  }
}

module.exports = MessageQueue;
