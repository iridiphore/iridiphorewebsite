import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import SEO from "@/components/SEO";

export default function NotFound() {
  return (
    <Layout>
      <SEO title="Page not found | Iridiphore" description="Page not found." path="/404" noindex />
      <div className="mx-auto max-w-3xl px-5 pb-24 pt-40 sm:px-8">
        <h1 className="font-display text-6xl italic">Not found</h1>
        <p className="mt-4 text-fog">That page doesn't exist.</p>
        <Link to="/" className="mt-8 inline-block text-teal hover:underline">Back to the homepage</Link>
      </div>
    </Layout>
  );
}
