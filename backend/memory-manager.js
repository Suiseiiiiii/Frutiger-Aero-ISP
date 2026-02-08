// Memory Manager Module - Pure JavaScript Garbage Collector
// Works in Node.js and browsers (Firefox, Chrome, etc.)
// No C++ dependencies required

class MemoryPool {
  constructor() {
    this.blocks = new Map();
    this.blockId = 0;
    this.stats = {
      totalAllocated: 0,
      totalFreed: 0,
      peakUsage: 0
    };
  }

  // Simulate memory allocation
  allocate(size) {
    const id = ++this.blockId;
    const block = {
      id: id,
      size: size,
      created: Date.now(),
      accessed: Date.now(),
      inUse: true
    };
    
    this.blocks.set(id, block);
    this.stats.totalAllocated += size;
    
    const currentUsage = this.getCurrentUsage();
    if (currentUsage > this.stats.peakUsage) {
      this.stats.peakUsage = currentUsage;
    }
    
    return id;
  }

  // Mark memory for deallocation
  free(blockId) {
    if (this.blocks.has(blockId)) {
      const block = this.blocks.get(blockId);
      block.inUse = false;
      block.freed = Date.now();
      this.stats.totalFreed += block.size;
      return true;
    }
    return false;
  }

  // Get current memory usage
  getCurrentUsage() {
    let usage = 0;
    for (let block of this.blocks.values()) {
      if (block.inUse) {
        usage += block.size;
      }
    }
    return usage;
  }

  // Get active blocks count
  getActiveBlocks() {
    let count = 0;
    for (let block of this.blocks.values()) {
      if (block.inUse) {
        count++;
      }
    }
    return count;
  }

  // Garbage collection - remove old freed blocks
  collect() {
    const now = Date.now();
    const maxAge = 5 * 60 * 1000; // 5 minutes
    let collected = 0;

    for (let [id, block] of this.blocks.entries()) {
      if (!block.inUse && block.freed && (now - block.freed) > maxAge) {
        this.blocks.delete(id);
        collected++;
      }
    }

    return collected;
  }

  // Get statistics
  getStats() {
    return {
      totalAllocated: this.stats.totalAllocated,
      totalFreed: this.stats.totalFreed,
      activeBlocks: this.getActiveBlocks(),
      currentUsage: this.getCurrentUsage(),
      peakUsage: this.stats.peakUsage,
      totalBlocks: this.blocks.size
    };
  }

  // Clear all blocks
  clear() {
    this.blocks.clear();
    this.stats = {
      totalAllocated: 0,
      totalFreed: 0,
      peakUsage: 0
    };
  }
}

// Global memory pool
const pool = new MemoryPool();

// Memory Monitor
class MemoryMonitor {
  constructor(options = {}) {
    this.checkInterval = options.checkInterval || 60000; // 1 minute
    this.heapThreshold = options.heapThreshold || 256 * 1024 * 1024; // 256MB
    this.maxHeapUsage = options.maxHeapUsage || 1024 * 1024 * 1024; // 1GB
    this.isRunning = false;
    this.monitorInterval = null;
    this.history = [];
    this.maxHistorySize = 100;
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;

    this.monitorInterval = setInterval(() => {
      const stats = this.getMemoryStats();
      
      // Keep history
      this.history.push({
        timestamp: Date.now(),
        ...stats
      });
      
      if (this.history.length > this.maxHistorySize) {
        this.history.shift();
      }

      // Log if in Node.js
      if (typeof process !== 'undefined' && process.memoryUsage) {
        console.log(`[Memory Monitor] Heap: ${Math.round(stats.nodeHeapUsed / 1024 / 1024)}MB / ${Math.round(stats.nodeHeapTotal / 1024 / 1024)}MB, Pool: ${Math.round(stats.poolCurrent / 1024 / 1024)}MB`);
      }

      // Trigger garbage collection if usage is high
      if (stats.nodeHeapUsed > this.heapThreshold) {
        console.log('[Memory Monitor] Triggering garbage collection...');
        if (typeof global !== 'undefined' && global.gc) {
          global.gc();
        }
        pool.collect();
      }

      // Warn if approaching max heap
      if (stats.nodeHeapUsed > this.maxHeapUsage * 0.9) {
        console.warn('[Memory Monitor] WARNING: Heap usage approaching maximum!');
      }
    }, this.checkInterval);
  }

  stop() {
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.isRunning = false;
    }
  }

  getMemoryStats() {
    const poolStats = pool.getStats();
    let nodeStats = {};

    // Get Node.js memory stats if available
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const mem = process.memoryUsage();
      nodeStats = {
        nodeHeapUsed: mem.heapUsed,
        nodeHeapTotal: mem.heapTotal,
        nodeExternal: mem.external,
        nodeRss: mem.rss
      };
    } else {
      // Browser fallback
      if (typeof performance !== 'undefined' && performance.memory) {
        nodeStats = {
          nodeHeapUsed: performance.memory.usedJSHeapSize,
          nodeHeapTotal: performance.memory.totalJSHeapSize,
          nodeExternal: 0,
          nodeRss: performance.memory.jsHeapSizeLimit
        };
      }
    }

    return {
      ...nodeStats,
      poolAllocated: poolStats.totalAllocated,
      poolFreed: poolStats.totalFreed,
      poolActive: poolStats.activeBlocks,
      poolCurrent: poolStats.currentUsage,
      poolPeak: poolStats.peakUsage,
      poolTotal: poolStats.totalBlocks
    };
  }

  printStats() {
    const stats = this.getMemoryStats();
    
    let output = '=== Memory Statistics ===\n';
    
    if (stats.nodeHeapUsed) {
      output += `Node.js Heap: ${Math.round(stats.nodeHeapUsed / 1024 / 1024)}MB / ${Math.round(stats.nodeHeapTotal / 1024 / 1024)}MB\n`;
      output += `External: ${Math.round(stats.nodeExternal / 1024 / 1024)}MB\n`;
      output += `RSS (Resident Set): ${Math.round(stats.nodeRss / 1024 / 1024)}MB\n`;
    }
    
    output += `Pool - Allocated: ${Math.round(stats.poolAllocated / 1024 / 1024)}MB\n`;
    output += `Pool - Freed: ${Math.round(stats.poolFreed / 1024 / 1024)}MB\n`;
    output += `Pool - Current: ${Math.round(stats.poolCurrent / 1024 / 1024)}MB\n`;
    output += `Pool - Peak: ${Math.round(stats.poolPeak / 1024 / 1024)}MB\n`;
    output += `Pool - Active Blocks: ${stats.poolActive}\n`;
    output += `Pool - Total Blocks: ${stats.poolTotal}\n`;
    output += '========================';
    
    if (typeof console !== 'undefined') {
      console.log(output);
    }
    
    return output;
  }

  getHistory() {
    return this.history;
  }

  getHistory(minutes = 5) {
    const now = Date.now();
    const timeWindow = minutes * 60 * 1000;
    return this.history.filter(entry => (now - entry.timestamp) <= timeWindow);
  }
}

// Module exports for Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    pool,
    Monitor: MemoryMonitor,
    
    // Helper functions
    allocate: function(size) {
      return pool.allocate(size);
    },

    free: function(blockId) {
      return pool.free(blockId);
    },

    collect: function() {
      return pool.collect();
    },

    stats: function() {
      return pool.getStats();
    },

    clear: function() {
      pool.clear();
    }
  };
}

// Browser global export
if (typeof window !== 'undefined') {
  window.MemoryManager = {
    pool,
    Monitor: MemoryMonitor,
    allocate: function(size) {
      return pool.allocate(size);
    },
    free: function(blockId) {
      return pool.free(blockId);
    },
    collect: function() {
      return pool.collect();
    },
    stats: function() {
      return pool.getStats();
    },
    clear: function() {
      pool.clear();
    }
  };
}

