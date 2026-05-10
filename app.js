/**
 * @file app.js
 * @description Entrypoint principal da aplicação com sistema de monitoramento via WhatsApp.
 * Gerencia o loop de execução contínua e envia alertas para o grupo de monitoramento.
 */

import "dotenv/config";
import { run } from "./src/index.js";

/**
 * Define o intervalo de execução (2 horas em milissegundos).
 * @constant {number}
 */
const EXECUTION_INTERVAL = 2 * 60 * 60 * 1000;

/**
 * ID do Grupo de Monitoramento (recuperado do .env)
 * @constant {string}
 */
const GRUPO_MONITORAMENTO = process.env.GROUP_ID_MONITORING;

/**
 * Inicializa e gerencia o ciclo de vida da aplicação.
 * @async
 * @function startApp
 */
const startApp = async () => {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`[${timestamp}] 🚀 Iniciando ciclo de curadoria...`);

  let whatsappClient;

  try {
    /**
     * Executa o fluxo principal e retorna a instância ativa do cliente WhatsApp.
     */
    whatsappClient = await run();

    console.log(
      `[${new Date().toLocaleTimeString()}] ✅ Ciclo finalizado com sucesso.`,
    );
  } catch (err) {
    console.error(`[Fatal] Erro durante a execução do ciclo: ${err.message}`);

    /**
     * RESGATE DO CLIENTE:
     * Se o run() falhou, a variável 'whatsappClient' acima estará undefined.
     * Tentamos recuperar a instância do WhatsApp que anexamos ao erro no index.js.
     */
    const activeClient = whatsappClient || err.client;

    if (activeClient && GRUPO_MONITORAMENTO) {
      try {
        const msgAlerta =
          `🚨 *PROMOCOFFE: ALERTA DE FALHA*\n\n` +
          `🕒 *Ocorrência:* ${new Date().toLocaleTimeString()}\n` +
          `❌ *Erro:* _${err.message}_\n\n` +
          `🔧 *Status:* O sistema segue ativo e tentará novamente no próximo ciclo agendado.`;

        await activeClient.sendMessage(GRUPO_MONITORAMENTO, msgAlerta);
        console.log(
          "[Monitoramento] ✅ Alerta enviado para o grupo com sucesso.",
        );
      } catch (sendError) {
        console.error(
          "[Monitoramento] ❌ Falha ao enviar alerta via WhatsApp:",
          sendError.message,
        );
      }
    } else {
      console.error(
        "[Monitoramento] ⚠️ Alerta não enviado: Cliente WhatsApp não inicializado ou ID ausente.",
      );
    }
  } finally {
    const nextExecution = new Date(Date.now() + EXECUTION_INTERVAL);
    console.log(
      `[Agendamento] Próximo envio programado para: ${nextExecution.toLocaleTimeString()}`,
    );

    // Agenda a próxima execução
    setTimeout(startApp, EXECUTION_INTERVAL);
  }
};

// Inicia o app
startApp();
