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
 *
 * A cada vírgula fora de aspas, olhamos se há um dígito colado imediatamente
 * antes dela (ex.: em "...- 1," é o "1"; em "58207910598," é "58207910598")
 * e se os 2 dígitos imediatamente depois batem com o padrão de centavos:
 *
 * - Se NÃO há dígito colado antes da vírgula → é separador de campo normal.
 * - Se o campo acumulado até ali (sem contar um "R$" na frente) NÃO tem
 *   nenhuma letra — ou seja, ainda parece só um número/moeda puro, como um
 *   Item Id ou um Price — só tratamos a vírgula como decimal se os 2 dígitos
 *   seguintes fecharem "limpo" em outra vírgula ou no fim da linha (ex.:
 *   "3999,90," ou "R$1,80" no fim da linha), E somente se esse campo ainda
 *   não tiver mesclado nenhuma vírgula decimal antes (dinheiro só tem uma
 *   parte decimal). Isso evita dois bugs: (1) um nome de produto que começa
 *   com número (ex.: "58207910598,10 Sacolinhas...") ser lido como se o "10"
 *   fosse centavos do Item Id — depois dos 2 dígitos vem espaço, não
 *   vírgula/fim, então não mescla; (2) um campo já mesclado tipo "1211,23"
 *   engolir a vírgula seguinte e grudar o próximo campo ("1211,23,10" viraria
 *   um valor só em vez de Price="1211,23" e Sales="10").
 * - Se o campo já tem alguma letra (é claramente texto corrido, tipo um
 *   título de produto) → mescla sempre que os 2 dígitos seguintes baterem,
 *   mesmo que várias vezes no mesmo campo (ex.: "Estante ... - 1,50 X 1,90 X
 *   0,30 ( 30 Nichos )" sem aspas: cada "N,NN" no meio do texto é protegido,
 *   então o título inteiro continua sendo um único campo em vez de se
 *   fragmentar em vários pedaços e desalinhar todas as colunas seguintes).
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
        const hasDigitBefore = /\d$/.test(current);
        let isDecimalComma = false;
        if (hasDigitBefore) {
          const rest = line.slice(i + 1);
          const withoutMoneyPrefix = current.replace(/^\s*R\$/, '');
          const isFreeText = /[A-Za-zÀ-ÿ]/.test(withoutMoneyPrefix);
          if (isFreeText) {
            // Texto corrido: protege qualquer "N,NN" embutido, quantas vezes aparecer.
            isDecimalComma = /^\d{2}(?!\d)/.test(rest);
          } else if (!current.includes(',')) {
            // Ainda parece só número/moeda, e ainda não mesclou nenhuma
            // vírgula decimal: só mescla se fechar limpo (vírgula ou fim).
            isDecimalComma = /^\d{2}(?=,|$)/.test(rest);
          }
        }
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
 * Divide o conteúdo em "linhas" (registros) respeitando aspas — uma quebra
 * de linha DENTRO de um campo entre aspas (ex.: um nome de produto colado
 * com uma quebra de linha real no meio) não conta como fim de linha, senão
 * aquele registro seria cortado ao meio e todas as colunas dali pra frente
 * viriam desalinhadas. Um `content.split(/\r?\n/)` simples (usado antes)
 * não tinha essa proteção.
 */
function splitCsvRecords(content: string): string[] {
  const records: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < content.length; i++) {
    const char = content[i];

    if (inQuotes) {
      if (char === '"') {
        if (content[i + 1] === '"') {
          current += '""';
          i++;
        } else {
          inQuotes = false;
          current += char;
        }
      } else {
        current += char;
      }
    } else if (char === '"') {
      inQuotes = true;
      current += char;
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && content[i + 1] === '\n') i++;
      if (current.trim().length > 0) records.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  if (current.trim().length > 0) records.push(current.trim());
  return records;
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
  const lines = splitCsvRecords(content).filter((l) => !isHeaderLine(l));

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
