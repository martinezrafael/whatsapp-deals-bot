import "dotenv/config";
import { run, initializeWhatsApp } from "./src/index.js"; // Supondo que você separe a inicialização

const EXECUTION_INTERVAL = 2 * 60 * 60 * 1000;
const GRUPO_MONITORAMENTO = process.env.GROUP_ID_MONITORING;

let whatsappClient;

/**
 * Função que executa apenas a lógica de negócio (curadoria e envio)
 */
const performCuratorship = async () => {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`[${timestamp}] 🚀 Iniciando ciclo de curadoria...`);

  try {
    // Aqui você passa o cliente já conectado para não ter que criar um novo
    await run(whatsappClient);

    console.log(
      `[${new Date().toLocaleTimeString()}] ✅ Ciclo finalizado com sucesso.`,
    );
  } catch (err) {
    console.error(`[Fatal] Erro no ciclo: ${err.message}`);

    if (whatsappClient && GRUPO_MONITORAMENTO) {
      const msgAlerta = `🚨 *PROMOCOFFE: FALHA*\n❌ *Erro:* _${err.message}_`;
      await whatsappClient
        .sendMessage(GRUPO_MONITORAMENTO, msgAlerta)
        .catch(console.error);
    }
  } finally {
    console.log(
      `[Agendamento] Próximo envio em 2h: ${new Date(Date.now() + EXECUTION_INTERVAL).toLocaleTimeString()}`,
    );
    setTimeout(performCuratorship, EXECUTION_INTERVAL);
  }
};

/**
 * Inicialização única do Bot
 */
const bootstrap = async () => {
  try {
    console.log("[Setup] Inicializando cliente WhatsApp...");
    // Inicializa o cliente uma única vez e aguarda o READY
    whatsappClient = await initializeWhatsApp();

    // Inicia o primeiro ciclo imediatamente
    performCuratorship();
  } catch (initialError) {
    console.error("Falha crítica na inicialização:", initialError);
    process.exit(1); // Se não conseguir logar, para tudo para o PM2 tentar de novo
  }
};

bootstrap();
