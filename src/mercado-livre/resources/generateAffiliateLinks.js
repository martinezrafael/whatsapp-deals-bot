import { fetchService } from "../../services/fetchService.js";

/**
 * Gera links de afiliado dinâmicos para o Mercado Livre.
 * Filtra erros de URL não permitida (111) e retorna apenas as short_urls.
 * @param {string|string[]} urls - Uma string ou array de strings com as URLs dos produtos.
 * @param {string} tag - Sua tag de afiliado.
 */
export const generateAffiliateLinks = async (
  urls,
  tag = "rafaelmartinezcontato",
) => {
  const endpoint =
    "https://www.mercadolivre.com.br/affiliate-program/api/v2/affiliates/createLink";
  const urlList = Array.isArray(urls) ? urls : [urls];

  const CHUNK_SIZE = 5;
  const finalShortUrls = [];

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
          "content-type": "application/json",
          origin: "https://www.mercadolivre.com.br",
          referer: "https://www.mercadolivre.com.br/afiliados/linkbuilder",
          "user-agent":
            "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36",
          "x-csrf-token": "URnx4gNW-EkARCIoNIjEuyy7c5df-kPUlYw8",
          cookie:
            'c_wP4d7=1; inferredZipcode=true; _d2id=716ef3e5-c610-4507-8ed9-d52a06d59eca; g_state={"i_l":0,"i_ll":1777927647994,"i_b":"pRuz2fxay21rA9fVz6TcrYxDG79/s++0QQv/F9tWxoQ","i_e":{"enable_itp_optimization":18},"i_et":1777927641627}; orguseridp=264537457; ssid=ghy-050416-b0q6IBeCenGj22bST7CAoM8UGDIgyD-__-264537457-__-1872622065838--RRR_0-RRR_0; ftid=Dq0Tbml9OgpJ6EzhfPRM94i3dMkGyt7N-1777927648972; orguserid=TZtTT79HhT9h; orgnickp=RAFAELMARTINEZCONTATO; cookiesPreferencesLoggedFallback=%7B%22userId%22%3A264537457%2C%22categories%22%3A%7B%22advertising%22%3Atrue%2C%22functionality%22%3Anull%2C%22performance%22%3Anull%2C%22traceability%22%3Atrue%7D%7D; cookiesPreferencesNotLogged=%7B%22categories%22%3A%7B%22advertising%22%3Atrue%2C%22functionality%22%3Anull%2C%22performance%22%3Anull%2C%22traceability%22%3Atrue%7D%7D; cp=11770374; tooltips-configuration={"compats_highlight_tooltip":{"view_cnt":1,"close_cnt":0,"view_time":1778092835,"close_time":0}}; LAST_SEARCH=cafÃ©%20uniÃ£o; c_ZxMWlg=1; _csrf=fYANgFbDPBlU30olztKPoGYA; ml_cart-quantity=0; _mldataSessionId=549c5541-050b-46fc-8cdb-0c626490b161; cookiesPreferencesLogged=%7B%22userId%22%3A264537457%2C%22categories%22%3A%7B%22advertising%22%3Atrue%2C%22functionality%22%3Anull%2C%22performance%22%3Anull%2C%22traceability%22%3Atrue%7D%7D; nsa_rotok=eyJhbGciOiJSUzI1NiIsImtpZCI6IjMiLCJ0eXAiOiJKV1QifQ.eyJpZGVudGlmaWVyIjoiZTM2NjIwYjAtNWVkYi00MWU1LTk5ZjAtYjZlMmQzMjJjZjQ1Iiwicm90YXRpb25faWQiOiI1YzI3MjcyNi1jMThkLTQyMzUtYTAyMy0wOTJhYzE5OWY0ZTkiLCJwbGF0Zm9ybSI6Ik1MIiwicm90YXRpb25fZGF0ZSI6MTc3ODIwNzIzMCwiZXhwIjoxNzgwNzk4NjMwLCJqdGkiOiI5ZTIyNTg0Yi1kOWM5LTRlYjYtOTMyNy04ZjhiOWNhMzkzOWUiLCJpYXQiOjE3NzgyMDY2MzAsInN1YiI6ImUzNjYyMGIwLTVlZGItNDFlNS05OWYwLWI2ZTJkMzIyY2Y0NSJ9.DwNkO2GUg9iME0qvPaVcF6LwHI6CrvJ7Ya1FLOffXiCbbvpdvrALYXvuMl-JBi0OeInLAiMpwCB7--yYMCii5aA76K_AkOxBUwUQSXwpSBEWUMotveR2z9j6oc_FiQ3okeXRaTwWCLmpRethoyYkqModjivlclip0ne6V6WyGsxmopUpcMr47QOIz8AzXAYcPtod2rqtDayXYMcWCqa5tmjG8DzxQWoPNovhss5kxnMhw4K-_dTTzo_cI2ATey0p5NZ8u39XoRDguWgSzxrRr-OFtxafPVGzmbefu-SEPjKI0pBruK5OGNZF7tdjekpqsmyeyn4mYAhAIbtN2EpNVg; _snoopy=eyJmaW5nZXJwcmludCI6IjhJZmM5UU0rb0lkWVhCb2d1dzg3ZFNRS0NONUxSc0lnNElmQldySUw5T0dMZi8rMktMcUhMNUZHSWU2cTBrcGI5QThYR1YzMk9vSWhOSU52T0NqSEYrcnVtakl4YzU1VjVmeUF1REpZbWQyT2RJRGdTZmc5MmJRalF6dFhEamxPUmI4U3BVMEs1MEJCUkRxUyt4NGpOcS80TklyNlV1VmgyZ3VzTDRZelRyblRJZGxNcjJnPSIsImtleSI6IkhtYy9LS1dLMEZVR2lOdldua0ozL1k2VVo0ZGN2QXF5SFh2RGRhVWpsYS94dDROZFBRakRJL0VOdXR1cWs3MVdTSDNncXdXMFFFM0MzVXBWMzkyVkVXRnBmZVpabWxCOCJ9; hide-cookie-banner=264537457-COOKIE_PREFERENCES_ALREADY_SET',
        },
        body: JSON.stringify({
          urls: currentChunk,
          tag: tag,
        }),
      });

      const data = await response.json();

      if (response.ok && data.urls) {
        // Filtra os itens com erro 111 e mapeia apenas para a short_url
        const validBatchUrls = data.urls
          .filter((item) => item.error_code !== 111 && item.short_url)
          .map((item) => item.short_url);

        finalShortUrls.push(...validBatchUrls);
      } else {
        console.error(`[AffiliateGen] Erro no lote: ${response.status}`, data);
      }

      if (i + CHUNK_SIZE < urlList.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    // Retorna o array simples contendo apenas as URLs curtas
    return finalShortUrls;
  } catch (error) {
    console.error(`[AffiliateGen] Erro fatal: ${error.message}`);
    return [];
  }
};
