export interface ParsedCsvRow {
  item_id: string | null;
  title: string;
  url: string;
  product_url: string | null;
  price: number | null;
  sales: number | null;
  store_name: string | null;
  commission_rate: string | null;
  commission: number | null;
}

/**
 * Parseia uma linha CSV respeitando aspas duplas e vírgulas dentro de campos.
 * Campos entre aspas podem conter vírgulas; aspas internas são escapadas como "".
 */
function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (inQuotes) {
      if (char === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        fields.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
  }
  fields.push(current.trim());
  return fields;
}

/**
 * Converte "59,94" ou "R$1,80" ou "1.234,56" para número.
 */
function parseNumber(raw: string): number | null {
  if (!raw) return null;
  const cleaned = raw
    .replace(/[R$\s%]/g, '')
    .replace(/\./g, '')
    .replace(',', '.');
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

/**
 * Parseia o conteúdo CSV exportado do programa de afiliados Shopee.
 * Cabeçalho esperado:
 * Item Id,Item Name,Price,Sales,Nome da loja,Commission Rate,Commission,Product Link,Offer Link
 *
 * Também aceita texto com apenas URLs (um por linha) para compatibilidade.
 */
export function parseCsvContent(content: string): ParsedCsvRow[] {
  const lines = content
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) return [];

  // Detecta se a primeira linha é cabeçalho
  const firstLine = lines[0].toLowerCase();
  const hasHeader =
    firstLine.includes('item id') ||
    firstLine.includes('item name') ||
    firstLine.includes('offer link');

  const startIndex = hasHeader ? 1 : 0;
  const rows: ParsedCsvRow[] = [];

  for (let i = startIndex; i < lines.length; i++) {
    const fields = parseCsvLine(lines[i]);

    // Se a linha tem só 1 campo e parece URL, trata como importação simples
    if (fields.length === 1) {
      const url = fields[0];
      if (url.startsWith('http')) {
        rows.push({
          item_id: null,
          title: '',
          url,
          product_url: null,
          price: null,
          sales: null,
          store_name: null,
          commission_rate: null,
          commission: null,
        });
      }
      continue;
    }

    // Mapeia por posição do cabeçalho Shopee:
    // 0: Item Id, 1: Item Name, 2: Price, 3: Sales, 4: Nome da loja,
    // 5: Commission Rate, 6: Commission, 7: Product Link, 8: Offer Link
    const item_id = fields[0] || null;
    const title = fields[1] || '';
    const price = parseNumber(fields[2] ?? '');
    const sales = fields[3] ? parseInt(fields[3], 10) || null : null;
    const store_name = fields[4] || null;
    const commission_rate = fields[5] || null;
    const commission = parseNumber(fields[6] ?? '');
    const product_url = fields[7] || null;
    const offerLink = fields[8] || product_url || '';

    if (!offerLink && !product_url) continue;

    rows.push({
      item_id,
      title,
      url: offerLink,
      product_url,
      price,
      sales,
      store_name,
      commission_rate,
      commission,
    });
  }

  return rows;
}
