import dotenv from "dotenv";
dotenv.config();

let currentCookie = process.env.ML_COOKIE;

function updateCookieJar(oldCookieString, setCookieArray) {
  const cookieMap = {};

  if (oldCookieString) {
    oldCookieString.split(";").forEach((c) => {
      const [key, ...val] = c.trim().split("=");
      if (key) cookieMap[key] = val.join("=");
    });
  }

  if (Array.isArray(setCookieArray)) {
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
  const apiUrl =
    "https://www.mercadolivre.com.br/affiliate-program/api/v2/affiliates/createLink";

  try {
    if (!urlOriginal || typeof urlOriginal !== "string") {
      console.error("⚠️ URL original inválida ou não fornecida.");
      return null;
    }

    // 2. Limpeza da URL (remove parâmetros de rastreio existentes)
    const urlLimpa = urlOriginal.split("?")[0];

    // 3. Requisição para o Mercado Livre
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        accept: "application/json, text/plain, */*",
        "content-type": "application/json",
        "x-csrf-token": process.env.ML_CSRF_TOKEN,
        cookie: currentCookie,
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        origin: "https://www.mercadolivre.com.br",
        referer: "https://www.mercadolivre.com.br/afiliados/linkbuilder",
      },
      body: JSON.stringify({
        urls: [urlLimpa],
        tag: "rafaelmartinezcontato",
      }),
    });

    const setCookies = response.headers.getSetCookie();
    if (setCookies.length > 0) {
      currentCookie = updateCookieJar(currentCookie, setCookies);
    }

    // 5. Tratamento de Erro HTTP
    if (!response.ok) {
      const errorText = await response.text();
      // Se for 400, o CSRF ou Cookie no .env provavelmente expiraram
      console.error(`Erro ML (${response.status}):`, errorText);
      return null;
    }

    // 6. Extração do link encurtado
    const data = await response.json();

    if (data?.urls?.[0]?.short_url) {
      return data.urls[0].short_url;
    }

    console.warn("Resposta do ML não contém short_url válido.");
    return null;
  } catch (err) {
    console.error("Falha crítica ao gerar link de afiliado:", err.message);
    return null;
  }
}
