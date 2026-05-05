import { searchProduct } from "../database/catalog.js";
import pool from "../config/database.js";
import "dotenv/config";

async function verFormatoJson() {
  try {
    // 1. Pegamos o token atualizado do banco
    const res = await pool.query(
      "SELECT access_token FROM auth_tokens LIMIT 1",
    );

    if (res.rows.length === 0) {
      console.log(
        "❌ Erro: Nenhum token encontrado. Rode o seedTokens.js primeiro.",
      );
      return;
    }

    const token = res.rows[0].access_token;
    const termoBusca = "Café Especial"; // Termo de teste

    console.log(`🔍 Buscando: "${termoBusca}"...`);

    // 2. Chamamos a sua função do catalog.js
    const data = await searchProduct(termoBusca, token);

    // 3. Exibimos o JSON completo com cores e identação
    console.log("\n📦 FORMATO DO JSON RETORNADO:");
    console.dir(data, { depth: null, colors: true });

    process.exit(0);
  } catch (error) {
    console.error("❌ Falha na busca:", error.message);
    process.exit(1);
  }
}

verFormatoJson();
