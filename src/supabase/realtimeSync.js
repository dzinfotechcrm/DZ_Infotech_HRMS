import { supabase } from './config';

// Map of tableName -> Set of listener callbacks
const tableListeners = new Map();

// Local same-origin BroadcastChannel for instant tab-to-tab sync in same browser
let localBc = null;
try {
  if (typeof window !== 'undefined' && window.BroadcastChannel) {
    localBc = new BroadcastChannel('hrms-app-updates');
    localBc.onmessage = (event) => {
      if (event.data?.type === 'table-update' && event.data?.table) {
        dispatchLocally(event.data.table);
      }
    };
  }
} catch (e) {
  // BroadcastChannel not available or restricted
}

function normalizeTableName(name) {
  if (!name) return '';
  return name.replace(/([A-Z])/g, '_$1').toLowerCase().trim();
}

function dispatchLocally(tableName) {
  const norm = normalizeTableName(tableName);
  const set = tableListeners.get(norm);
  if (set && set.size > 0) {
    set.forEach((cb) => {
      try {
        cb(norm);
      } catch (err) {
        console.error('Error in realtime listener:', err);
      }
    });
  }
}

// Global Supabase Realtime Channel (cross-browser, cross-device, cross-login)
let globalChannel = null;
let isChannelSubscribed = false;
const sendQueue = [];

function getGlobalChannel() {
  if (globalChannel) return globalChannel;

  globalChannel = supabase.channel('hrms-cross-browser-sync', {
    config: {
      broadcast: { ack: false, self: false },
    },
  });

  // 1. Listen for cross-browser / cross-login Realtime Broadcasts
  globalChannel.on('broadcast', { event: 'table-update' }, (payload) => {
    const table = payload?.payload?.table;
    if (table) {
      dispatchLocally(table);
    }
  });

  // 2. Listen for Supabase PostgreSQL Database Changes (CDC)
  globalChannel.on('postgres_changes', { event: '*', schema: 'public' }, (payload) => {
    const table = payload?.table;
    if (table) {
      dispatchLocally(table);
    }
  });

  // Subscribe to channel
  globalChannel.subscribe((status) => {
    if (status === 'SUBSCRIBED') {
      isChannelSubscribed = true;
      // Flush any queued broadcasts
      while (sendQueue.length > 0) {
        const item = sendQueue.shift();
        try {
          globalChannel.send(item);
        } catch (e) {}
      }
    } else {
      isChannelSubscribed = false;
    }
  });

  return globalChannel;
}

// Ensure the channel is initialized on startup
if (typeof window !== 'undefined') {
  getGlobalChannel();
}

/**
 * Subscribe a component or hook to real-time changes for a specific table.
 * Returns an unsubscribe cleanup function.
 */
export function subscribeToTable(tableName, callback) {
  if (!tableName || typeof callback !== 'function') return () => {};

  const norm = normalizeTableName(tableName);
  if (!tableListeners.has(norm)) {
    tableListeners.set(norm, new Set());
  }
  tableListeners.get(norm).add(callback);

  // Ensure channel is active
  getGlobalChannel();

  return () => {
    const set = tableListeners.get(norm);
    if (set) {
      set.delete(callback);
      if (set.size === 0) {
        tableListeners.delete(norm);
      }
    }
  };
}

/**
 * Notify all connected clients, tabs, browsers, and logins that a table was updated.
 */
export function notifyTableChange(tableName) {
  if (!tableName) return;
  const norm = normalizeTableName(tableName);

  // 1. Dispatch locally in this window immediately
  dispatchLocally(norm);

  // 2. Dispatch across tabs in the same browser via BroadcastChannel
  try {
    if (localBc) {
      localBc.postMessage({ type: 'table-update', table: norm });
    }
  } catch (e) {}

  // 3. Dispatch across different browsers, logins, and devices via Supabase Realtime Broadcast!
  try {
    const channel = getGlobalChannel();
    const message = {
      type: 'broadcast',
      event: 'table-update',
      payload: { table: norm, timestamp: Date.now() },
    };

    if (isChannelSubscribed) {
      channel.send(message);
    } else {
      sendQueue.push(message);
      // Cap queue size
      if (sendQueue.length > 20) sendQueue.shift();
    }
  } catch (err) {
    console.warn('Realtime broadcast error:', err);
  }
}
