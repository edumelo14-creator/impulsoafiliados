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
 *
 * Também protege vírgulas decimais no formato brasileiro (ex.: "3.587,91" ou
 * "R$1,80") mesmo quando o campo NÃO está entre aspas — o export de afiliados
 * da Shopee frequentemente não coloca aspas em colunas monetárias como Price e
 * Commission, e uma vírgula "solta" ali quebra o alinhamento de todas as
 * colunas seguintes daquela linha (o que fazia o preço importado vir errado,
 * às vezes pegando um pedaço de outra coluna, como a taxa de comissão).
 * Regra: uma vírgula fora de aspas NÃO separa campos quando (a) o campo
 * acumulado até ali é puramente numérico/monetário (só dígitos, pontos e um
 * "R$" opcional — ainda sem nenhuma vírgula mesclada) e (b) ela é seguida por
 * exatamente 2 dígitos que não continuam com mais dígitos — o padrão de
 * centavos em pt-BR (dinheiro sempre tem 2 casas decimais). A condição (a) é
 * essencial: sem ela, uma vírgula real de separação de campo seguida por um
 * campo qualquer de 2 dígitos (ex.: a coluna "Sales" com valor "50") seria
 * incorretamente engolida também. Depois de mesclar uma vírgula decimal, o
 * campo passa a conter uma vírgula e (a) deixa de valer, então uma segunda
 * vírgula no mesmo campo nunca é mesclada.
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
        const isNumericSoFar = /^(R\$)?\s*\d+(\.\d+)*$/.test(current.trim());
        const isDecimalComma =
          isNumericSoFar && /^\d{2}(?!\d)/.test(line.slice(i + 1));
        if (isDecimalComma) {
          current += char;
        } else {
          fields.push(current.trim());
          current = '';
        }
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

function isHeaderLine(line: string): boolean {
  const lower = line.toLowerCase();
  return (
    lower.includes('item id') ||
    lower.includes('item name') ||
    lower.includes('offer link')
  );
}

/**
 * Parseia o conteúdo CSV exportado do programa de afiliados Shopee.
 * Cabeçalho esperado:
 * Item Id,Item Name,Price,Sales,Nome da loja,Commission Rate,Commission,Product Link,Offer Link
 *
 * Também aceita texto com apenas URLs (um por linha) para compatibilidade.
 *
 * O conteúdo pode conter várias exportações coladas/anexadas em sequência
 * (ex.: ao importar vários arquivos CSV de uma vez) — por isso uma linha de
 * cabeçalho é ignorada onde quer que apareça, não só na primeira linha.
 */
export function parseCsvContent(content: string): ParsedCsvRow[] {
  const lines = content
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !isHeaderLine(l));

  if (lines.length === 0) return [];

  const rows: ParsedCsvRow[] = [];

  for (let i = 0; i < lines.length; i++) {
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
