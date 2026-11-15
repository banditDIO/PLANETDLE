"""Optional one-time step to prefetch legally reusable astronomy texture maps.
Run from the planetdle folder after installing requirements:
    python CACHE_TEXTURES.py
Works only when the internet and source servers are reachable.
"""
from pathlib import Path
from urllib.request import Request, urlopen
from app import TEXTURE_FILES, MISSION_MAPS

DEST = Path(__file__).parent / 'static' / 'planet_maps'
DEST.mkdir(parents=True, exist_ok=True)
failed = []
for world in sorted(set(TEXTURE_FILES) | set(MISSION_MAPS)):
    name = world.lower().replace(' ', '_').replace("'", '') + '.jpg'
    target = DEST / name
    if target.is_file() and target.stat().st_size > 1000:
        print('Already cached:',world)
        continue
    if world in {"Pluto", "Bennu", "Vesta", "Ceres", "Phobos"}:
        failed.append(world)
        print("Restore the matching model texture from the release ZIP:",world)
        continue
    url = MISSION_MAPS.get(world) or 'https://www.solarsystemscope.com/textures/download/' + TEXTURE_FILES[world]
    try:
        with urlopen(Request(url,headers={'User-Agent':'PLANETDLE classroom educational exhibit'}),timeout=15) as response:
            blob=response.read(5_000_001)
        if len(blob)>5_000_000 or not blob.startswith(b'\xff\xd8\xff'):
            raise ValueError('Not an acceptable JPEG')
        target.write_bytes(blob)
        print('Saved',world,len(blob),'bytes')
    except Exception as exc:
        failed.append(world)
        print('Unavailable:',world,str(exc)[:130])
print('Completed: 3D maps are served locally where cached.')
if failed: print('Missing:',', '.join(failed))
