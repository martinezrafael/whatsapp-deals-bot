import pkg from "whatsapp-web.js";
const { Client, LocalAuth } = pkg;
import qrcode from "qrcode-terminal";
import pool from "./config/database.js";
import "dotenv/config";

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  },
});

import { gerarLinkAfiliado } from "./services/mercadolivre.js";

// No loop de postagem:
const linkOriginal =
  "https://www.mercadolivre.com.br/vaso-sanitario-inteligente-smart-toilet-automatico-tubrax/up/MLBU3790306988";
const linkAfiliado = await gerarLinkAfiliado(linkOriginal);

console.log(`link de afiliado:${linkAfiliado}`);

// Pega o intervalo do .env ou usa 30min (1800000ms) como padrão de segurança
const INTERVALO_MS = parseInt(process.env.SEND_INTERVAL_MS) || 1800000;

client.on("qr", (qr) => {
  console.log("📱 Escaneie o QR Code abaixo:");
  qrcode.generate(qr, { small: true });
});

client.on("ready", async () => {
  console.log("🚀 Bot conectado!");
  console.log(`⏱️ Intervalo configurado: ${INTERVALO_MS / 1000 / 60} minutos.`);

  // 1. Dispara a primeira oferta imediatamente
  await processarUmaOferta();

  // 2. Inicia o ciclo baseado no seu .env
  setInterval(async () => {
    await processarUmaOferta();
  }, INTERVALO_MS);
});

async function processarUmaOferta() {
  try {
    // Busca apenas 1 oferta por vez da fila
    const res = await pool.query(
      "SELECT * FROM ofertas WHERE postado = FALSE ORDER BY data_criacao ASC LIMIT 1",
    );

    if (res.rows.length === 0) {
      console.log("📭 Sem ofertas pendentes no momento.");
      return;
    }

    const o = res.rows[0];
    const chatID = process.env.GROUP_ID;

    // Fallback para campos nulos
    const clean = (val) => val || "Não informado";

    const mensagem = `☕ *PROMOCOFFE | Oferta Selecionada*

*${o.titulo}* - ${clean(o.subtitulo)}
${clean(o.descricao_longa)} 🌋

🏆 *Pontuação:* ${clean(o.pontuacao)}
✨ *Perfil:* ${clean(o.perfil_notas)}
🍋 *Acidez:* ${clean(o.acidez)}
🗓️ *Torra:* ${clean(o.torra)}
⚖️ *Peso:* ${clean(o.peso)}

💰 *Preço:* R$ ${o.preco}

🛒 *COMO COMPRAR:*
🔍 Copie e cole no buscador do Mercado Livre:
*${clean(o.sku_ml)}*

🔗 Ou acesse o link direto:
${o.link_afiliado}`;

    await client.sendMessage(chatID, mensagem);

    await pool.query("UPDATE ofertas SET postado = TRUE WHERE id = $1", [o.id]);

    console.log(
      `✅ [${new Date().toLocaleTimeString()}] Oferta "${o.titulo}" enviada.`,
    );
  } catch (error) {
    console.error("❌ Erro no processamento:", error);
  }
}

client.initialize();
