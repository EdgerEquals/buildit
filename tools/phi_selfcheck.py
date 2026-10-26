#!/usr/bin/env python3
"""Rule 12 self-check ALERT (report only, changes nothing): lists every numeric literal in the given JS/CSS files that is
not a ratio this page allows. Allowed: 0, 1, 2 (identity, halves, both sides); Fibonacci counts; PHI itself and PHI powers
(x or 1 - x, as a fraction or a percentage, whole or half steps); unit definitions (ms per second/day, degrees, hours, MIDI 69/440, the major pentatonic scale,
12 semitones, 127 MIDI steps, 0x hex colours); and lines marked as cited reference data (REFERENCE / cited / SKY / NOAA / Meeus /
WCAG). Everything else is an ALERT: a fixed parameter to move to a ratio or a cited/kid-input anchor, or for Danny to keep.
Lines marked PENDING-DANNY (the amplitude matrix and pitch range hooks) are listed apart as PENDING: existing values held for
Danny, not counted as ALERTs. Lines marked SCALE are musical scale intervals (ratios of the base), allowed like the pentatonic.
Exponents inside P(n) / S(n) (PHI^n, grid step x PHI^n) and array indices are skipped.
Usage: tools/phi_selfcheck.py file.js [...]   (comments are skipped)"""
import re, sys, math
PHI = (1 + 5 ** 0.5) / 2
FIB = {3, 5, 8, 13, 21, 34, 55, 89, 144, 233}
UNIT = {0, 0.5, 50, 1, 2, 4, 10, 12, 15, 16, 24, 32, 60, 69, 90, 100, 127, 180, 255, 360, 440, 1000, 3600, 8191, 8192, 86400, 864e5, 864e2, 1e-4, 1e-6, 1e-3, 1e9, 6048e5}
CITED = re.compile(r'PENTA = |SCALE|REFERENCE|cited|SKY\.|NOAA|Meeus|WCAG|Cartwright|NSSDC|Schureman|0\.2126|0\.7152|0\.0722|0\.03928|1\.055|12\.92|2\.4\)')
def phiish(v):
    if v <= 0: return False
    forms = [(v, False), (1 - v if v < 1 else None, True)]
    if v >= 1: forms += [(v / 100, False), (1 - v / 100 if v < 100 else None, True)]   # percentages like 61.8 / 38.2
    for x, comp in forms:
        if x is None or x <= 0: continue
        n = math.log(x) / math.log(PHI)
        if comp and round(n * 2) == 0: continue   # 1 - (something tiny) is not a phi power
        if abs(n * 2 - round(n * 2)) < 0.02 and abs(n) <= 20: return True
    return False
def strip_comments(src):
    src = re.sub(r'/\*.*?\*/', lambda m: '\n' * m.group(0).count('\n'), src, flags=re.S)
    return [re.sub(r'(?<![:\'"\\])//.*$', '', l) for l in src.split('\n')]
NUM = re.compile(r'(?<![\w.#$\-{])(\d+\.?\d*(?:e-?\d+)?|\.\d+)(?=(?:s|%|em|px|vmin|vh|vw|deg|ms)?(?![\w.]))')
tot = 0; ptot = 0
for f in sys.argv[1:]:
    hits = []; pend = []; raw = open(f, encoding='utf-8').read().split('\n')
    for i, line in enumerate(strip_comments('\n'.join(raw)), 1):
        if CITED.search(line) or CITED.search(raw[i-1].split('//')[-1] if '//' in raw[i-1] else ''): continue
        clean = re.sub(r"'[^']*'|\"[^\"]*\"", lambda m: '' if not re.search(r'\d+(\.\d+)?(s|%|em|px|vmin|vh)\b', m.group(0)) else m.group(0), line)
        clean = re.sub(r'\b[PS]\((?:lerp\()?-?[\d.]+(?:,\s*-?[\d.]+)?', '', clean); clean = re.sub(r'\w\[\d+\]', '', clean)   # phi exponents and array indices are not parameters
        clean = re.sub(r'#[0-9A-Fa-f]{3,8}\b', '', clean); clean = re.sub(r'\\u[0-9A-Fa-f]{4}', '', clean)
        for m in NUM.finditer(clean):
            try: v = float(m.group(1))
            except ValueError: continue
            if v in UNIT or v in FIB or phiish(v): continue
            (pend if 'PENDING-DANNY' in raw[i-1] else hits).append((i, m.group(1), line.strip()[:110]))
    tot += len(hits)
    print('%s: %d ALERT%s' % (f, len(hits), '' if len(hits) == 1 else 's'))
    for i, n, l in hits: print('  ALERT line %d: %s   | %s' % (i, n, l))
    ptot += len(pend)
    if pend: print('  PENDING (held for Danny): %d values on lines %s' % (len(pend), sorted(set(i for i, _, _ in pend))))
print('TOTAL ALERTS: %d   PENDING-DANNY: %d' % (tot, ptot))
