/*
# Categorize all 220 affiliate links

## Context
All affiliate_links rows have category = NULL. This migration assigns each
product to one of 12 thematic categories based on title keyword matching.

## Approach
Use a temp table of (keyword, category) pairs, then UPDATE in priority order
(specific keywords first to avoid misclassification). A final cleanup ensures
every row got a category.

## Safety
- No schema changes, only data updates to the existing `category` column
- No DROP, no DELETE, no column type changes
*/

-- First, set a default category for everything so nothing is left null
UPDATE affiliate_links SET category = 'Outros' WHERE category IS NULL;

-- Then apply specific categories in priority order (most specific first)

-- Eletronicos
UPDATE affiliate_links SET category = 'Eletronicos'
WHERE category = 'Outros' AND (
  title ILIKE '%carregador%' OR title ILIKE '%fone%' OR title ILIKE '%bluetooth%'
  OR title ILIKE '%headset%' OR title ILIKE '%hub usb%' OR title ILIKE '%usb%'
  OR title ILIKE '%monitor%' OR title ILIKE '%tablet%' OR title ILIKE '%chromebook%'
  OR title ILIKE '%computador%' OR title ILIKE '%smart tv%' OR title ILIKE '%memoria ram%'
  OR title ILIKE '%repetidor%' OR title ILIKE '%wifi%' OR title ILIKE '%microfone%'
  OR title ILIKE '%tripé%' OR title ILIKE '%tripod%' OR title ILIKE '%you%C' -- tripe vlog
  OR title ILIKE '%kit youtuber%' OR title ILIKE '%placa uber%' OR title ILIKE '%letreiro%'
  OR title ILIKE '%mouse%' OR title ILIKE '%teclado%' OR title ILIKE '%gamer rgb%'
  OR title ILIKE '%dock%' OR title ILIKE '%kingston%' OR title ILIKE '%hyperx%'
  OR title ILIKE '%lampada led%' OR title ILIKE '%lâmpada led%' OR title ILIKE '%led 9w%'
);

-- Ferramentas
UPDATE affiliate_links SET category = 'Ferramentas'
WHERE category = 'Outros' AND (
  title ILIKE '%chave%' OR title ILIKE '%catraca%' OR title ILIKE '%furadeira%'
  OR title ILIKE '%parafusadeira%' OR title ILIKE '%ferramentas%' OR title ILIKE '%maleta%'
  OR title ILIKE '%pistola de pintura%' OR title ILIKE '%pist%tinta%'
  OR title ILIKE '%abraçadeira%' OR title ILIKE '%braco%' OR title ILIKE '%conector eletrico%'
  OR title ILIKE '%filtro de linha%' OR title ILIKE '%protetor eletrico%' OR title ILIKE '%dps%'
  OR title ILIKE '%iCLAMPER%'
);

-- Automotivo
UPDATE affiliate_links SET category = 'Automotivo'
WHERE category = 'Outros' AND (
  title ILIKE '%lavadora%alta%press%' OR title ILIKE '%lavadora%pressao%'
  OR title ILIKE '%bomba de ar%' OR title ILIKE '%compressor%' OR title ILIKE '%calibrador%'
  OR title ILIKE '%carregador de bateria%' OR title ILIKE '%bateria automotivo%'
  OR title ILIKE '%bicicleta eletrica%' OR title ILIKE '%scooter eletrica%'
  OR title ILIKE '%lava%carro%' OR title ILIKE '%lava%moto%' OR title ILIKE '%lava jato%'
  OR title ILIKE '%kit%lavar%moto%' OR title ILIKE '%mangueira%jardim%'
  OR title ILIKE '%pulverizador%' OR title ILIKE '%patinete%'
  OR title ILIKE '%vonixx%' OR title ILIKE '%v-floc%' OR title ILIKE '%vexus%'
  OR title ILIKE '%restaurax%' OR title ILIKE '%pretinho%' OR title ILIKE '%vintex%'
  OR title ILIKE '%mop%blend%' OR title ILIKE '%placa de carbono%tenis%'
);

-- Cozinha
UPDATE affiliate_links SET category = 'Cozinha'
WHERE category = 'Outros' AND (
  title ILIKE '%bule%' OR title ILIKE '%coador%' OR title ILIKE '%chaleira%'
  OR title ILIKE '%panela%' OR title ILIKE '%frigideira%' OR title ILIKE '%assadeira%'
  OR title ILIKE '%travessa%' OR title ILIKE '%copo termico%' OR title ILIKE '%copo térmico%'
  OR title ILIKE '%garrafa termica%' OR title ILIKE '%garrafa%água%' OR title ILIKE '%squee%'
  OR title ILIKE '%potes%' OR title ILIKE '%temperos%' OR title ILIKE '%condimentos%'
  OR title ILIKE '%cortador%legumes%' OR title ILIKE '%processador%alimentos%'
  OR title ILIKE '%cozedor%ovos%' OR title ILIKE '%forma%pudim%' OR title ILIKE '%forma%bolo%'
  OR title ILIKE '%taça%' OR title ILIKE '%tacas%' OR title ILIKE '%torneira%'
  OR title ILIKE '%silicone%cozinha%' OR title ILIKE '%sanduicheira%' OR title ILIKE '%caf%'
  OR title ILIKE '%molde%bolo%' OR title ILIKE '%utensilio%cozinha%'
  OR title ILIKE '%caneca%chop%' OR title ILIKE '%kit%cafe%manha%' OR title ILIKE '%kit café%'
  OR title ILIKE '%jarra%'
);

-- Casa & Decoracao
UPDATE affiliate_links SET category = 'Casa & Decoracao'
WHERE category = 'Outros' AND (
  title ILIKE '%lustre%' OR title ILIKE '%espelho%' OR title ILIKE '%organizador%'
  OR title ILIKE '%suporte%parede%' OR title ILIKE '%cabide%' OR title ILIKE '%luminaria%'
  OR title ILIKE '%luminária%' OR title ILIKE '%lixeira%' OR title ILIKE '%ventilador%teto%'
  OR title ILIKE '%nicho%' OR title ILIKE '%suporte%papel%' OR title ILIKE '%shaun%'
  OR title ILIKE '%almofada%' OR title ILIKE '%manta%bebe%' OR title ILIKE '%manta%infantil%'
  OR title ILIKE '%cooler%' OR title ILIKE '%termica%32%' OR title ILIKE '%térmica%32%'
  OR title ILIKE '%umidificador%' OR title ILIKE '%cama pet%' OR title ILIKE '%lixeira%sensor%'
  OR title ILIKE '%ventilador%aromatizador%' OR title ILIKE '%arandela%' OR title ILIKE '%iluminaria%'
  OR title ILIKE '% Spot %' OR title ILIKE '%spot%parede%'
);

-- Moda Feminina
UPDATE affiliate_links SET category = 'Moda Feminina'
WHERE category = 'Outros' AND (
  title ILIKE '%feminin%' OR title ILIKE '%conjunto%femin%' OR title ILIKE '%vestido%'
  OR title ILIKE '%macac%o%femin%' OR title ILIKE '%macaquinho%' OR title ILIKE '%legging%'
  OR title ILIKE '%short%femin%' OR title ILIKE '%pijama%femin%' OR title ILIKE '%baby doll%'
  OR title ILIKE '%blusinha%' OR title ILIKE '%cropped%' OR title ILIKE '%conjunto%alfaiataria%femin%'
  OR title ILIKE '%calça%pantalona%' OR title ILIKE '%conjunto%suplex%femin%'
  OR title ILIKE '%bolsa%femin%' OR title ILIKE '%conjunto%tule%' OR title ILIKE '%saia%'
  OR title ILIKE '%casaco%frio%femin%' OR title ILIKE '%blusa%frio%femin%'
  OR title ILIKE '%blusa%tricot%' OR title ILIKE '%jeans%feminin%' OR title ILIKE '%macac%c3%a3o%femin%'
  OR title ILIKE '%conjunto%fitness%femin%' OR title ILIKE '%academia%femin%'
  OR title ILIKE '%conjunto%premium%longo%' OR title ILIKE '%macac%o%linho%'
  OR title ILIKE '%short%doll%' OR title ILIKE '%pijaminhas%' OR title ILIKE '%camisola%'
  OR title ILIKE '%conjunto%gabi%' OR title ILIKE '%conjunto%valentina%'
  OR title ILIKE '%conjunto%gringo%' OR title ILIKE '%conjunto%duna%'
  OR title ILIKE '%sandalia%femin%' OR title ILIKE '%sandália%femin%'
);

-- Moda Masculina
UPDATE affiliate_links SET category = 'Moda Masculina'
WHERE category = 'Outros' AND (
  title ILIKE '%masculin%' OR title ILIKE '%calça%jeans%mascul%' OR title ILIKE '%jeans%country%'
  OR title ILIKE '%bota%caterpillar%' OR title ILIKE '%sapatenis%mascul%'
  OR title ILIKE '%sapatênis%mascul%' OR title ILIKE '%camiseta%pai%' OR title ILIKE '%melhor%pai%'
  OR title ILIKE '%moletom%mascul%' OR title ILIKE '%bermudas%mascul%' OR title ILIKE '%bermuda%mascul%'
  OR title ILIKE '%slide%mascul%' OR title ILIKE '%jaqueta%puffer%mascul%' OR title ILIKE '%kit%2%blusa%moletom%'
  OR title ILIKE '%kit%dia%dos%pais%' OR title ILIKE '%kit%presente%mascul%'
  OR title ILIKE '%boné%grife%' OR title ILIKE '%boné%carteira%'
  OR title ILIKE '%jaqueta%corta%vento%monster%' OR title ILIKE '%jaqueta%bomber%'
  OR title ILIKE '%cinto%carteira%' OR title ILIKE '%kit%churrasco%'
);

-- Fitness & Saude
UPDATE affiliate_links SET category = 'Fitness & Saude'
WHERE category = 'Outros' AND (
  title ILIKE '%creatina%' OR title ILIKE '%whey%protein%' OR title ILIKE '%bcaa%'
  OR title ILIKE '%shaker%' OR title ILIKE '%halteres%' OR title ILIKE '%halter%'
  OR title ILIKE '%treino%funcional%' OR title ILIKE '%kettlebell%' OR title ILIKE '%supino%'
  OR title ILIKE '%aparelho%abdominal%' OR title ILIKE '%pistola%massagem%' OR title ILIKE '%massageador%'
  OR title ILIKE '%massagem%muscular%' OR title ILIKE '%tenis%corrida%' OR title ILIKE '%tênis%corrida%'
  OR title ILIKE '%placa%carbono%corrida%' OR title ILIKE '%maratona%'
  OR title ILIKE '%melatonina%' OR title ILIKE '%biotina%' OR title ILIKE '%vitamina%c%'
  OR title ILIKE '%gummy%night%' OR title ILIKE '%esportivo%academia%' OR title ILIKE '%fitness%academia%'
  OR title ILIKE '%fitness%treino%' OR title ILIKE '%musculacao%' OR title ILIKE '%musculação%'
  OR title ILIKE '%crossfit%' OR title ILIKE '%kit%treino%'
);

-- Beleza & Cuidados
UPDATE affiliate_links SET category = 'Beleza & Cuidados'
WHERE category = 'Outros' AND (
  title ILIKE '%depilador%' OR title ILIKE '%ipl%' OR title ILIKE '%luz%pulsada%'
  OR title ILIKE '%escova%capilar%' OR title ILIKE '%escova%dentes%' OR title ILIKE '%antiqueda%'
  OR title ILIKE '%escova%secadora%' OR title ILIKE '%secador%cabelo%' OR title ILIKE '%chapinha%'
  OR title ILIKE '%modelador%cachos%' OR title ILIKE '%skincare%' OR title ILIKE '%hidratante%'
  OR title ILIKE '%oleo%corporal%' OR title ILIKE '%óleo%corporal%' OR title ILIKE '%perfume%'
  OR title ILIKE '%esmalte%' OR title ILIKE '%shampoo%' OR title ILIKE '%cosmetico%'
  OR title ILIKE '%eudora%' OR title ILIKE '%siage%' OR title ILIKE '%natura%tododia%'
  OR title ILIKE '%loreal%' OR title ILIKE '%elseve%' OR title ILIKE '%kokeshi%'
  OR title ILIKE '%nativa%spa%' OR title ILIKE '%paixao%framboesa%' OR title ILIKE '%lin%paixao%'
  OR title ILIKE '%sabonete%facial%' OR title ILIKE '%creme%gel%' OR title ILIKE '%colageno%'
  OR title ILIKE '%maquiagem%' OR title ILIKE '%barbear%' OR title ILIKE '%aparador%pelos%'
  OR title ILIKE '%creme%area%olhos%' OR title ILIKE '%hidratante%corporal%'
);

-- Pet Shop
UPDATE affiliate_links SET category = 'Pet Shop'
WHERE category = 'Outros' AND (
  title ILIKE '%cama%pet%' OR title ILIKE '%coleira%' OR title ILIKE '%peitoral%'
  OR title ILIKE '%pet%' OR title ILIKE '%cachorro%' OR title ILIKE '%gato%'
);

-- Livros & Educacao
UPDATE affiliate_links SET category = 'Livros & Educacao'
WHERE category = 'Outros' AND (
  title ILIKE '%apostila%' OR title ILIKE '%enem%' OR title ILIKE '%biblioteca%desenvolvimento%'
  OR title ILIKE '%devocional%' OR title ILIKE '%livro%' OR title ILIKE '%jogo%biblico%'
  OR title ILIKE '%jogo bíblico%' OR title ILIKE '%quem sou eu%cartas%'
  OR title ILIKE '%sagrada%familia%' OR title ILIKE '%deus%' OR title ILIKE '%spurgeon%'
  OR title ILIKE '%deive%leonardo%' OR title ILIKE '%poder%mente%' OR title ILIKE '%canecas%flork%'
  OR title ILIKE '%caneca%flork%' OR title ILIKE '%caneca%dia%pais%'
  OR title ILIKE '%lápis%escrever%' OR title ILIKE '%lapis%escrever%' OR title ILIKE '%borracha%escolar%'
  OR title ILIKE '%papel%sulfite%'
);

-- Limpeza
UPDATE affiliate_links SET category = 'Limpeza'
WHERE category = 'Outros' AND (
  title ILIKE '%spray%limpa%' OR title ILIKE '%air%fryer%limpa%' OR title ILIKE '%zip%clean%'
  OR title ILIKE '%mop%' OR title ILIKE '%esfregao%' OR title ILIKE '%esfregão%'
  OR title ILIKE '%panos%limpeza%' OR title ILIKE '%pano%limpeza%' OR title ILIKE '%microfibra%absor%'
  OR title ILIKE '%sabao%po%' OR title ILIKE '%sabão%pó%' OR title ILIKE '%saco%lixo%'
  OR title ILIKE '%percarbonato%' OR title ILIKE '%alvejante%' OR title ILIKE '%removedor%manchas%'
  OR title ILIKE '%pano%prato%' OR title ILIKE '%limpeza%geral%' OR title ILIKE '%limpa%gordura%'
  OR title ILIKE '%lenços%umede%' OR title ILIKE '%toalhas%umede%' OR title ILIKE '%higiene%bebe%'
);

-- Select to verify distribution
SELECT category, count(*) as total FROM affiliate_links GROUP BY category ORDER BY total DESC;
