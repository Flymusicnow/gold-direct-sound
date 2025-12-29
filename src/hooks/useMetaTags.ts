import { useEffect } from "react";

interface MetaTagsConfig {
  title: string;
  description: string;
  image?: string;
  url?: string;
  type?: 'website' | 'profile' | 'article';
}

const DEFAULT_TITLE = "FlyMusic Gold";
const DEFAULT_DESCRIPTION = "Discover and support independent artists on FlyMusic Gold";
const DEFAULT_IMAGE = "/flymusic-logo.png";

function updateMetaTag(attrName: 'property' | 'name', attrValue: string, content: string | undefined) {
  if (!content) return;
  
  let element = document.querySelector(`meta[${attrName}="${attrValue}"]`);
  
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attrName, attrValue);
    document.head.appendChild(element);
  }
  
  element.setAttribute('content', content);
}

export function useMetaTags(config: MetaTagsConfig | null) {
  useEffect(() => {
    if (!config) return;

    const previousTitle = document.title;
    
    // Update document title
    document.title = config.title;
    
    // Update Open Graph meta tags
    updateMetaTag('property', 'og:title', config.title);
    updateMetaTag('property', 'og:description', config.description);
    updateMetaTag('property', 'og:image', config.image || DEFAULT_IMAGE);
    updateMetaTag('property', 'og:url', config.url || window.location.href);
    updateMetaTag('property', 'og:type', config.type || 'website');
    
    // Update Twitter Card meta tags
    updateMetaTag('name', 'twitter:card', 'summary_large_image');
    updateMetaTag('name', 'twitter:title', config.title);
    updateMetaTag('name', 'twitter:description', config.description);
    updateMetaTag('name', 'twitter:image', config.image || DEFAULT_IMAGE);
    
    // Cleanup: restore defaults on unmount
    return () => {
      document.title = previousTitle;
      updateMetaTag('property', 'og:title', DEFAULT_TITLE);
      updateMetaTag('property', 'og:description', DEFAULT_DESCRIPTION);
      updateMetaTag('property', 'og:image', DEFAULT_IMAGE);
      updateMetaTag('property', 'og:type', 'website');
      updateMetaTag('name', 'twitter:title', DEFAULT_TITLE);
      updateMetaTag('name', 'twitter:description', DEFAULT_DESCRIPTION);
      updateMetaTag('name', 'twitter:image', DEFAULT_IMAGE);
    };
  }, [config?.title, config?.description, config?.image, config?.url, config?.type]);
}
