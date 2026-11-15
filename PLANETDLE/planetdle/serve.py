"""Run PLANETDLE with a threaded, single-process WSGI server."""
import os
from waitress import serve
from app import app

if __name__ == "__main__":
    serve(app, host=os.environ.get("PLANETDLE_HOST", "127.0.0.1"),
          port=int(os.environ.get("PORT", "5000")), threads=8)
