"""Verify local links, assets, fragment targets, and accessible page basics."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parents[1]


class Page(HTMLParser):
    def __init__(self, path):
        super().__init__(convert_charrefs=True)
        self.ids = set()
        self.references = []
        self.h1_count = 0
        self.current_links = []
        self.errors = []
        self.feed(path.read_text(encoding="utf-8"))

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if "id" in attrs:
            if attrs["id"] in self.ids:
                self.errors.append(f"duplicate ID: {attrs['id']}")
            self.ids.add(attrs["id"])
        self.h1_count += tag == "h1"
        if tag in ("a", "link") and "href" in attrs:
            self.references.append(attrs["href"])
        if tag in ("img", "script") and "src" in attrs:
            self.references.append(attrs["src"])
        if tag == "object" and "data" in attrs:
            self.references.append(attrs["data"])
        if tag == "img" and "alt" not in attrs:
            self.errors.append("image has no alt attribute")
        if tag == "a" and attrs.get("aria-current") == "page":
            self.current_links.append(attrs.get("href"))


def main():
    pages = {path: Page(path) for path in ROOT.glob("*.html")}
    assert pages, "No HTML pages found"
    errors = []
    for path, page in pages.items():
        errors.extend(f"{path.name}: {error}" for error in page.errors)
        if page.h1_count != 1:
            errors.append(f"{path.name}: expected one H1")
        if page.current_links != [path.name]:
            errors.append(f"{path.name}: active navigation doesn't match the page")
        for reference in page.references:
            url = urlsplit(reference)
            if url.scheme or url.netloc:
                continue
            target = (path.parent / unquote(url.path)).resolve() if url.path else path
            if not target.is_relative_to(ROOT) or not target.is_file():
                errors.append(f"{path.name}: missing local target {reference}")
            elif url.fragment and target in pages and unquote(url.fragment) not in pages[target].ids:
                errors.append(f"{path.name}: missing fragment {reference}")
    assert not errors, "\n".join(errors)
    print(f"PASS: {len(pages)} pages; local links, assets, fragments, navigation, and image descriptions.")


if __name__ == "__main__":
    main()
