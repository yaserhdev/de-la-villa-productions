class ShopifyAPI{constructor(a){this.domain=a.storeDomain,this.token=a.storefrontAccessToken,this.apiVersion=a.apiVersion,this.endpoint=`https://${this.domain}/api/${this.apiVersion}/graphql.json`}async query(a){try{const b=await fetch(this.endpoint,{method:"POST",headers:{"Content-Type":"application/json","X-Shopify-Storefront-Access-Token":this.token},body:JSON.stringify({query:a})});if(!b.ok)throw new Error(`HTTP error! status: ${b.status}`);const c=await b.json();if(c.errors)throw console.error("GraphQL errors:",c.errors),new Error(c.errors[0].message);return c.data}catch(a){throw console.error("Shopify API Error:",a),a}}async getProducts(a=20){const b=await this.query(`
      {
        products(first: ${a}) {
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
    `);return b.products.edges.map(a=>this.formatProduct(a.node))}async getProductByHandle(a){const b=await this.query(`
      {
        productByHandle(handle: "${a}") {
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
    `);return this.formatProduct(b.productByHandle)}async createCheckout(a){const b=a.map(a=>`{ merchandiseId: "${a.variantId}", quantity: ${a.quantity} }`).join(", "),c=await this.query(`
    mutation {
      cartCreate(input: {
        lines: [${b}]
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
  `);if(0<c.cartCreate.userErrors.length)throw new Error(c.cartCreate.userErrors[0].message);return{webUrl:c.cartCreate.cart.checkoutUrl}}formatProduct(a){return a?{id:a.id,title:a.title,description:a.description,available:a.availableForSale,price:parseFloat(a.priceRange.minVariantPrice.amount),currencyCode:a.priceRange.minVariantPrice.currencyCode,images:a.images.edges.map(b=>({url:b.node.url,alt:b.node.altText||a.title})),variants:a.variants.edges.map(a=>({id:a.node.id,title:a.node.title,price:parseFloat(a.node.priceV2.amount),available:a.node.availableForSale,quantityAvailable:a.node.quantityAvailable}))}:null}formatPrice(a,b="USD"){return new Intl.NumberFormat("en-US",{style:"currency",currency:b}).format(a)}}