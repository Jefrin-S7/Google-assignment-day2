import os
import re
import datetime
import xml.etree.ElementTree as ET
import requests
from flask import Flask, jsonify, render_template, request

app = Flask(__name__)

# Cache configuration
FEED_URL = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml"
cache = {
    "data": None,
    "last_fetched": None
}
CACHE_DURATION = datetime.timedelta(minutes=5)

def fetch_and_parse_feed():
    """Fetches the RSS feed and parses it into structured JSON."""
    try:
        response = requests.get(FEED_URL, timeout=10)
        response.raise_for_status()
        xml_data = response.text
    except Exception as e:
        print(f"Error fetching feed: {e}")
        return None

    try:
        # Register the Atom namespace
        ns = {'atom': 'http://www.w3.org/2005/Atom'}
        root = ET.fromstring(xml_data)
        
        parsed_entries = []
        
        for entry in root.findall('atom:entry', ns):
            title_elem = entry.find('atom:title', ns)
            date_str = title_elem.text if title_elem is not None else 'Unknown Date'
            
            updated_elem = entry.find('atom:updated', ns)
            iso_date = updated_elem.text if updated_elem is not None else ''
            # Format iso_date to YYYY-MM-DD
            if iso_date:
                iso_date = iso_date.split('T')[0]
                
            # Find the link
            link = ''
            for link_tag in entry.findall('atom:link', ns):
                if link_tag.attrib.get('rel') == 'alternate' or not link_tag.attrib.get('rel'):
                    link = link_tag.attrib.get('href', '')
                    break
            
            # Find the content
            content_elem = entry.find('atom:content', ns)
            content_html = content_elem.text if content_elem is not None else ''
            
            # Parse individual items within the content
            # The content is HTML and typically split by <h3> tags
            items = []
            if '<h3>' in content_html:
                parts = content_html.split('<h3>')
                for part in parts:
                    part = part.strip()
                    if not part:
                        continue
                    
                    subparts = part.split('</h3>', 1)
                    if len(subparts) == 2:
                        item_type = subparts[0].strip()
                        item_content = subparts[1].strip()
                        items.append({
                            'type': item_type,
                            'content': item_content
                        })
                    else:
                        items.append({
                            'type': 'General',
                            'content': part
                        })
            else:
                items.append({
                    'type': 'General',
                    'content': content_html.strip()
                })
                
            # Add each item as a separate flat entry for cleaner frontend rendering
            for idx, item in enumerate(items):
                # Clean up multiple spaces and empty paragraphs in the content
                clean_content = item['content']
                # Create a unique ID for each sub-item
                item_id = f"{iso_date}-{idx}"
                
                parsed_entries.append({
                    'id': item_id,
                    'date': date_str,
                    'iso_date': iso_date,
                    'link': link,
                    'type': item['type'],
                    'content': clean_content
                })
                
        return parsed_entries
    except Exception as e:
        print(f"Error parsing XML: {e}")
        return None

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/notes')
def get_notes():
    force_refresh = request.args.get('refresh', 'false').lower() == 'true'
    now = datetime.datetime.now()
    
    # Check if cache is valid
    if not force_refresh and cache['data'] and cache['last_fetched'] and (now - cache['last_fetched'] < CACHE_DURATION):
        return jsonify({
            'source': 'cache',
            'last_fetched': cache['last_fetched'].isoformat(),
            'notes': cache['data']
        })
        
    # Fetch and update cache
    notes = fetch_and_parse_feed()
    if notes is not None:
        cache['data'] = notes
        cache['last_fetched'] = now
        return jsonify({
            'source': 'live',
            'last_fetched': now.isoformat(),
            'notes': notes
        })
    else:
        # If fetch fails, fallback to cache if available
        if cache['data']:
            return jsonify({
                'source': 'cache_fallback',
                'last_fetched': cache['last_fetched'].isoformat(),
                'notes': cache['data'],
                'warning': 'Failed to fetch live feed. Using stale cached data.'
            }), 200
        else:
            return jsonify({
                'error': 'Failed to fetch release notes and no cached data is available.'
            }), 500

if __name__ == '__main__':
    app.run(debug=True, host='127.0.0.1', port=5000)
