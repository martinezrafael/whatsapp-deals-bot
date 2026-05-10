import "dotenv/config";

/**
 * Gera links de afiliado via API oficial do Mercado Livre em lotes de 40.
 * @async
 * @param {string|string[]} urls - Lista de URLs de produtos para encurtar.
 * @param {string} [tag="rafaelmartinezcontato"] - Tag de afiliado para atribuição.
 * @returns {Promise<{urls: Object[], total_success: number, total_error: number}>} Resultados da conversão.
 */
export const generateAffiliateLinks = async (
  urls,
  tag = "rafaelmartinezcontato",
) => {
  const urlList = Array.isArray(urls) ? urls : [urls];
  const results = { urls: [], total_success: 0, total_error: 0 };
  const endpoint =
    "https://www.mercadolivre.com.br/affiliate-program/api/v2/affiliates/createLink";

  for (let i = 0; i < urlList.length; i += 40) {
    const chunk = urlList.slice(i, i + 40);
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-csrf-token": process.env.ML_CSRF_TOKEN,
          cookie: process.env.ML_AFFILIATE_COOKIE,
          "user-agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
        body: JSON.stringify({ urls: chunk, tag }),
      });

      const data = await response.json();
      if (response.ok && data.urls) {
        const valid = data.urls.filter((u) => u.error_code !== 111);
        results.urls.push(...valid);
        results.total_success += valid.length;
        results.total_error += chunk.length - valid.length;
      }
    } catch (e) {
      results.total_error += chunk.length;
    }

    if (i + 40 < urlList.length) await new Promise((r) => setTimeout(r, 1000));
  }
  return results;
};
