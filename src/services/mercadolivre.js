import dotenv from "dotenv";
dotenv.config();

let currentCookie = process.env.ML_COOKIE;

function updateCookieJar(oldCookieString, setCookieArray) {
  let cookieMap = {};

  if (oldCookieString) {
    oldCookieString.split(";").forEach((c) => {
      const [key, ...val] = c.trim().split("=");
      if (key) cookieMap[key] = val.join("=");
    });
  }

  if (setCookieArray && Array.isArray(setCookieArray)) {
    setCookieArray.forEach((c) => {
      const cookiePart = c.split(";")[0];
      const [key, ...val] = cookiePart.trim().split("=");
      if (key) cookieMap[key] = val.join("=");
    });
  }

  return Object.entries(cookieMap)
    .map(([key, val]) => `${key}=${val}`)
    .join("; ");
}

export async function gerarLinkAfiliado(urlOriginal) {
  const url =
    "https://www.mercadolivre.com.br/affiliate-program/api/v2/affiliates/createLink";

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        accept: "application/json, text/plain, */*",
        "content-type": "application/json",
        "x-csrf-token": process.env.ML_CSRF_TOKEN,
        cookie: currentCookie,
        "user-agent":
          "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36",
        origin: "https://www.mercadolivre.com.br",
        referer: "https://www.mercadolivre.com.br/afiliados/linkbuilder",
      },
      body: JSON.stringify({
        urls: [urlOriginal],
        tag: "rafaelmartinezcontato",
      }),
    });

    const setCookies = response.headers.getSetCookie();
    if (setCookies.length > 0) {
      currentCookie = updateCookieJar(currentCookie, setCookies);
      console.log("🍪 Cookies de sessão atualizados!");
    }

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Erro ML: ${response.status} - ${error}`);
    }

    const data = await response.json();

    // AJUSTE AQUI: Acessando a estrutura correta do JSON que você postou
    if (data && data.urls && data.urls.length > 0) {
      // Retorna o link encurtado (meli.la)
      return data.urls[0].short_url || null;
    }

    console.warn("⚠️ ML retornou sucesso, mas sem URLs no corpo da resposta.");
    return null;
  } catch (err) {
    console.error("❌ Falha ao gerar link:", err.message);
    return null;
  }
}
