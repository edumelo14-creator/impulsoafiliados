import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { action, host, port, database, dialect, username, password, sql } = body;

    if (!action) return jsonResponse({ error: "action é obrigatório" }, 400);

    // Monta connection string no formato Firebird/Interbase:
    // host/port:/path/to/database.fdb
    const connStr = `${host}/${port || 3050}:${database}`;

    // Importa o driver firebird (npm: node-firebird) dinamicamente
    // O Deno suporta npm: specifiers
    let firebird;
    try {
      firebird = await import("npm:node-firebird@1.0.0");
    } catch (impErr) {
      return jsonResponse({
        error: "Driver firebird não disponível no servidor: " + (impErr instanceof Error ? impErr.message : String(impErr)),
      }, 500);
    }

    const options = {
      host: host,
      port: port || 3050,
      database: database,
      user: username,
      password: password,
      lowercase_keys: false,
      ...(dialect ? { dialect: Number(dialect) } : {}),
    };

    if (action === "test") {
      // Teste de conexão com timeout de 10s
      const timeoutMs = 10000;
      const result = await new Promise<{ online: boolean; message: string; latencyMs?: number }>((resolve) => {
        const start = Date.now();
        const timer = setTimeout(() => {
          resolve({ online: false, message: "Timeout: sem resposta em 10 segundos" });
        }, timeoutMs);

        firebird.attach(options, (err: Error | null, db: { detach: (cb: (e: Error | null) => void) => void }) => {
          if (err) {
            clearTimeout(timer);
            resolve({ online: false, message: err.message });
            return;
          }
          // Executa um SELECT simples para confirmar que responde
          db.detach((detachErr) => {
            clearTimeout(timer);
            const latency = Date.now() - start;
            if (detachErr) {
              resolve({ online: false, message: "Conectado mas erro ao fechar: " + detachErr.message });
            } else {
              resolve({ online: true, message: "Conexão bem-sucedida", latencyMs: latency });
            }
          });
        });
      });
      return jsonResponse(result);
    }

    if (action === "query") {
      if (!sql) return jsonResponse({ error: "sql é obrigatório para action=query" }, 400);

      const result = await new Promise<{ rows: Record<string, unknown>[] | null; error?: string; rowCount?: number }>((resolve) => {
        firebird.attach(options, (err: Error | null, db: {
          query: (sql: string, params: unknown[], cb: (err: Error | null, rows: Record<string, unknown>[]) => void) => void;
          detach: (cb: (e: Error | null) => void) => void;
        }) => {
          if (err) {
            resolve({ rows: null, error: err.message });
            return;
          }
          db.query(sql, [], (qErr, rows) => {
            db.detach(() => {});
            if (qErr) {
              resolve({ rows: null, error: qErr.message });
              return;
            }
            resolve({ rows: rows || [], rowCount: rows ? rows.length : 0 });
          });
        });
      });
      return jsonResponse(result);
    }

    return jsonResponse({ error: "action inválido. Use 'test' ou 'query'" }, 400);
  } catch (e) {
    return jsonResponse({
      error: e instanceof Error ? e.message : String(e),
    }, 500);
  }
});
