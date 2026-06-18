// Global App State
let appState = {
    notes: [],
    selectedNote: null,
    selectedTemplateStyle: 'tech', // tech, bullet, minimal
    activeTypeFilter: 'all',
    searchQuery: ''
};

// DOM Elements
const elements = {
    notesContainer: document.getElementById('notes-container'),
    loadingState: document.getElementById('loading-state'),
    emptyState: document.getElementById('empty-state'),
    refreshBtn: document.getElementById('refresh-btn'),
    refreshIcon: document.getElementById('refresh-icon'),
    searchInput: document.getElementById('search-input'),
    clearSearchBtn: document.getElementById('clear-search-btn'),
    filterTagsContainer: document.getElementById('filter-tags-container'),
    resetFiltersBtn: document.getElementById('reset-filters-btn'),
    
    // Stats elements
    totalNotesCount: document.getElementById('total-notes-count'),
    lastFetchedTime: document.getElementById('last-fetched-time'),
    feedStatusBadge: document.getElementById('feed-status-badge'),
    feedStatusText: document.getElementById('feed-status-text'),
    
    // Composer elements
    composerMetaPreview: document.getElementById('composer-meta-preview'),
    tweetTextarea: document.getElementById('tweet-textarea'),
    charCounter: document.getElementById('char-counter'),
    progressCircle: document.getElementById('progress-circle'),
    tweetBtn: document.getElementById('tweet-btn'),
    previewTweetBtn: document.getElementById('preview-tweet-btn'),
    templatesSection: document.getElementById('composer-templates-section'),
    composerToast: document.getElementById('composer-toast')
};

// Radial Progress Ring Constants
const CIRCLE_RADIUS = 14;
const CIRCLE_CIRCUMFERENCE = 2 * Math.PI * CIRCLE_RADIUS; // ~87.96

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    setupProgressRing();
    fetchNotes();
    setupEventListeners();
});

// Setup Initial State of Radial Circle
function setupProgressRing() {
    elements.progressCircle.style.strokeDasharray = `${CIRCLE_CIRCUMFERENCE} ${CIRCLE_CIRCUMFERENCE}`;
    elements.progressCircle.style.strokeDashoffset = CIRCLE_CIRCUMFERENCE;
}

// Fetch Release Notes from API
async function fetchNotes(refresh = false) {
    toggleLoading(true);
    updateFeedStatus('loading', 'Refreshing...');
    
    try {
        const url = `/api/notes${refresh ? '?refresh=true' : ''}`;
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        appState.notes = data.notes || [];
        
        // Update stats
        elements.totalNotesCount.textContent = appState.notes.length;
        
        // Update Last Checked Time
        if (data.last_fetched) {
            const date = new Date(data.last_fetched);
            elements.lastFetchedTime.textContent = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
        
        updateFeedStatus('live', data.source === 'cache' ? 'Cached' : 'Synced');
        renderNotes();
        
    } catch (error) {
        console.error('Failed to fetch release notes:', error);
        updateFeedStatus('error', 'Fetch Failed');
        elements.totalNotesCount.textContent = 'Error';
        elements.lastFetchedTime.textContent = '--:--';
        
        // Render current local state if any, otherwise empty
        renderNotes();
    } finally {
        toggleLoading(false);
    }
}

// Update the Feed Status Indicator
function updateFeedStatus(state, text) {
    elements.feedStatusBadge.className = `status-badge ${state}`;
    elements.feedStatusText.textContent = text;
}

// Show/Hide Loading Spinner
function toggleLoading(isLoading) {
    if (isLoading) {
        elements.loadingState.style.display = 'flex';
        elements.notesContainer.style.display = 'none';
        elements.emptyState.style.display = 'none';
        elements.refreshBtn.classList.add('spinning');
        elements.refreshBtn.disabled = true;
    } else {
        elements.loadingState.style.display = 'none';
        elements.notesContainer.style.display = 'block';
        elements.refreshBtn.classList.remove('spinning');
        elements.refreshBtn.disabled = false;
    }
}

// Clean HTML content into plain text for tweet text calculations
function cleanHtmlToText(html) {
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = html;
    
    // Convert code tags to markdown quotes
    const codeTags = tempDiv.getElementsByTagName("code");
    for (let i = 0; i < codeTags.length; i++) {
        const codeText = codeTags[i].textContent || codeTags[i].innerText;
        codeTags[i].textContent = `\`${codeText}\``;
    }
    
    let text = tempDiv.textContent || tempDiv.innerText || "";
    // Normalize spacing
    text = text.replace(/\s+/g, " ").trim();
    return text;
}

// Generate Tweet Content based on style templates
function generateTweetContent(note, templateStyle) {
    const cleanText = cleanHtmlToText(note.content);
    const link = note.link || "https://cloud.google.com/bigquery/docs/release-notes";
    
    // Adjust character budgets dynamically
    if (templateStyle === 'tech') {
        const prefix = `BigQuery Update 🚀: `;
        const suffix = `\n\nDetails: ${link}\n#BigQuery #GoogleCloud`;
        const maxDescLen = 280 - prefix.length - suffix.length;
        
        let desc = cleanText;
        if (desc.length > maxDescLen) {
            desc = desc.substring(0, maxDescLen - 4) + "...";
        }
        return `${prefix}${desc}${suffix}`;
        
    } else if (templateStyle === 'bullet') {
        const prefix = `New in BigQuery (${note.date}):\n• `;
        const suffix = `\n\nRead more: ${link}\n#DataWarehouse`;
        const maxDescLen = 280 - prefix.length - suffix.length;
        
        let desc = cleanText;
        if (desc.length > maxDescLen) {
            desc = desc.substring(0, maxDescLen - 4) + "...";
        }
        return `${prefix}${desc}${suffix}`;
        
    } else { // minimal
        const prefix = `BigQuery Release: `;
        const suffix = `\n\nLink: ${link}`;
        const maxDescLen = 280 - prefix.length - suffix.length;
        
        let desc = cleanText;
        if (desc.length > maxDescLen) {
            desc = desc.substring(0, maxDescLen - 4) + "...";
        }
        return `${prefix}${desc}${suffix}`;
    }
}

// Setup Event Listeners for UI interaction
function setupEventListeners() {
    // Refresh click
    elements.refreshBtn.addEventListener('click', () => {
        fetchNotes(true);
    });
    
    // Search input
    elements.searchInput.addEventListener('input', (e) => {
        appState.searchQuery = e.target.value.toLowerCase().trim();
        elements.clearSearchBtn.style.display = appState.searchQuery.length > 0 ? 'block' : 'none';
        renderNotes();
    });
    
    // Clear search
    elements.clearSearchBtn.addEventListener('click', () => {
        elements.searchInput.value = '';
        appState.searchQuery = '';
        elements.clearSearchBtn.style.display = 'none';
        renderNotes();
        elements.searchInput.focus();
    });
    
    // Filter tags
    elements.filterTagsContainer.addEventListener('click', (e) => {
        const targetTag = e.target.closest('.filter-tag');
        if (!targetTag) return;
        
        document.querySelectorAll('.filter-tag').forEach(tag => tag.classList.remove('active'));
        targetTag.classList.add('active');
        
        appState.activeTypeFilter = targetTag.dataset.type;
        renderNotes();
    });
    
    // Reset filters
    elements.resetFiltersBtn.addEventListener('click', resetFilters);
    elements.resetFiltersBtn.addEventListener('click', resetFilters);
    
    // Tweet composer input
    elements.tweetTextarea.addEventListener('input', (e) => {
        updateCharacterCounter(e.target.value.length);
    });
    
    // Template buttons
    document.querySelectorAll('.btn-template').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.btn-template').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            
            appState.selectedTemplateStyle = e.target.dataset.style;
            if (appState.selectedNote) {
                const draft = generateTweetContent(appState.selectedNote, appState.selectedTemplateStyle);
                elements.tweetTextarea.value = draft;
                updateCharacterCounter(draft.length);
            }
        });
    });
    
    // Action: Share on X Web Intent
    elements.tweetBtn.addEventListener('click', () => {
        const text = elements.tweetTextarea.value;
        const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
        window.open(twitterUrl, '_blank', 'noopener,noreferrer');
    });
    
    // Action: Mock post
    elements.previewTweetBtn.addEventListener('click', simulateMockPost);
}

// Reset filters to defaults
function resetFilters() {
    elements.searchInput.value = '';
    appState.searchQuery = '';
    elements.clearSearchBtn.style.display = 'none';
    
    document.querySelectorAll('.filter-tag').forEach(tag => tag.classList.remove('active'));
    document.querySelector('[data-type="all"]').classList.add('active');
    appState.activeTypeFilter = 'all';
    
    renderNotes();
}

// Update character counting circle and counter text
function updateCharacterCounter(len) {
    const charsRemaining = 280 - len;
    elements.charCounter.textContent = charsRemaining;
    
    // Calculate SVG progress ring offsets
    const percent = Math.min(len / 280, 1);
    const dashoffset = CIRCLE_CIRCUMFERENCE - (percent * CIRCLE_CIRCUMFERENCE);
    elements.progressCircle.style.strokeDashoffset = dashoffset;
    
    // Set color conditions
    elements.charCounter.className = 'char-counter';
    elements.progressCircle.style.stroke = '#1d9bf0'; // Brand default blue
    
    if (len > 280) {
        elements.charCounter.classList.add('error');
        elements.progressCircle.style.stroke = '#f43f5e'; // Warning red
        elements.tweetBtn.disabled = true;
        elements.previewTweetBtn.disabled = true;
    } else if (len >= 260) {
        elements.charCounter.classList.add('warning');
        elements.progressCircle.style.stroke = '#f59e0b'; // warning yellow/orange
        elements.tweetBtn.disabled = false;
        elements.previewTweetBtn.disabled = false;
    } else {
        elements.tweetBtn.disabled = len === 0;
        elements.previewTweetBtn.disabled = len === 0;
    }
}

// Select a release note and load it to composer
function selectNote(note, cardElement) {
    // Update active visual highlights in DOM
    document.querySelectorAll('.note-card').forEach(card => card.classList.remove('selected'));
    cardElement.classList.add('selected');
    
    appState.selectedNote = note;
    
    // Enable Composer UI elements
    elements.tweetTextarea.disabled = false;
    elements.templatesSection.style.display = 'flex';
    
    // Generate Draft
    const draftText = generateTweetContent(note, appState.selectedTemplateStyle);
    elements.tweetTextarea.value = draftText;
    updateCharacterCounter(draftText.length);
    
    // Update Composer Meta Preview info
    elements.composerMetaPreview.innerHTML = `
        <div class="meta-active">
            <div class="meta-title">
                <span>BigQuery Release Item</span>
                <span class="type-badge ${note.type.toLowerCase()}">${note.type}</span>
            </div>
            <div>Source Date: ${note.date}</div>
        </div>
    `;
    
    // Smooth scroll to composer on small screens
    if (window.innerWidth < 1024) {
        elements.tweetTextarea.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

// Render filtered release notes onto dashboard
function renderNotes() {
    const container = elements.notesContainer;
    container.innerHTML = '';
    
    // Apply filters
    const filtered = appState.notes.filter(note => {
        // Filter type
        const typeMatch = appState.activeTypeFilter === 'all' || 
                          note.type.toLowerCase() === appState.activeTypeFilter.toLowerCase();
                          
        // Search filter
        const searchMatch = !appState.searchQuery || 
                            note.content.toLowerCase().includes(appState.searchQuery) ||
                            note.type.toLowerCase().includes(appState.searchQuery) ||
                            note.date.toLowerCase().includes(appState.searchQuery);
                            
        return typeMatch && searchMatch;
    });
    
    if (filtered.length === 0) {
        elements.emptyState.style.display = 'flex';
        container.style.display = 'none';
        return;
    }
    
    elements.emptyState.style.display = 'none';
    container.style.display = 'block';
    
    filtered.forEach(note => {
        const card = document.createElement('article');
        card.className = `note-card ${appState.selectedNote && appState.selectedNote.id === note.id ? 'selected' : ''}`;
        card.setAttribute('data-id', note.id);
        
        // Parse date for visual layout
        const dateHtml = `<span class="card-date">${note.date}</span>`;
        const typeClass = note.type.toLowerCase();
        
        card.innerHTML = `
            <header class="note-card-header">
                <div class="badge-group">
                    <span class="type-badge ${typeClass}">${note.type}</span>
                    ${dateHtml}
                </div>
                <button class="btn-select-share" title="Select to Tweet">
                    <i class="fa-brands fa-x-twitter"></i>
                </button>
            </header>
            <section class="note-card-body">
                ${note.content}
            </section>
            <footer class="note-card-footer">
                <a href="${note.link}" target="_blank" rel="noopener noreferrer" class="feed-link" title="Open official notes page">
                    <span>Official Release Notes</span>
                    <i class="fa-solid fa-arrow-up-right-from-square"></i>
                </a>
                <div class="selection-indicator">
                    <i class="fa-solid fa-circle-check"></i>
                    <span>Selected</span>
                </div>
            </footer>
        `;
        
        // Add card selection actions
        const handleSelection = () => selectNote(note, card);
        card.addEventListener('click', handleSelection);
        
        // The quick select button
        const quickSelectBtn = card.querySelector('.btn-select-share');
        quickSelectBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Stop parent click trigger (redundant but clean)
            handleSelection();
        });
        
        container.appendChild(card);
    });
}

// Simulate posting mock tweet locally
function simulateMockPost() {
    const originalText = elements.previewTweetBtn.innerHTML;
    elements.previewTweetBtn.disabled = true;
    elements.tweetBtn.disabled = true;
    elements.tweetTextarea.disabled = true;
    elements.previewTweetBtn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> Posting...`;
    
    setTimeout(() => {
        elements.previewTweetBtn.disabled = false;
        elements.tweetBtn.disabled = false;
        elements.tweetTextarea.disabled = false;
        elements.previewTweetBtn.innerHTML = originalText;
        
        // Display toast animation
        elements.composerToast.classList.add('show');
        setTimeout(() => {
            elements.composerToast.classList.remove('show');
        }, 4000);
    }, 1500);
}
