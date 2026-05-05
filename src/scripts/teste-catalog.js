import { searchProduct } from "../database/catalog.js";
import pool from "../config/database.js";
import "dotenv/config";

async function verFormatoJson() {
  try {
    const res = await pool.query(
      "SELECT access_token FROM auth_tokens LIMIT 1",
    );

    if (res.rows.length === 0) {
      return;
    }

    const token = res.rows[0].access_token;
    const termoBusca = "Café Especial";

    const data = await searchProduct(termoBusca, token);

    console.dir(data, { depth: null, colors: true });

    process.exit(0);
  } catch (error) {
    console.error("sFalha na busca:", error.message);
    process.exit(1);
  }
}

verFormatoJson();
