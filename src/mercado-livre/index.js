import "dotenv/config";
import { authenticateAndFetchToken } from "./auth/authOrchestrator.js";
import { mlAuthConfig, mlTokenConfig } from "./config/mlConfig.js";

async function runAuthentication() {
  try {
    const authPayload = await authenticateAndFetchToken(
      mlAuthConfig,
      mlTokenConfig,
    );

    if (!authPayload) {
      throw new Error("O provedor não retornou um token válido.");
    }

    console.log({
      code: authPayload.code,
      token: authPayload.accessToken,
    });

    return authPayload;
  } catch (error) {
    console.error("Erro crítico na execução:", error.message);
    process.exit(1);
  }
}

await runAuthentication();
