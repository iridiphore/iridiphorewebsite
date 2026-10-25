# Setup

The steps only a person can do. Do them in order; the site works in preview mode until step 2 is finished.

## 1. Put the site online (GitHub Pages)

1. In the repo: **Settings > Pages > Build and deployment > Source: GitHub Actions**. Do this **once, by hand, before the first deploy**. It needs repo admin rights. The deploy workflow isn't allowed to switch Pages on itself, and the first run fails with "Resource not accessible by integration" if this is skipped.
2. Push to `main`, or run **Actions > Deploy to GitHub Pages > Run workflow**.
3. The site appears at `https://<user>.github.io/iridiphore/`. This works with no domain set up.

## 2. Create the Supabase project

Use a **new, separate** project for Iridiphore. Don't reuse the My Liberal Pony one.

1. supabase.com > New project. Note the **Project ref**, the **URL** and the **publishable (anon) key** (Project Settings > API).
2. Apply the schema (**every** file in `supabase/migrations/`, in order), either way:
   - CLI: `npx supabase link --project-ref <ref>` then `npx supabase db push`. This applies everything.
   - or paste each file into the SQL editor and run them in filename order: `20261018000000_initial_schema.sql`, `20261018010000_page_wording.sql`, `20261018020000_update_copy.sql`, then `20261025000000_blog.sql`.
   - The last one also creates the photo storage bucket. Afterwards check **Storage** in Supabase: a bucket called `site-photos` should exist and be marked Public. If the blog migration fails on a `storage` error, tell whoever is helping you: that part could not be tested without a live project.
3. Put the URL and publishable key in `.env`:
   ```
   VITE_SUPABASE_URL=https://<ref>.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=<publishable key>
   ```
   Only these two. Never the `service_role` key.
4. In Supabase: **Authentication > URL Configuration**, set the Site URL to the live site address and add `<site>/reset-password` to Redirect URLs. This is what makes "Forgot password" work.

## 3. Create the admins (two people)

1. Supabase > **Authentication > Users > Add user**, with email and a strong password. Do it for each admin.
2. In the SQL editor, give them the role:
   ```sql
   insert into public.user_roles (user_id, role)
   select id, 'admin' from auth.users where email in ('person-one@example.com', 'person-two@example.com');
   ```
3. They sign in at `/login`. Anyone who is signed in but isn't in `user_roles` sees "No access".

To add an admin later, repeat both steps. To remove one, `delete from public.user_roles where user_id = '<id>'`.

## 4. Connect Cloudinary

1. Create a Cloudinary account (a free one is fine to start). Copy the **cloud name** from the dashboard.
2. Put it in `.env`: `VITE_CLOUDINARY_CLOUD_NAME=<cloud name>`
3. Upload assets in the Cloudinary dashboard (Media Library), for example into folders `hero/` and `events/<event-name>/`.
4. Use short, plain names: letters, numbers, `-` and `_`.
5. In admin, click an asset in Cloudinary, copy its URL and paste it in. Nothing else is needed.

Commit the `.env` change and push to deploy it.

## 5. Add content

1. **Home page** tab: paste the hero video link, edit the headline and line under it. (The three short "about" blocks under the hero are in the **Text** tab, group "Home page: about section".)
2. **Sectors** tab: the three "Who we work with" cards.
3. **Work** tab: **New event**, fill it in, tick **Published**, save. Then add photos, clips and videos to it.
   **Blog** tab: **New post**, fill it in, upload or paste a cover, save, then add photos, clips and videos. Tick **Featured on Home** on the key posts (none ticked = Home shows the latest 3; any ticked = only those, up to 6). Tick **Published** to make it live. **Manage categories** sets the filter buttons.
4. **Text** tab: rename any heading, button, form label or message. Empty box = standard wording. Press **Save changes** (one button for the whole tab).
5. **Look & sections** tab: accent colours, hero darkness, and switches to hide menu links or sections.
6. **Enquiries** tab: where contact form messages arrive.

Mistake? Each field has **Reset to standard**, and each of the two tabs has **Reset all to standard**. The admin itself always uses the standard colours, so a bad colour choice can't lock you out of fixing it.

Nothing is live until an event is ticked **Published**. Untick it to take it down without deleting it.

## 6. Custom domain (when ready to switch from the old site)

`iridiphore.co.uk` currently points at the existing website. Switching it is the moment the old site goes offline, so do it last and on purpose.

1. Add a file `public/CNAME` containing `iridiphore.co.uk`.
2. In the DNS settings, point the domain at GitHub Pages: the four `A` records `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`, and `www` as a `CNAME` to `<user>.github.io`.
3. Repo **Settings > Pages**: set the custom domain and tick Enforce HTTPS.
4. Update the Supabase Site URL and redirect URL to the new address.

## 7. Forwarding enquiries by email (optional)

New enquiries always appear in admin. This also emails each one to an address you choose. It uses a small Google Apps Script that sends from a Gmail account, so there is no mail provider to pay for or domain to verify.

1. Signed in to the Gmail account the emails should come **from**: script.google.com > New project. Paste this over the default code and save:
   ```js
   function doPost(e) {
     var d = JSON.parse(e.postData.contents);
     var secret = PropertiesService.getScriptProperties().getProperty('SECRET');
     if (!secret || d.secret !== secret) return ContentService.createTextOutput('forbidden');
     var opts = { name: 'Iridiphore website' };
     if (d.reply_to) opts.replyTo = d.reply_to;
     GmailApp.sendEmail(d.to, d.subject, d.body, opts);
     return ContentService.createTextOutput('ok');
   }
   ```
2. In Supabase: **Project Settings > Vault > Secrets**. The secret `enquiry_webhook_secret` holds a random value. Copy it.
3. In the Apps Script: **Project Settings > Script properties > Add**: name `SECRET`, value = the copied secret.
4. **Deploy > New deployment > Web app**. Execute as: **Me**. Who has access: **Anyone**. Authorise when asked. Copy the **Web app URL**.
5. In Supabase Vault, add a secret named `enquiry_webhook_url` with that URL.
6. In admin > **Enquiries**: tick *Forward enquiries to email*, enter the address, **Save**, then **Send test email**.

Good to know:
- Emails come from the Gmail account that owns the script. Replying goes to the visitor, not to that account.
- A free Gmail account can send about 100 emails a day. Forwarding stops after 10 enquiries in an hour; the rest are still saved in admin.
- If the test says it isn't set up, one of the two Vault secrets is missing or misspelt. If it says "sent" but nothing arrives, check spam, then that the deployment is set to *Anyone*. After editing the script, create a **new deployment version**.
- Treat the secret like a password. If it leaks, change it in both Vault and Script properties.

## Optional later

- **Analytics**: none installed. A cookieless option such as Plausible can be added to `index.html`.
