import "dotenv/config";
import pool from "../database/database.js"; // Importe o seu pool
import { saveToDb } from "../database/dbService.js"; // Importe a função genérica
import { authenticateAndFetchToken } from "./auth/authOrchestrator.js";
import { mlAuthConfig, mlTokenConfig } from "./config/mlConfig.js";

async function runAuthentication() {
  try {
    // 1. Autentica e busca os tokens
    const authPayload = await authenticateAndFetchToken(
      mlAuthConfig,
      mlTokenConfig,
    );

    if (!authPayload || !authPayload.accessToken) {
      throw new Error("O provedor não retornou um token válido.");
    }

    // 2. Prepara os dados para o banco (mapeando para as colunas da tabela)
    const dataToSave = {
      code: authPayload.code,
      access_token: authPayload.accessToken,
    };

    // 3. Salva no banco de dados passando o pool como parâmetro
    const savedRow = await saveToDb(pool, "auth_tokens", dataToSave);

    console.log({
      id: savedRow.id,
      code: savedRow.code,
      access_token: savedRow.access_token,
      created_at: savedRow.created_at,
    });

    return savedRow;
  } catch (error) {
    console.error("Erro crítico na execução:", error.message);
    process.exit(1);
  } finally {
    // Opcional: Fecha o pool se o script for apenas de execução única (CLI)
    // await pool.end();
  }
}

await runAuthentication();
