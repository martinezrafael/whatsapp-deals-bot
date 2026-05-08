import "dotenv/config";

/**
 * Gera links de afiliado para o Mercado Livre, filtrando URLs não permitidas (erro 111).
 * @param {string|string[]} urls - Uma string ou array de URLs.
 * @param {string} tag - Sua tag de afiliado.
 */
export const generateAffiliateLinks = async (
  urls,
  tag = "rafaelmartinezcontato",
) => {
  const endpoint =
    "https://www.mercadolivre.com.br/affiliate-program/api/v2/affiliates/createLink";
  const urlList = Array.isArray(urls) ? urls : [urls];

  // Manter CHUNK_SIZE baixo ajuda a evitar bloqueios e erros 400
  const CHUNK_SIZE = 5;
  const results = {
    status: 200,
    urls: [],
    total_items: urlList.length,
    total_success: 0,
    total_error: 0,
  };

  try {
    for (let i = 0; i < urlList.length; i += CHUNK_SIZE) {
      const currentChunk = urlList.slice(i, i + CHUNK_SIZE);

      console.log(
        `[AffiliateGen] Processando lote ${Math.floor(i / CHUNK_SIZE) + 1}...`,
      );

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          accept: "application/json, text/plain, */*",
          "accept-language": "pt-BR,pt;q=0.7",
          "content-type": "application/json",
          origin: "https://www.mercadolivre.com.br",
          referer: "https://www.mercadolivre.com.br/afiliados/linkbuilder",
          "user-agent":
            "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36",
          "x-csrf-token": process.env.ML_CSRF_TOKEN,
          cookie: process.env.ML_AFFILIATE_COOKIE,
        },
        body: JSON.stringify({
          urls: currentChunk,
          tag: tag,
        }),
      });

      const data = await response.json();

      if (response.ok && data.urls) {
        // 🛑 FILTRO: Remove itens com error_code: 111 (URL não permitida)
        const validLinks = data.urls.filter((item) => item.error_code !== 111);

        results.urls.push(...validLinks);

        // Atualiza contadores baseados no filtro
        results.total_success += validLinks.length;
        results.total_error += currentChunk.length - validLinks.length;
      } else {
        console.error(`[AffiliateGen] Erro no lote: ${response.status}`, data);
        results.total_error += currentChunk.length;
      }

      // Delay entre lotes para não sobrecarregar a API
      if (i + CHUNK_SIZE < urlList.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    return results;
  } catch (error) {
    console.error(`[AffiliateGen] Erro fatal: ${error.message}`);
    return { ...results, status: 500, error: error.message };
  }
};
