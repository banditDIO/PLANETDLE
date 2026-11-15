from datetime import date
import hashlib
import secrets

# Compact, intentionally beginner-friendly Solar System dataset.
# Values are game categories, not scientific measurements.
OBJECTS = {
    "Mercury":       {"type":"Planet", "orbit":"Sun", "size":"Small",  "air":"None",       "temp":"Hot"},
    "Venus":         {"type":"Planet", "orbit":"Sun", "size":"Small",  "air":"Thick",      "temp":"Hot"},
    "Earth":         {"type":"Planet", "orbit":"Sun", "size":"Medium", "air":"Thick",      "temp":"Mild"},
    "Mars":          {"type":"Planet", "orbit":"Sun", "size":"Small",  "air":"Trace",      "temp":"Cold"},
    "Jupiter":       {"type":"Planet", "orbit":"Sun", "size":"Giant",  "air":"Thick",      "temp":"Cold"},
    "Saturn":        {"type":"Planet", "orbit":"Sun", "size":"Giant",  "air":"Thick",      "temp":"Cold"},
    "Uranus":        {"type":"Planet", "orbit":"Sun", "size":"Giant",  "air":"Thick",      "temp":"Cold"},
    "Neptune":       {"type":"Planet", "orbit":"Sun", "size":"Giant",  "air":"Thick",      "temp":"Cold"},
    "Pluto":         {"type":"Dwarf planet", "orbit":"Sun", "size":"Small", "air":"Trace",  "temp":"Cold"},
    "Ceres":         {"type":"Dwarf planet", "orbit":"Sun", "size":"Tiny", "air":"None",   "temp":"Cold"},
    "Europa":        {"type":"Moon", "orbit":"Jupiter", "size":"Tiny", "air":"Trace",      "temp":"Cold"},
    "Titan":         {"type":"Moon", "orbit":"Saturn", "size":"Small",  "air":"Thick",     "temp":"Cold"},
    "Ganymede":      {"type":"Moon", "orbit":"Jupiter", "size":"Small", "air":"Trace",      "temp":"Cold"},
    "Io":            {"type":"Moon", "orbit":"Jupiter", "size":"Tiny", "air":"Trace",        "temp":"Hot"},
    "Enceladus":     {"type":"Moon", "orbit":"Saturn", "size":"Tiny", "air":"Trace",        "temp":"Cold"},
    "Earth's Moon":  {"type":"Moon", "orbit":"Earth", "size":"Tiny", "air":"None",          "temp":"Cold"},
    "Phobos":        {"type":"Moon", "orbit":"Mars", "size":"Tiny", "air":"None",           "temp":"Cold"},
    "Callisto":      {"type":"Moon", "orbit":"Jupiter", "size":"Small", "air":"Trace",      "temp":"Cold"},
    "Halley's Comet":{"type":"Comet", "orbit":"Sun", "size":"Tiny", "air":"None",           "temp":"Cold"},
    "Bennu":         {"type":"Asteroid", "orbit":"Sun", "size":"Tiny", "air":"None",        "temp":"Cold"},
    "Vesta":         {"type":"Asteroid", "orbit":"Sun", "size":"Tiny", "air":"None",        "temp":"Cold"},
}
# Approximate MEAN diameters in km (not equatorial diameters); rounded for game readability.
# Some small, irregular bodies have convention-dependent equivalent diameters.
# This sixth clue distinguishes objects that share broad categorical traits.
DIAMETERS_KM = {
    "Mercury": 4879, "Venus": 12104, "Earth": 12742, "Mars": 6779,
    "Jupiter": 139820, "Saturn": 116460, "Uranus": 50724, "Neptune": 49244,
    "Pluto": 2377, "Ceres": 940, "Europa": 3122, "Titan": 5150,
    "Ganymede": 5268, "Io": 3643, "Enceladus": 504,
    "Earth's Moon": 3475, "Phobos": 22, "Callisto": 4821,
    "Halley's Comet": 11, "Bennu": 0.49, "Vesta": 525,
}
for _name, _diameter in DIAMETERS_KM.items():
    OBJECTS[_name]["diameter"] = _diameter
assert set(DIAMETERS_KM) == set(OBJECTS)
assert len(set(DIAMETERS_KM.values())) == len(OBJECTS)

# General astronomy notes are educational, not target-specific hints.
LEARNING_NOTES = [
    'The Moon spins once in the time it takes to orbit Earth. That is why we usually see the same side.',
    'Crater walls can keep sunlight off the ground all year. Water ice can survive in those shaded spots, even on Mercury.',
    'Some moons have oceans beneath their ice. Spacecraft measurements can reveal water that cameras cannot see.',
    'A planet can stretch a moon as it orbits. Repeated stretching warms the moon from the inside.',
    'Small asteroids often have lumpy shapes. Their gravity is too weak to pull the rock into a round ball.',
    'Pluto and its moon Charon both turn the same face toward each other as they orbit.',
    'Water ice breaks into chunks that can orbit a planet in a ring. From far away, the separate pieces look like one band.',
    'The Moon keeps many old craters because it has almost no atmosphere and no rain to wear them away.',
    'Sunlight takes about eight minutes to reach Earth. We see the Sun as it was about eight minutes ago.',
    'Radio signals travel at the speed of light. A spacecraft far from Earth can take hours to receive a command.',
    'A spacecraft can pass close to a moving planet to change its speed or direction and save fuel.',
    'As a comet warms near the Sun, gas and dust escape. Sunlight and the solar wind push its tails generally away from the Sun.',
    'The bits of dust left by a comet can cause a meteor shower when Earth crosses its trail.',
    'Some spacecraft cameras record colors our eyes cannot see. Scientists give those colors visible shades to show details.',
    'A planet can spin backward. On Venus, the Sun would rise in the west and set in the east.',
]

def _shuffled_notes():
    notes = list(LEARNING_NOTES)
    secrets.SystemRandom().shuffle(notes)
    return notes

def round_fact(game):
    notes = game.get("learning_notes")
    if notes is None:
        notes = game["learning_notes"] = _shuffled_notes()
    index = game.get("learning_index", 0)
    if index >= len(notes):
        notes = _shuffled_notes()
        game["learning_notes"] = notes
        index = 0
    game["learning_index"] = index + 1
    return notes[index]

WIN_FACTS = {
 "Mercury": "Mercury has an unusually large iron-rich core.",
 "Venus": "Venus spins in the opposite direction to most planets.",
 "Earth": "Earth is the only world known to host life.",
 "Mars": "Mars has the giant volcano Olympus Mons.",
 "Jupiter": "Jupiter's Great Red Spot is a vast, long-lived storm.",
 "Saturn": "Saturn's bright rings consist mostly of icy particles.",
 "Uranus": "Uranus rotates with its axis tipped nearly onto its side.",
 "Neptune": "Neptune was predicted mathematically before its discovery by telescope.",
 "Pluto": "Pluto has a prominent heart-shaped region called Tombaugh Regio.",
 "Ceres": "Ceres has bright salt deposits in Occator crater.",
 "Europa": "Europa may hide a global salty ocean beneath its icy crust.",
 "Titan": "Titan has lakes and seas made of liquid methane and ethane, chemicals that are gases on Earth at room temperature.",
 "Ganymede": "Ganymede is the Solar System's largest moon.",
 "Io": "Io is the most volcanically active world known.",
 "Enceladus": "Enceladus sends plumes of water-rich material into space.",
 "Earth's Moon": "The Moon slowly recedes from Earth by about 3.8 cm per year.",
 "Phobos": "Phobos is gradually spiraling inward toward Mars.",
 "Callisto": "Callisto has a heavily cratered ancient surface.",
 "Halley's Comet": "Dust left by Halley's Comet produces two meteor showers each year.",
 "Bennu": "Samples from Bennu were delivered to Earth in 2023.",
 "Vesta": "Vesta has an enormous impact basin near its south pole.",
}
assert set(WIN_FACTS) == set(OBJECTS)

FIELDS = [("type","TYPE"), ("orbit","ORBITS"), ("size","SIZE"), ("air","AIR"), ("temp","TEMP"), ("diameter","DIAMETER") ]
ORDER = ["Tiny", "Small", "Medium", "Giant"]
TEMP_ORDER = ["Cold", "Mild", "Hot"]

def new_game(daily=True):
    names = sorted(OBJECTS)
    if daily:
        seed = date.today().isoformat()
        index = int(hashlib.sha256(seed.encode()).hexdigest(), 16) % len(names)
        target = names[index]
    else:
        # Each practice round picks a fresh object independently of the daily puzzle.
        target = secrets.choice(names)
    return {"target": target, "guesses": [], "over": False, "won": False,
            "hints": 0, "daily": daily, "learning_notes": _shuffled_notes(), "learning_index": 0}

def closeness(field, guess_value, target_value):
    if guess_value == target_value:
        return "correct"
    if field == "diameter":
        return "close" if abs(guess_value-target_value) / max(guess_value,target_value) <= 0.15 else "wrong"
    if field == "size":
        order = ORDER
    elif field == "temp":
        order = TEMP_ORDER
    else:
        order = []
    if order and guess_value in order and target_value in order:
        if abs(order.index(guess_value) - order.index(target_value)) == 1:
            return "close"
    return "wrong"

def direction(field, guess_value, target_value):
    """Direction always describes the change needed to reach the answer."""
    if field == "diameter":
        diff = target_value - guess_value
        return {"direction": "up" if diff > 0 else "down" if diff < 0 else "equal",
                "hint": "Bigger" if diff > 0 else "Smaller" if diff < 0 else "Correct"}
    order = ORDER if field == "size" else TEMP_ORDER if field == "temp" else None
    if order and guess_value in order and target_value in order:
        diff = order.index(target_value) - order.index(guess_value)
        if diff:
            return {"direction": "up" if diff > 0 else "down",
                    "hint": ("Bigger" if diff > 0 else "Smaller") if field == "size" else ("Warmer" if diff > 0 else "Colder")}
    return {"direction": "equal" if guess_value == target_value else "none",
            "hint": "Correct" if guess_value == target_value else "Different"}

def submit_guess(game, guess):
    if not game:
        game = new_game()
    name = " ".join(str(guess).strip().split())
    match = next((x for x in OBJECTS if x.lower() == name.lower()), None)
    if not match:
        return {"ok": False, "error": "Choose an object from the list."}
    if game["over"]:
        return {"ok": False, "error": "This round is already finished."}
    if match in game["guesses"]:
        return {"ok": False, "error": "You already tried that object."}

    target = OBJECTS[game["target"]]
    candidate = OBJECTS[match]
    feedback = {key: closeness(key, candidate[key], target[key]) for key, _ in FIELDS}
    game["guesses"].append(match)
    won = match == game["target"]
    game["won"] = won
    game["over"] = won or len(game["guesses"]) >= 6
    row = {"name": match, "feedback": feedback,
           "values": {key: (f"{candidate[key]:,} km" if key == "diameter" else candidate[key]) for key, _ in FIELDS},
           "directions": {key: direction(key, candidate[key], target[key]) for key, _ in FIELDS}}
    response = {"ok": True, "row": row, "attempts": len(game["guesses"]),
                "over": game["over"], "won": won,
                "fun_fact": WIN_FACTS[game["target"]] if game["over"] else round_fact(game)}
    if game["over"]:
        response["answer"] = game["target"]
    response["game"] = game
    return response

def get_hint(game):
    if not game:
        game = new_game()
    if game["over"]:
        return {"ok": False, "message": "The round is over.", "game": game}
    if game["hints"] >= 3:
        return {"ok": False, "message": "No hints remaining.", "game": game}
    game["hints"] += 1
    return {"ok": True, "message": "Astronomy insight: " + round_fact(game),
            "remaining": 3-game["hints"], "game": game}
