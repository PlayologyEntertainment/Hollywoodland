"""Tags the translatable text in index.html with data-i18n keys and adds it to the English catalog.

Run from the repo root:  python tools/extract-html-strings.py

Idempotent. Text or attributes that already carry data-i18n / data-i18n-attr are left alone; new, untagged text gets a key
made from the nearest id'd ancestor plus the words of the text (legal text gets legal.terms.pNN / legal.privacy.pNN), and is
added to src/locales/en.json. The English stays in the HTML as the no-JS fallback.

Left alone on purpose: text the game rewrites while it runs (RUNTIME_IDS; translated by code with t(), because re-applying
its static English on a language change would overwrite what the game put there), <title>, <script>, <select>/<option>
(built by code), and anything with no letters (keys like A / D / E). A run of text beside inline markup (a link, a <kbd>)
is wrapped in its own <span data-i18n>.
"""
import html as htmllib
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
INDEX = ROOT / 'index.html'
EN = ROOT / 'src' / 'locales' / 'en.json'

RUNTIME_IDS = {
    'objective-title', 'objective-goal', 'hud-day-number', 'hud-weekday', 'hud-time', 'hud-money', 'hud-energy',
    'hud-assignment-label', 'hud-assignment-countdown', 'status-title', 'status-level', 'status-xp-label',
    'status-time', 'status-money', 'status-energy', 'status-reputation', 'dialogue-location', 'dialogue-line',
    'interaction-title', 'audition-title', 'audition-outcome', 'home-hub-title', 'home-hub-housing-tier',
    'home-hub-away-headline', 'home-hub-active-assignment-label', 'interaction-prompt-label', 'toast', 'announcer',
    'film-mode', 'text-scale-output', 'music-volume-output', 'ambience-volume-output', 'hud-quickstats',
}
SKIP_TAGS = {'script', 'style', 'title', 'head', 'output', 'select', 'option', 'textarea', 'svg'}
VOID = {'meta', 'link', 'input', 'img', 'br', 'hr', 'source', '!doctype'}
ATTRS = ('aria-label', 'alt', 'title', 'placeholder')
TOKEN = re.compile(r'<!--.*?-->|<[^>]+>|[^<]+', re.S)
ATTR = re.compile(r'([\w:-]+)(?:\s*=\s*"([^"]*)")?')


class Element:
    def __init__(self, tag, attrs, start, end, parent):
        self.tag, self.attrs, self.start, self.end, self.parent = tag, attrs, start, end, parent
        self.children = []
        self.content_start = end
        self.content_end = end
        self.self_closing = False


class Text:
    def __init__(self, start, end, raw):
        self.start, self.end, self.raw = start, end, raw


def parse(source):
    root = Element('#root', {}, 0, 0, None)
    current = root
    for match in TOKEN.finditer(source):
        raw = match.group(0)
        start, end = match.span()
        if raw.startswith('<!--'):
            continue
        if raw.startswith('</'):
            tag = raw[2:-1].strip().lower()
            node = current
            while node is not root and node.tag != tag:
                node = node.parent
            if node is not root:
                node.content_end = start
                current = node.parent
            continue
        if raw.startswith('<'):
            inner = raw[1:-1].strip()
            self_closing = inner.endswith('/')
            inner = inner.rstrip('/').strip()
            tag = re.match(r'[^\s]+', inner).group(0).lower()
            attrs = {m.group(1): m.group(2) for m in ATTR.finditer(inner[len(tag):])}
            element = Element(tag, attrs, start, end, current)
            current.children.append(element)
            if tag in VOID or self_closing:
                element.self_closing = True
            else:
                current = element
            continue
        current.children.append(Text(start, end, raw))
    return root


def camel(text):
    words = re.findall(r'[A-Za-z0-9]+', text)[:4]
    if not words:
        return 'text'
    return words[0].lower() + ''.join(w.capitalize() for w in words[1:])


def id_to_scope(value):
    parts = value.split('-')
    return parts[0] + ''.join(p.capitalize() for p in parts[1:])


def main():
    source = INDEX.read_text(encoding='utf-8')
    catalog = json.loads(EN.read_text(encoding='utf-8')) if EN.exists() else {}
    used = set(catalog)
    counters = {}
    edits = []  # (position, insert-or-replace tuple)

    def scope_of(node):
        while node is not None:
            if node.attrs.get('id'):
                return node.attrs['id']
            node = node.parent
        return 'page'

    def make_key(node, text):
        scope = scope_of(node)
        if scope in ('legal-terms-dialog', 'legal-privacy-dialog'):
            prefix = 'legal.terms' if scope == 'legal-terms-dialog' else 'legal.privacy'
            counters[prefix] = counters.get(prefix, 0) + 1
            base = f'{prefix}.p{counters[prefix]:02d}'
        else:
            base = f'{id_to_scope(scope)}.{camel(text)}'
        key, i = base, 2
        while key in used:
            key, i = f'{base}{i}', i + 1
        used.add(key)
        return key

    def blocked(node):
        while node is not None and node.tag != '#root':
            if node.tag in SKIP_TAGS or node.attrs.get('id') in RUNTIME_IDS or 'data-i18n' in node.attrs:
                return True
            node = node.parent
        return False

    def has_letters(text):
        return re.search(r'[A-Za-z]{2}', htmllib.unescape(text)) is not None

    def visit(node):
        if node.tag != '#root' and not blocked(node):
            # attributes
            if 'data-i18n-attr' not in node.attrs:
                pairs = []
                for name in ATTRS:
                    value = node.attrs.get(name)
                    if value and has_letters(value):
                        text = htmllib.unescape(value)
                        key = make_key(node, text)
                        catalog[key] = text
                        pairs.append(f'{name}:{key}')
                if pairs:
                    cut = node.end - (2 if source[node.end - 2:node.end] == '/>' else 1)
                    while cut > node.start and source[cut - 1] == ' ':
                        cut -= 1
                    edits.append((cut, cut, f' data-i18n-attr="{";".join(pairs)}"'))
            texts = [c for c in node.children if isinstance(c, Text) and has_letters(c.raw)]
            elements = [c for c in node.children if isinstance(c, Element)]
            if texts and not elements:
                text = re.sub(r'\s+', ' ', htmllib.unescape(''.join(t.raw for t in texts)).strip())
                key = make_key(node, text)
                catalog[key] = text
                cut = node.end - 1
                edits.append((cut, cut, f' data-i18n="{key}"'))
                return
            for t in texts:
                stripped = t.raw.strip()
                lead = len(t.raw) - len(t.raw.lstrip())
                text = re.sub(r'\s+', ' ', htmllib.unescape(stripped))
                key = make_key(node, text)
                catalog[key] = text
                s = t.start + lead
                edits.append((s, s + len(stripped), f'<span data-i18n="{key}">{stripped}</span>'))
        for child in node.children:
            if isinstance(child, Element) and not (node.tag in SKIP_TAGS):
                visit(child)

    visit(parse(source))
    for start, end, replacement in sorted(edits, key=lambda e: e[0], reverse=True):
        source = source[:start] + replacement + source[end:]
    INDEX.write_text(source, encoding='utf-8', newline='')
    EN.write_text(json.dumps(catalog, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(f'{len(edits)} edits, {len(catalog)} catalog entries')


if __name__ == '__main__':
    main()
