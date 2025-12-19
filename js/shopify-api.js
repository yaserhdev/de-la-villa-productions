class ShopifyAPI {
  constructor(config) {
    this.domain = config.storeDomain;
    this.token = config.storefrontAccessToken;
    this.apiVersion = config.apiVersion;
    this.endpoint = `https://${this.domain}/api/${this.apiVersion}/graphql.json`;
  }

  async query(graphqlQuery) {
    try {
      const response = await fetch(this.endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Storefront-Access-Token": this.token
        },
        body: JSON.stringify({ query: graphqlQuery })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.errors) {
        console.error("GraphQL errors:", result.errors);
        throw new Error(result.errors[0].message);
      }

      return result.data;
    } catch (error) {
      console.error("Shopify API Error:", error);
      throw error;
    }
  }

  async getProducts(limit = 20) {
    const data = await this.query(`
      {
        products(first: ${limit}) {
          edges {
            node {
              id
              title
              description
              availableForSale
              priceRange {
                minVariantPrice {
                  amount
                  currencyCode
                }
              }
              images(first: 5) {
                edges {
                  node {
                    url
                    altText
                  }
                }
              }
              variants(first: 10) {
                edges {
                  node {
                    id
                    title
                    priceV2 {
                      amount
                      currencyCode
                    }
                    availableForSale
                    quantityAvailable
                  }
                }
              }
            }
          }
        }
      }
    `);

    return data.products.edges.map(edge => this.formatProduct(edge.node));
  }

  async getProductByHandle(handle) {
    const data = await this.query(`
      {
        productByHandle(handle: "${handle}") {
          id
          title
          description
          availableForSale
          priceRange {
            minVariantPrice {
              amount
              currencyCode
            }
          }
          images(first: 5) {
            edges {
              node {
                url
                altText
              }
            }
          }
          variants(first: 10) {
            edges {
              node {
                id
                title
                priceV2 {
                  amount
                  currencyCode
                }
                availableForSale
                quantityAvailable
              }
            }
          }
        }
      }
    `);

    return this.formatProduct(data.productByHandle);
  }

  async createCheckout(items) {
    const lineItems = items
      .map(item => `{ merchandiseId: "${item.variantId}", quantity: ${item.quantity} }`)
      .join(", ");

    const data = await this.query(`
      mutation {
        cartCreate(input: {
          lines: [${lineItems}]
        }) {
          cart {
            id
            checkoutUrl
            lines(first: 10) {
              edges {
                node {
                  id
                  quantity
                }
              }
            }
          }
          userErrors {
            field
            message
          }
        }
      }
    `);

    if (data.cartCreate.userErrors.length > 0) {
      throw new Error(data.cartCreate.userErrors[0].message);
    }

    return {
      webUrl: data.cartCreate.cart.checkoutUrl
    };
  }

  formatProduct(product) {
    if (!product) {
      return null;
    }

    return {
      id: product.id,
      title: product.title,
      description: product.description,
      available: product.availableForSale,
      price: parseFloat(product.priceRange.minVariantPrice.amount),
      currencyCode: product.priceRange.minVariantPrice.currencyCode,
      images: product.images.edges.map(edge => ({
        url: edge.node.url,
        alt: edge.node.altText || product.title
      })),
      variants: product.variants.edges.map(edge => ({
        id: edge.node.id,
        title: edge.node.title,
        price: parseFloat(edge.node.priceV2.amount),
        available: edge.node.availableForSale,
        quantityAvailable: edge.node.quantityAvailable
      }))
    };
  }

  formatPrice(amount, currencyCode = "USD") {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currencyCode
    }).format(amount);
  }
}