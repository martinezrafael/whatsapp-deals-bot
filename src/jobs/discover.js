import pkg from "whatsapp-web.js";
const { Client, LocalAuth } = pkg;
import qrcode from "qrcode-terminal";

const client = new Client({
  authStrategy: new LocalAuth(),
});

client.on("qr", (qr) => {
  qrcode.generate(qr, { small: true });
  console.log("▲ Escaneie o QR Code acima para listar seus grupos.");
});

client.on("ready", async () => {
  console.log("Conectado! Buscando grupos...");
  const chats = await client.getChats();
  const grupos = chats.filter((chat) => chat.isGroup);

  console.log("\n=== SEUS GRUPOS ENCONTRADOS ===");
  grupos.forEach((g) => {
    console.log(`Nome: ${g.name}`);
    console.log(`ID: ${g.id._serialized}`); // ESTE É O VALOR QUE VAI NO .ENV
    console.log("-------------------------------");
  });

  process.exit();
});

client.initialize();
