import type { Plugin } from 'vite';

interface InterbaseConfig {
  host: string;
  port: number;
  database: string;
  dialect?: number;
  username: string;
  password: string;
  timeout?: number;
}

export function interbaseProxyPlugin(): Plugin {
  let fb: typeof import('node-firebird') | null = null;

  async function getFirebird() {
    if (!fb) {
      fb = await import('node-firebird');
    }
    return fb;
  }

  function attach(cfg: InterbaseConfig, cb: (err: Error | null, db: any) => void) {
    getFirebird().then(mod => {
      mod.attach({
        host: cfg.host,
        port: cfg.port || 3050,
        database: cfg.database,
        user: cfg.username,
        password: cfg.password,
        lowercase_keys: false,
        ...(cfg.dialect ? { dialect: cfg.dialect } : {}),
      }, cb);
    }).catch((err: Error) => cb(err, null as any));
  }

  function testConnection(cfg: InterbaseConfig): Promise<{ online: boolean; message: string; latencyMs?: number }> {
    return new Promise((resolve) => {
      const timeoutMs = (cfg.timeout ?? 10) * 1000;
      const start = Date.now();
      const timer = setTimeout(() => {
        resolve({ online: false, message: `Timeout: sem resposta em ${cfg.timeout ?? 10} segundos` });
      }, timeoutMs);

      attach(cfg, (err, db) => {
        if (err) {
          clearTimeout(timer);
          resolve({ online: false, message: err.message });
          return;
        }
        db.detach((detachErr: Error | null) => {
          clearTimeout(timer);
          const latency = Date.now() - start;
          if (detachErr) {
            resolve({ online: false, message: 'Conectado mas erro ao fechar: ' + detachErr.message });
          } else {
            resolve({ online: true, message: 'Conexão bem-sucedida', latencyMs: latency });
          }
        });
      });
    });
  }

  function runQuery(cfg: InterbaseConfig, sql: string): Promise<{ rows: Record<string, unknown>[] | null; error?: string; rowCount?: number }> {
    return new Promise((resolve) => {
      const timeoutMs = (cfg.timeout ?? 10) * 1000;
      const timer = setTimeout(() => {
        resolve({ rows: null, error: `Timeout: sem resposta em ${cfg.timeout ?? 10} segundos` });
      }, timeoutMs);
      attach(cfg, (err, db) => {
        if (err) {
          clearTimeout(timer);
          resolve({ rows: null, error: err.message });
          return;
        }
        db.query(sql, [], (qErr: Error | null, rows: Record<string, unknown>[]) => {
          db.detach(() => {});
          clearTimeout(timer);
          if (qErr) {
            resolve({ rows: null, error: qErr.message });
            return;
          }
          resolve({ rows: rows || [], rowCount: rows ? rows.length : 0 });
        });
      });
    });
  }

  function readBody(req: any): Promise<string> {
    return new Promise((resolve, reject) => {
      let data = '';
      req.on('data', (chunk: Buffer) => { data += chunk; });
      req.on('end', () => resolve(data));
      req.on('error', reject);
    });
  }

  function sendJson(res: any, status: number, body: unknown) {
    res.writeHead(status, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    res.end(JSON.stringify(body));
  }

  return {
    name: 'interbase-proxy',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url || '';
        if (!url.startsWith('/api/interbase/')) {
          next();
          return;
        }

        if (req.method === 'OPTIONS') {
          sendJson(res, 200, {});
          return;
        }

        try {
          const bodyStr = await readBody(req);
          const body = bodyStr ? JSON.parse(bodyStr) : {};

          if (url === '/api/interbase/test') {
            const result = await testConnection(body);
            sendJson(res, 200, result);
          } else if (url === '/api/interbase/query') {
            const result = await runQuery(body, body.sql);
            sendJson(res, 200, result);
          } else {
            sendJson(res, 404, { error: 'Not found' });
          }
        } catch (e) {
          sendJson(res, 500, { error: e instanceof Error ? e.message : String(e) });
        }
      });
    },
  };
}
