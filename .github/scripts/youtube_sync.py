#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""고신교회 유튜브 새 영상 자동 반영

GitHub Actions(.github/workflows/youtube-sync.yml)가 몇 시간마다 실행합니다.
  - 유튜브가 채널마다 자동으로 만들어 두는 목록의 공개 피드(RSS)를 읽습니다. (로그인·API 키 필요 없음)
      UULF… : 영상  (쇼츠와 라이브 방송은 들어 있지 않음)
      UUSH… : 쇼츠
      UULV… : 라이브 방송 → 일부러 읽지 않습니다 (라이브는 홈페이지에 올리지 않음)
  - 결과를 data/youtube.js 에 모아 둡니다. (assets/js/site.js 가 이 파일을 읽어 3분 묵상·쇼츠 목록에 합칩니다)
  - 피드는 최근 15개만 주므로, 이전에 모아 둔 것은 그대로 두고 새 것만 앞에 붙입니다.
  - 유튜브에서 지우거나 비공개로 바꾼 영상은 다음 실행 때 자동으로 빠집니다.
  - 바뀐 것이 없으면 파일을 건드리지 않습니다. (불필요한 저장 기록이 쌓이지 않도록 시각 같은 값은 넣지 않습니다)
"""
import datetime
import json
import re
import sys
import time
import urllib.request
import xml.etree.ElementTree as ET
from pathlib import Path

CHANNEL_ID = 'UCEhm5xOJZMadH_oS3jFfRFA'            # 고신교회 유튜브 채널 (@kosinchurch)
KINDS = {'videos': 'UULF', 'shorts': 'UUSH'}        # 모을 종류 → 유튜브 자동 목록 머리글자
OUT = Path('data/youtube.js')
KEEP = 150                                           # 종류마다 최대 몇 개까지 모아 둘지
KST = datetime.timezone(datetime.timedelta(hours=9))
ATOM = '{http://www.w3.org/2005/Atom}'
YT = '{http://www.youtube.com/xml/schemas/2015}'


def fetch(kind):
    url = 'https://www.youtube.com/feeds/videos.xml?playlist_id=' + KINDS[kind] + CHANNEL_ID[2:]
    last = None
    for attempt in range(3):
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (kosin-church-site-sync)'})
            with urllib.request.urlopen(req, timeout=30) as r:
                root = ET.fromstring(r.read())
            out = []
            for e in root.findall(ATOM + 'entry'):
                vid = (e.findtext(YT + 'videoId') or '').strip()
                pub = (e.findtext(ATOM + 'published') or '').strip()
                title = clean_title(e.findtext(ATOM + 'title') or '')
                if not (re.fullmatch(r'[\w-]{11}', vid) and pub and title):
                    continue
                when = datetime.datetime.fromisoformat(pub).astimezone(datetime.timezone.utc)
                out.append({
                    'youtube': vid,
                    'date': when.astimezone(KST).strftime('%Y-%m-%d'),   # 한국 시간 기준 날짜
                    'p': when.strftime('%Y-%m-%dT%H:%M:%SZ'),
                    'title': title,
                })
            if not out:
                raise ValueError('빈 목록')
            return out
        except Exception as ex:  # 일시적인 오류는 잠시 뒤 다시 시도
            last = ex
            time.sleep(4 * (attempt + 1))
    raise RuntimeError('%s 목록을 읽지 못했습니다: %s' % (kind, last))


def clean_title(t):
    t = t.replace('￼', '').replace('​', '')
    t = re.sub(r'\s+', ' ', t).strip()
    t = re.sub(r'^3분\s*묵상\s*[-–—:]\s*', '', t)   # "3분 묵상 - 제목" → "제목" (사이트의 기존 목록과 같은 모양)
    return t


def load_existing():
    empty = {k: [] for k in KINDS}
    if not OUT.exists():
        return empty
    m = re.search(r'KOSIN\.youtubeAuto\s*=\s*(\{.*\})\s*;', OUT.read_text(encoding='utf-8'), re.S)
    if not m:
        return empty
    try:
        data = json.loads(m.group(1))
    except ValueError:
        return empty
    return {k: [x for x in data.get(k, []) if isinstance(x, dict) and x.get('youtube') and x.get('p')] for k in KINDS}


def merge(old, feed):
    fresh = {e['youtube'] for e in feed}
    oldest = min(e['p'] for e in feed)
    # 피드가 보여 주는 기간 안인데 피드에 없는 것 = 지우거나 비공개로 바꾼 영상 → 뺍니다. 더 오래된 것은 그대로 둡니다.
    kept = [e for e in old if e['youtube'] not in fresh and e['p'] < oldest]
    merged = feed + kept
    merged.sort(key=lambda e: (e['p'], e['youtube']), reverse=True)
    return merged[:KEEP]


def render(data):
    def block(items):
        return ',\n'.join('    ' + json.dumps({'youtube': e['youtube'], 'date': e['date'], 'p': e['p'], 'title': e['title']}, ensure_ascii=False, separators=(',', ':')) for e in items)
    return (
        '/* 자동으로 만들어지는 파일입니다 — 직접 고치지 마세요.\n'
        '   .github/workflows/youtube-sync.yml 이 몇 시간마다 유튜브 채널(라이브 제외)의 새 영상·쇼츠를 모아 이 파일을 갱신합니다.\n'
        '   videos → 3분 묵상 목록, shorts → 쇼츠 목록에 자동으로 합쳐집니다 (assets/js/site.js). */\n'
        'window.KOSIN = window.KOSIN || {};\n'
        'KOSIN.youtubeAuto = {\n'
        '  "videos": [\n' + block(data['videos']) + '\n  ],\n'
        '  "shorts": [\n' + block(data['shorts']) + '\n  ]\n'
        '};\n'
    )


def main():
    existing = load_existing()
    result, errors = {}, []
    for kind in KINDS:
        try:
            result[kind] = merge(existing[kind], fetch(kind))
        except Exception as ex:
            errors.append(str(ex))
            result[kind] = existing[kind]   # 이번에는 못 읽었으니 있던 그대로 둡니다
    if len(errors) == len(KINDS):
        print('모든 목록을 읽지 못했습니다:\n  ' + '\n  '.join(errors), file=sys.stderr)
        return 1
    for e in errors:
        print('주의: ' + e, file=sys.stderr)
    text = render(result)
    old_text = OUT.read_text(encoding='utf-8') if OUT.exists() else ''
    if text == old_text:
        print('새 영상 없음 (영상 %d, 쇼츠 %d)' % (len(result['videos']), len(result['shorts'])))
        return 0
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(text, encoding='utf-8', newline='\n')
    added = {k: len({e['youtube'] for e in result[k]} - {e['youtube'] for e in existing[k]}) for k in KINDS}
    print('갱신: 새 영상 %d, 새 쇼츠 %d (모아 둔 영상 %d, 쇼츠 %d)' % (added['videos'], added['shorts'], len(result['videos']), len(result['shorts'])))
    return 0


if __name__ == '__main__':
    sys.exit(main())
