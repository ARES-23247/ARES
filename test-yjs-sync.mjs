import Y from 'yjs';
import * as syncProtocol from 'y-protocols/sync';
import * as encoding from 'lib0/encoding';
import * as decoding from 'lib0/decoding';
import WebSocket from 'ws';

const doc = new Y.Doc();
const ws = new WebSocket('wss://aresweb-partykit.thehomelessguy.partykit.dev/parties/main/test-room');

ws.on('open', () => {
  console.log('Connected to WebSocket!');
  
  // Create SyncStep1
  const encoder = encoding.createEncoder();
  encoding.writeVarUint(encoder, 0); // messageSync
  syncProtocol.writeSyncStep1(encoder, doc);
  
  ws.send(encoding.toUint8Array(encoder));
  console.log('Sent SyncStep1');
});

ws.on('message', (data) => {
  console.log('Received message from server, byteLength:', data.byteLength);
  
  try {
    const decoder = decoding.createDecoder(new Uint8Array(data));
    const messageType = decoding.readVarUint(decoder);
    
    if (messageType === 0) { // messageSync
      const syncType = decoding.readVarUint(decoder);
      console.log('Sync message type:', syncType);
      
      if (syncType === 2) { // messageYjsSyncStep2
        console.log('Received SyncStep2! Server is healthy.');
        process.exit(0);
      }
    } else {
      console.log('Other message type:', messageType);
    }
  } catch (e) {
    console.error('Error parsing message:', e);
  }
});

ws.on('close', (code, reason) => {
  console.log('Connection closed:', code, reason.toString());
  process.exit(1);
});

ws.on('error', (err) => {
  console.error('WebSocket error:', err);
  process.exit(1);
});

setTimeout(() => {
  console.error('Timed out waiting for SyncStep2');
  process.exit(1);
}, 5000);
