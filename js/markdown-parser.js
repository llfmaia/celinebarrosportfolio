/**
 * Parse YAML frontmatter and markdown content
 * Separates YAML frontmatter from markdown content
 */
function parseMarkdownFile(content) {
  const lines = content.split('\n');
  
  // Check if file starts with frontmatter
  if (lines[0] !== '---') {
    return { frontmatter: {}, content: content };
  }

  // Find closing frontmatter delimiter
  let endIndex = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i] === '---') {
      endIndex = i;
      break;
    }
  }

  if (endIndex === -1) {
    return { frontmatter: {}, content: content };
  }

  // Parse YAML frontmatter
  const frontmatterLines = lines.slice(1, endIndex);
  const frontmatter = {};

  frontmatterLines.forEach(line => {
    const colonIndex = line.indexOf(':');
    if (colonIndex > -1) {
      const key = line.substring(0, colonIndex).trim();
      const value = line.substring(colonIndex + 1).trim();
      
      // Handle arrays (tags)
      if (value.includes(',')) {
        frontmatter[key] = value.split(',').map(v => v.trim());
      } else {
        frontmatter[key] = value;
      }
    }
  });

  // Get markdown content
  const markdownContent = lines.slice(endIndex + 1).join('\n').trim();

  return { frontmatter, content: markdownContent };
}

/**
 * Simple markdown to HTML converter
 * Supports: headings, paragraphs, lists, bold, italic, links, images, code blocks
 */
function markdownToHtml(markdown) {
  let html = markdown;

  // Code blocks (```...```) - process first to protect content
  html = html.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');

  // Inline code (`...`)
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Images with image: ID format - ![alt](image:id)
  // This will look up the image from localStorage
  html = html.replace(/!\[([^\]]*)\]\(image:([^)]+)\)/g, (match, alt, imageId) => {
    try {
      const images = JSON.parse(localStorage.getItem('blog-draft-images') || '{}');
      if (images[imageId] && images[imageId].data) {
        // Image found in localStorage, use the base64 data
        return `<img src="${images[imageId].data}" alt="${alt}" style="max-width: 100%; height: auto; border-radius: 4px; margin: 1rem 0;">`;
      }
    } catch (e) {
      console.warn('Could not load image from localStorage:', imageId);
    }
    // Fallback: show placeholder if image not found
    return `<img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect fill='%23e0e0e0' width='400' height='300'/%3E%3Ctext x='50%25' y='50%25' font-size='20' fill='%23999' text-anchor='middle' dy='.3em'%3EImage not found: ${imageId}%3C/text%3E%3C/svg%3E" alt="${alt}" style="max-width: 100%; height: auto; border-radius: 4px; margin: 1rem 0;">`;
  });

  // Regular images with file paths - ![alt](path/to/image.jpg)
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" style="max-width: 100%; height: auto; border-radius: 4px; margin: 1rem 0;">');

  // Bold (**text**)
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

  // Italic (*text*)
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');

  // Strikethrough (~~text~~)
  html = html.replace(/~~([^~]+)~~/g, '<del>$1</del>');

  // Links [text](url)
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');

  // Headings
  html = html.replace(/^### (.*?)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.*?)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.*?)$/gm, '<h1>$1</h1>');

  // Horizontal rule
  html = html.replace(/^---$/gm, '<hr>');

  // Blockquotes (> quote)
  html = html.replace(/^> (.*?)$/gm, '<blockquote>$1</blockquote>');

  // Tables
  const lines = html.split('\n');
  const out = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const next = lines[i + 1] || '';
    const isHeader = line.includes('|');
    const isDivider = /^\s*\|?\s*[:\-]+\s*(\|\s*[:\-]+\s*)+\|?\s*$/.test(next);

    if (isHeader && isDivider) {
      const headers = line.split('|').map(c => c.trim()).filter(Boolean);
      const rows = [];
      i += 2;
      while (i < lines.length && lines[i].includes('|')) {
        const cells = lines[i].split('|').map(c => c.trim()).filter(Boolean);
        rows.push(cells);
        i++;
      }
      i--;

      const thead = '<thead><tr>' + headers.map(h => `<th>${h}</th>`).join('') + '</tr></thead>';
      const tbody = '<tbody>' + rows.map(r => '<tr>' + r.map(c => `<td>${c}</td>`).join('') + '</tr>').join('') + '</tbody>';
      out.push('<table>' + thead + tbody + '</table>');
    } else {
      out.push(line);
    }
  }
  html = out.join('\n');

  // Unordered lists (- item)
  const listLines = html.split('\n');
  let inList = false;
  let inOrderedList = false;
  const processedLines = [];

  listLines.forEach((line, index) => {
    if (line.trim().startsWith('- ')) {
      if (inOrderedList) {
        processedLines.push('</ol>');
        inOrderedList = false;
      }
      if (!inList) {
        processedLines.push('<ul>');
        inList = true;
      }
      processedLines.push('<li>' + line.replace(/^- /, '') + '</li>');
    } else if (/^\d+\.\s+/.test(line.trim())) {
      if (inList) {
        processedLines.push('</ul>');
        inList = false;
      }
      if (!inOrderedList) {
        processedLines.push('<ol>');
        inOrderedList = true;
      }
      processedLines.push('<li>' + line.replace(/^\d+\.\s+/, '') + '</li>');
    } else {
      if (inList) {
        processedLines.push('</ul>');
        inList = false;
      }
      if (inOrderedList) {
        processedLines.push('</ol>');
        inOrderedList = false;
      }
      processedLines.push(line);
    }
  });

  if (inList) {
    processedLines.push('</ul>');
  }
  if (inOrderedList) {
    processedLines.push('</ol>');
  }

  html = processedLines.join('\n');

  // Paragraphs (non-empty lines not already in tags)
  html = html.split('\n\n').map(para => {
    const trimmed = para.trim();
    if (trimmed && !['<h1', '<h2', '<h3', '<ul', '<ol', '<blockquote', '<pre', '<hr', '<img'].some(tag => trimmed.startsWith(tag))) {
      return '<p>' + trimmed + '</p>';
    }
    return trimmed;
  }).join('\n\n');

  return html;
}

/**
 * Generate a URL-friendly slug from a title
 */
function generateSlug(title) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

/**
 * Format date as YYYY-MM-DD
 */
function formatDate(date) {
  const d = new Date(date);
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return [d.getFullYear(), month, day].join('-');
}

/**
 * Parse date string and return formatted display date
 */
function displayDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}
