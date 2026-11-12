# Christoforakis.com Content and Publishing Guide

This guide is for anyone writing or reviewing material for the family website. It covers what belongs in each section, how to add a note, how to prepare photographs and image descriptions, and how to review sensitive family or medical information before it becomes public.

The technical implementation is documented in `README.md`. This file focuses on editorial decisions.

## The guiding idea

The site should feel like a family home with several rooms, not a corporate biography and not a social-media feed.

Good content here is:

- Specific enough to feel human.
- Calm enough to remain readable later.
- Honest about uncertainty.
- Respectful of each family member's ownership of their story.
- Useful without becoming exhaustive.
- Written for relatives, friends, and curious visitors at the same time.

No one needs to publish on a schedule. An empty notebook state is better than a rushed post.

## Where content belongs

### Landing page

The home page is a directory and shared welcome. Keep it concise. It should answer:

- Who is in the family?
- Where can I learn about each person?
- Where are the latest important family updates?

Do not turn the landing page back into a chronological news feed. The newest Lukas update is already surfaced there automatically.

### Nicholas

Use this page for durable information about Nicholas, Middlebury, and current work. Filuma (previously Loom) and Meds Ahead are the current apps. Give both equal weight and use actual product screenshots.

When either app changes materially, update the description to answer:

- What problem is it trying to solve?
- Who is it for?
- What makes its approach different?
- What is Nicholas actually working on now?

Avoid release promises, usage figures, or launch dates unless they are confirmed and meant to be public.

### Andreas

Andreas’s page covers his family role, high school, and Longmeadow cross-country. Nicholas confirmed the athletics context on September 3, 2026. Keep the public race-profile link current and let Andreas supply additional stories or interests.

Do not fill the page with inferred personality details simply to make it look complete.

### Lukas

The profile page belongs to Lukas's interests and personality: airliners, U.S. military jets, Formula 1, and whatever comes next.

Medical news belongs in the updates on Oksana's page. Keeping those areas separate lets Lukas have a page defined by what he loves, while preserving a clear place for important family communication.

### Oksana's notebook

Oksana's page holds every update on Lukas, newest first, and anything else she writes: observations, photographs, short essays, memories, ordinary moments. There is no separate updates page any more; `/updates/` only forwards old links to the matching note.

Write updates on Lukas with both immediate readers and future readers in mind, since they form a permanent public record. A note that is not about Lukas's health can be brief, quiet, or personal.

### Kiriakos

Kiriakos’s page covers his role as dad and owner-operator of Mr. Pizza House in Hartford, confirmed by Nicholas on September 3, 2026. It links to the restaurant and clearly dates the June 2022 WFSB community story.

Separate durable business facts from time-sensitive details. Prefer the restaurant’s own site for menus, ordering, and opening hours.

### Foxy

Foxy's page can be playful. Keep details true and easy to understand. If photographs are added, avoid showing private home-location information in the background.

## Tone and voice

### Write like a person

Prefer direct sentences and concrete details. Use the words the family naturally uses. A post should sound like it came from the named author, not from an institution.

Instead of:

> We are pleased to announce that a positive transition has occurred.

Prefer:

> Lukas came home today.

### Be honest about uncertainty

When something is unknown, say so. Avoid presenting a hope, early indication, or single conversation as a settled medical fact.

Useful phrases include:

- “This is what we understand today.”
- “The team is still working to understand…”
- “We are hopeful, but we do not know yet.”
- “Plans may change.”

### Keep medical language understandable

If a medical term matters, introduce it once and explain it in everyday language. Do not dilute the reality, but do not require readers to know clinical vocabulary.

Medical information on this site describes one family's experience. It should not be framed as advice for another person's care.

### Avoid manufactured inspiration

Lukas can be brave, funny, frustrated, fascinated, tired, and ordinary. Do not make him responsible for teaching every reader a lesson. Let events and details carry their own meaning.

### Name the author when it matters

Updates may close with a family sign-off or named author. Use a consistent form when authorship affects the meaning of the post.

## A useful update structure

There is no required formula, but this sequence works well for longer updates:

1. **Lead:** the most important thing that happened.
2. **Context:** what led here and why it matters.
3. **Current state:** what is true today.
4. **Uncertainty:** what is not yet known.
5. **Next steps:** what the family expects next, without overpromising.
6. **Human close:** gratitude, a specific ordinary detail, or a direct sign-off.

The first paragraph is especially important: it is what most readers will read before deciding whether to keep going.

### Update worksheet

Use this before drafting:

```text
The single most important fact:

What changed since the last update:

What is true right now:

What remains uncertain:

What readers should or should not do:

Private details to leave out:

Who should review this before publication:
```

## A useful notebook structure

Notebook entries can be much looser. A simple pattern is:

1. Begin with the moment, image, or observation.
2. Add only the context the reader needs.
3. End when the thought is complete.

### Notebook worksheet

```text
What did I notice?

Why did I want to remember it?

What does the photograph add?

Is there any detail in the photograph or story that should remain private?
```

## Titles

A good title is short, specific, and recognizable in an archive.

Good patterns:

- A direct event: “Home. For real.”
- A meaningful phrase from the story.
- A date or milestone when that is what readers will remember.
- A small concrete observation for a notebook entry.

Avoid:

- “Update” or “News” with no distinguishing detail.
- Clickbait or withholding the central fact for suspense.
- All capital letters.
- Unconfirmed conclusions.
- Medical terminology as the entire title unless readers already know it.

## Paragraphs and formatting

Notes are written straight into the page's HTML (see "Adding a note" below).

- Each paragraph is its own `<p>`.
- A line break inside a paragraph is `<br />`.
- Escape `&` as `&amp;` and `<` as `&lt;` if either appears in the text.
- Use ordinary quotation marks and punctuation.
- Keep very long lists rare; prose is usually easier to read in the current layout.

Before publishing, read the page in a browser and scan for accidental copied email signatures, tracking links, duplicated paragraphs, or private notes.

## Dates

Use the date the entry is published or the date the described event occurred, whichever makes the record least confusing. If those dates differ substantially, explain the timing in the text.

## Photographs

### Choosing a photograph

Use an image because it adds a moment, detail, or feeling—not simply because the editor supports one.

Before uploading, check:

- Is everyone pictured comfortable with it being public?
- Are any children other than the family identifiable?
- Is there a patient board, wristband, address, school name, badge, license plate, document, or screen in view?
- Does the background reveal a private location or routine?
- Does the file contain location metadata?
- Is the image sharp enough to work at the displayed size?
- Is the crop respectful and understandable on a phone?

Resize the photograph and strip its metadata (especially location) before adding it to the repository.

### File preparation

A practical target for a notebook photograph is:

- JPEG or WebP for photographs.
- PNG for artwork that needs crisp edges or transparency.
- A longest dimension around 1600–2400 pixels for most uses.
- Usually under 1–2 MB after export.

These are guidelines, not application-enforced limits. Smaller well-compressed files make the site faster, especially on mobile connections.

### Image descriptions

The editor requires an image description whenever a notebook post includes a photograph. Describe the information a sighted reader receives from the image.

A useful description usually includes:

- The main person, animal, or object.
- The visible action.
- The setting when it matters.
- A distinctive visual detail relevant to the post.

Good:

> Foxy standing in fallen leaves, looking toward the camera with one ear tilted sideways.

Too vague:

> A picture of Foxy.

Too interpretive:

> Foxy having the best day of her entire life.

Do not begin every description with “Image of” or “Photo of”; screen readers already announce that it is an image. Keep the description concise, but include the detail that gives the photograph its meaning.

If an image is purely decorative, the public code can support an empty description, but the writing-room workflow intentionally treats notebook images as meaningful and asks for a description.

## Medical and privacy review

The update archive contains sensitive medical history. Treat publication as permanent even if a post might later be removed.

### Two-person review

For a significant medical update, one person should write and another informed family member should review before publication. The reviewer should check facts, tone, privacy, and whether the timing is right.

### Medical fact checklist

- Is every named condition, medicine, procedure, date, and number accurate to the family's current understanding?
- Are uncertain conclusions labeled as uncertain?
- Does the text distinguish what clinicians said from what the family inferred?
- Could a reader mistake the post for general medical advice?
- Has information changed since the draft was written?
- Is a highly technical detail necessary to the story?

### Privacy checklist

- Does Lukas agree to this being shared, to the extent appropriate for his age and circumstances?
- Does the post disclose another person's health information?
- Does it identify a donor or donor family?
- Does it reveal a precise upcoming appointment, travel time, or live location?
- Does it name clinicians or staff who have not agreed to be named?
- Does a photograph show identifying hospital information?
- Would the family be comfortable with this passage appearing in a search result years from now?

### Corrections

If a medical or factual mistake is discovered:

1. Correct it promptly.
2. For a material correction, add a brief plain-language note to the post so returning readers understand what changed.
3. Do not silently change the meaning of a widely shared update when an explicit correction would prevent confusion.
4. Remember that earlier copies may still exist in Git history, screenshots, caches, or shared quotations.

## Adding a note

Notes are hard-coded in `oksana/index.html`, inside `<section class="notes" id="notebook">`, newest first. To add one, copy this above the current first note and fill it in:

```html
        <article class="note" id="a-short-unique-id">
          <time datetime="2026-11-14">November 14, 2026</time>
          <h2>The title</h2>
          <div class="note__copy">
            <p>The first paragraph.</p>
            <p>The next one.</p>
          </div>
        </article>
```

- The `id` is the note's link (`https://christoforakis.com/oksana/#a-short-unique-id`). Use lowercase words and hyphens, and never change it once the note has been shared.
- A photograph goes first inside the article: `<img class="note__image" src="/assets/notebook/name.jpg" alt="What it shows" width="1600" height="1200" loading="lazy" />`.
- Commit and push through the normal Git workflow. There is no editor on the live site, by design: nothing on the public site can write to the repository.

## Sharing a note

Every note has a stable link, `/oksana/#<id>`. Older links in the form `/updates/#post-<id>` still work: the `/updates/` page forwards them to the same note.

## Updating profile pages

Profile pages are edited in HTML. When a profile needs a substantive change:

1. Ask the person what they want the page to say.
2. Prefer current, durable details over a long inventory.
3. Avoid publishing a school, workplace, routine, or location detail without approval.
4. Review the page at mobile and desktop widths.
5. Confirm the person's entry in the `family` list in `assets/js/islands.js` (name, path, and note) still matches.
6. Publish through the normal Git workflow.

Placeholder pages are intentional. A short truthful page is better than an invented or overfilled one.

## Final pre-publication checklist

Copy this into a draft or pull request when useful:

```text
[ ] Title is specific and accurate
[ ] Date is correct
[ ] Opening paragraph communicates the central point
[ ] Medical facts checked
[ ] Uncertainty stated honestly
[ ] Privacy checklist completed
[ ] No real-time private location or schedule information
[ ] Photograph reviewed for private details
[ ] Image description is useful
[ ] The id is unique and the date reads correctly
[ ] Second reviewer completed, if needed
[ ] Public page checked after publishing
[ ] Shared link tested, if applicable
```

## Editorial principle to keep

The site's most important separation is this:

- Lukas's profile is about what he loves.
- Oksana's page is where the family explains what is happening medically, alongside her other writing.
- The landing page belongs to the whole family.

Protecting that separation keeps the site warm, useful, and spacious enough for every person in it.
