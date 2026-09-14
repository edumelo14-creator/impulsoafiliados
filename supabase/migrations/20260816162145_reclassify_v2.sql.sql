-- Segunda passagem de reclassificação com mais keywords

CREATE OR REPLACE FUNCTION recategorize_link_v2(p_title TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_lower TEXT;
BEGIN
  v_lower := LOWER(p_title);

  -- 1. Bebes & Criancas
  IF v_lower !~ '(adulto|masculin)' THEN
    IF v_lower ~ '(bebe|bebê|recem nascido|recém nascido|recém-nascido|infantil|crianca|criança|fralda|chupeta|mamadeira|tenis bebe|tênis bebê|sapato infantil|manta bebe|manta infantil|conjunto infantil|body bebe|brinquedo|boneco|boneca|carrinho de brinquedo|quebra cabeca|quebra cabeça|blocos de montar|cubo magico|giz de cera|kit 50 lapis|lapis de escrever|lápis de escrever|borracha escolar|trciclo|triciclo)' THEN
      RETURN 'Bebes & Criancas';
    END IF;
  END IF;

  -- 2. Eletronicos
  IF v_lower !~ '(suporte parede|organizador|fita led|fita adesiva)' THEN
    IF v_lower ~ '(carregador|fone|bluetooth|headset|hub usb|usb|monitor|tablet|chromebook|computador|smart tv|memoria ram|repetidor|wifi|microfone|tripé|tripod|kit youtuber|letreiro|mouse|teclado|gamer|dock|kingston|hyperx|lampada led|lâmpada led|cadeira gamer|celular|iphone|samsung galaxy|xiaomi|poco|redmi|smartphone|nobreak|estabilizador|hdmi|switch|roteador|power bank|cabo lightning|cabo tipo c|speaker|caixa de som|soundbar|home theater|antena tv|receptor|pilha recarregavel|bateria portatil|ssd|hd externo|disco rigido|pendrive|sd card|micro sd|cartao de memoria|placa de video|placa mae|processador|water cooler|cooler cpu|fonte atx|gabinete|notebook|rgb|extensor wifi|apple|airpods|macbook|ipad|watch|sata iii|estado solido|repelente eletr|cronometro digital|bussola|nebulizador|inalador|balanca inteligente|bioimpedancia|prensa termica|sublimacao|maquina de impressao|maquina nebulizadora|ventilador de mesa|termometro|seringa|insulina|repelente ultrass)' THEN
      RETURN 'Eletronicos';
    END IF;
  END IF;

  -- 3. Automotivo
  IF v_lower !~ '(celular|iphone|tablet)' THEN
    IF v_lower ~ '(lavadora alta press|lavadora pressao|bomba de ar|compressor|calibrador|carregador de bateria automotivo|bateria automotivo|bicicleta eletrica|scooter eletrica|lava carro|lava moto|lava jato|kit lavar moto|mangueira jardim|pulverizador|patinete|vonixx|vexus|restaurax|pretinho|vintex|mop blend|bicicleta scooter|carro veiculo|carro veiculos|calibrar pneu|pneu|capa carro|capa moto|defletor|parabrisa|parachoque|rack de teto|bagageiro|suporte de moto|antena de teto|antena tubular|cinta de reboque|macaco hidraulico|triangulo de seguranca|cabo de reboque|retrovisor|calota|tapete de carro|automotivo|coxim|amortecedor|embreagem|pastilha de freio|disco de freio|virabrequim|peca de motor|pecas de motor|lavadora vonder|lav 1300)' THEN
      RETURN 'Automotivo';
    END IF;
  END IF;

  -- 4. Ferramentas
  IF v_lower !~ '(organizador)' THEN
    IF v_lower ~ '(chave|catraca|furadeira|parafusadeira|ferramentas|maleta|pistola de pintura|pistola tinta|abraçadeira|braco|conector eletrico|filtro de linha|protetor eletrico|dps|iclamper|conector elétrico|cabo de transferencia|cabo transferencia|carga de bateria|chupeta carga|cabo de bateria|cabo bateria|pino bateria|borne|trena|nivel a laser|esquadro|martelo|alicate|serra|torno|esmeril|lixadeira|solda|soldador|multimetro|tacometro|fita metrica|chapa disco de arado|formex|aplicador|spray)' THEN
      RETURN 'Ferramentas';
    END IF;
  END IF;

  -- 5. Cozinha
  IF v_lower !~ '(termico 32 litros|cooler)' THEN
    IF v_lower ~ '(bule|coador|chaleira|panela|frigideira|assadeira|travessa|copo termico|copo térmico|garrafa termica|garrafa agua|squeeze|potes|temperos|condimentos|cortador legumes|processador alimentos|cozedor ovos|forma pudim|forma bolo|torneira|silicone cozinha|sanduicheira|caf|molde bolo|utensilio cozinha|caneca chop|kit cafe|kit café|jarra|liquidificador|batedeira|cafeteira|air fryer|fritadeira eletrica|forno eletrico|fogao|cooktop|geladeira|freezer|coifa|depurador|torradeira|panela eletrica|multiprocessador|ralar|ralador|escorredor|portas temperos|azeite|oleo de cozinha|sal grosso|sal fino|tabua|cutelo|facas de cozinha|kit de facas|bowl|presea|presilha|panos de prato|puxa saco|fatiador|jogo de jantar|ceramica|tigela|iogurteira|omeleteira|chapa disco|paella|papel parede marmore|papel parede mármore|impermeavel|resistente altas temperatura|touca descartavel|protecao|creme crocante|kit kat|nestle|especiaria)' THEN
      RETURN 'Cozinha';
    END IF;
  END IF;

  -- 6. Casa & Decoracao
  IF v_lower !~ '(teclado|mouse|hub usb|monitor|lampada led)' THEN
    IF v_lower ~ '(lustre|espelho|organizador|suporte parede|cabide|luminaria|luminária|lixeira|ventilador teto|nicho|suporte papel|shaun|almofada|cooler|termica 32|térmica 32|umidificador|cama pet|lixeira sensor|ventilador aromatizador|arandela|iluminaria|faca churrasco|travesseiro|raquete mosquito|bolsa maternidade|cortina|persiana|tapete|almofad|manta|abajur|candeeiro|relogio de parede|quadro decorativo|poster|puff|banqueta|banco|cesta de decoracao|decoracao|decor|porta joias|vaso decorativo|porta retrato|moldura|suporte tv|prateleira|cabideiro|sapateira|caixa organizadora|hook|cesto de roupa|balanco de parede|bancada|estante|criado mudo|cama|colchao|colchão|sofa|poltrona|mesa de centro|mesa de jantar|cadeira de jantar|rack de sala|arranjo|trepadeira|vaso|lençol|fronha|lenco|lenç|evita mofo|odorizante|guarda-roupa|pantufa|chinelo peluciada|chinelo de pelucia|ventilador| Kit Jogo de Lençol)' THEN
      RETURN 'Casa & Decoracao';
    END IF;
  END IF;

  -- 7. Beleza & Cuidados
  IF v_lower !~ '(tenis|tênis|sapato|sandalia|sandália)' THEN
    IF v_lower ~ '(depilador|ipl|luz pulsada|escova capilar|escova dentes|antiqueda|escova secadora|secador cabelo|chapinha|modelador cachos|skincare|hidratante|oleo corporal|óleo corporal|perfume|esmalte|shampoo|cosmetico|eudora|siage|natura tododia|loreal|elseve|kokeshi|nativa spa|sabonete facial|creme gel|colageno|maquiagem|barbear|aparador pelos|creme area olhos|hidratante corporal|escova de dentes|creme para pe|creme para pé|creme para mao|creme para mão|creme hidratante|creme corporal|locao|loção|tonico facial|serum|sérum|mascara facial|protetor solar|filtro solar|oleo de barba|óleo de barba|condicionador|tratamento capilar|mascara capilar|máscara capilar|base|rimel|delineador|po compacto|pó compacto|corretivo|blush|iluminador|paleta|batom|lip balm|gloss|unhas|unha|cilios|cílios|creme para o corpo|oleo capilar|óleo capilar|argan oil|escova drenagem|escova progressiva|clareador|creme clareador|niacinamida|rosa mosqueta|tonico poderoso|cresce cabelo|adorno espinha|acne|hidrocoloide|seca espinha|barbeador|maquina de cortar cabelo|cortar cabelo|barbeador eletrico)' THEN
      RETURN 'Beleza & Cuidados';
    END IF;
  END IF;

  -- 8. Fitness & Saude
  IF v_lower !~ '(iphone|celular|monitor)' THEN
    IF v_lower ~ '(creatina|whey protein|bcaa|shaker|halteres|halter|treino funcional|kettlebell|supino|aparelho abdominal|pistola massagem|massageador|massagem muscular|tenis corrida|tênis corrida|placa carbono corrida|maratona|melatonina|biotina|vitamina c|esportivo academia|fitness academia|fitness treino|musculacao|musculação|crossfit|abdominal ventosa|esteira|bicicleta ergometrica|bicicleta ergométrica|eliptico|remador|barra de fixacao|anilha|caneleira|corda de pular|mat de yoga|suplemento|pre treino|pré treino|termogenico|colageno hidrolisado|omega 3|multivitaminico|bicicleta bike ergometrica|spinning|top academia|sutia esportivo|top fitness|faixa elastica|cinto porta numero|corrida|ciclismo|triathlon|mochila hidratacao|bolso de corrida|corretor postura|cinta postural|coluna|oculos esportivo|calca bicycles|bermuda shorts|tactel|academia|caminhada|esportivo|treino|yoga|sneaker|running shoes|breathable mesh|couples|body test|shock absorption|marathon)' THEN
      RETURN 'Fitness & Saude';
    END IF;
  END IF;

  -- 9. Pet Shop
  IF v_lower ~ '\M(pet|cachorro|gato|gatos|cachorros)\M' OR
     v_lower ~ '(cama pet|coleira|peitoral|pet shop|racao|ração|arranhador|gaiola|aquario|aquário|comedouro|bebedouro|brinquedo pet|ossinho|petisco|tapete higienico|tapete higiênico|fralda pet|cama cachorro|cama gato|casinha|shampoo pet|vermifugo|vermífugo|antipulgas|antipulga|bolinha pet|brinquedo gato|arranhador para gatos|ratinho pet|jornal pet|higienico|pet higiênico|biodegrad)' THEN
    RETURN 'Pet Shop';
  END IF;

  -- 10. Moda Feminina (incluindo tenis feminino, sapato feminino)
  IF v_lower !~ '(masculin|bebe|bebê|infantil|kit 2 blusa moletom)' THEN
    IF v_lower ~ '(feminin|femenino|vestido|macacão femin|macaquinho|legging|short femin|pijama femin|baby doll|blusinha|cropped|alfaiataria femin|calça pantalona|suplex femin|bolsa femin|tule|saia|casaco frio femin|blusa frio femin|blusa tricot|jeans feminin|fitness femin|academia femin|linho|short doll|pijaminhas|camisola|scarpin|bico fino|salto fino|verniz|boneca|camisa feminina|blusa feminina|lingerie|calcinha|soutien|bralette|top femin|meia calca|sapatilha|sapato feminino|roupa femin|tenis feminino|tênis feminino|tenis feminin|tênis feminin|bolsa de maternidade|conjunto gabi|gabi|pijama|verão|nuvem|mulheres|bolsa termica|piquenique|loja|dona|moda|modare|bolsa|chic|chique|sneaker plataforma|ramarim|oldsen|fila recovery|olympikus|trop f1|vili fusion|slip on|ortopedico|tesla hertz|eskatista|streetwear|cloud|knu|mocassin|mocatenis|chunky|flyvo|podium|modare|moda mulher|look|casacos|jaqueta esportiva|cardigan|jaqueta|unissex|mulher|feminino|calca|calça|bermuda|casaco|jaqueta)' THEN
      RETURN 'Moda Feminina';
    END IF;
  END IF;

  -- 11. Moda Masculina
  IF v_lower !~ '(feminin|femenino|bebe|bebê|infantil)' THEN
    IF v_lower ~ '(masculin|calça jeans mascul|jeans country|caterpillar|sapatenis mascul|sapatênis mascul|camiseta pai|melhor pai|moletom mascul|bermudas mascul|bermuda mascul|slide mascul|puffer mascul|kit 2 blusa moletom|kit dia dos pais|kit presente mascul|boné grife|boné carteira|corta vento monster|bomber|cinto carteira|kit churrasco|snaaker|camiseta masculin|camiseta basica mascul|camisa masculin|camisa social mascul|camisa polo mascul|tenis masculin|tênis masculin|sapato masculin|meia masculin|cueca masculin|calca masculin|calça masculin|jaqueta masculin|casaco mascul|jaqueta jeans|camisa xadrez|sapato social mascul|mocassim mascul|alpargata mascul|chinelo bandeirinha|sandalia de dedo|gravata|homens|sem gravatas|vestimenta formal|homem|noivo|negocios|copo super pai|presente dia dos pais|faca churrasco|kit churrasco)' THEN
      RETURN 'Moda Masculina';
    END IF;
  END IF;

  -- 12. Livros & Educacao
  IF v_lower !~ '(lapis de escrever|lápis de escrever|borracha escolar|kit 50 lapis)' THEN
    IF v_lower ~ '(apostila|enem|devocional|livro|jogo biblico|jogo bíblico|sagrada familia|deus|spurgeon|deive leonardo|poder mente|caneca flork|canecas flork|caneca dia pais|papel sulfite|canetas wow|agenda|diario|diário|caderno|mochila escolar|estojo|lapiseira|caneta esferografica|caneta esferográfica|kit de canetas|marcador de texto|destaque texto|caneta gel|caneta profissional|livro de colorir|pintura por numero|quadro negro|lousa|quadro branco|sagrada familia imagem|sagrada família imagem)' THEN
      RETURN 'Livros & Educacao';
    END IF;
  END IF;

  -- 13. Limpeza
  IF v_lower !~ '(termico 32 litros)' THEN
    IF v_lower ~ '(spray limpa|air fryer limpa|zip clean|mop|esfregao|esfregão|panos limpeza|pano limpeza|microfibra absor|sabao po|sabão pó|saco lixo|percarbonato|alvejante|removedor manchas|pano prato|limpeza geral|limpa gordura|lenços umede|toalhas umede|aspirador|sabao de lixo|saco de lixo|desentupidor|pano de limpeza|pano de cozinha|pano microfibra|pano absorvente|detergente|sabao em po|sabão em pó|amaciante|lustra moveis|lustra móveis|limpa vidro|limpa vidros|desinfetante|agua sanitaria|água sanitária|limpa tudo|flanela|rodo|vassoura|escova de limpeza|esponja de cozinha|esponja de aco|esponja de aço|sabao|sabão|limpa forno|limpa inox|pano chao|pano de chao|pano de piso|trapeador|refil mop|balde de limpeza|tirador de manchas|kit c/10 panos|bolsa para lavar|saco de lavagem|lavar tenis)' THEN
      RETURN 'Limpeza';
    END IF;
  END IF;

  RETURN 'Outros';
END;
$$;

UPDATE affiliate_links SET category = recategorize_link_v2(title);

DROP FUNCTION recategorize_link_v2(TEXT);
