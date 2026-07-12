// src/tests/TillModelTests.js

const Till = require('../models/Till');

describe('Till Model', () => {
  it('should have a last_seen_at field', async () => {
    const till = new Till();
    expect(till).toHaveProperty('last_seen_at');
    expect(till.last_seen_at).toBeNull(); // Assuming default value is null
  });

  it('should update last_seen_at on every WebSocket connection', async () => {
    const till = new Till();
    const currentTime = new Date();
    till.updateLastSeenAt(currentTime);
    expect(till.last_seen_at).toEqual(currentTime);
  });
});