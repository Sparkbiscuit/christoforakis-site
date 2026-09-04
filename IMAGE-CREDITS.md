# Image credits

This file records the origin, license, production treatment, and placement of photographs added during the profile-enrichment pass. It is intentionally kept beside the site source so future maintainers can audit every non-family image without reconstructing its history.

## Lukas interest photographs

| Production file | Subject | Creator / source | License | Site use and modifications |
| --- | --- | --- | --- | --- |
| `assets/interests/airliner.jpg` | Airbus A380 at sunset | [Chad Ajamian / Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Airbus_A380_with_sunset_(175372547).jpg) | [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/) | Lukas’s Airliners panel; a cropped derivative is also used as `assets/backgrounds/lukas.webp` on the family map and Lukas hero. Resized, metadata removed, and responsively cropped by CSS. |
| `assets/interests/f22-raptor.jpg` | U.S. Air Force F-22 Raptor with condensation cloud | [Trevor Cokley, U.S. Air Force / Wikimedia Commons](https://commons.wikimedia.org/wiki/File:U.S._Air_Force_F-22_Raptor.jpg) | Public domain in the United States as a work of the U.S. federal government | Lukas’s U.S. military jets panel; resized, metadata removed, and responsively cropped by CSS. |
| `assets/interests/formula-one.jpg` | Carlos Sainz’s Ferrari at the 2024 Dutch Grand Prix | [Steffen Prößdorf / Wikimedia Commons](https://commons.wikimedia.org/wiki/File:2024-08-25_Motorsport,_Formel_1,_Gro%C3%9Fer_Preis_der_Niederlande_2024_STP_3895_by_Stepro.jpg) | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) | Lukas’s Formula 1 panel; resized, metadata removed, and responsively cropped by CSS. |

The source descriptions above preserve attribution even though the production files have had embedded metadata removed for privacy and page weight. The images are editorial illustrations of Lukas’s interests; no creator or organization is presented as endorsing this website.

## Foxy photographs

The following photographs are family-owned and were supplied locally by the site owner:

- `assets/photos/foxy-autumn.jpg`
- `assets/photos/foxy-deep-snow.jpg`
- `assets/photos/foxy-first-snow.jpg`
- `assets/photos/foxy-family-day.jpg`

Each is an optimized derivative. Production copies are resized JPEGs with embedded EXIF, camera, and location metadata removed. The untouched originals remain local in `foxy/` and are excluded by `.gitignore`; they should not be added to Git. A landscape crop of `foxy-autumn.jpg` is also used as `assets/backgrounds/foxy.webp` on the family map.

## Family-map stills

Andreas and Oksana tiles are decorative generated stills. They do not depict family members or a named course. Nicholas’s tile is an interim work-table still until a supplied image replaces it.

| Production file | Subject | Origin | Site use |
| --- | --- | --- | --- |
| `assets/backgrounds/nicholas.webp` | Work table: notebook, headphones, lamp | Original generated still, September 4, 2026, interim | Nicholas map tile and `/nicholas/` Open Graph image |
| `assets/backgrounds/andreas.webp` | Autumn cross-country trail | Original generated still, September 4, 2026 | Andreas map tile, hero, and Open Graph image |
| `assets/backgrounds/oksana.webp` | Open notebook on a kitchen table | Original generated still, September 4, 2026 | Oksana map tile, notebook header, and Open Graph image |
| `assets/backgrounds/kiriakos.webp` | Cheese pizza | Official Mr. Pizza House listing photograph via [Slice](https://slicelife.imgix.net/15429/photos/original/Mr_Pizza_House_SpecialCombo.jpg), also used on [mrpizzahouse.com](https://www.mrpizzahouse.com/). Shop-owned; cropped and resized for the family site at the owner’s request. | Kiriakos map tile, hero, and Open Graph image |

`assets/backgrounds/lukas.webp` is credited with the A380 photograph above. `assets/backgrounds/foxy.webp` is credited with the family photographs above.

## Maintenance rule

When adding another third-party photograph:

1. Confirm that the license permits the intended use and any crop or resize.
2. Prefer the creator’s page, an official government source, or Wikimedia Commons over an unsourced image search result.
3. Download a self-hosted production copy; do not hotlink.
4. Remove unnecessary metadata and optimize the file to the largest size the layout needs.
5. Add a row here and a visible credit near the image when the license requires attribution.
