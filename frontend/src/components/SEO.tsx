import { useEffect } from "react";

interface SEOProps {
  title: string;
  description: string;
  path?: string;
}

const BASE_TITLE = "Falcons Cricket Club";
const SITE_URL = "https://falcons-if.vercel.app";

export function SEO({ title, description, path = "" }: SEOProps) {
  useEffect(() => {
    const fullTitle = title === "Home" ? BASE_TITLE : `${title} | ${BASE_TITLE}`;
    document.title = fullTitle;

    const setMeta = (name: string, content: string) => {
      let el = document.querySelector(`meta[name="${name}"]`) || document.querySelector(`meta[property="${name}"]`);
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(name.startsWith("og:") ? "property" : "name", name);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    setMeta("description", description);
    setMeta("og:title", fullTitle);
    setMeta("og:description", description);
    setMeta("og:url", `${SITE_URL}${path}`);
    setMeta("og:type", "website");

    return () => { document.title = BASE_TITLE; };
  }, [title, description, path]);

  return null;
}
