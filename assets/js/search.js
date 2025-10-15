// ========================================
// Search Functionality
// ========================================

class SearchEngine {
  constructor() {
    this.searchData = [];
    this.searchInput = document.getElementById('search-input');
    this.searchBtn = document.getElementById('search-btn');
    this.searchResults = document.getElementById('search-results');
    this.initialized = false;
    
    this.init();
  }
  
  async init() {
    if (!this.searchInput || !this.searchResults) return;
    
    try {
      await this.loadSearchData();
      this.attachEventListeners();
      this.initialized = true;
      console.log('Search engine initialized successfully');
    } catch (error) {
      console.error('Failed to initialize search:', error);
    }
  }
  
  async loadSearchData() {
    try {
      const response = await fetch('/search.json');
      if (!response.ok) throw new Error('Failed to load search data');
      this.searchData = await response.json();
    } catch (error) {
      console.error('Error loading search data:', error);
      throw error;
    }
  }
  
  attachEventListeners() {
    // Search on button click
    if (this.searchBtn) {
      this.searchBtn.addEventListener('click', () => this.performSearch());
    }
    
    // Search on Enter key
    this.searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.performSearch();
      }
    });
    
    // Live search with debouncing
    let searchTimeout;
    this.searchInput.addEventListener('input', () => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => this.performSearch(), 300);
    });
    
    // Close search results when clicking outside
    document.addEventListener('click', (e) => {
      if (!this.searchInput.contains(e.target) && 
          !this.searchResults.contains(e.target) &&
          (!this.searchBtn || !this.searchBtn.contains(e.target))) {
        this.hideResults();
      }
    });
    
    // Handle URL parameters for tag search
    this.handleTagSearch();
  }
  
  performSearch() {
    const query = this.searchInput.value.trim().toLowerCase();
    
    if (query.length === 0) {
      this.hideResults();
      return;
    }
    
    if (query.length < 2) {
      this.showMessage('Please enter at least 2 characters');
      return;
    }
    
    const results = this.search(query);
    this.displayResults(results, query);
  }
  
  search(query) {
    const words = query.toLowerCase().split(/\s+/);
    
    return this.searchData
      .map(item => {
        let score = 0;
        const titleLower = item.title.toLowerCase();
        const contentLower = item.content.toLowerCase();
        const categoryLower = item.category.toLowerCase();
        const tagsLower = item.tags.map(tag => tag.toLowerCase());
        
        // Exact title match (highest score)
        if (titleLower === query) score += 100;
        
        // Title contains query
        if (titleLower.includes(query)) score += 50;
        
        // Category match
        if (categoryLower.includes(query)) score += 30;
        
        // Tag match
        tagsLower.forEach(tag => {
          if (tag.includes(query)) score += 40;
        });
        
        // Content match
        words.forEach(word => {
          if (word.length < 2) return;
          
          if (titleLower.includes(word)) score += 10;
          if (contentLower.includes(word)) score += 5;
          
          tagsLower.forEach(tag => {
            if (tag.includes(word)) score += 8;
          });
        });
        
        return { ...item, score };
      })
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score);
  }
  
  displayResults(results, query) {
    if (results.length === 0) {
      this.showMessage(`No results found for "${query}"`);
      return;
    }
    
    let html = `<div class="search-results-header">Found ${results.length} result${results.length !== 1 ? 's' : ''}</div>`;
    
    results.slice(0, 10).forEach(result => {
      const excerpt = this.getExcerpt(result.content, query);
      const highlightedTitle = this.highlightText(result.title, query);
      const highlightedExcerpt = this.highlightText(excerpt, query);
      
      html += `
        <div class="search-result-item">
          <h4><a href="${result.url}">${highlightedTitle}</a></h4>
          <p>${highlightedExcerpt}</p>
          <div class="search-result-meta">
            <span class="result-category">${this.formatCategory(result.category)}</span>
            <span class="separator">•</span>
            <span class="result-date">${result.date}</span>
            ${result.tags.length > 0 ? `
              <span class="separator">•</span>
              <span class="result-tags">${result.tags.slice(0, 3).map(tag => `<span class="mini-tag">${tag}</span>`).join(' ')}</span>
            ` : ''}
          </div>
        </div>
      `;
    });
    
    if (results.length > 10) {
      html += `<div class="search-results-footer">Showing top 10 of ${results.length} results</div>`;
    }
    
    this.searchResults.innerHTML = html;
    this.showResults();
  }
  
  getExcerpt(content, query, contextLength = 150) {
    const queryLower = query.toLowerCase();
    const contentLower = content.toLowerCase();
    
    // Try to find the query in the content
    let index = contentLower.indexOf(queryLower);
    
    // If not found, try first word
    if (index === -1) {
      const firstWord = query.split(/\s+/)[0];
      index = contentLower.indexOf(firstWord.toLowerCase());
    }
    
    // If still not found, just take from start
    if (index === -1) {
      return content.substring(0, contextLength) + '...';
    }
    
    // Calculate excerpt boundaries
    const start = Math.max(0, index - contextLength / 2);
    const end = Math.min(content.length, index + query.length + contextLength / 2);
    
    let excerpt = content.substring(start, end);
    
    if (start > 0) excerpt = '...' + excerpt;
    if (end < content.length) excerpt = excerpt + '...';
    
    return excerpt;
  }
  
  highlightText(text, query) {
    if (!text || !query) return text;
    
    const words = query.split(/\s+/).filter(w => w.length > 1);
    let result = text;
    
    words.forEach(word => {
      const regex = new RegExp(`(${this.escapeRegex(word)})`, 'gi');
      result = result.replace(regex, '<mark>$1</mark>');
    });
    
    return result;
  }
  
  escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
  
  formatCategory(category) {
    return category
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
  
  showMessage(message) {
    this.searchResults.innerHTML = `
      <div class="search-message">
        <p>${message}</p>
      </div>
    `;
    this.showResults();
  }
  
  showResults() {
    this.searchResults.classList.add('active');
  }
  
  hideResults() {
    this.searchResults.classList.remove('active');
  }
  
  handleTagSearch() {
    const urlParams = new URLSearchParams(window.location.search);
    const tag = urlParams.get('tag');
    
    if (tag) {
      this.searchInput.value = tag;
      this.performSearch();
    }
  }
}

// Initialize search when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new SearchEngine();
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SearchEngine;
}