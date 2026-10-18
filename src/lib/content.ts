/**
 * Everything on the site that the crew can change in /admin (apart from events, sectors and
 * the hero, which have their own tables and tabs) is defined here, once.
 *
 * - TEXT_FIELDS: every piece of wording. The public pages call t("key"); the admin "Text" tab
 *   is generated from this list. To make another string editable, add a line here and use
 *   t("that.key") where it is shown.
 * - SHOW_FIELDS: switches that show or hide a part of the page.
 * - THEME_DEFAULTS: the two accent colours and how dark the hero overlay is.
 *
 * Only values that differ from these defaults are stored (site_config.content). A blank text
 * box in admin means "use the standard wording".
 */

export interface TextField {
  key: string;
  group: string;
  label: string;
  default: string;
  multiline?: boolean;
  max?: number;
  hint?: string;
}

const EMAIL_HINT = "{email} is replaced by the contact email address (as a link where it is shown on the page).";

export const TEXT_FIELDS = [
  // ------------------------------------------------------------ Site
  { key: "brand.name", group: "Site name and menu", label: "Site name (header and footer)", default: "IRIDIPHORE", max: 40 },
  { key: "nav.sectors", group: "Site name and menu", label: "Menu: sectors", default: "Sectors", max: 30 },
  { key: "nav.work", group: "Site name and menu", label: "Menu: work", default: "Work", max: 30 },
  { key: "nav.contact", group: "Site name and menu", label: "Menu: contact", default: "Contact", max: 30 },

  // ------------------------------------------------------------ Home
  { key: "home.cta_work", group: "Home page", label: "Hero button: see the work", default: "See the work", max: 40 },
  { key: "home.cta_contact", group: "Home page", label: "Hero button: get in touch", default: "Get in touch", max: 40 },
  { key: "home.sectors_title", group: "Home page", label: "Sectors heading", default: "Who we work with", max: 80 },
  { key: "home.sector_link", group: "Home page", label: "Link on each sector card", default: "Enquire →", max: 40 },
  { key: "home.recent_title", group: "Home page", label: "Recent work heading", default: "Recent work", max: 80 },
  { key: "home.recent_all", group: "Home page", label: "Link to all work", default: "All work →", max: 40 },
  { key: "home.contact_title", group: "Home page", label: "Contact heading", default: "Get in touch", max: 80 },
  {
    key: "home.contact_intro", group: "Home page", label: "Sentence above the form",
    default: "Use the form, or email {email}.", max: 200, hint: EMAIL_HINT,
  },

  // ------------------------------------------------------------ Home: about
  { key: "home.about_1_title", group: "Home page: about section", label: "Block 1: title", default: "The idea", max: 40 },
  {
    key: "home.about_1_text", group: "Home page: about section", label: "Block 1: text",
    default: "Visuals should enhance the artist's performance, never distract from it. That's the rule behind everything we make.",
    multiline: true, max: 600,
  },
  { key: "home.about_2_title", group: "Home page: about section", label: "Block 2: title", default: "Track record", max: 40 },
  {
    key: "home.about_2_text", group: "Home page: about section", label: "Block 2: text",
    default: "We've delivered for dozens of artists, from indie and electronic acts to DJs, at album launches, festivals and livestreams. We're happy to work with any genre. Before the night we talk to the artist about their style, so what we make is bespoke to them.",
    multiline: true, max: 600,
  },
  { key: "home.about_3_title", group: "Home page: about section", label: "Block 3: title", default: "On the night", max: 40 },
  {
    key: "home.about_3_text", group: "Home page: about section", label: "Block 3: text",
    default: "Typically, we mix cameras live with textures, effects, video clips and projection mapping. We match the visuals to the music as it grows and fades, following the feel of each track as it happens.",
    multiline: true, max: 600,
  },

  // ------------------------------------------------------------ Work page
  { key: "work.title", group: "Work page", label: "Page heading", default: "Work", max: 80 },
  { key: "work.subtitle", group: "Work page", label: "Line under the heading", default: "Events we've made visuals for.", max: 200 },
  { key: "work.filter_all", group: "Work page", label: "Filter button: everything", default: "All", max: 30 },
  { key: "work.empty", group: "Work page", label: "Message when there are no events", default: "Nothing here yet.", max: 120 },
  { key: "work.loading", group: "Work page", label: "Loading message", default: "Loading…", max: 60 },
  { key: "event.back", group: "Work page", label: "Link back from an event", default: "← All work", max: 40 },

  // ------------------------------------------------------------ Contact form
  { key: "form.name", group: "Contact form", label: "Name field", default: "Name or act", max: 60 },
  { key: "form.email", group: "Contact form", label: "Email field", default: "Email", max: 60 },
  { key: "form.location", group: "Contact form", label: "Location field", default: "Event location", max: 60 },
  { key: "form.audience", group: "Contact form", label: "Audience field", default: "I'm", max: 60 },
  { key: "form.audience_placeholder", group: "Contact form", label: "Audience: nothing chosen", default: "Choose one", max: 60 },
  { key: "form.audience_other", group: "Contact form", label: "Audience: other option", default: "Something else", max: 60 },
  { key: "form.message", group: "Contact form", label: "Message field", default: "Tell us about the event", max: 80 },
  { key: "form.send", group: "Contact form", label: "Send button", default: "Send", max: 40 },
  { key: "form.sending", group: "Contact form", label: "Send button while sending", default: "Sending…", max: 40 },
  { key: "form.success_title", group: "Contact form", label: "After sending: heading", default: "Thanks, we've got it.", max: 120 },
  { key: "form.success_text", group: "Contact form", label: "After sending: text", default: "We'll reply to the email address you gave.", multiline: true, max: 300 },
  {
    key: "form.error", group: "Contact form", label: "If sending fails",
    default: "Couldn't send that. Please email {email} instead.", max: 200, hint: EMAIL_HINT,
  },

  // ------------------------------------------------------------ Not found
  { key: "notfound.title", group: "Page not found", label: "Heading", default: "Not found", max: 80 },
  { key: "notfound.text", group: "Page not found", label: "Text", default: "That page doesn't exist.", max: 200 },
  { key: "notfound.link", group: "Page not found", label: "Link home", default: "Back to the homepage", max: 60 },

  // ------------------------------------------------------------ Event type names
  { key: "type.gig", group: "Event type names", label: "Gig", default: "Gig", max: 30, hint: "The set of types is fixed (gig, EMOM, livestream, other). Only their names can change." },
  { key: "type.emom", group: "Event type names", label: "EMOM", default: "EMOM", max: 30 },
  { key: "type.livestream", group: "Event type names", label: "Livestream", default: "Livestream", max: 30 },
  { key: "type.other", group: "Event type names", label: "Other", default: "Other", max: 30 },

  // ------------------------------------------------------------ Search & sharing
  { key: "seo.site_name", group: "Search and sharing", label: "Name used in page titles", default: "Iridiphore", max: 60, hint: "Shown after the event name in the browser tab, e.g. \"Gig name | Iridiphore\"." },
  { key: "seo.home_title", group: "Search and sharing", label: "Home page title (browser tab and Google)", default: "Iridiphore | Live visuals for live music", max: 70 },
  {
    key: "seo.home_description", group: "Search and sharing", label: "Home page description (Google and link previews)",
    default: "Iridiphore turns gigs into audio-visual events people talk about and remember: live visuals for artists, festivals and livestreams.",
    multiline: true, max: 200,
    hint: "Changes apply once the page has loaded. Link previews from some apps and search engines that don't run scripts may keep showing the original text.",
  },
  { key: "seo.work_title", group: "Search and sharing", label: "Work page title", default: "Work | Iridiphore", max: 70 },
  { key: "seo.work_description", group: "Search and sharing", label: "Work page description", default: "Events Iridiphore has made visuals for: gigs, EMOM nights and livestreams.", multiline: true, max: 200 },
] as const satisfies readonly TextField[];

export type TextKey = (typeof TEXT_FIELDS)[number]["key"];

/** The same list with a uniform type, for code that loops over every field (the admin Text tab). */
export const TEXT_FIELD_LIST: readonly TextField[] = TEXT_FIELDS;

export const TEXT_DEFAULTS = Object.fromEntries(TEXT_FIELDS.map((f) => [f.key, f.default])) as Record<TextKey, string>;
const TEXT_MAX = Object.fromEntries(TEXT_FIELDS.map((f) => [f.key, f.max ?? 300])) as Record<TextKey, number>;

export interface ShowField {
  key: string;
  group: string;
  label: string;
}

export const SHOW_FIELDS = [
  { key: "nav.sectors", group: "Menu", label: "Menu link: sectors" },
  { key: "nav.work", group: "Menu", label: "Menu link: work" },
  { key: "nav.contact", group: "Menu", label: "Menu link: contact" },
  { key: "home.hero_buttons", group: "Home page", label: "Buttons under the headline" },
  { key: "home.about", group: "Home page", label: "About section (three short blocks under the headline)" },
  { key: "home.sectors", group: "Home page", label: "\"Who we work with\" section" },
  { key: "home.recent", group: "Home page", label: "\"Recent work\" section" },
  { key: "work.filters", group: "Work page", label: "Filter buttons (by event type)" },
  { key: "footer.email", group: "Footer", label: "Email address" },
  { key: "footer.instagram", group: "Footer", label: "Instagram link (needs a link set on the Home page tab)" },
  { key: "footer.youtube", group: "Footer", label: "YouTube link (needs a link set on the Home page tab)" },
] as const satisfies readonly ShowField[];

export type ShowKey = (typeof SHOW_FIELDS)[number]["key"];

export interface Theme {
  /** Links, highlights and hover colours. #rrggbb */
  accent: string;
  /** Warnings, the preview banner and error text. #rrggbb */
  accent2: string;
  /** How dark the hero overlay is at the top, 0 to 90. */
  dim: number;
}

export const THEME_DEFAULTS: Theme = { accent: "#2dd4bf", accent2: "#fb923c", dim: 60 };
export const DIM_MAX = 90;
export const BACKGROUND_HEX = "#07090c";

export interface SiteContent {
  text: Partial<Record<TextKey, string>>;
  show: Partial<Record<ShowKey, boolean>>;
  theme: Partial<Theme>;
}

export const EMPTY_CONTENT: SiteContent = { text: {}, show: {}, theme: {} };

const HEX = /^#[0-9a-fA-F]{6}$/;
export const isHex = (s: unknown): s is string => typeof s === "string" && HEX.test(s);

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);

/**
 * Turns whatever is in the database into a safe SiteContent: unknown keys are dropped, text is
 * length-limited, colours must be #rrggbb and the overlay is clamped. Nothing from the database
 * is trusted to be the right shape.
 */
export function normalizeContent(raw: unknown): SiteContent {
  const out: SiteContent = { text: {}, show: {}, theme: {} };
  if (!isRecord(raw)) return out;

  if (isRecord(raw.text)) {
    for (const key of Object.keys(TEXT_DEFAULTS) as TextKey[]) {
      const v = raw.text[key];
      if (typeof v === "string" && v.trim() !== "") out.text[key] = v.slice(0, TEXT_MAX[key]);
    }
  }
  if (isRecord(raw.show)) {
    for (const f of SHOW_FIELDS) {
      const v = raw.show[f.key];
      if (typeof v === "boolean") out.show[f.key] = v;
    }
  }
  if (isRecord(raw.theme)) {
    const { accent, accent2, dim } = raw.theme;
    if (isHex(accent)) out.theme.accent = accent.toLowerCase();
    if (isHex(accent2)) out.theme.accent2 = accent2.toLowerCase();
    if (typeof dim === "number" && Number.isFinite(dim)) out.theme.dim = Math.min(DIM_MAX, Math.max(0, Math.round(dim)));
  }
  return out;
}

export function resolveText(content: SiteContent, key: TextKey): string {
  return content.text[key] ?? TEXT_DEFAULTS[key];
}

export function resolveShow(content: SiteContent, key: ShowKey): boolean {
  return content.show[key] ?? true;
}

export function resolveTheme(content: SiteContent): Theme {
  return { ...THEME_DEFAULTS, ...content.theme };
}

/** "#2dd4bf" -> "45 212 191", the form Tailwind's rgb(var(--x) / alpha) colours expect. */
export function hexToTriplet(hex: string): string {
  const n = parseInt(hex.slice(1), 16);
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`;
}

function luminance(hex: string): number {
  const n = parseInt(hex.slice(1), 16);
  const lin = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
}

/** WCAG contrast ratio between two #rrggbb colours (1 to 21). */
export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** Replaces {email} in an editable sentence. Used where the result is plain text. */
export function fillEmail(text: string, email: string): string {
  return text.split("{email}").join(email);
}
