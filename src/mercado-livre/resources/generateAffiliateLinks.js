import "dotenv/config";

/**
 * Gera links de afiliado para o Mercado Livre em lotes, filtrando URLs não permitidas.
 *
 * @async
 * @function generateAffiliateLinks
 * @param {string|string[]} urls - Uma única URL ou um array de URLs para converter.
 * @param {string} [tag="rafaelmartinezcontato"] - A tag de identificação do afiliado.
 * @returns {Promise<object>} Objeto contendo o status, as URLs geradas e contadores de sucesso/erro.
 */
export const generateAffiliateLinks = async (
  urls,
  tag = "rafaelmartinezcontato",
) => {
  const endpoint =
    "https://www.mercadolivre.com.br/affiliate-program/api/v2/affiliates/createLink";
  const urlList = Array.isArray(urls) ? urls : [urls];

  const CHUNK_SIZE = 40;
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
        const validLinks = data.urls.filter((item) => item.error_code !== 111);

        results.urls.push(...validLinks);

        results.total_success += validLinks.length;
        results.total_error += currentChunk.length - validLinks.length;
      } else {
        console.error(`[AffiliateGen] Erro no lote: ${response.status}`, data);
        results.total_error += currentChunk.length;
      }

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
