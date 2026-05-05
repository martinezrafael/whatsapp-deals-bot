import pool from "../config/database.js"; // Ajuste para seu caminho de conexão
import { searchProduct, saveCatalogToDb } from "./catalog.js";

async function executarSincronizacao() {
  try {
    // 1. Busca o token ativo no banco
    const resToken = await pool.query(
      "SELECT access_token FROM auth_tokens ORDER BY expires_at DESC LIMIT 1",
    );
    const token = resToken.rows[0]?.access_token;

    if (!token) throw new Error("Token não encontrado no banco.");

    // 2. Define o termo de busca (ex: Café)
    const termo = "Café Especial Moído";
    console.log(`🔎 Buscando no ML: ${termo}...`);

    // 3. Chama a API
    const data = await searchProduct(termo, token);

    // 4. Salva tudo no banco de dados
    if (data.results && data.results.length > 0) {
      await saveCatalogToDb(data.results, pool);
      console.log(
        `✅ Sucesso: ${data.results.length} produtos salvos no catálogo!`,
      );
    }
  } catch (error) {
    console.error("❌ Falha na operação:", error.message);
  } finally {
    process.exit();
  }
}

executarSincronizacao();
