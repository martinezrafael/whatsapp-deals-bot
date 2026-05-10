/**
 * @file app.js
 * @description Entrypoint principal da aplicação.
 * Gerencia o loop de execução contínua com intervalo de 2 horas.
 */

import { run } from "./src/index.js";

/**
 * Define o intervalo de execução (2 horas em milissegundos).
 * @constant {number}
 */
const EXECUTION_INTERVAL = 2 * 60 * 60 * 1000;

/**
 * Inicializa e gerencia o ciclo de vida da aplicação.
 * Executa o fluxo principal e agenda a próxima execução automaticamente.
 * * @async
 * @function startApp
 * @returns {Promise<void>}
 */
const startApp = async () => {
  console.log(
    `[${new Date().toLocaleTimeString()}] 🚀 Iniciando ciclo de curadoria...`,
  );

  try {
    // Executa o fluxo principal (WhatsApp, Busca ML, IA e Envio)
    await run();

    console.log(
      `[${new Date().toLocaleTimeString()}] ✅ Ciclo finalizado com sucesso.`,
    );
  } catch (err) {
    console.error("[Fatal] Erro durante a execução do ciclo:", err.message);
    // Em caso de erro crítico, não encerramos o processo para o PM2 não entrar em loop de crash,
    // apenas aguardamos o próximo intervalo para tentar novamente.
  } finally {
    const nextExecution = new Date(Date.now() + EXECUTION_INTERVAL);
    console.log(
      `[Agendamento] Próximo envio programado para: ${nextExecution.toLocaleTimeString()}`,
    );

    // Agenda a próxima execução sem encerrar o processo
    setTimeout(startApp, EXECUTION_INTERVAL);
  }
};

// Inicia o primeiro ciclo imediatamente
startApp();
