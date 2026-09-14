import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const API_BASE = "https://api.telegram.org";

interface SendPhotoParams {
  chat_id: string;
  photo: string;
  caption?: string;
}

interface SendMessageParams {
  chat_id: string;
  text: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    const body = await req.json().catch(() => ({}));
    const token = body.token as string | undefined;

    if (!token) {
      return json({ error: "Token do bot não fornecido" }, 400);
    }

    // action=getMe — valida o token e retorna info do bot
    if (action === "getMe") {
      const resp = await fetch(`${API_BASE}/bot${token}/getMe`);
      const data = await resp.json();
      return json(data, resp.ok ? 200 : 400);
    }

    // action=getUpdates — descobre chats onde o bot está
    if (action === "getUpdates") {
      const offset = body.offset;
      const params = new URLSearchParams({ timeout: "0" });
      if (offset !== undefined && offset !== null) {
        params.set("offset", String(offset));
      }
      params.set(
        "allowed_updates",
        '["message","my_chat_member","channel_post","chat_member"]',
      );
      const resp = await fetch(
        `${API_BASE}/bot${token}/getUpdates?${params.toString()}`,
      );
      const data = await resp.json();
      return json(data, resp.ok ? 200 : 400);
    }

    // action=sendPhoto — envia foto com caption
    if (action === "sendPhoto") {
      const params = body.params as SendPhotoParams;
      if (!params?.chat_id || !params?.photo) {
        return json({ error: "chat_id e photo são obrigatórios" }, 400);
      }
      const resp = await fetch(`${API_BASE}/bot${token}/sendPhoto`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: params.chat_id,
          photo: params.photo,
          caption: params.caption ?? "",
          parse_mode: "HTML",
        }),
      });
      const data = await resp.json();
      return json(data, resp.ok ? 200 : 400);
    }

    // action=sendMessage — envia apenas texto
    if (action === "sendMessage") {
      const params = body.params as SendMessageParams;
      if (!params?.chat_id || !params?.text) {
        return json({ error: "chat_id e text são obrigatórios" }, 400);
      }
      const resp = await fetch(`${API_BASE}/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: params.chat_id,
          text: params.text,
          parse_mode: "HTML",
          disable_web_page_preview: false,
        }),
      });
      const data = await resp.json();
      return json(data, resp.ok ? 200 : 400);
    }

    return json({ error: "Ação não reconhecida" }, 400);
  } catch (err) {
    return json({ error: `Erro interno: ${String(err)}` }, 500);
  }
});

function json(data: unknown, status: number): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
