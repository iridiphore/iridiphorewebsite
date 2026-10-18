-- Editable page wording, show/hide switches and look (colours).
-- One JSON object on the single site_config row:
--   { "text":  { "<key>": "<override>" },
--     "show":  { "<key>": true | false },
--     "theme": { "accent": "#rrggbb", "accent2": "#rrggbb", "dim": 0-90 } }
-- Only values that differ from the built-in defaults are stored. The shape is validated by
-- the app (src/lib/content.ts); the database only guarantees it is a reasonably small JSON
-- object. Writes are admin-only through the existing "Admins write site config" policy and
-- anyone can read it (it is public site content).
alter table public.site_config
  add column content jsonb not null default '{}'::jsonb
  constraint site_config_content_shape
    check (jsonb_typeof(content) = 'object' and pg_column_size(content) < 32768);
