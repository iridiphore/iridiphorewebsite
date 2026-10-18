import { Helmet } from "react-helmet-async";

const SITE_URL = ((import.meta.env.VITE_SITE_URL as string | undefined) ?? "https://iridiphore.co.uk").replace(/\/$/, "");

interface Props {
  title: string;
  description: string;
  path: string;
  noindex?: boolean;
  ogImage?: string;
}

export default function SEO({ title, description, path, noindex, ogImage }: Props) {
  const url = `${SITE_URL}${path}`;
  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      {ogImage && <meta property="og:image" content={ogImage} />}
      {noindex && <meta name="robots" content="noindex, nofollow" />}
    </Helmet>
  );
}
