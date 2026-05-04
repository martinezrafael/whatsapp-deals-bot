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

client.on("qr", (qr) => {
  console.log("📱 Escaneie o QR Code para iniciar o teste:");
  qrcode.generate(qr, { small: true });
});

client.on("ready", () => {
  console.log("🚀 Bot conectado! Verificando ofertas...");
  processarOfertas();
});

async function processarOfertas() {
  try {
    const query =
      "SELECT * FROM ofertas WHERE postado = FALSE ORDER BY data_criacao ASC LIMIT 1";
    const res = await pool.query(query);

    if (res.rows.length === 0) {
      console.log("📭 Nenhuma oferta pendente no banco.");
      return;
    }

    const oferta = res.rows[0];
    const chatID = process.env.GROUP_ID;

    // Formatação simples apenas com texto
    const mensagem =
      `🔥 *OFERTA TESTE* 🔥\n\n` +
      `*${oferta.titulo}*\n` +
      `💰 R$ ${oferta.preco}\n\n` +
      `🛒 Link: ${oferta.link_afiliado}`;

    await client.sendMessage(chatID, mensagem);

    // Atualiza o banco para não enviar de novo no próximo loop
    await pool.query("UPDATE ofertas SET postado = TRUE WHERE id = $1", [
      oferta.id,
    ]);

    console.log(`✅ Oferta "${oferta.titulo}" enviada para o grupo!`);
  } catch (error) {
    console.error("❌ Erro no disparo:", error);
  }
}

client.initialize();
