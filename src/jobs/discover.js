import pkg from "whatsapp-web.js";
const { Client, LocalAuth } = pkg;
import qrcode from "qrcode-terminal";

const client = new Client({
  authStrategy: new LocalAuth(),
});

client.on("qr", (qr) => {
  qrcode.generate(qr, { small: true });
});

client.on("ready", async () => {
  const chats = await client.getChats();
  const grupos = chats.filter((chat) => chat.isGroup);

  grupos.forEach((g) => {
    console.log(`Nome: ${g.name}`);
    console.log(`ID: ${g.id._serialized}`);
  });

  process.exit();
});

client.initialize();
