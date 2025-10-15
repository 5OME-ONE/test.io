// ========================================
// Main JavaScript
// ========================================

document.addEventListener('DOMContentLoaded', function() {
  
  // Theme Toggle
  initThemeToggle();
  
  // Mobile Menu
  initMobileMenu();
  
  // Code Highlighting
  initCodeHighlighting();
  
  // Table of Contents
  initTableOfContents();
  
  // Copy Link Button
  initCopyLink();
  
  // Search Functionality
  initSearch();
  
  // Reading Progress Bar
  initReadingProgress();
  
  // Tag Filtering
  initTagFiltering();
  
});

// ========================================
// Theme Toggle
// ========================================

function initThemeToggle() {
  const themeToggle = document.getElementById('theme-toggle');
  const body = document.body;
  
  // Check for saved theme preference or default to 'dark'
  const currentTheme = localStorage.getItem('theme') || 'dark';
  body.classList.add(`theme-${currentTheme}`);
  
  if (themeToggle) {
    themeToggle.addEventListener('click', function() {
      if (body.classList.contains('theme-dark')) {
        body.classList.remove('theme-dark');
        body.classList.add('theme-light');
        localStorage.setItem('theme', 'light');
      } else {
        body.classList.remove('theme-light');
        body.classList.add('theme-dark');
        localStorage.setItem('theme', 'dark');
      }
      
      // Update Utterances theme if comments are present
      updateUtterancesTheme();
    });
  }
}

function updateUtterancesTheme() {
  const utterancesFrame = document.querySelector('.utterances-frame');
  if (utterancesFrame) {
    const theme = document.body.classList.contains('theme-dark') 
      ? 'github-dark' 
      : 'github-light';
    
    const message = {
      type: 'set-theme',
      theme: theme
    };
    utterancesFrame.contentWindow.postMessage(message, 'https://utteranc.es');
  }
}

// ========================================
// Mobile Menu
// ========================================

function initMobileMenu() {
  const menuToggle = document.querySelector('.mobile-menu-toggle');
  const navMenu = document.querySelector('.nav-menu');
  
  if (menuToggle && navMenu) {
    menuToggle.addEventListener('click', function() {
      navMenu.classList.toggle('active');
      
      // Animate hamburger icon
      const spans = menuToggle.querySelectorAll('span');
      spans.forEach(span => span.classList.toggle('active'));
    });
    
    // Close menu when clicking outside
    document.addEventListener('click', function(event) {
      if (!menuToggle.contains(event.target) && !navMenu.contains(event.target)) {
        navMenu.classList.remove('active');
      }
    });
  }
}

// ========================================
// Code Highlighting
// ========================================

function initCodeHighlighting() {
  if (typeof hljs !== 'undefined') {
    hljs.highlightAll();
    
    // Add copy button to code blocks
    document.querySelectorAll('pre code').forEach(function(codeBlock) {
      const pre = codeBlock.parentElement;
      const button = document.createElement('button');
      button.className = 'copy-code-btn';
      button.textContent = 'Copy';
      button.setAttribute('aria-label', 'Copy code to clipboard');
      
      pre.style.position = 'relative';
      pre.appendChild(button);
      
      button.addEventListener('click', function() {
        const code = codeBlock.textContent;
        navigator.clipboard.writeText(code).then(function() {
          button.textContent = 'Copied!';
          setTimeout(function() {
            button.textContent = 'Copy';
          }, 2000);
        });
      });
    });
  }
}

// ========================================
// Table of Contents
// ========================================

function initTableOfContents() {
  const toc = document.getElementById('toc');
  if (!toc) return;
  
  const postBody = document.querySelector('.post-body');
  if (!postBody) return;
  
  const headings = postBody.querySelectorAll('h2, h3, h4');
  if (headings.length === 0) return;
  
  let tocHTML = '<ul>';
  
  headings.forEach(function(heading, index) {
    const id = `heading-${index}`;
    heading.id = id;
    
    const level = parseInt(heading.tagName.substring(1));
    const indent = (level - 2) * 20;
    
    tocHTML += `
      <li style="margin-left: ${indent}px;">
        <a href="#${id}">${heading.textContent}</a>
      </li>
    `;
  });
  
  tocHTML += '</ul>';
  toc.innerHTML = tocHTML;
  
  // Highlight current section in TOC
  const tocLinks = toc.querySelectorAll('a');
  
  const observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        tocLinks.forEach(link => link.classList.remove('active'));
        const activeLink = toc.querySelector(`a[href="#${entry.target.id}"]`);
        if (activeLink) {
          activeLink.classList.add('active');
        }
      }
    });
  }, {
    rootMargin: '-100px 0px -80% 0px'
  });
  
  headings.forEach(heading => observer.observe(heading));
}

// ========================================
// Copy Link Button
// ========================================

function initCopyLink() {
  const copyLinkBtn = document.getElementById('copy-link');
  
  if (copyLinkBtn) {
    copyLinkBtn.addEventListener('click', function() {
      const url = window.location.href;
      
      navigator.clipboard.writeText(url).then(function() {
        const originalText = copyLinkBtn.innerHTML;
        copyLinkBtn.innerHTML = `
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          Copied!
        `;
        
        setTimeout(function() {
          copyLinkBtn.innerHTML = originalText;
        }, 2000);
      });
    });
  }
}

// ========================================
// Reading Progress Bar
// ========================================

function initReadingProgress() {
  const post = document.querySelector('.post-body');
  if (!post) return;
  
  const progressBar = document.createElement('div');
  progressBar.className = 'reading-progress';
  progressBar.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    height: 3px;
    background: linear-gradient(90deg, #2563eb, #7c3aed);
    z-index: 9999;
    transition: width 0.2s ease;
  `;
  
  document.body.appendChild(progressBar);
  
  window.addEventListener('scroll', function() {
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight - windowHeight;
    const scrolled = window.scrollY;
    const progress = (scrolled / documentHeight) * 100;
    
    progressBar.style.width = progress + '%';
  });
}

// ========================================
// Tag Filtering
// ========================================

function initTagFiltering() {
  const tags = document.querySelectorAll('.tag');
  
  tags.forEach(function(tag) {
    tag.addEventListener('click', function() {
      const tagName = this.getAttribute('data-tag') || this.textContent;
      // Redirect to search with tag
      window.location.href = `${window.location.origin}${window.location.pathname}?tag=${encodeURIComponent(tagName)}`;
    });
  });
}

// ========================================
// Search Functionality
// ========================================

function initSearch() {
  const searchInput = document.getElementById('search-input');
  const searchBtn = document.getElementById('search-btn');
  const searchResults = document.getElementById('search-results');
  
  if (!searchInput || !searchResults) return;
  
  let searchData = [];
  
  // Fetch search data
  fetch('/search.json')
    .then(response => response.json())
    .then(data => {
      searchData = data;
    })
    .catch(error => console.error('Error loading search data:', error));
  
  // Search on button click
  if (searchBtn) {
    searchBtn.addEventListener('click', performSearch);
  }
  
  // Search on Enter key
  searchInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      performSearch();
    }
  });
  
  // Live search as user types (debounced)
  let searchTimeout;
  searchInput.addEventListener('input', function() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(performSearch, 300);
  });
  
  function performSearch() {
    const query = searchInput.value.trim().toLowerCase();
    
    if (query.length === 0) {
      searchResults.innerHTML = '';
      searchResults.classList.remove('active');
      return;
    }
    
    const results = searchData.filter(function(item) {
      return item.title.toLowerCase().includes(query) ||
             item.content.toLowerCase().includes(query) ||
             item.category.toLowerCase().includes(query) ||
             item.tags.some(tag => tag.toLowerCase().includes(query));
    });
    
    displaySearchResults(results, query);
  }
  
  function displaySearchResults(results, query) {
    if (results.length === 0) {
      searchResults.innerHTML = '<div class="search-result-item"><p>No results found</p></div>';
      searchResults.classList.add('active');
      return;
    }
    
    let html = '';
    
    results.slice(0, 10).forEach(function(result) {
      const excerpt = getExcerpt(result.content, query);
      
      html += `
        <div class="search-result-item">
          <h4><a href="${result.url}">${highlightText(result.title, query)}</a></h4>
          <p>${highlightText(excerpt, query)}</p>
          <div class="search-result-meta">
            <span>${result.category}</span> • <span>${result.date}</span>
          </div>
        </div>
      `;
    });
    
    searchResults.innerHTML = html;
    searchResults.classList.add('active');
  }
  
  function getExcerpt(content, query) {
    const index = content.toLowerCase().indexOf(query.toLowerCase());
    const start = Math.max(0, index - 50);
    const end = Math.min(content.length, index + query.length + 50);
    
    let excerpt = content.substring(start, end);
    if (start > 0) excerpt = '...' + excerpt;
    if (end < content.length) excerpt = excerpt + '...';
    
    return excerpt;
  }
  
  function highlightText(text, query) {
    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }
  
  // Close search results when clicking outside
  document.addEventListener('click', function(event) {
    if (!searchInput.contains(event.target) && 
        !searchResults.contains(event.target) &&
        !searchBtn.contains(event.target)) {
      searchResults.classList.remove('active');
    }
  });
}

// ========================================
// Utility Functions
// ========================================

// Reading time calculator
String.prototype.reading_time = function() {
  const wordsPerMinute = 200;
  const text = this.replace(/<[^>]+>/g, '');
  const wordCount = text.split(/\s+/).length;
  const minutes = Math.ceil(wordCount / wordsPerMinute);
  return minutes;
};

// Smooth scroll to anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  });
});