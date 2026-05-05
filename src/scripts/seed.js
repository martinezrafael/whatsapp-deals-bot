import pool from "../config/database.js";

const ofertas = [
  {
    titulo: "Café Especial Orfeu Moído",
    subtitulo: "Clássico em Grãos 250g",
    descricao_longa:
      "Um café equilibrado de torra média, com notas de chocolate e caramelo. Perfeito para quem busca doçura natural e corpo aveludado.",
    pontuacao: "84 Pontos SCAA",
    perfil_notas: "Chocolate, Caramelo, Frutas Doces",
    acidez: "Cítrica Equilibrada",
    torra: "Média",
    peso: "250g",
    preco: 32.9, // Alterado para número com ponto
    sku_ml: "MLB3456789012",
    link_afiliado: "https://mercadolivre.com.br/exemplo-orfeu",
  },
  {
    titulo: "Café Baggio Chocolate com Avelã",
    subtitulo: "Aromatizado Moído 250g",
    descricao_longa:
      "O queridinho dos cafés aromatizados. Aroma intenso de avelã com toque de chocolate premium. Ideal para sobremesas e lattes.",
    pontuacao: "Gourmet",
    perfil_notas: "Chocolate e Avelã",
    acidez: "Baixa",
    torra: "Média",
    peso: "250g",
    preco: 28.5, // Alterado para número com ponto
    sku_ml: "MLB9876543210",
    link_afiliado: "https://mercadolivre.com.br/exemplo-baggio",
  },
  {
    titulo: "Café L'OR Espresso Onyx",
    subtitulo: "Cápsulas Compatíveis Nespresso",
    descricao_longa:
      "Intensidade 12. Uma mistura rica e defumada com notas de cacau amargo. Para quem gosta de um café potente e marcante.",
    pontuacao: "Intensidade 12",
    perfil_notas: "Especiarias, Cacau Amargo",
    acidez: "Mínima",
    torra: "Escura",
    peso: "10 unidades",
    preco: 24.9, // Alterado para número com ponto
    sku_ml: "MLB1122334455",
    link_afiliado: "https://mercadolivre.com.br/exemplo-lor",
  },
  {
    titulo: "Café Santa Monica Artesanal",
    subtitulo: "Grãos Selecionados 500g",
    descricao_longa:
      "Direto da fazenda para sua xícara. Cultivado em altitudes elevadas, apresenta uma doçura marcante e retrogosto prolongado.",
    pontuacao: "82 Pontos",
    perfil_notas: "Cereja, Mel e Amêndoas",
    acidez: "Média Alta",
    torra: "Média Clara",
    peso: "500g",
    preco: 54.0,
    sku_ml: "MLB5566778899",
    link_afiliado: "https://mercadolivre.com.br/exemplo-santa-monica",
  },
];

async function seed() {
  try {
    for (const o of ofertas) {
      const query = `
        INSERT INTO ofertas (
          titulo, subtitulo, descricao_longa, pontuacao, perfil_notas, 
          acidez, torra, peso, preco, sku_ml, link_afiliado, postado
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, FALSE)
      `;

      await pool.query(query, [
        o.titulo,
        o.subtitulo,
        o.descricao_longa,
        o.pontuacao,
        o.perfil_notas,
        o.acidez,
        o.torra,
        o.peso,
        o.preco,
        o.sku_ml,
        o.link_afiliado,
      ]);
    }

    process.exit();
  } catch (err) {
    console.error("Erro ao inserir ofertas:", err);
    process.exit(1);
  }
}

seed();
