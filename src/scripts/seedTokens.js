import "dotenv/config";
import pool from "../config/database.js";

async function seedTokens() {
  try {
    console.log("🌱 Iniciando inserção do token inicial...");

    await pool.query("DELETE FROM auth_tokens");

    const query = `
      INSERT INTO auth_tokens (
        access_token, 
        refresh_token, 
        expires_at
      ) VALUES ($1, $2, $3)
    `;

    const accessToken =
      "APP_USR-8907271086207187-050508-07f40c95873163caf974d6631e59d926-264537457";
    const refreshToken = "TG-69f9ec57634d1f0001a4059f-264537457";

    const expiresAt = new Date(Date.now() + 21600 * 1000);

    await pool.query(query, [accessToken, refreshToken, expiresAt]);

    console.log("Token inicial inserido com sucesso!");
    console.log(`Expiração definida para: ${expiresAt.toLocaleString()}`);

    process.exit(0);
  } catch (err) {
    console.error("❌ Erro ao inserir token:", err);
    process.exit(1);
  }
}

seedTokens();
