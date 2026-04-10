# MapReduce Wordcount Web App

## Overview
This is a Flask-based web application demonstrating a simple MapReduce-style wordcount functionality. Users can input text via a web interface, process it (wordcount), and view results. It includes deployment configs for Render.

## Project Structure
```
.
├── app.py              # Main Flask application
├── requirements.txt    # Python dependencies
├── Procfile           # Heroku/Render process type
├── render.yaml        # Render deployment config
├── TODO.md            # Task list
├── templates/
│   └── index.html     # Main HTML template
└── static/
    ├── style.css      # Styles
    └── script.js      # Client-side JavaScript
```

## Local Setup & Run
1. Ensure Python 3.8+ is installed.
2. Install dependencies:
   ```
   pip install -r requirements.txt
   ```
3. Run the app:
   ```
   python app.py
   ```
4. Open https://mapreduce-wordcount.onrender.com/ in your browser.

## Features
- Web form for text input
- MapReduce-inspired wordcount processing (map: split words, reduce: count)
- Responsive UI with CSS/JS

## Deployment
- **Render**: Push to Git repo linked to Render; uses `render.yaml` and `Procfile`.
  - Build: `pip install -r requirements.txt`
  - Start: `gunicorn app:app`

## TODO
See [TODO.md](TODO.md) for ongoing tasks.

## License
MIT License.

