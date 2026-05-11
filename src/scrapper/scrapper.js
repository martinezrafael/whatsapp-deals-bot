import { chromium } from "playwright";

export async function scrapePrice(productId) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
  });
  const page = await context.newPage();

  try {
    await page.goto(`https://www.mercadolivre.com.br/p/${productId}`, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });

    await page.waitForSelector("[data-testid='price-part']", {
      timeout: 10000,
    });

    const data = await page.evaluate(() => {
      const currentPriceMeta = document.querySelector('meta[itemprop="price"]');
      const currentPrice = currentPriceMeta
        ? parseFloat(currentPriceMeta.getAttribute("content"))
        : null;

      let originalPrice = null;

      const originalContainer =
        document.querySelector(".ui-pdp-price__part--original") ||
        document.querySelector(".andes-money-amount--previous");

      if (originalContainer) {
        const label = originalContainer.getAttribute("aria-label");
        if (label) {
          const numbers = label.match(/\d+/g);
          if (numbers && numbers.length >= 2) {
            originalPrice = parseFloat(`${numbers[0]}.${numbers[1]}`);
          }
        }
      }

      if (!originalPrice && originalContainer) {
        const fraction = originalContainer
          .querySelector(".andes-money-amount__fraction")
          ?.innerText.replace(/\D/g, "");
        const cents =
          originalContainer
            .querySelector(".andes-money-amount__cents")
            ?.innerText.replace(/\D/g, "") || "00";
        if (fraction) originalPrice = parseFloat(`${fraction}.${cents}`);
      }

      const sellerEl = document.querySelector(".ui-pdp-seller__link-trigger");

      return {
        currentPrice,
        originalPrice,
        seller: sellerEl ? sellerEl.innerText.trim() : "Mercado Livre",
      };
    });

    await browser.close();
    return data;
  } catch (error) {
    console.error(`❌ Erro no scrap de ${productId}:`, error.message);
    await browser.close();
    return null;
  }
}
