import React, { useEffect } from 'react';

interface SEOProps {
  title: string;
  description: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'product';
  productData?: any;
}

const SEO: React.FC<SEOProps> = ({ title, description, keywords, image, url, type = 'website', productData }) => {
  useEffect(() => {
    document.title = `${title} | KNOTTY TOWN`;

    const setMetaTag = (attr: string, key: string, content: string) => {
      let element = document.querySelector(`meta[${attr}="${key}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attr, key);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    setMetaTag('name', 'description', description);
    if (keywords) setMetaTag('name', 'keywords', keywords);

    // Open Graph Protocol
    setMetaTag('property', 'og:title', title);
    setMetaTag('property', 'og:description', description);
    setMetaTag('property', 'og:type', type);
    if (image) setMetaTag('property', 'og:image', image);
    if (url) setMetaTag('property', 'og:url', url);

    // Twitter Cards
    setMetaTag('name', 'twitter:card', 'summary_large_image');
    setMetaTag('name', 'twitter:title', title);
    setMetaTag('name', 'twitter:description', description);
    if (image) setMetaTag('name', 'twitter:image', image);

    // Structured Data (JSON-LD)
    let schemaScript = document.querySelector('script[id="__knotty_seo__"]');
    if (!schemaScript) {
      schemaScript = document.createElement('script');
      schemaScript.setAttribute('type', 'application/ld+json');
      schemaScript.setAttribute('id', '__knotty_seo__');
      document.head.appendChild(schemaScript);
    }
    
    let schema: any = {
      "@context": "https://schema.org",
      "@type": type === 'product' ? 'Product' : type === 'article' ? 'Article' : 'WebSite',
      "name": title,
      "description": description,
      "url": url || window.location.href,
    };

    if (image) schema.image = image;
    if (type === 'product' && productData) {
      schema = {
        ...schema,
        "brand": {
          "@type": "Brand",
          "name": "Knotty Town"
        },
        "category": productData.category,
        "offers": {
          "@type": "Offer",
          "priceCurrency": "INR",
          "price": productData.price,
          "itemCondition": "https://schema.org/NewCondition",
          "availability": productData.isSoldOut || (productData.stock_quantity !== undefined && productData.stock_quantity <= 0) ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
          "seller": {
            "@type": "Organization",
            "name": "Knotty Town"
          }
        }
      };
      if (productData.rating) {
        schema.aggregateRating = {
          "@type": "AggregateRating",
          "ratingValue": productData.rating,
          "reviewCount": productData.reviewCount || Math.floor(Math.random() * 20) + 5
        };
      }
    }

    let outputSchemas: any[] = [schema];

    // BreadcrumbList Schema
    if (type === 'product' && productData) {
      const breadcrumbSchema = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "Home",
            "item": "https://knottytown.com/"
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": productData.category.charAt(0).toUpperCase() + productData.category.slice(1),
            "item": `https://knottytown.com/shop?category=${encodeURIComponent(productData.category)}`
          },
          {
            "@type": "ListItem",
            "position": 3,
            "name": title,
            "item": url || window.location.href
          }
        ]
      };
      outputSchemas.push(breadcrumbSchema);
    }

    schemaScript.textContent = JSON.stringify(outputSchemas.length === 1 ? outputSchemas[0] : outputSchemas);

  }, [title, description, keywords, image, url, type, productData]);

  return null;
};

export default SEO;
