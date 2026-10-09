# Afonso Mota — personal academic website

Four static pages for **afonsom20.github.io**: About, Publications, Outreach,
and CV. The organization follows Alexandre Branco's website; the original
design takes inspiration from ScrewFast's neutral surfaces, orange accents,
rounded corners, and light/dark themes. No template code or dependencies are
required.

## Preview and check

Open `index.html` in a browser, or serve the repository:

```sh
python -m http.server 8000 --bind 127.0.0.1
```

Then visit http://127.0.0.1:8000. Run the dependency-free link check with:

```sh
python scripts/check_site.py
```

## GitHub Pages

Commit and push these files to `afonsom20/afonsom20.github.io`. In the repository's
**Settings → Pages**, select **Deploy from a branch**, branch **main**, folder
**/ (root)**, then Save. The intended address is https://afonsom20.github.io/.
No build step, package installation, or GitHub Actions workflow is needed.

## Edit

- `index.html`: rotating profile/lab photos, biography, education, contact.
- `publications.html`: journal articles grouped by year; defaults to first-author
  publications, with an All publications view.
- `outreach.html`: AstroBioLusitanos, radio, interview, and science writing.
- `cv.html`: embedded uploaded CV PDF, upload/version dates, academic profile icons,
  and direct open/download links.
- `assets/site.css`: shared layout, colors, responsive design, print styles.
- `assets/site.js`: theme preference, mobile navigation, five-second photo carousel,
  and publication filtering.

Content remains readable with JavaScript disabled. Navigation and footers
are repeated in the four pages so the website works directly on GitHub Pages
and by opening the files locally. Update all four when changing shared links.
Fonts and photographs are local; external services are linked rather than embedded.

The LinkedIn mark uses the original SVG geometry from
[Bootstrap Icons](https://github.com/twbs/icons/blob/main/icons/linkedin.svg),
with its MIT license preserved in `assets/bootstrap-icons-LICENSE.txt`.

The carousel offers previous/next arrows and a pause/play control. It pauses on
hover or keyboard interaction, and starts paused for visitors requesting reduced
motion. Without JavaScript, the profile photograph and all publications remain
readable. LinkedIn and AstroBioLusitanos Instagram icons appear in the navigation;
LinkedIn also appears beside contact links.

The CV file is `assets/CV Afonso Mota June 2026.pdf`. Its upload date is
**9 October 2026**, matching the file's creation date in this repository; its
document version is **June 2026**. When replacing it, update the filename and
the visible date in `cv.html`. Native PDF viewing depends on the visitor's browser,
so the page also provides open and download links.

## Content sources

Checked on 9 October 2026. Afonso confirmed the name and affiliation order:
**Instituto de Astrofísica e Ciências do Espaço** is the primary affiliation,
with CAUP, CIIMAR, and FCUP specified where relevant.

- [Space Microbes Lab profile](https://spacemicrobes.com/afonsomota/): research,
  education, DLR visit, email, and the two photographs.
- [CIIMAR profile](https://www.ciimar.up.pt/members/afonso-morgado-mota/):
  academic background and research.
- [CIÊNCIA VITAE](https://www.cienciavitae.pt/portal/pt/9617-6BA5-0402):
  education, thesis, research experience, publication cross-checks.
- [Space Microbes Lab publications](https://spacemicrobes.com/publications/),
  publisher and institutional records linked on the site: bibliographic details.
- [University of Lisbon record](https://researchportal.ulisboa.pt/en/publications/deep-tracks-using-deep-learning-and-procedurally-simulated-data-f/):
  Deep Tracks authors and its 2026 publication year.
- [AskAstrobio interview](https://askastrobio.org/articles/astrobiology-revealed-23).
- [90 Segundos de Ciência, episode 2304](https://www.90segundosdeciencia.pt/episodes/ep-2304-afonso-mota/).
- [AstroBioLusitanos event coverage](https://www.jup.pt/ciencia-saude/artigo/astrobiologia-na-u-porto-entre-estrelas-e-microorganismos.aspx).
- [AstroBioLusitanos website](https://astrobiopt.github.io/),
  [outreach locations](https://astrobiopt.github.io/onde-estivemos.html),
  [workshops](https://astrobiopt.github.io/services.html), and
  [event](https://astrobiopt.github.io/jab.html): the 66-word group summary.
  The locations page lists eight distinct schools and university activities at
  Minho, Aveiro, NOVA FCT, and Coimbra. Its Universities category also includes
  public events; those are not incorrectly counted as additional universities.
- [AbGradE committee](https://abgrade.eu/about/): historical secretary role, 2023–2025.

## Information not added

- A Google Scholar URL, complete conference/talk history, awards, and a
  confirmed PhD completion date were not supplied/confirmed and are omitted.
- The outreach page presents verified examples, rather than a complete archive.
- Independent game projects were found publicly but left out pending
  confirmation that they should be included on this academic website.

The two photographs are local copies of Afonso's publicly displayed Space
Microbes Lab profile photos, obtained through its WordPress image CDN:

- https://spacemicrobes.com/wp-content/uploads/2025/09/small_perfil_jab_2025_2-1.jpg
- https://spacemicrobes.com/wp-content/uploads/2025/09/lab.jpeg

`assets/outreach.JPG` is the photograph supplied by Afonso for the outreach page.

Design references: [Alexandre Branco](https://alexoworlds.github.io/index.html),
[ScrewFast demo](https://screwfast.uk/products), and
[ScrewFast repository](https://github.com/mearashadowfax/ScrewFast).
