const SHOPIFY_CONFIG = {
  storeDomain: "delavillaprod.myshopify.com",
  storefrontAccessToken: "fbbd3af51ce4a518fb094ea34139f2f1",
  apiVersion: "2025-01",
  shopOpeningDate: "2025-12-20T00:00:00",
  shopClosingDate: "2025-12-24T00:00:00"
};

if (
  SHOPIFY_CONFIG.storeDomain.includes("YOUR-STORE") ||
  SHOPIFY_CONFIG.storefrontAccessToken.includes("YOUR_STOREFRONT")
) {
  console.warn("⚠️ Shopify credentials not configured! Update config.js with your actual credentials.");
}