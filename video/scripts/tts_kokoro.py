"""Synthesise voiceover lines with Kokoro (Apache-2.0 open voice model), locally.
   python scripts/tts_kokoro.py <script.json> <out-dir> [--voice am_adam] [--speed 1.0] [--list]
The script json is {"voice": "...", "speed": 1.0, "lines": [{"id": "01", "text": "..."}]}; writes <out-dir>/<id>.24k.wav"""
import json, sys, pathlib
import soundfile as sf
from kokoro_onnx import Kokoro

root = pathlib.Path(__file__).resolve().parent.parent
model = root / ".cache/kokoro/kokoro-v1.0.onnx"
voices = root / ".cache/kokoro/voices-v1.0.bin"
k = Kokoro(str(model), str(voices))
args = sys.argv[1:]
if "--list" in args:
    print(" ".join(sorted(k.get_voices())))
    sys.exit(0)
script = json.loads(pathlib.Path(args[0]).read_text(encoding="utf8"))
out = pathlib.Path(args[1]); out.mkdir(parents=True, exist_ok=True)
voice = args[args.index("--voice") + 1] if "--voice" in args else script.get("voice", "am_adam")
speed = float(args[args.index("--speed") + 1]) if "--speed" in args else float(script.get("speed", 1.0))
for line in script["lines"]:
    samples, sr = k.create(line["text"], voice=line.get("voice", voice), speed=float(line.get("speed", speed)), lang="en-us")
    sf.write(str(out / f"{line['id']}.24k.wav"), samples, sr)
    print(f"{line['id']}  {len(samples)/sr:5.2f}s  {line['text']}")
