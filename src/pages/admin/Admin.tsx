import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { Session } from "@supabase/supabase-js";
import SEO from "@/components/SEO";
import { hexToTriplet, THEME_DEFAULTS } from "@/lib/content";
import { backendConfigured, supabase } from "@/lib/supabase";
import { ghostBtnCls } from "./fields";
import SiteTab from "./SiteTab";
import SectorsTab from "./SectorsTab";
import TextTab from "./TextTab";
import LookTab from "./LookTab";
import EventsTab from "./EventsTab";
import EnquiriesTab from "./EnquiriesTab";

const TABS = [
  { id: "events", label: "Work" },
  { id: "enquiries", label: "Enquiries" },
  { id: "site", label: "Home page" },
  { id: "sectors", label: "Sectors" },
  { id: "text", label: "Text" },
  { id: "look", label: "Look & sections" },
] as const;
type TabId = (typeof TABS)[number]["id"];

function Shell({ children }: { children: React.ReactNode }) {
  return (
    // The admin always uses the standard colours, so a poor colour choice on the Look tab can
    // never make the screen you need to undo it unreadable.
    <div
      className="min-h-screen bg-ink font-sans text-paper"
      style={{ "--accent": hexToTriplet(THEME_DEFAULTS.accent), "--accent-2": hexToTriplet(THEME_DEFAULTS.accent2) } as React.CSSProperties}
    >
      <SEO title="Admin | Iridiphore" description="Admin" path="/admin" noindex />
      {children}
    </div>
  );
}

export default function Admin() {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [tab, setTab] = useState<TabId>("events");

  useEffect(() => {
    if (!supabase) return;
    void supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session === null) navigate("/login", { replace: true });
  }, [session, navigate]);

  useEffect(() => {
    if (!supabase || !session) return;
    setIsAdmin(null);
    void supabase
      .rpc("has_role", { _user_id: session.user.id, _role: "admin" })
      .then(({ data, error }) => setIsAdmin(!error && data === true));
  }, [session]);

  if (!backendConfigured) {
    return (
      <Shell>
        <div className="mx-auto max-w-xl p-8">
          <h1 className="font-display text-4xl italic">Admin</h1>
          <p className="mt-4 text-fog">
            Preview mode: no database is connected yet, so there is nothing to edit. Follow docs/SETUP.md to connect
            Supabase, then sign in here.
          </p>
          <Link to="/" className="mt-6 inline-block text-teal hover:underline">Back to the site</Link>
        </div>
      </Shell>
    );
  }
  if (session === undefined || (session && isAdmin === null)) {
    return <Shell><p className="p-8 text-fog">Loading…</p></Shell>;
  }
  if (!session) return <Shell><p className="p-8 text-fog">Redirecting…</p></Shell>;
  if (!isAdmin) {
    return (
      <Shell>
        <div className="mx-auto max-w-xl p-8">
          <h1 className="font-display text-4xl italic">No access</h1>
          <p className="mt-4 text-fog">
            You're signed in as {session.user.email}, but this account isn't an admin. Ask an existing admin to add it
            (docs/SETUP.md, "Add an admin").
          </p>
          <button className={`${ghostBtnCls} mt-6`} onClick={() => void supabase?.auth.signOut()}>Sign out</button>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <header className="border-b border-line">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-5 py-4">
          <div className="flex items-center gap-4">
            <Link to="/" className="font-display text-xl italic tracking-[0.18em]">IRIDIPHORE</Link>
            <span className="text-xs uppercase tracking-wider text-fog">Admin</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-fog">
            <span className="hidden sm:inline">{session.user.email}</span>
            <Link to="/" className={ghostBtnCls}>View site</Link>
            <button className={ghostBtnCls} onClick={() => void supabase?.auth.signOut().then(() => navigate("/login"))}>
              Sign out
            </button>
          </div>
        </div>
        <nav className="mx-auto flex max-w-5xl gap-1 overflow-x-auto px-5" aria-label="Admin sections">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              aria-current={tab === t.id ? "page" : undefined}
              className={`shrink-0 whitespace-nowrap border-b-2 px-4 py-3 text-sm transition-colors ${
                tab === t.id ? "border-teal text-paper" : "border-transparent text-fog hover:text-paper"
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </header>
      <div className="mx-auto max-w-5xl px-5 py-8">
        {tab === "events" && <EventsTab />}
        {tab === "enquiries" && <EnquiriesTab />}
        {tab === "site" && <SiteTab />}
        {tab === "sectors" && <SectorsTab />}
        {tab === "text" && <TextTab />}
        {tab === "look" && <LookTab />}
      </div>
    </Shell>
  );
}
