# 🚀 BigQuery Release Notes Dashboard & X-Share

A premium, responsive, dark-mode web application built with **Python Flask** and **Vanilla HTML, CSS, and JavaScript**. The app parses official Google Cloud BigQuery Release Notes, structures the feed by splitting nested items, and provides advanced search, category filtering, and an interactive Tweet composer.

---

## 🌟 Key Features

*   **Smart Feed Parsing:** Automatically fetches the Google Cloud BigQuery RSS feed and parses nested items (splitting daily updates by `<h3>` tags) into individual, filterable cards.
*   **Performance Cache:** Implements a 5-minute memory cache on the backend to avoid hitting Google's endpoints repeatedly, with a manual refresh override.
*   **Search & Filtering:** Fast client-side search indexing across dates, tags, and content, alongside type-specific filter badges (Features, Announcements, Issues, Deprecations, General).
*   **Interactive Tweet Composer:**
    *   Generates share-ready posts instantly from selected release notes.
    *   Offers 3 preset styles: **Tech 🚀**, **Bullets 📝**, and **Minimal 💡**.
    *   Includes a live character counter (X limit: 280) and a sleek radial progress ring indicator.
    *   Supports direct sharing via X Web Intent and simulated local posts.
*   **Premium Aesthetics:** Modern dark-theme UI with responsive layouts, neon accent states, and custom transitions.

---

## 📂 Project Structure

```text
bigquery-release-notes/
├── app.py                  # Flask backend (caching, feed fetcher, XML/HTML splitting parser)
├── requirements.txt        # Python dependency specifications
├── .gitignore              # Git ignore configuration
├── README.md               # Project documentation
├── templates/
│   └── index.html          # Main HTML structure
└── static/
    ├── css/
    │   └── style.css       # Custom dark UI styling, animations, and typography layout
    └── js/
        └── app.js          # App state, text cleaners, filters, and sharing triggers
```

---

## 🛠️ Setup and Installation

### 1. Prerequisites
Ensure you have **Python 3.10+** installed on your system.

### 2. Clone and Install Dependencies
Navigate into your project folder and set up a virtual environment:

```powershell
# Create a virtual environment
python -m venv venv

# Activate the virtual environment
# Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# Windows (cmd):
.\venv\Scripts\activate.bat
# macOS/Linux:
source venv/bin/activate

# Install required packages
pip install -r requirements.txt
```

### 3. Run the Development Server
Start the Flask application:

```bash
python app.py
```
The application will run on **[http://127.0.0.1:5000](http://127.0.0.1:5000)**.

---

## 📝 Licence
This project is open-source and available under the MIT License.
