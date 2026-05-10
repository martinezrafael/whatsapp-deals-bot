/**
 * @file app.js
 * @description Entrypoint principal na raiz do projeto.
 */

import { run } from "./src/index.js";

// Executa o fluxo principal importado do src/index.js
run().catch((err) => {
  console.error(
    "[Fatal] Erro ao iniciar a aplicação através do entrypoint:",
    err,
  );
  process.exit(1);
});
