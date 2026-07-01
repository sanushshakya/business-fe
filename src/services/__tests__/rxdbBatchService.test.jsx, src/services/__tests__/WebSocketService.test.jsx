// src/services/__tests__/rxdbBatchService.test.jsx

import { describe, it, expect } from 'vitest';
import rxdbBatchService from '../rxdbBatchService';

describe('rxdbBatchService', () => {
  it('should batch records correctly', async () => {
    const mockRecords = [
      { _id: '1', data: 'record1' },
      { _id: '2', data: 'record2' },
    ];
    const batchSize = 1;
    const batches = await rxdbBatchService.batchRecords(mockRecords, batchSize);
    
    expect(batches).toEqual([
      [{ _id: '1', data: 'record1' }],
      [{ _id: '2', data: 'record2' }],
    ]);
  });

  it('should handle empty records array', async () => {
    const mockRecords = [];
    const batchSize = 1;
    const batches = await rxdbBatchService.batchRecords(mockRecords, batchSize);
    
    expect(batches).toEqual([]);
  });
});
```

```jsx
// src/services/__tests__/WebSocketService.test.jsx

import { describe, it, expect } from 'vitest';
import WebSocketService from '../WebSocketService';

describe('WebSocketService', () => {
  let mockSocket;
  let service;

  beforeEach(() => {
    mockSocket = new MockWebSocket();
    service = new WebSocketService(mockSocket);
  });

  it('should send messages correctly', async () => {
    const message = { type: 'alert', data: 'new alert' };
    
    await service.sendMessage(message);

    expect(mockSocket.send).toHaveBeenCalledWith(JSON.stringify(message));
  });

  it('should handle connection error', async () => {
    mockSocket.readyState = WebSocket.CLOSED;
    
    try {
      await service.sendMessage({ type: 'alert', data: 'error message' });
    } catch (error) {
      expect(error.message).toBe('WebSocket is not open');
    }
  });
});

class MockWebSocket {
  readyState = WebSocket.OPEN;

  send(data) {}

  onopen() {}
  onmessage(event) {}
  onclose(event) {}
 .onerror(error) {}
}