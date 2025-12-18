// config.js - Shopify API Configuration
// IMPORTANT: Keep this file secure and never commit real tokens to public repos

const SHOPIFY_CONFIG = {
  // Replace with your actual store domain (without https://)
  storeDomain: 'delavillaprod.myshopify.com',
  
  // Replace with your Storefront API access token
  storefrontAccessToken: 'fbbd3af51ce4a518fb094ea34139f2f1',
  
  // API version (update as needed)
  apiVersion: '2025-01',
  
  // Shop opening date (ISO 8601 format: YYYY-MM-DDTHH:MM:SS)
  // Shop will be closed with countdown until this date
  shopOpeningDate: '2025-12-18T20:00:00',
  
  // Shop closing date (ISO 8601 format: YYYY-MM-DDTHH:MM:SS)
  // Shop will close at this date and show closed message
  shopClosingDate: '2025-12-23T00:00:00'
};

// Validation
if (SHOPIFY_CONFIG.storeDomain.includes('YOUR-STORE') || 
    SHOPIFY_CONFIG.storefrontAccessToken.includes('YOUR_STOREFRONT')) {
  console.warn('⚠️ Shopify credentials not configured! Update config.js with your actual credentials.');
}