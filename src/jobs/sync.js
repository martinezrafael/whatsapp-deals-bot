import pool from "../config/database.js";
import { searchProduct, saveCatalogToDb } from "./catalog.js";

async function executarSincronizacao() {
  try {
    const resToken = await pool.query(
      "SELECT access_token FROM auth_tokens ORDER BY expires_at DESC LIMIT 1",
    );
    const token = resToken.rows[0]?.access_token;

    if (!token) throw new Error("Token não encontrado no banco.");

    const termo = "Café Especial Moído";

    const data = await searchProduct(termo, token);

    if (data.results && data.results.length > 0) {
      await saveCatalogToDb(data.results, pool);
    }
  } catch (error) {
    console.error("Falha na operação:", error.message);
  } finally {
    process.exit();
  }
}

executarSincronizacao();
