/* Fix last 3 items with accented characters using exact title match */

UPDATE affiliate_links SET category = 'Livros & Educacao'
WHERE title = 'Sagrada Família Imagem Gesso com Resina 20cm';

UPDATE affiliate_links SET category = 'Ferramentas'
WHERE title = 'Conector Elétrico Kit 90 Peças Compacto Emenda Derivação 2 3 5 Vias 4mm² 6mm² Instalação Elétrica';

UPDATE affiliate_links SET category = 'Automotivo'
WHERE title = 'Bicicleta Scooter Elétrica 600W Bike WeHawk WX-03 Basket – Bateria 48V 12Ah Removível Autopropelido';

SELECT category, count(*) as total FROM affiliate_links GROUP BY category ORDER BY total DESC;
