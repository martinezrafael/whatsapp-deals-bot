import pkg from "whatsapp-web.js";
const { Client, LocalAuth, MessageMedia } = pkg;
import qrcode from "qrcode-terminal";
import pool from "../config/database.js";
import "dotenv/config";

import { refreshMyToken } from "./auth.js";
import { searchProduct, saveCatalogToDb } from "../database/catalog.js";
import { gerarLinkAfiliado } from "../services/mercadolivre.js";

/**
 * Gerencia a renovação do Token de Acesso.
 */
async function validarEObterToken() {
  console.log("🔑 [Token] Verificando validade...");
  try {
    const { rows } = await pool.query("SELECT * FROM auth_tokens LIMIT 1");
    const tokens = rows[0];

    if (!tokens) throw new Error("Autenticação ausente no banco.");

    const limiteRenovacao = new Date(Date.now() + 10 * 60 * 1000);
    const expiraEm = new Date(tokens.expires_at);

    if (expiraEm <= limiteRenovacao) {
      console.log("🔄 [Token] Renovando...");
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
    console.error("❌ [Token] Erro detalhado:", error);
    throw error;
  }
}

/**
 * Busca anúncios e alimenta o banco de dados.
 */
async function alimentarFilaDeOfertas(termoBusca) {
  console.log(`🚀 [Fila] Iniciando busca para: "${termoBusca}"`);
  try {
    const token = await validarEObterToken();
    const data = await searchProduct(termoBusca, token);
    const results = data?.results || [];

    if (results.length === 0)
      return console.log("⚠️ [Fila] Nada encontrado na API do ML.");

    console.log(
      `📦 [Fila] Sincronizando ${results.length} itens com o banco...`,
    );
    await saveCatalogToDb(results, pool);

    for (const prod of results) {
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
        process.stdout.write(`.`);
      } catch (err) {
        console.error(`\n❌ [Fila] Erro no item ${prod.id}:`, err.message);
      }
    }
    console.log("\n🏁 [Fila] Processamento concluído.");
  } catch (error) {
    console.error("❌ [Fila] Erro Crítico:", error);
  }
}

/**
 * Envia a oferta para o WhatsApp.
 */
async function processarUmaOferta() {
  console.log("📡 [WhatsApp] Verificando se há ofertas pendentes...");
  try {
    const chatID = process.env.GROUP_ID;
    if (!chatID) {
      console.error("❌ [WhatsApp] GROUP_ID não definido no .env");
      return;
    }

    const { rows } = await pool.query(`
      SELECT o.*, c.nome_oficial, c.marca, c.imagem_high_res, c.raw_data
      FROM ofertas o
      JOIN produtos_catalogo c ON o.id_catalogo = c.id_catalogo
      WHERE o.postado = FALSE 
      ORDER BY o.data_criacao ASC LIMIT 1
    `);

    if (rows.length === 0) {
      console.log("📭 Fila vazia no banco.");
      return await alimentarFilaDeOfertas("Café Especial Moído");
    }

    const oferta = rows[0];
    console.log(`📤 [WhatsApp] Preparando envio: ${oferta.nome_oficial}`);

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

    let postadoSucesso = false;

    // Log antes da ação que costuma causar o ECONNRESET
    console.log("📸 [WhatsApp] Tentando carregar/enviar mídia...");

    try {
      if (oferta.imagem_high_res) {
        console.log(`🔗 [WhatsApp] Baixando imagem: ${oferta.imagem_high_res}`);
        const media = await MessageMedia.fromUrl(oferta.imagem_high_res);
        console.log("📤 [WhatsApp] Enviando mensagem com imagem...");
        await client.sendMessage(chatID, media, { caption: mensagem });
      } else {
        console.log("📤 [WhatsApp] Enviando apenas texto...");
        await client.sendMessage(chatID, mensagem);
      }
      postadoSucesso = true;
    } catch (mediaError) {
      console.error(
        "⚠️ [WhatsApp] Erro de mídia/envio principal:",
        mediaError.message,
      );
      console.log(
        "🔄 [WhatsApp] Tentativa de fallback: Enviando apenas texto...",
      );
      await client.sendMessage(chatID, mensagem);
      postadoSucesso = true;
    }

    if (postadoSucesso) {
      await pool.query("UPDATE ofertas SET postado = TRUE WHERE id = $1", [
        oferta.id,
      ]);
      console.log(`✅ [WhatsApp] Postado com sucesso: ${oferta.nome_oficial}`);
    }
  } catch (error) {
    console.error("❌ [WhatsApp] Erro no fluxo de envio:");
    console.error(error); // Loga o objeto de erro completo com stack trace
  }
}

/**
 * Inicialização do Cliente
 */
const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    headless: true,
    // Aumentar o timeout ajuda se o PC estiver lento
    handleSIGINT: false,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--no-zygote",
      "--single-process",
    ],
  },
});

client.on("qr", (qr) => {
  console.log("💡 [WhatsApp] Novo QR Code gerado. Escaneie para conectar:");
  qrcode.generate(qr, { small: true });
});

client.on("loading_screen", (percent, message) => {
  console.log(`⏳ [WhatsApp] Carregando: ${percent}% - ${message}`);
});

client.on("authenticated", () => {
  console.log("✅ [WhatsApp] Autenticado com sucesso!");
});

client.on("ready", () => {
  console.log("🚀 [WhatsApp] Bot Online e Pronto!");
  const intervalo = parseInt(process.env.SEND_INTERVAL_MS) || 1800000;

  // Delay maior (10s) para garantir que o WhatsApp carregou todas as conversas internas
  console.log("⏱️ Aguardando 10 segundos para estabilização...");
  setTimeout(() => {
    processarUmaOferta();
    setInterval(processarUmaOferta, intervalo);
  }, 10000);
});

client.on("disconnected", (reason) => {
  console.log("❌ [WhatsApp] O bot foi desconectado:", reason);
});

console.log(" iniciando o client...");
client.initialize().catch((err) => {
  console.error("❌ [WhatsApp] Falha fatal na inicialização:");
  console.error(err);
});
