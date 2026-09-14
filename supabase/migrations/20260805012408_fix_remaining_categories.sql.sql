/* Fix remaining 14 uncategorized links */

-- Scooter eletrica -> Automotivo
UPDATE affiliate_links SET category = 'Automotivo'
WHERE category = 'Outros' AND title ILIKE '%scooter%eletrica%';

-- Bolsa maternidade -> Casa & Decoracao
UPDATE affiliate_links SET category = 'Casa & Decoracao'
WHERE category = 'Outros' AND title ILIKE '%bolsa%maternidade%';

-- Cadeira gamer -> Eletronicos
UPDATE affiliate_links SET category = 'Eletronicos'
WHERE category = 'Outros' AND title ILIKE '%cadeira%gamer%';

-- Conector eletrico -> Ferramentas
UPDATE affiliate_links SET category = 'Ferramentas'
WHERE category = 'Outros' AND title ILIKE '%conector%eletrico%';

-- Conjunto Femenino Ribi -> Moda Feminina
UPDATE affiliate_links SET category = 'Moda Feminina'
WHERE category = 'Outros' AND title ILIKE '%conjunto%femenino%';

-- Faca churrasco -> Casa & Decoracao
UPDATE affiliate_links SET category = 'Casa & Decoracao'
WHERE category = 'Outros' AND title ILIKE '%faca%churrasco%';

-- Travesseiro -> Casa & Decoracao
UPDATE affiliate_links SET category = 'Casa & Decoracao'
WHERE category = 'Outros' AND title ILIKE '%travesseiro%';

-- Canetas -> Livros & Educacao (papelaria)
UPDATE affiliate_links SET category = 'Livros & Educacao'
WHERE category = 'Outros' AND title ILIKE '%canetas%wow%';

-- Raquete mata mosquito -> Casa & Decoracao
UPDATE affiliate_links SET category = 'Casa & Decoracao'
WHERE category = 'Outros' AND title ILIKE '%raquete%mosquito%';

-- Robô aspirador -> Limpeza
UPDATE affiliate_links SET category = 'Limpeza'
WHERE category = 'Outros' AND title ILIKE '%aspirador%';

-- Sagrada Familia -> Livros & Educacao (religioso)
UPDATE affiliate_links SET category = 'Livros & Educacao'
WHERE category = 'Outros' AND title ILIKE '%sagrada%familia%imagem%';

-- Tenis casual/sneaker -> Moda Masculina
UPDATE affiliate_links SET category = 'Moda Masculina'
WHERE category = 'Outros' AND title ILIKE '%snaaker%';

SELECT category, count(*) as total FROM affiliate_links GROUP BY category ORDER BY total DESC;
