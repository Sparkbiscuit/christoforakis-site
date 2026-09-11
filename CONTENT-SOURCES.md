# Content sources and review dates

This records the basis for the September 3, 2026 local revision. It is an editorial maintenance note, not additional public biography.

## Nicholas and the apps

- Nicholas confirmed on September 3 that Loom is now Filuma, and Meds Ahead is at the same stage of completion.
- On September 4, Nicholas supplied the live App Store listing for Filuma: https://apps.apple.com/app/filuma/id6792247549 (verified as Filuma by Nicholas George Christoforakis). Meds Ahead remains in review. The page dates this split status to September 4 and links the verified store URL. It does not claim Meds Ahead availability or quote prices.
- The same conversation confirms the Claude-led planning and review / smaller GPT implementation workflow, the D8 Assistant Business Manager role since May 2026 alongside Social Media Manager, tutoring his brothers, and family caregiving. The revised resume supplies neuroscience at Middlebury. The September 4 kicker on `/nicholas/` reads “Middlebury · medicine · making things”; the lead still states neuroscience at Middlebury.
- Filuma functionality was checked against its current README and app source, including OnboardingView.swift and SharedStore.swift. The August App Store metadata draft is outdated on subscriptions; the website makes no pricing claim. Optional calendar connections and Apple Speech mean a blanket fully-offline claim would be inaccurate.
- Meds Ahead functionality and motivation were checked against its README, AppStore/SUBMISSION.md, ForecastEngine.swift, MedicationLabelInterpreter.swift, and SettingsView.swift. Local medication storage and on-device scanning do not mean the user's own device backups or explicit exports are impossible.
- The six PNGs under assets/apps are byte-for-byte copies of the screenshots Nicholas supplied on September 3. The Filuma sources are AppStoreAssets/1.3.0-build6/iphone-6.5/{01-focus-library,02-your-tasks,04-work-session}.png. The Meds sources are AppStore/Screenshots/6.9-inch-current/{01-today,02-supply,03-medications}.png. Captions describe the screens, not health advice or claims about real patients.

## Andreas

- Nicholas's July 15 website brief describes Andreas as the middle brother and a high school senior.
- Nicholas confirmed on September 3 that the Longmeadow athletics context is accurate.
- Public race history: https://ma.milesplit.com/athletes/10898113-andreas-christoforakis
- The page does not infer cycling or invent results, records, goals, or personal quotes. The September 4 family-map still is an autumn trail, not a portrait of Andreas.

## Kiriakos

- Nicholas confirmed on September 3 that Kiriakos is the owner-operator of Mr. Pizza House in Hartford.
- Restaurant name, location, menu categories, and ordering link: https://www.mrpizzahouse.com/ (checked September 3).
- The community menu collaboration is explicitly dated June 2022 and attributed to WFSB: https://www.wfsb.com/2022/06/15/restaurants-hartford-get-help-creating-healthier-menu-options/
- The page does not infer a founding date, current opening hours, or ongoing involvement in the 2022 initiative.
- The September 4 family-map photograph for Kiriakos is the shop’s own cheese-pizza listing image, used at Nicholas’s request. It is not a portrait of Kiriakos.

## Before publication

### Filuma project page, September 6, 2026

- Added `/projects/filuma/` as a bounded product and builder-story page, authorized by Nick in this work session.
- Product behavior checked against `Sparkbiscuit/Filuma` at commit `52a1c893b039db5271db6cd6811e4525c0dc48d6`: README, SchedulerService, CalendarImportService, and CalendarExportService. The page makes no adoption, testimonial, or clinical-effectiveness claims.
- Reuses the three existing Filuma screenshots and the existing Nicholas social image. No generated product screens.
- App Store listing and existing privacy-policy URL returned successfully during verification. Prices are left to the App Store.
- Launch status is supported by the September 6 canonical Nick OS record and the live App Store listing. The learning section describes the next step, not completed user research.

Review the local preview. Reconfirm the dated App Store status if publication is delayed. The original screenshots and older illustration files are preserved; the illustrative Loom demo is no longer loaded. Nicholas approved deployment on September 3 after reviewing the local preview. The September 4 Filuma live-status correction uses the store URL he supplied that afternoon.

## Notebook and contact additions

- The notebook contains two personal excerpts from Oksana's signed August 25, 2025 "Our Story" update. Text and dates are preserved, each excerpt links to the original, and fundraising passages are omitted. The other explicitly Oksana-signed entries are fundraising milestones and were excluded; Nicholas-signed entries were not reassigned to Oksana.
- LinkedIn: https://www.linkedin.com/in/nickchristoforakis/ matched the public profile's name, Middlebury, and neuroscience description on September 3.

## Meds Ahead release and project page, September 7, 2026

- Nick confirmed release for distribution and supplied https://apps.apple.com/us/app/meds-ahead-supply-tracker/id6804540619; listing returned HTTP 200 during this session.
- Product claims checked against Sparkbiscuit/meds-ahead at a0ca4464b36fafe4fc1f6d75f6b8440cc9a4b15a: README, Documentation/ARCHITECTURE.md, AppStore/SUBMISSION.md and privacy policy.
- Reuses the existing three screenshots and Nicholas social image. No patient story details, efficacy claims, or invented testimonials added.
- Both app links appear on the profile. Meds Ahead is free with optional tips, not a subscription.

## Filuma 1.4 and sparkbiscuit.me links, September 10, 2026

- Nicholas confirmed that Filuma 1.4 has been released. The gallery hints on `/nicholas/` and `/projects/filuma/` no longer describe the screenshots as “the upcoming Filuma 1.4 update.”
- The three Filuma screenshots under `assets/apps` are byte-for-byte copies of the 1.4 screenshots in `Sparkbiscuit.github.io/filuma/assets` (`focus-1.4.png`, `tasks-1.4.png`, `session-1.4.png`). They supersede the 1.3.0-build6 sources listed above.
- `/nicholas/` links to each app’s page on sparkbiscuit.me (https://sparkbiscuit.me/filuma/ and https://sparkbiscuit.me/meds/), and its contact links include https://sparkbiscuit.me/. All three returned HTTP 200 on September 10.

## Design rebuild, September 11, 2026

- Nicholas chose the rebuild’s direction in this session:
  - Remove eyebrow labels and helper text.
  - Give each page one signature moment, plus parallax and soft reveals.
  - Slim the app pages to their builder stories.
  - Redesign every family page with its facts and voice kept.
- Copy edits only remove helper text and repeats, or move a fact from a label into a sentence. No facts were added.
  - Home: “Pick a world and wander in.” and the family counter were removed. The latest-update excerpt now ends on a full sentence and links to the update itself.
  - Nicholas: the dated status line and the screenshot galleries were removed. Each app keeps its existing description in a doorway tile.
  - Andreas: the family relationship moved into the lead. The placeholder “with more of his own stories to come” was removed.
  - Lukas: “extra birthday March 25” moved from the label into the lead.
  - Kiriakos: “June 2022” moved into the WFSB sentence.
  - Foxy: “shepherd mix” moved from the label into the lead. Photo captions were removed; alt text is unchanged.
  - Oksana: the preface and format chips were removed. Posts and their dates are unchanged.
  - Filuma and Meds Ahead story pages:
    - The walkthroughs and galleries were removed in favour of sparkbiscuit.me.
    - The three decisions and the builder notes are unchanged in substance.
    - The Meds Ahead disclaimers are now footnotes.
    - Attribution reads Nicholas Christoforakis.
- Screenshots: `assets/apps/filuma-focus-660.jpg` and `assets/apps/meds-supply-660.jpg` are 660 × 1434 JPEG copies of the committed screenshots, made with `sips` for the doorway tiles and story pages. The full-size PNGs are unchanged.
- The Kiriakos photograph’s alt text now describes the combination pizza that is actually pictured.
- Notebook excerpts now link to `/updates/#post-our-story`, which opens and expands the original update. The earlier `/updates/#our-story` link landed at the top of the archive.
- For the family to review in `IMAGE-CREDITS.md`, left unchanged:
  - The A380 row still lists “Lukas hero” among its uses. That hero is now a drawn sky; the photograph remains on the flight board and the family map.
  - The Mr. Pizza House row lists the subject as “Cheese pizza”.
