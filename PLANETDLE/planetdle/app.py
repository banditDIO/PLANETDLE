from flask import Flask, render_template, request, jsonify, session, Response
import os
import secrets
import json
import re
import time
from pathlib import Path
import threading
from collections import OrderedDict
from urllib.parse import urlencode
from urllib.request import Request, urlopen
from urllib.error import URLError, HTTPError
from game_logic import OBJECTS, new_game, submit_guess, get_hint

app = Flask(__name__)
app.secret_key = os.environ.get("PLANETDLE_SECRET_KEY") or secrets.token_hex(32)
app.config["SESSION_COOKIE_SECURE"] = os.environ.get("PLANETDLE_HTTPS") == "1"

# The secret answer must NOT live in Flask's signed (readable) session cookie.
# This single-process store is appropriate for a local hackathon demonstration.
_GAMES = OrderedDict()
_GAME_LOCK = threading.RLock()
MAX_GAMES = 200

def _game_id():
    game_id = session.get('game_id')
    if not isinstance(game_id, str) or len(game_id) != 32:
        game_id = secrets.token_hex(16)
        session['game_id'] = game_id
    return game_id

def _set_game(game_id, game):
    if "round_id" not in game:
        game["round_id"] = secrets.token_hex(12)
    _GAMES[game_id] = (time.monotonic(), game)
    _GAMES.move_to_end(game_id)
    while len(_GAMES) > MAX_GAMES:
        _GAMES.popitem(last=False)

def _get_game(game_id):
    record = _GAMES.get(game_id)
    return record[1] if record else None

@app.get('/')
def index():
    with _GAME_LOCK:
        game_id = _game_id()
        game = _get_game(game_id)
        if game is None:
            game = new_game(daily=True)
        _set_game(game_id, game)
        round_view = {"id":game["round_id"], "guesses":list(game.get("history", ()))}
    response = app.make_response(render_template('index.html', object_names=sorted(OBJECTS), round_view=round_view))
    response.headers["Cache-Control"] = "no-store"
    return response

@app.post('/api/guess')
def guess():
    data = request.get_json(silent=True)
    if not isinstance(data, dict) or not isinstance(data.get("guess"), str):
        return jsonify(ok=False, error="Choose an object from the list."), 400
    with _GAME_LOCK:
        game_id = _game_id()
        game = _get_game(game_id) or new_game(daily=True)
        if ("round_id" in data and data["round_id"] != game.get("round_id")
                or "attempts" in data and data["attempts"] != len(game["guesses"])):
            return jsonify(ok=False, error="This round changed in another tab. Reload to sync your guesses."), 409
        response = submit_guess(game, data['guess'])
        response.pop('game', None)
        if response["ok"]:
            game.setdefault("history", []).append(response)
        _set_game(game_id, game)
    return jsonify(response)

@app.post('/api/hint')
def hint():
    with _GAME_LOCK:
        game_id = _game_id()
        game = _get_game(game_id) or new_game(daily=True)
        response = get_hint(game)
        _set_game(game_id, response.pop('game', game))
    return jsonify(response)

@app.post('/api/new')
def new():
    data = request.get_json(silent=True)
    if not isinstance(data, dict) or not isinstance(data.get("practice", False), bool):
        return jsonify(ok=False, error="Choose a valid round mode."), 400
    practice = data.get('practice', False)
    with _GAME_LOCK:
        game = new_game(daily=not practice)
        _set_game(_game_id(), game)
    return jsonify(ok=True, practice=practice, round_id=game["round_id"])

# NASA's public Image and Video Library. The server limits searches to known worlds,
# caches metadata, and returns small preview images only; no API key is required.
_NASA_CACHE = {}
NASA_QUERIES = {
    "Mercury":"Mercury planet NASA", "Venus":"Venus planet NASA",
    "Mars":"Mars planet NASA", "Jupiter":"Jupiter planet Juno", "Saturn":"Saturn planet Cassini",
    "Uranus":"Uranus planet Voyager", "Neptune":"Neptune planet Voyager",
    "Pluto":"Pluto New Horizons", "Ceres":"Ceres Dawn spacecraft",
    "Europa":"Europa moon Galileo", "Titan":"Titan moon Cassini",
    "Ganymede":"Ganymede moon Galileo", "Io":"Io moon Galileo",
    "Enceladus":"Enceladus Cassini", "Earth's Moon":"Moon lunar surface NASA",
    "Phobos":"Phobos Mars moon", "Callisto":"Callisto Galileo moon",
    "Halley's Comet":"Halley comet NASA", "Bennu":"Bennu OSIRIS-REx",
    "Vesta":"Vesta Dawn spacecraft",
}

# Earth searches can rank unrelated mission and event material above planet photos.
# Use known NASA archive records for Earth so gallery contents are deterministic.
EARTH_NASA_IMAGES = [
    {
        "title": "Blue Marble from Apollo 17",
        "nasa_id": "AS17-148-22727",
        "image": "https://eol.jsc.nasa.gov/DatabaseImages/EFS/lowres/AS17/AS17-148-22727.JPG",
        "credit": "NASA / Apollo 17",
        "url": "https://science.nasa.gov/earth/earth-observatory/the-blue-marble-from-apollo-17-1133/",
    },
    {
        "title": "Earthrise from lunar orbit",
        "nasa_id": "AS08-14-2383",
        "image": "https://eol.jsc.nasa.gov/DatabaseImages/ISD/lowres/AS08/AS08-14-2383.JPG",
        "credit": "NASA / William Anders",
        "url": "https://science.nasa.gov/resource/image-earthrise/",
    },
    {
        "title": "Earth’s sunlit side from DSCOVR",
        "nasa_id": "DSCOVR-EPIC-20150706",
        "image": (
            "https://assets.science.nasa.gov/dynamicimage/assets/science/esd/eo/images/"
            "imagerecords/86000/86257/epicfirstlight_DSC_2015186_lrg.jpg"
            "?crop=faces%2Cfocalpoint&fit=crop&h=150&w=150"
        ),
        "credit": "NASA / DSCOVR EPIC team",
        "url": "https://science.nasa.gov/earth/earth-observatory/an-epic-new-view-of-earth-86257/",
    },
]


@app.get("/api/nasa/<path:world>")
def nasa_images(world):
    if world not in OBJECTS:
        return jsonify({"ok": False, "error": "Unknown celestial object"}), 404
    if world == "Earth":
        return jsonify(ok=True, items=EARTH_NASA_IMAGES, source="NASA Earth imagery archives")
    cached = _NASA_CACHE.get(world)
    if cached and time.time() - cached[0] < 86400:
        return jsonify(cached[1])
    params = urlencode({"q": NASA_QUERIES[world], "media_type": "image", "page_size": 40})
    url = "https://images-api.nasa.gov/search?" + params
    try:
        req = Request(url, headers={"User-Agent": "PLANETDLE/1.0 (educational astronomy atlas)", "Accept": "application/json"})
        with urlopen(req, timeout=7) as response:
            payload = json.load(response)
        items = []
        for entry in payload.get("collection", {}).get("items", []):
            metadata = (entry.get("data") or [{}])[0]
            if metadata.get("media_type") != "image":
                continue
            # NASA search ranks related mission content too; reject generic thumbnails.
            title = str(metadata.get("title", ""))
            target_terms = [world.lower()]
            if world == "Earth's Moon":
                target_terms = ["moon", "lunar"]
            elif world == "Halley's Comet":
                target_terms = ["halley"]
            if not any(re.search(r"(?<!\w)"+re.escape(term)+r"(?!\w)",title,re.IGNORECASE) for term in target_terms):
                continue
            bad_terms = ("logo", "poster", "infographic", "artist's concept", "artist’s concept", "illustration", "diagram", "patch", "mission emblem", "graphic", "animation", "launch", "spacecraft model", "artist concept", "earth-sized", "earth-class", "space station", "hangout", "visualization", "event", "conference", "briefing", "press", "panel discussion", "workshop")
            if any(term in title.lower() for term in bad_terms):
                continue
            nasa_id = str(metadata.get("nasa_id", ""))
            if not nasa_id or len(nasa_id) > 120:
                continue
            links = [x.get("href", "") for x in entry.get("links", []) if x.get("render") == "image"]
            image = next((x for x in links if x.startswith("https://images-assets.nasa.gov/") and ("~small." in x or "~thumb." in x)), None)
            if not image:
                image = next((x for x in links if x.startswith("https://images-assets.nasa.gov/") and "~medium." in x), None)
            if not image:
                continue
            items.append({"title": str(metadata.get("title", "NASA image"))[:140],
                          "nasa_id": nasa_id, "image": image,
                          "credit": str(metadata.get("secondary_creator") or metadata.get("center") or "NASA")[:100],
                          "url": "https://images.nasa.gov/details/" + nasa_id})
            if len(items) == 3:
                break
        result = {"ok": True, "items": items, "source": "NASA Image and Video Library", "query": NASA_QUERIES[world]}
        _NASA_CACHE[world] = (time.time(), result)
        return jsonify(result)
    except (HTTPError, URLError, TimeoutError, ValueError, OSError) as exc:
        return jsonify({"ok": False, "items": [], "error": "NASA images temporarily unavailable"}), 503

@app.get("/api/health")
def health():
    return jsonify({"ok": True, "service": "PLANETDLE"})

# Scientific base-colour maps used only for 3D discovery, when available.
# Source: Solar System Scope (based on NASA mission data), CC BY 4.0.
# Some coverage and colours are reconstructed; see TEXTURE_SOURCES.md.
TEXTURE_FILES = {
 'Mercury':'2k_mercury.jpg', 'Venus':'2k_venus_atmosphere.jpg',
 'Earth':'2k_earth_daymap.jpg', 'Mars':'2k_mars.jpg',
 'Jupiter':'2k_jupiter.jpg', 'Saturn':'2k_saturn.jpg',
 'Uranus':'2k_uranus.jpg', 'Neptune':'2k_neptune.jpg',
 "Earth's Moon":'2k_moon.jpg',
}
MISSION_MAPS = {
 'Ceres':'https://astrogeology.usgs.gov/ckan/dataset/6ad84c9a-1fad-4869-b4f6-b52c5c2ace36/resource/9f757a65-8d8a-4349-a72d-8062387574b3/download/ceres_dawn_fc_dlr_global_feb2016_1024.jpg',
 'Vesta':'https://astrogeology.usgs.gov/ckan/dataset/ec63e420-a8bd-4a90-9341-a5754b551574/resource/9306febf-0c7a-49ee-b7b0-a1f043297bf7/download/vesta_dawn_fc_hamo_mosaic_global_1024.jpg',
 'Pluto':'https://assets.science.nasa.gov/content/dam/science/psd/photojournal/pia/pia11/pia11707/PIA11707.jpg',
 'Bennu':'https://astrogeology.usgs.gov/ckan/dataset/1207ce04-efa6-4c3c-a7ad-13fd6b2af827/resource/8e177439-6c50-46f0-a65f-6521c8d1b9df/download/bennu_global_fb34_fb56_shapev28_gndcontrol_minnaertphase30_pan_8bit_1024.jpg',
 'Phobos':'https://maps.jpl.nasa.gov/tmaps/pix/mar1kuu2.jpg',
 'Enceladus':'https://astrogeology.usgs.gov/ckan/dataset/30bff65e-56bb-4fd1-bd04-edd9bc2e77d0/resource/19ba2e14-9ceb-45e6-8cc8-e784e36ed4f0/download/full.jpg',
 'Titan':'https://assets.science.nasa.gov/content/dam/science/psd/photojournal/pia/pia22/pia22770/PIA22770.jpg',
 'Io':'https://maps.jpl.nasa.gov/tmaps/pix/jup1vss2.jpg',
 'Europa':'https://maps.jpl.nasa.gov/tmaps/pix/jup2vss2.jpg',
 'Ganymede':'https://maps.jpl.nasa.gov/tmaps/pix/jup3vss2.jpg',
 'Callisto':'https://astrogeology.usgs.gov/ckan/dataset/a80abd68-7ed9-440e-829a-76376779164f/resource/ac628525-cb1c-4742-928b-5a0a60f372cd/download/callisto_voyager_galileossi_global_mosaic_1024.jpg',
}
_TEXTURE_CACHE = {}
_TEXTURE_FAILURES = {}

@app.get('/api/texture/<path:world>')
def planet_texture(world):
    if world not in TEXTURE_FILES and world not in MISSION_MAPS:
        return jsonify({'ok':False, 'error':'No verified texture available'}), 404
    local_map = Path(__file__).parent / 'static' / 'planet_maps' / (world.lower().replace(' ', '_').replace("'", '') + '.jpg')
    if local_map.is_file():
        return Response(local_map.read_bytes(), mimetype='image/jpeg', headers={'Cache-Control':'public,max-age=86400'})
    if world in {"Pluto", "Bennu", "Vesta", "Ceres", "Phobos"}:
        return jsonify(ok=False, error="Restore the matching map from the release ZIP."), 503
    now = time.monotonic()
    with _GAME_LOCK:
        cached = _TEXTURE_CACHE.get(world)
        if cached:
            return Response(cached, mimetype='image/jpeg', headers={'Cache-Control':'public,max-age=86400'})
        if now < _TEXTURE_FAILURES.get(world, 0):
            return jsonify({'ok':False,'error':'Map temporarily unavailable'}), 503
    from urllib.parse import quote
    url = MISSION_MAPS.get(world) or ('https://www.solarsystemscope.com/textures/download/' + quote(TEXTURE_FILES[world]))
    try:
        req = Request(url, headers={'User-Agent':'PLANETDLE educational exhibit/1.0'})
        with urlopen(req,timeout=6) as response:
            if response.headers.get('Content-Type','').split(';')[0] not in ('image/jpeg','image/jpg','application/octet-stream'):
                raise ValueError('Unexpected response type')
            raw = response.read(5_000_001)
            if len(raw)>5_000_000 or not raw.startswith(b'\xff\xd8\xff'):
                raise ValueError('Invalid or oversized texture')
        with _GAME_LOCK:
            _TEXTURE_CACHE[world] = raw
        return Response(raw, mimetype='image/jpeg', headers={'Cache-Control':'public,max-age=86400'})
    except (URLError, HTTPError, TimeoutError, ValueError, OSError):
        with _GAME_LOCK: _TEXTURE_FAILURES[world] = time.monotonic()+90
        return jsonify({'ok':False,'error':'Scientific texture unavailable; neutral globe shown'}), 503

if __name__ == "__main__":
    app.run(debug=os.environ.get("PLANETDLE_DEBUG") == "1")


