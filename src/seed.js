import pool from "./config/database.js";

async function seed() {
  try {
    const query = `
            INSERT INTO ofertas (titulo, preco, link_original, link_afiliado)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (link_original) DO NOTHING
            RETURNING *;
        `;

    const values = [
      'Monitor Gamer Curvo 27" 165Hz',
      1299.9,
      "https://loja.com/monitor-123",
      "https://afiliado.com/monitor-123",
    ];

    const res = await pool.query(query, values);

    if (res.rows.length > 0) {
      console.log("✅ Oferta de teste inserida com sucesso!");
    } else {
      console.log(
        "⚠️ A oferta já existia no banco (Unique constraint funcionou).",
      );
    }
  } catch (err) {
    console.error("❌ Erro ao inserir dados:", err);
  } finally {
    await pool.end();
  }
}

seed();
