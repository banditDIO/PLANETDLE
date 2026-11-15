# PLANETDLE

A compact, Wordle-inspired Solar System guessing game built with **Python + Flask**, with JavaScript for gameplay and CSS for the interface.

## Run it (Windows)

1. Install Python 3.10 or newer.
2. Open a terminal in this folder.
3. Create and activate a virtual environment (recommended):

   ```powershell
   py -m venv .venv
   .venv\Scripts\activate
   ```

4. Install dependencies:

   ```powershell
   py -m pip install -r requirements.txt
   ```

5. Start the app:

   ```powershell
   py app.py
   ```

6. Open http://127.0.0.1:5000 in your browser.

## How to play

- Guess a Solar System object from the suggestion list.
- You have six attempts.
- Each row compares five properties: type, what it orbits, size, atmosphere, and temperature category.
- Green means a match, yellow means close, and grey means different.
- Use up to three hints.

## Project structure

```text
planetdle/
├── app.py
├── game_logic.py
├── requirements.txt
├── README.md
├── templates/
│   └── index.html
└── static/
    ├── game.js
    └── style.css
```

## Before presenting or deploying

This is a hackathon prototype. For a public deployment, set a strong `SECRET_KEY`, turn off Flask debug mode, and use a production WSGI server. The object-property categories are simplified for gameplay and should be reviewed before presenting them as scientific data.


## Windows quick start (important)
Double-click `START_PLANETDLE.bat` inside the `planetdle` folder. It installs Flask if necessary and launches the local web address. Keep the black terminal window open while playing. Do **not** open `templates/index.html` directly: API calls will fail. If port 5000 is in use, close the other app using that port before starting.

Orbital paths have been spaced farther apart; outer planets may initially be offscreen. Pan and zoom to explore them.
