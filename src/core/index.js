import pkg from "whatsapp-web.js";
const { Client, LocalAuth, MessageMedia } = pkg;
import qrcode from "qrcode-terminal";
import pool from "../config/database.js";
import "dotenv/config";

import { refreshMyToken } from "./auth.js";
import { searchProduct, saveCatalogToDb } from "../database/catalog.js";
import { gerarLinkAfiliado } from "../services/mercadolivre.js";

async function validarEObterToken() {
  try {
    const { rows } = await pool.query("SELECT * FROM auth_tokens LIMIT 1");
    const tokens = rows[0];

    if (!tokens) throw new Error("Autenticação ausente no banco.");

    const limiteRenovacao = new Date(Date.now() + 10 * 60 * 1000);
    const expiraEm = new Date(tokens.expires_at);

    if (expiraEm <= limiteRenovacao) {
      const novosDados = await refreshMyToken(tokens.refresh_token);
      const novaExpira = new Date(Date.now() + novosDados.expires_in * 1000);

      await pool.query(
        `UPDATE auth_tokens SET access_token = $1, refresh_token = $2, expires_at = $3 WHERE id = $4`,
        [
          novosDados.access_token,
          novosDados.refresh_token,
          novaExpira,
          tokens.id,
        ],
      );
      return novosDados.access_token;
    }
    return tokens.access_token;
  } catch (error) {
    console.error("[Token] Erro:", error.message);
    throw error;
  }
}

async function alimentarFilaDeOfertas(termoBusca) {
  try {
    const token = await validarEObterToken();
    const data = await searchProduct(termoBusca, token);

    const results = data?.results || [];

    if (results.length === 0) return console.log("⚠️ [Fila] Nada encontrado.");

    await saveCatalogToDb(results, pool);

    for (const [index, prod] of results.entries()) {
      try {
        const precoVenda = prod.price || 0;
        const urlOriginal = prod.permalink;

        if (!precoVenda || !urlOriginal) continue;

        const linkCurto = await gerarLinkAfiliado(urlOriginal);
        if (!linkCurto) continue;

        await pool.query(
          `INSERT INTO ofertas (id_catalogo, titulo, preco, link_afiliado, link_original)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (link_original) DO NOTHING`,
          [prod.id, prod.title, precoVenda, linkCurto, urlOriginal],
        );

        process.stdout.write(`.`); // Progresso visual simples
        await new Promise((res) => setTimeout(res, 1000));
      } catch (err) {
        console.error(`\n Erro no item ${prod.id}:`, err.message);
      }
    }
  } catch (error) {
    console.error("[Fila] Erro crítico:", error.message);
  }
}

async function processarUmaOferta() {
  try {
    const chatID = process.env.GROUP_ID;
    const { rows } = await pool.query(`
      SELECT o.*, c.nome_oficial, c.marca, c.imagem_high_res, c.raw_data
      FROM ofertas o
      JOIN produtos_catalogo c ON o.id_catalogo = c.id_catalogo
      WHERE o.postado = FALSE 
      ORDER BY o.data_criacao ASC LIMIT 1
    `);

    if (rows.length === 0) {
      return await alimentarFilaDeOfertas("Café Especial Moído");
    }

    const oferta = rows[0];
    const attr = (id) =>
      oferta.raw_data?.attributes?.find((a) => a.id === id)?.value_name || null;

    const mensagem = [
      `☕ *PROMOCOFFE | Oferta Selecionada*`,
      `\n*${oferta.nome_oficial}*`,
      `🏷️ Marca: ${oferta.marca}`,
      attr("SENSORY_NOTES") ? `📝 *Notas:* ${attr("SENSORY_NOTES")}` : null,
      attr("COFFEE_ROAST") ? `🔥 *Torra:* ${attr("COFFEE_ROAST")}` : null,
      `\n💰 *Preço:* R$ ${oferta.preco}`,
      `\n🛒 *COMPRE AQUI:*`,
      `${oferta.link_afiliado}`,
    ]
      .filter(Boolean)
      .join("\n");

    // Tenta enviar com imagem, se falhar, envia apenas texto para não travar o bot
    let postadoSucesso = false;
    try {
      if (oferta.imagem_high_res) {
        const media = await MessageMedia.fromUrl(oferta.imagem_high_res);
        await client.sendMessage(chatID, media, { caption: mensagem });
      } else {
        await client.sendMessage(chatID, mensagem);
      }
      postadoSucesso = true;
    } catch (mediaError) {
      console.error(
        "⚠️ Erro ao carregar mídia, tentando enviar apenas texto...",
      );
      await client.sendMessage(chatID, mensagem);
      postadoSucesso = true;
    }

    if (postadoSucesso) {
      await pool.query("UPDATE ofertas SET postado = TRUE WHERE id = $1", [
        oferta.id,
      ]);
    }
  } catch (error) {
    console.error("[WhatsApp] Erro:", error.message);
  }
}

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage", // Importante para Linux/Docker
      "--disable-gpu",
      "--no-zygote",
      "--single-process",
    ],
  },
});

client.on("qr", (qr) => qrcode.generate(qr, { small: true }));

client.on("ready", () => {
  const intervalo = parseInt(process.env.SEND_INTERVAL_MS) || 1800000;

  setTimeout(processarUmaOferta, 5000);

  setInterval(processarUmaOferta, intervalo);
});

client.on("disconnected", (reason) => {
  console.log("WhatsApp desconectado:", reason);
});

client
  .initialize()
  .catch((err) => console.error("Inicialização:", err.message));
