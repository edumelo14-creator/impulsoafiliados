export const CATEGORIES = [
  'Eletronicos',
  'Ferramentas',
  'Automotivo',
  'Cozinha',
  'Casa & Decoracao',
  'Moda Feminina',
  'Moda Masculina',
  'Fitness & Saude',
  'Beleza & Cuidados',
  'Pet Shop',
  'Bebes & Criancas',
  'Livros & Educacao',
  'Limpeza',
] as const;

export type Category = (typeof CATEGORIES)[number] | 'Outros';

interface CategoryRule {
  category: Category;
  keywords: string[];
  wholeWords?: string[];
  /** Keywords that should NOT match for this category (anti-keywords) */
  exclude?: string[];
}

const RULES: CategoryRule[] = [
  {
    category: 'Eletronicos',
    keywords: [
      'carregador', 'fone', 'bluetooth', 'headset', 'hub usb', 'usb', 'monitor',
      'tablet', 'chromebook', 'computador', 'smart tv', 'memoria ram', 'repetidor',
      'wifi', 'microfone', 'tripé', 'tripod', 'kit youtuber', 'placa uber',
      'letreiro', 'mouse', 'teclado', 'gamer rgb', 'dock', 'kingston', 'hyperx',
      'lampada led', 'lâmpada led', 'led 9w', 'cadeira gamer',
      'celular', 'iphone', 'samsung galaxy', 'xiaomi', 'poco', 'redmi',
      'smartphone', 'nobreak', 'no-break', 'estabilizador', 'hdmi', 'switch',
      'roteador', 'power bank', 'cabo lightning', 'cabo tipo c', 'cabo usb',
      'speaker', 'caixa de som', 'soundbar', 'home theater', 'antena tv',
      'receptor', 'controle universal', 'pilha recarregavel', 'bateria portatil',
      'ssd', 'hd externo', 'disco rigido', 'pendrive', 'sd card', 'micro sd',
      'cartao de memoria', 'placa de video', 'placa mae', 'processador',
      'water cooler', 'cooler cpu', 'fonte atx', 'gabinete', 'notebook',
      'gamer', 'rgb', 'led rgb', 'extensor wifi', 'ponto de acesso',
      'apple', 'airpods', 'macbook', 'ipad', 'watch',
      'radar detector', 'leitor codigo', 'leitor codigo de barras',
    ],
    exclude: ['suporte parede', 'organizador', 'fita led', 'fita adesiva'],
  },
  {
    category: 'Ferramentas',
    keywords: [
      'chave', 'catraca', 'furadeira', 'parafusadeira', 'ferramentas', 'maleta',
      'pistola de pintura', 'pistola tinta', 'abraçadeira', 'braco',
      'conector eletrico', 'filtro de linha', 'protetor eletrico', 'dps',
      'iclamper', 'conector elétrico', 'cabo de transferencia',
      'cabo transferencia', 'carga de bateria', 'chupeta carga',
      'cabo de bateria', 'cabo bateria', 'pino bateria', 'borne',
      'trena', 'nivel a laser', 'esquadro', 'martelo', 'alicate',
      'serra', 'torno', 'esmeril', 'lixadeira', 'solda', 'soldador',
      'multimetro', 'tacometro', 'termometro digital', 'fita metrica',
    ],
    exclude: ['organizador'],
  },
  {
    category: 'Automotivo',
    keywords: [
      'lavadora alta press', 'lavadora pressao', 'bomba de ar', 'compressor',
      'calibrador', 'carregador de bateria automotivo', 'bateria automotivo',
      'bicicleta eletrica', 'scooter eletrica', 'lava carro', 'lava moto',
      'lava jato', 'kit lavar moto', 'mangueira jardim', 'pulverizador',
      'patinete', 'vonixx', 'v-floc', 'vexus', 'restaurax', 'pretinho',
      'vintex', 'mop blend', 'bicicleta scooter', 'carro veiculo',
      'carro veiculos', 'calibrar pneu', 'pneu', 'capa carro', 'capa moto',
      'defletor', 'parabrisa', 'parachoque', 'rack de teto', 'bagageiro',
      'suporte de moto', 'suporte celular moto', 'suporte celular carro',
      'antena de teto', 'antena tubular', 'cinta de reboque', 'macaco hidraulico',
      'triangulo de seguranca', 'cabo de reboque', 'pracho', 'pra-choque',
      'retrovisor', 'espelho retrovisor', 'calota', 'vala', 'tapete de carro',
      'automotivo', 'coxim do motor', 'amortecedor', 'embreagem',
      'pastilha de freio', 'disco de freio', 'virabrequim',
      'multiuso motor', 'kit motor', 'peca de motor', 'pecas de motor',
    ],
    exclude: ['celular', 'iphone', 'tablet'],
  },
  {
    category: 'Cozinha',
    keywords: [
      'bule', 'coador', 'chaleira', 'panela', 'frigideira', 'assadeira',
      'travessa', 'copo termico', 'copo térmico', 'garrafa termica',
      'garrafa agua', 'squeeze', 'potes', 'temperos', 'condimentos',
      'cortador legumes', 'processador alimentos', 'cozedor ovos',
      'forma pudim', 'forma bolo', 'torneira',
      'silicone cozinha', 'sanduicheira', 'caf', 'molde bolo',
      'utensilio cozinha', 'caneca chop', 'kit cafe manha', 'kit café',
      'jarra', 'liquidificador', 'batedeira', 'cafeteira', 'air fryer',
      'fritadeira eletrica', 'forno eletrico', 'fogao portatil',
      'cooktop', 'fogao', 'geladeira', 'freezer', 'coifa', 'depurador',
      'torradeira', 'panela eletrica', 'panela de pressao eletrica',
      'multiprocessador', 'ralar', 'ralador', 'escorredor de louca',
      'escorredor macarrao', 'cesta de comida', 'portas temperos',
      'azeite', 'oleo de cozinha', 'sal grosso', 'sal fino',
      'tabua de corte', 'cutelo', 'facas de cozinha', 'kit de facas',
      'bowl', 'presea', 'presilha', 'panos de prato', 'puxa saco',
    ],
    exclude: ['termico 32 litros', 'cooler'],
  },
  {
    category: 'Casa & Decoracao',
    keywords: [
      'lustre', 'espelho', 'organizador', 'suporte parede', 'cabide',
      'luminaria', 'luminária', 'lixeira', 'ventilador teto', 'nicho',
      'suporte papel', 'shaun', 'almofada', 'manta bebe', 'manta infantil',
      'cooler', 'termica 32', 'térmica 32', 'umidificador', 'cama pet',
      'lixeira sensor', 'ventilador aromatizador', 'arandela', 'iluminaria',
      'faca churrasco', 'travesseiro', 'raquete mosquito', 'bolsa maternidade',
      'cortina', 'persiana', 'tapete', 'almofad', 'manta',
      'abajur', 'candeeiro', 'relogio de parede', 'relogio de mesa',
      'quadro decorativo', 'poster', 'puff', 'banqueta', 'banco',
      'cesta de decoracao', 'decoracao', 'decor', 'porta joias',
      'porta temperos decorativo', 'vaso decorativo', 'porta retrato',
      'moldura', 'suporte tv', 'suporte de tv', 'prateleira',
      'cabideiro', 'sapateira', 'caixa organizadora', 'caixas organizar',
      'hook', 'cabo de vassoura', 'cesto de roupa', 'cesto organizar',
      'balanco de parede', 'bancada', 'estante', 'criado mudo',
      'cama', 'colchao', 'colchão', 'sofa', 'poltrona', 'mesa de centro',
      'mesa de jantar', 'cadeira de jantar', 'rack de sala',
    ],
    // 'cama' e 'casinha' sozinhos também aparecem em produtos pet (cama pet,
    // casinha de cachorro) — exclui esses casos para a regra de Pet Shop
    // (mais específica) decidir primeiro.
    exclude: ['teclado', 'mouse', 'hub usb', 'monitor', 'lampada led', 'pet', 'cachorro', 'gato'],
  },
  {
    category: 'Moda Feminina',
    keywords: [
      'feminin', 'conjunto femin', 'vestido', 'macacão femin', 'macaquinho',
      'legging', 'short femin', 'pijama femin', 'baby doll', 'blusinha',
      'cropped', 'alfaiataria femin', 'calça pantalona', 'suplex femin',
      'bolsa femin', 'tule', 'saia', 'casaco frio femin', 'blusa frio femin',
      'blusa tricot', 'jeans feminin', 'fitness femin', 'academia femin',
      'premium longo', 'linho', 'short doll', 'pijaminhas', 'camisola',
      'gabi', 'valentina', 'gringo', 'duna', 'sandalia femin', 'sandália femin',
      'femenino', 'conjunto femenino', 'scarpin', 'bico fino', 'salto fino',
      'salto taça', 'salto taca', 'verniz', 'boneca', 'camisa feminina',
      'camisa feminin', 'blusa feminina', 'blusa feminin', 'conjunto lingerie',
      'cueca feminina', 'calcinha', 'soutien', 'bralette', 'top femin',
      'meia calca', 'meia cano alto', 'conjunto cropp', 'roupa femin',
      'sapato feminin', 'sapatilha', 'tamanho femin', 'roupa intima',
    ],
    exclude: ['masculin', 'tenis', 'tênis', 'sapatenis', 'sapatênis', 'bebe', 'bebê', 'infantil'],
  },
  {
    category: 'Moda Masculina',
    keywords: [
      'masculin', 'calça jeans mascul', 'jeans country', 'caterpillar',
      'sapatenis mascul', 'sapatênis mascul', 'camiseta pai', 'melhor pai',
      'moletom mascul', 'bermudas mascul', 'bermuda mascul', 'slide mascul',
      'puffer mascul', 'kit 2 blusa moletom', 'kit dia dos pais',
      'kit presente mascul', 'boné grife', 'boné carteira', 'corta vento monster',
      'bomber', 'cinto carteira', 'kit churrasco', 'snaaker',
      'camiseta masculin', 'camiseta basica mascul', 'camisa masculin',
      'camisa social mascul', 'camisa polo mascul', 'tenis masculin',
      'tênis masculin', 'sapato masculin', 'meia masculin', 'cueca masculin',
      'calca masculin', 'calça masculin', 'jaqueta masculin', 'casaco mascul',
      'jaqueta jeans', 'camisa xadrez', 'tenis casual mascul',
      'sapato social mascul', 'mocassim mascul', 'alpargata mascul',
    ],
    exclude: ['feminin', 'femenino', 'bebe', 'bebê', 'infantil'],
  },
  {
    category: 'Fitness & Saude',
    keywords: [
      'creatina', 'whey protein', 'bcaa', 'shaker', 'halteres', 'halter',
      'treino funcional', 'kettlebell', 'supino', 'aparelho abdominal',
      'pistola massagem', 'massageador', 'massagem muscular', 'tenis corrida',
      'tênis corrida', 'placa carbono corrida', 'maratona', 'melatonina',
      'biotina', 'vitamina c', 'gummy night', 'esportivo academia',
      'fitness academia', 'fitness treino', 'musculacao', 'musculação',
      'crossfit', 'kit treino', 'abdominal ventosa', 'esteira', 'bicicleta ergometrica',
      'bicicleta ergométrica', 'eliptico', 'remador', 'barra de fixacao',
      'barra fixação', 'peso 5kg', 'peso 10kg', 'anilha', 'caneleira',
      'corda de pular', 'mat de yoga', 'tapa de yoga', 'bloco de yoga',
      'fitness top', 'top de academia', 'legging academia', 'short academia',
      'suplemento', 'pre treino', 'pré treino', 'termogenico', 'termogênico',
      'colageno hidrolisado', 'omega 3', 'multivitaminico', 'zma',
      'garrafa de agua fitness', 'garrafa de água fitness',
    ],
    exclude: ['iphone', 'celular', 'monitor'],
  },
  {
    category: 'Beleza & Cuidados',
    keywords: [
      'depilador', 'ipl', 'luz pulsada', 'escova capilar', 'escova dentes',
      'antiqueda', 'escova secadora', 'secador cabelo', 'chapinha',
      'modelador cachos', 'skincare', 'hidratante', 'oleo corporal',
      'óleo corporal', 'perfume', 'esmalte', 'shampoo', 'cosmetico',
      'eudora', 'siage', 'natura tododia', 'loreal', 'elseve', 'kokeshi',
      'nativa spa', 'paixao framboesa', 'lin paixao', 'sabonete facial',
      'creme gel', 'colageno', 'maquiagem', 'barbear', 'aparador pelos',
      'creme area olhos', 'hidratante corporal', 'escova de dentes',
      'creme para pe', 'creme para pé', 'creme para mao', 'creme para mão',
      'creme hidratante', 'creme corporal', 'locao', 'loção', 'tonico facial',
      'tonico', 'tônico', 'serum', 'sérum', 'mascara facial', 'mascara de argila',
      'protetor solar', 'filtro solar', 'hidratante facial', 'oleo de barba',
      'óleo de barba', 'shampoo antiqueda', 'condicionador', 'tratamento capilar',
      'mascara capilar', 'máscara capilar', 'leave in', 'leave-in',
      'base', 'rimel', 'mascara', 'máscara', 'delineador', 'broca', 'po compacto',
      'pó compacto', 'corretivo', 'blush', 'iluminador', 'paleta',
      'labios', 'lábios', 'lip tint', 'gloss', 'batom', 'lip balm',
      'sapatos femininos', 'alongamento de cilios', 'cilios', 'cílios',
      'unhas', 'unha', 'decoracao de unhas', 'decoração de unhas',
      'removedor de cuticula', 'removedor de cutícula', 'creme para o corpo',
    ],
    exclude: ['tenis', 'tênis', 'sapato', 'sandalia', 'sandália'],
  },
  {
    category: 'Pet Shop',
    // Nota: 'pet' sozinho NÃO entra como wholeWord — em títulos de produto
    // também aparece como sigla do material plástico PET (ex.: "Difusor PET",
    // "Garrafa PET"), o que causava falsos positivos (ex.: kit de lavabo com
    // difusor feito de PET sendo classificado como Pet Shop).
    wholeWords: ['cachorro', 'gato', 'gatos', 'cachorros'],
    keywords: ['cama pet', 'coleira', 'peitoral', 'pet shop', 'petshop',
      'loja pet', 'racao', 'ração', 'racao para cachorro', 'racao para gato',
      'ração para cachorro', 'ração para gato', 'porta racao', 'porta ração',
      'arranhador', 'gaiola para pet', 'gaiola para passaro', 'gaiola para pássaro',
      'aquario', 'aquário', 'aquario de peixe', 'aquário de peixe',
      'comedouro pet', 'comedouro para cachorro', 'comedouro para gato',
      'bebedouro pet', 'bebedouro para cachorro', 'bebedouro para gato',
      'brinquedo pet', 'brinquedo para cachorro', 'brinquedo para gato',
      'ossinho', 'petisco pet', 'petisco animal', 'petisco para cachorro',
      'petisco para gato', 'petiscos para cachorro', 'petiscos para gato',
      'tapete higienico', 'tapete higiênico', 'fralda pet', 'fralda para cachorro',
      'fralda para cao', 'fralda para cão', 'cama cachorro', 'cama gato',
      'casinha de cachorro', 'casinha para cachorro', 'casinha para gato',
      'casinha pet', 'rede pet', 'pente pet', 'escova pet', 'shampoo pet',
      'shampoo para cachorro', 'shampoo para gato', 'vermifugo', 'vermífugo',
      'antipulgas', 'antipulga', 'coleira antipulgas', 'bolinha pet',
      'brinquedo gato', 'arranhador para gatos', 'arranhador para gato',
      'ratinho pet', 'ratinho de brinquedo para gato', 'roupa para cachorro',
      'roupa para gato', 'roupa pet', 'guia para cachorro', 'guia pet',
      'caixa de transporte pet', 'caixa de transporte para cachorro',
      'caixa de transporte para gato', 'areia higienica', 'areia higiênica',
      'animal de estimacao', 'animal de estimação',
    ],
  },
  {
    category: 'Bebes & Criancas',
    keywords: [
      'bebe', 'bebê', 'recem nascido', 'recém nascido', 'recém-nascido',
      'infantil', 'crianca', 'criança', 'nene', 'neném', 'neonatal',
      'fralda', 'chupeta', 'mamadeira', 'mordedor', 'carrinho de bebe',
      'carrinho de bebê', 'casa de crianca', 'mesa de brinquedo',
      'manta bebe', 'manta infantil', 'manta de bebe', 'conjunto infantil',
      'tenis bebe', 'tênis bebê', 'sapato infantil', 'sapato bebe',
      'roupa de bebe', 'roupa infantil', 'body bebe', 'body bebê',
      'calca infantil', 'calça infantil', 'short infantil', 'vestido infantil',
      'conjunto bebe', 'conjunto bebê', 'brinquedo infantil', 'jogo infantil',
      'carrinho de brinquedo', 'bone', 'boneco', 'boneca', 'carrinho de controle',
      'controle remoto brinquedo', 'carrinho controle remoto',
      'puzzle', 'quebra cabeca', 'quebra cabeça', 'quebra-cabeça',
      'blocos de montar', 'lego', 'cubo magico', 'cubo mágico',
      'kit 50 lapis', 'kit lápis', 'lapis de cor', 'lápis de cor',
      'lapis de escrever', 'lápis de escrever', 'giz de cera', 'borracha escolar',
      'caderno infantil', 'mochila infantil', 'mochila de crianca',
      'brinquedo educativo', 'brinquedo montessori', 'atividade infantil',
    ],
    exclude: ['adulto', 'masculin', 'feminin'],
  },
  {
    category: 'Livros & Educacao',
    keywords: [
      'apostila', 'enem', 'biblioteca desenvolvimento', 'devocional',
      'livro', 'jogo biblico', 'jogo bíblico', 'quem sou eu cartas',
      'sagrada familia', 'deus', 'spurgeon', 'deive leonardo',
      'poder mente', 'caneca flork', 'canecas flork', 'caneca dia pais',
      'sagrada família imagem', 'papel sulfite', 'canetas wow',
      'agenda', 'diario', 'diário', 'caderno', 'mochila escolar',
      'estojo', 'lapiseira', 'caneta esferografica', 'caneta esferográfica',
      'kit de canetas', 'marcador de texto', 'destaque texto',
      'caneta gel', 'caneta profissional', 'livro de colorir',
      'pintura por numero', 'quadro negro', 'lousa', 'quadro branco',
    ],
    exclude: ['lapis de escrever', 'lápis de escrever', 'borracha escolar', 'kit 50 lapis'],
  },
  {
    category: 'Limpeza',
    keywords: [
      'spray limpa', 'air fryer limpa', 'zip clean', 'mop', 'esfregao',
      'esfregão', 'panos limpeza', 'pano limpeza', 'microfibra absor',
      'sabao po', 'sabão pó', 'saco lixo', 'percarbonato', 'alvejante',
      'removedor manchas', 'pano prato', 'limpeza geral', 'limpa gordura',
      'lenços umede', 'toalhas umede', 'higiene bebe', 'aspirador',
      'sabao de lixo', 'saco de lixo', 'desentupidor', 'pano de limpeza',
      'pano de cozinha', 'pano microfibra', 'pano absorvente',
      'detergente', 'sabao em po', 'sabão em pó', 'amaciante', 'amolecedor',
      'lustra moveis', 'lustra móveis', 'limpa vidro', 'limpa vidros',
      'desinfetante', 'agua sanitaria', 'água sanitária', 'limpa tudo',
      'flanela', 'rodo', 'vassoura', 'escova de limpeza', 'escovacao',
      'esponja de cozinha', 'esponja de aco', 'esponja de aço',
      'limpa烤箱', 'sabao', 'sabão', 'limpa forno', 'limpa inox',
      'pano chao', 'pano de chao', 'pano de piso', 'trapeador',
      'refil mop', 'balde de limpeza', 'tirador de manchas',
    ],
    exclude: ['termico 32 litros'],
  },
];

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function matchesWholeWord(text: string, word: string): boolean {
  const pattern = new RegExp(`\\b${escapeRegex(word)}\\b`, 'i');
  return pattern.test(text);
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function categorizeTitle(title: string): Category {
  const normalized = normalize(title);
  for (const rule of RULES) {
    const isExcluded = rule.exclude?.some((ex) => normalized.includes(normalize(ex)));
    if (isExcluded) continue;

    for (const kw of rule.keywords) {
      if (normalized.includes(normalize(kw))) {
        return rule.category;
      }
    }
    if (rule.wholeWords) {
      for (const word of rule.wholeWords) {
        if (matchesWholeWord(normalized, normalize(word))) {
          return rule.category;
        }
      }
    }
  }
  return 'Outros';
}
