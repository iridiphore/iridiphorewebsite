-- Replace the first-draft placeholder copy with the crew's own wording.
-- Each update only fires where the value is STILL the old placeholder, so anything an admin
-- has already edited in the meantime is left alone. Safe on a fresh or an existing database.

alter table public.site_config
  alter column tagline set default 'We turn gigs into audio-visual events people talk about and remember.';

update public.site_config
   set tagline = 'We turn gigs into audio-visual events people talk about and remember.'
 where id = 1
   and tagline = 'Iridiphore is a visual collective. We make the visuals for gigs, EMOM nights and livestreams.';

update public.sectors
   set description = 'Bespoke visuals for your set, album launch or livestream, made after talking to you about your style.'
 where audience = 'artists-labels'
   and description = 'Live visuals for your set, and video content for releases and tours.';

update public.sectors
   set description = 'Turn a night into an audio-visual event people talk about and remember.'
 where audience = 'promoters-managers'
   and description = 'Visuals for your nights and your acts, from a single event to a run of dates.';

update public.sectors
   set description = 'Live visuals and projection mapping for your stage or room.'
 where audience = 'festivals-venues'
   and description = 'A visual rig and crew for your stage, or a resident setup for your venue.';
