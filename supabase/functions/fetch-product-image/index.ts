import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { url } = await req.json().catch(() => ({}));
    if (!url || typeof url !== "string") {
      return json({ error: "URL não fornecida" }, 400);
    }

    const result = await fetchProductData(url);

    if (!result.image_url && result.price == null) {
      return json({ error: "Dados não encontrados" }, 404);
    }

    return json(result, 200);
  } catch (err) {
    return json({ error: `Erro interno: ${String(err)}` }, 500);
  }
});

interface ProductData {
  image_url: string | null;
  price: number | null;
}

async function fetchProductData(productUrl: string): Promise<ProductData> {
  // Shopee serves a special pre-rendered HTML to crawlers like TelegramBot/TwitterBot
  // that includes og:image meta tags with the actual product image and price data.
  const crawled = await scrapeWithCrawlerUA(productUrl);
  if (crawled) return crawled;

  // Fallback: regular scraping with browser UA
  const scraped = await scrapeOgImage(productUrl);
  if (scraped) return scraped;

  return { image_url: null, price: null };
}

async function scrapeWithCrawlerUA(url: string): Promise<ProductData | null> {
  try {
    const resp = await fetch(url, {
      redirect: "follow",
      headers: {
        "User-Agent": "TelegramBot (like TwitterBot)",
        "Accept": "text/html,application/xhtml+xml",
        "Accept-Language": "pt-BR,pt;q=0.9",
      },
    });
    if (!resp.ok) return null;

    const html = await resp.text();
    return {
      image_url: extractOgImage(html),
      price: extractPrice(html),
    };
  } catch {
    return null;
  }
}

async function scrapeOgImage(url: string): Promise<ProductData | null> {
  try {
    const resp = await fetch(url, {
      redirect: "follow",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
      },
    });
    if (!resp.ok) return null;

    const html = await resp.text();
    return {
      image_url: extractOgImage(html),
      price: extractPrice(html),
    };
  } catch {
    return null;
  }
}

function extractOgImage(html: string): string | null {
  // og:image meta tag - property before content
  const ogMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i);
  if (ogMatch?.[1]) return ogMatch[1];

  // og:image meta tag - content before property
  const ogReverse = html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
  if (ogReverse?.[1]) return ogReverse[1];

  // twitter:image
  const twMatch = html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i);
  if (twMatch?.[1]) return twMatch[1];

  // Shopee CDN images (susercontent.com or cf.shopee)
  const imgMatch = html.match(/https?:\/\/(?:cf\.shopee\.(?:sg|br|com\.br)|down-[^.]+\.img\.susercontent\.com)\/file\/[^"'\s]+/i);
  if (imgMatch?.[0]) return imgMatch[0];

  return null;
}

function extractPrice(html: string): number | null {
  // 1. JSON-LD structured data - look for "price" or "lowPrice" field
  const jsonLdBlocks = html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
  for (const block of jsonLdBlocks) {
    const jsonText = block[1];
    // lowPrice (price range)
    const lowPriceMatch = jsonText.match(/"lowPrice"\s*:\s*"?(\d+(?:\.\d+)?)"/i);
    if (lowPriceMatch?.[1]) {
      const price = parseFloat(lowPriceMatch[1]);
      if (!isNaN(price) && price > 1) return price;
    }
    // price field
    const priceMatch = jsonText.match(/"price"\s*:\s*"?(\d+(?:\.\d+)?)"/i);
    if (priceMatch?.[1]) {
      const price = parseFloat(priceMatch[1]);
      if (!isNaN(price) && price > 1) return price;
    }
  }

  // 2. product:price:amount meta tag (Open Graph Product)
  const metaPriceMatch = html.match(/<meta[^>]+property=["']product:price:amount["'][^>]+content=["']([^"']+)["']/i);
  if (metaPriceMatch?.[1]) {
    const price = parseFloat(metaPriceMatch[1]);
    if (!isNaN(price) && price > 1) return price;
  }

  // 3. Shopee page data: the itemdatasection or page data contains price in cents
  // Shopee stores prices in cents (e.g., 733408 = R$ 7334.08)
  // Only match when the key is clearly "price" and value is 5+ digits (to avoid matching
  // things like shipping fees or small numbers)
  const shopeePriceMatch = html.match(/"price"\s*:\s*(\d{5,})/);
  if (shopeePriceMatch?.[1]) {
    const priceInCents = parseInt(shopeePriceMatch[1], 10);
    if (priceInCents > 1000) {
      return priceInCents / 100;
    }
  }

  // 4. Visible price text: "R$ 7.334,08" or "R$7334,08" patterns
  // Look for the largest R$ price in the page (shipping fees and small amounts
  // are usually lower than the product price)
  let bestPrice: number | null = null;
  const visiblePriceMatches = html.matchAll(/R\$\s*(\d{1,3}(?:\.\d{3})*,\d{2})/gi);
  for (const match of visiblePriceMatches) {
    const priceStr = match[1];
    const price = parseFloat(priceStr.replace(/\./g, '').replace(',', '.'));
    if (!isNaN(price) && price > 1) {
      if (bestPrice === null || price > bestPrice) {
        bestPrice = price;
      }
    }
  }
  if (bestPrice !== null) return bestPrice;

  return null;
}

function json(data: unknown, status: number): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
