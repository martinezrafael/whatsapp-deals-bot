import "dotenv/config";

export async function getAccessToken(code) {
  const url = "https://api.mercadolibre.com/oauth/token";

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: process.env.ML_CLIENT_ID,
    client_secret: process.env.ML_CLIENT_SECRET,
    code: code,
    redirect_uri: process.env.ML_REDIRECT_URI,
  });

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body,
  });

  return await response.json();
}

export async function refreshMyToken(storedRefreshToken) {
  const url = "https://api.mercadolibre.com/oauth/token";

  const body = new URLSearchParams({
    grant_type: "refresh_token",
    client_id: process.env.ML_CLIENT_ID,
    client_secret: process.env.ML_CLIENT_SECRET,
    refresh_token: storedRefreshToken,
  });

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: body,
    });

    const data = await response.json();

    if (data.error) {
      console.error("Erro da API Mercado Livre:", data);
      throw new Error(data.message || data.error);
    }

    return data;
  } catch (error) {
    console.error("Erro de conexão ao renovar token:", error.message);
    throw error;
  }
}
