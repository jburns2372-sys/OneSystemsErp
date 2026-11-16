'use strict';

/**
 * Official Neon Serverless WebSocket (`wss://<endpoint>:443/v2`) PostgreSQL Wire Transport
 *
 * Hardened per Task 4 offline lifecycle investigation:
 * - Attempt-scoped WebSocket retry (tracks `attemptId` and `retryTimer` so stale sockets or dual
 *   `onerror`+`onclose` events never double-retry or leak sockets).
 * - Complete `Duplex` terminal lifecycle on `_final()` (`this.push(null)` + WebSocket close + callback)
 *   and `_destroy()` (drains/fails `_pendingWrites` and closes WebSocket without manual `'close'` emit
 *   conflicts), eliminating indefinite `await client.end()` hangs.
 * - Exports `endPgClientBounded(client, timeoutMs)` so callers never block indefinitely on shutdown.
 * - Loopback bridge (`startLocalNeonWsBridge`) records upstream errors, guards `ws.send()` in `try/catch`,
 *   handles fragmented initial bytes cleanly, and bounds shutdown.
 */

const net = require('node:net');
const { Duplex } = require('node:stream');
const { Client } = require('pg');

function openResilientWebSocket(url, totalTimeoutMs, handlers) {
  const deadline = Date.now() + totalTimeoutMs;
  let currentAttemptId = 0;
  let activeWs = null;
  let opened = false;
  let terminated = false;
  let retryTimer = null;

  const clearTimers = () => {
    clearTimeout(overallTimer);
    if (retryTimer) {
      clearTimeout(retryTimer);
      retryTimer = null;
    }
  };

  const overallTimer = setTimeout(() => {
    if (!opened && !terminated) {
      terminated = true;
      if (retryTimer) {
        clearTimeout(retryTimer);
        retryTimer = null;
      }
      const wsToClose = activeWs;
      activeWs = null;
      if (wsToClose) {
        try {
          wsToClose.close();
        } catch {}
      }
      handlers.onFail(new Error(`Neon WebSocket connect timeout (${totalTimeoutMs}ms)`));
    }
  }, totalTimeoutMs);
  overallTimer.unref();

  function tryConnect() {
    if (terminated) return;
    currentAttemptId += 1;
    const myAttemptId = currentAttemptId;
    let attemptFailed = false;

    const ws = new WebSocket(url);
    ws.binaryType = 'arraybuffer';
    activeWs = ws;

    const failPreOpenOnce = (reason) => {
      if (terminated || myAttemptId !== currentAttemptId || attemptFailed) return;
      attemptFailed = true;
      try {
        ws.close();
      } catch {}
      if (!opened && myAttemptId < 4 && Date.now() + 900 < deadline) {
        retryTimer = setTimeout(() => {
          retryTimer = null;
          tryConnect();
        }, 300 * myAttemptId);
        return;
      }
      terminated = true;
      clearTimers();
      handlers.onFail(new Error(reason || 'Neon WebSocket transport error'));
    };

    ws.onopen = () => {
      if (terminated || myAttemptId !== currentAttemptId) {
        try {
          ws.close();
        } catch {}
        return;
      }
      opened = true;
      clearTimers();
      handlers.onOpen(ws);
    };

    ws.onmessage = (ev) => {
      if (terminated || myAttemptId !== currentAttemptId) return;
      handlers.onMessage(Buffer.from(ev.data));
    };

    ws.onerror = (ev) => {
      if (terminated || myAttemptId !== currentAttemptId) return;
      const msg = ev?.error?.message || ev?.message || 'Neon WebSocket transport error';
      if (!opened) {
        failPreOpenOnce(msg);
      } else {
        terminated = true;
        clearTimers();
        handlers.onFail(new Error(msg));
      }
    };

    ws.onclose = () => {
      if (terminated || myAttemptId !== currentAttemptId) return;
      if (!opened) {
        failPreOpenOnce('Neon WebSocket closed before handshake completed');
        return;
      }
      terminated = true;
      clearTimers();
      handlers.onClose();
    };
  }

  tryConnect();

  return {
    close() {
      terminated = true;
      clearTimers();
      const wsToClose = activeWs;
      activeWs = null;
      if (
        wsToClose &&
        (wsToClose.readyState === WebSocket.OPEN || wsToClose.readyState === WebSocket.CONNECTING)
      ) {
        try {
          wsToClose.close();
        } catch {}
      }
    },
  };
}

class NeonWsPgStream extends Duplex {
  constructor(connectTimeoutMs = 20000) {
    super({ emitClose: true, autoDestroy: true });
    this._handle = null;
    this._ws = null;
    this._connectTimeoutMs = connectTimeoutMs;
    this._pendingWrites = [];
    this._connected = false;
    this._eofPushed = false;
  }

  setNoDelay() {
    return this;
  }

  setKeepAlive() {
    return this;
  }

  ref() {
    return this;
  }

  unref() {
    return this;
  }

  _pushEofOnce() {
    if (!this._eofPushed && !this.destroyed) {
      this._eofPushed = true;
      this.push(null);
    }
  }

  _drainPendingWritesWithError(err) {
    for (const item of this._pendingWrites.splice(0)) {
      try {
        item.cb(err);
      } catch {}
    }
  }

  connect(_port, host) {
    this._handle = openResilientWebSocket(`wss://${host}/v2`, this._connectTimeoutMs, {
      onOpen: (ws) => {
        this._ws = ws;
        this._connected = true;
        for (const item of this._pendingWrites.splice(0)) {
          try {
            ws.send(item.chunk);
            item.cb();
          } catch (err) {
            item.cb(err);
            this._drainPendingWritesWithError(err);
            this.destroy(err);
            return;
          }
        }
        this.emit('connect');
      },
      onMessage: (buf) => {
        if (!this._eofPushed && !this.destroyed) {
          this.push(buf);
        }
      },
      onFail: (err) => {
        this._drainPendingWritesWithError(err);
        if (!this.destroyed) {
          this.destroy(err);
        }
      },
      onClose: () => {
        this._pushEofOnce();
      },
    });
  }

  _read() {}

  _write(chunk, _encoding, callback) {
    if (!this._handle || this.destroyed) {
      return callback(new Error('Neon WebSocket stream closed'));
    }
    if (this._connected && this._ws && this._ws.readyState === WebSocket.OPEN) {
      try {
        this._ws.send(chunk);
        callback();
      } catch (err) {
        callback(err);
      }
    } else {
      this._pendingWrites.push({ chunk: Buffer.from(chunk), cb: callback });
    }
  }

  _final(callback) {
    if (this._handle) {
      this._handle.close();
    }
    // Complete readable side so `pg.Client.end()` receives stream EOF & close deterministically
    this._pushEofOnce();
    callback();
  }

  _destroy(err, callback) {
    this._drainPendingWritesWithError(err || new Error('Stream destroyed'));
    if (this._handle) {
      this._handle.close();
    }
    callback(err);
  }
}

function createNeonWsClient(rawPostgresUrl, appName, extraConfig = {}) {
  const u = new URL(rawPostgresUrl);
  const host = u.hostname;
  const port = Number(u.port || 5432);
  const user = decodeURIComponent(u.username || '');
  const password = decodeURIComponent(u.password || '');
  const database = decodeURIComponent((u.pathname || '').replace(/^\/+/, ''));
  const streamInstance = new NeonWsPgStream(extraConfig.connectionTimeoutMillis || 20000);

  const client = new Client({
    host,
    port,
    user,
    password,
    database,
    ssl: false, // TLS 1.3 + CA/SNI verification is active on outer `wss://${host}/v2`
    stream: () => streamInstance,
    connectionTimeoutMillis: extraConfig.connectionTimeoutMillis || 25000,
    query_timeout: extraConfig.query_timeout || 40000,
    application_name: appName,
    ...(extraConfig.options ? { options: extraConfig.options } : {}),
  });
  client.__neonWsStream = streamInstance;
  return client;
}

async function endPgClientBounded(client, timeoutMs = 5000) {
  if (!client) return;
  let timer = null;
  try {
    await Promise.race([
      client.end().catch(() => {}),
      new Promise((resolve) => {
        timer = setTimeout(() => {
          if (client.__neonWsStream && !client.__neonWsStream.destroyed) {
            try {
              client.__neonWsStream.destroy();
            } catch {}
          }
          resolve();
        }, timeoutMs);
        timer.unref();
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

function startLocalNeonWsBridge(neonHost) {
  return new Promise((resolve, reject) => {
    const sockets = new Set();
    const diagnostics = {
      connectionsAccepted: 0,
      connectionsOpened: 0,
      lastUpstreamError: null,
    };

    const server = net.createServer((tcpSocket) => {
      diagnostics.connectionsAccepted += 1;
      sockets.add(tcpSocket);
      tcpSocket.setNoDelay(true);

      let initialProbeDone = false;
      let initialBuf = Buffer.alloc(0);
      const pendingFrames = [];
      let activeWs = null;

      const sendUpstream = (buf) => {
        if (activeWs && activeWs.readyState === WebSocket.OPEN) {
          try {
            activeWs.send(buf);
          } catch (err) {
            diagnostics.lastUpstreamError = err?.message || 'WS_SEND_ERROR';
            if (!tcpSocket.destroyed) tcpSocket.destroy();
          }
        } else {
          pendingFrames.push(buf);
        }
      };

      const handle = openResilientWebSocket(`wss://${neonHost}/v2`, 25000, {
        onOpen: (ws) => {
          diagnostics.connectionsOpened += 1;
          activeWs = ws;
          for (const frame of pendingFrames.splice(0)) {
            sendUpstream(frame);
          }
        },
        onMessage: (buf) => {
          if (!tcpSocket.destroyed) {
            tcpSocket.write(buf);
          }
        },
        onFail: (err) => {
          diagnostics.lastUpstreamError = err?.message || 'WS_UPSTREAM_FAIL';
          if (!tcpSocket.destroyed) tcpSocket.destroy();
        },
        onClose: () => {
          if (!tcpSocket.destroyed) tcpSocket.end();
        },
      });

      tcpSocket.on('data', (chunk) => {
        if (!initialProbeDone) {
          initialBuf = Buffer.concat([initialBuf, Buffer.from(chunk)]);
          if (initialBuf.length < 8) return;
          initialProbeDone = true;
          // PostgreSQL SSLRequest (`00 00 00 08 04 d2 16 2f`): reply `'N'` on loopback
          if (initialBuf.readUInt32BE(0) === 8 && initialBuf.readUInt32BE(4) === 80877103) {
            tcpSocket.write(Buffer.from([0x4e]));
            const remainder = initialBuf.subarray(8);
            initialBuf = Buffer.alloc(0);
            if (remainder.length > 0) sendUpstream(remainder);
            return;
          }
          const toSend = initialBuf;
          initialBuf = Buffer.alloc(0);
          sendUpstream(toSend);
          return;
        }
        sendUpstream(Buffer.from(chunk));
      });

      tcpSocket.on('close', () => {
        sockets.delete(tcpSocket);
        handle.close();
      });
      tcpSocket.on('error', () => {
        handle.close();
      });
    });

    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address();
      resolve({
        port: addr.port,
        getDiagnostics() {
          return { ...diagnostics };
        },
        buildBridgeUrl(username, password, dbName) {
          const u = new URL(`postgresql://127.0.0.1:${addr.port}/${dbName}`);
          u.username = username;
          u.password = password;
          u.searchParams.set('sslmode', 'disable');
          u.searchParams.set('connect_timeout', '30');
          u.searchParams.set('pool_timeout', '30');
          u.searchParams.set('socket_timeout', '360');
          return u.toString();
        },
        close() {
          return new Promise((res) => {
            const closeTimer = setTimeout(() => res(), 3000);
            closeTimer.unref();
            for (const s of sockets) {
              try {
                s.destroy();
              } catch {}
            }
            server.close(() => {
              clearTimeout(closeTimer);
              res();
            });
          });
        },
      });
    });
  });
}

module.exports = {
  NeonWsPgStream,
  createNeonWsClient,
  endPgClientBounded,
  startLocalNeonWsBridge,
};
