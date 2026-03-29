/**
 * Shared in-memory broadcast store.
 * Admin routes write to this; game/state reads from it.
 */
const broadcastStore = [];
module.exports = broadcastStore;
