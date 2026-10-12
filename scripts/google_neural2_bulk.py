#!/usr/bin/env python3
"""TIB Academy: Google Neural2 bulk narration, Labs 4-46.
Run in authenticated Google Cloud Shell. Produces a single deployment ZIP.
"""
import html, json, os, re, time, urllib.request, zipfile
from pathlib import Path
from google.cloud import texttospeech

OWNER = "isaac-gethub"
REPO = "TIB-ACADEMY-NARRATION-SERVICE-CHATGPT-"
ROOT = "https://raw.githubusercontent.com/" + OWNER + "/" + REPO + "/main/"
OUT = Path.home() / "TIB_Neural2_Bulk"
AUDIO = OUT / "audio"
AUDIO.mkdir(parents=True, exist_ok=True)
client = texttospeech.TextToSpeechClient()
voice = texttospeech.VoiceSelectionParams(language_code="en-US", name="en-US-Neural2-D")
config = texttospeech.AudioConfig(audio_encoding=texttospeech.AudioEncoding.MP3, speaking_rate=0.94)
manifest = []
for number in range(4, 47):
    lab = f"lab{number:02d}"
    source = urllib.request.urlopen(ROOT + lab + ".html", timeout=45).read().decode("utf-8")
    matches = re.findall(r"<section\b[^>]*>(.*?)</section>", source, re.S | re.I)
    if len(matches) != 5:
        raise RuntimeError(f"{lab}: expected five sections, got {len(matches)}")
    items = []
    for i, section in enumerate(matches, 1):
        title_match = re.search(r"<h2\b[^>]*>(.*?)</h2>", section, re.S | re.I)
        text_match = re.search(r"<p\b[^>]*>(.*?)</p>", section, re.S | re.I)
        if not title_match or not text_match:
            raise RuntimeError(f"{lab}: missing section heading or text {i}")
        clean = lambda s: html.unescape(re.sub(r"<[^>]*>", "", s)).strip()
        title, spoken = clean(title_match.group(1)), clean(text_match.group(1))
        if not spoken:
            raise RuntimeError(f"{lab} section {i}: empty script")
        name = f"{lab}-section-{i}.mp3"
        target = AUDIO / name
        if not target.exists() or target.stat().st_size < 1000:
            result = client.synthesize_speech(
                input=texttospeech.SynthesisInput(text=spoken),
                voice=voice, audio_config=config
            )
            target.write_bytes(result.audio_content)
            time.sleep(0.15)
        if target.stat().st_size < 1000:
            raise RuntimeError(f"{name}: invalid audio")
        items.append((title, spoken, name))
        print(f"OK {lab} section {i}: {target.stat().st_size} bytes", flush=True)
    esc = html.escape
    sections = "".join(
        f'<section><h2>{esc(title)}</h2><audio controls preload="none" src="/audio/{name}"></audio>'
        f'<p><a href="/audio/{name}" download>Download MP3</a></p>'
        f'<details><summary>Read narration script</summary><p>{esc(spoken)}</p></details></section>'
        for title, spoken, name in items
    )
    page = (
        '<!doctype html><html lang="en"><meta charset="utf-8">'
        '<meta name="viewport" content="width=device-width,initial-scale=1">'
        f'<title>Lab {number} — Recorded Narration</title>'
        '<style>body{font:17px/1.6 system-ui;background:#edf2f8;color:#173257;margin:0}'
        'main{max-width:900px;margin:35px auto;background:white;padding:30px;border-radius:14px}'
        'section{padding:20px 0;border-top:1px solid #d5dfeb}audio{width:100%}</style>'
        f'<main><h1>Lab {number} — Google Neural2 Recorded Lesson</h1>'
        f'<p>Five prerecorded sections. <a href="/{lab}-interactive.html">Open interactive lab</a>'
        ' · <a href="/">Course home</a></p>' + sections + '</main></html>'
    )
    (OUT / (lab + ".html")).write_text(page, encoding="utf-8")
    manifest.append({"lab":number,"sections":len(items),"files":[x[2] for x in items]})
if len(manifest) != 43 or sum(x["sections"] for x in manifest) != 215:
    raise RuntimeError("Incomplete bulk generation")
(OUT / "narration-manifest.json").write_text(json.dumps(manifest,indent=2),encoding="utf-8")
zip_path = Path.home() / "TIB_Neural2_Labs04-46_Deployment.zip"
with zipfile.ZipFile(zip_path,"w",zipfile.ZIP_DEFLATED) as z:
    for path in OUT.rglob("*"):
        if path.is_file():
            z.write(path,path.relative_to(OUT))
with zipfile.ZipFile(zip_path) as z:
    bad = z.testzip()
    if bad: raise RuntimeError("ZIP corruption: " + bad)
print(f"COMPLETE: 43 labs, 215 MP3s. ZIP: {zip_path}",flush=True)
