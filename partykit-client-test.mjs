import YPartyKitProvider from 'y-partykit/provider';
import * as Y from 'yjs';
import WebSocket from 'ws';

global.WebSocket = WebSocket;

const ydoc = new Y.Doc();
const provider = new YPartyKitProvider(
  'aresweb-partykit.thehomelessguy.partykit.dev',
  'test-room-5',
  ydoc,
  {
    WebSocketPolyfill: WebSocket
  }
);

provider.on('sync', isSynced => {
  console.log('SYNCED:', isSynced);
  if (isSynced) {
    process.exit(0);
  }
});

setTimeout(() => {
  console.log('TIMEOUT. isSynced:', provider.synced);
  process.exit(1);
}, 5000);
