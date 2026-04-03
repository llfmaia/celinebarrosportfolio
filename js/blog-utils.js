/**
 * Blog utilities for fetching and managing posts
 * Static site: loads markdown from posts/ (see posts/manifest.json).
 */

/** Path prefix for site root (works on GitHub project pages and custom domains). */
function getSiteRoot() {
  const segments = window.location.pathname.split('/').filter(Boolean);
  if (segments.length && segments[segments.length - 1].includes('.')) {
    segments.pop();
  }
  return segments.length ? '/' + segments.join('/') + '/' : '/';
}

/** Turn root-relative URLs (/images/...) into correct paths for this deploy. */
function resolveSitePath(url) {
  if (!url || url.startsWith('http') || url.startsWith('data:') || url.startsWith('//')) {
    return url;
  }
  if (url.startsWith('/')) {
    const root = getSiteRoot();
    return root + url.slice(1).replace(/^\//, '');
  }
  return url;
}

/**
 * Fetch all published posts (from posts/manifest.json + posts/*.md)
 */
async function fetchPublishedPosts() {
  try {
    const manifestUrl = new URL('posts/manifest.json', window.location.href);
    const manifestRes = await fetch(manifestUrl);
    if (!manifestRes.ok) throw new Error('Failed to load posts manifest');
    const manifest = await manifestRes.json();
    const slugs = manifest.posts || [];
    const loaded = await Promise.all(slugs.map((slug) => fetchPostBySlug(slug)));
    return loaded.filter(Boolean);
  } catch (error) {
    console.error('Error fetching posts:', error);
    return [];
  }
}

/**
 * Fetch a single post by slug (posts/{slug}.md)
 */
async function fetchPostBySlug(slug) {
  try {
    const mdUrl = new URL(`posts/${slug}.md`, window.location.href);
    const response = await fetch(mdUrl);
    if (!response.ok) throw new Error('Post not found');
    const text = await response.text();
    const { frontmatter, content } = parseMarkdownFile(text);
    return { slug, frontmatter, content };
  } catch (error) {
    console.error('Error fetching post:', error);
    return null;
  }
}

/**
 * Sort posts by date (newest first)
 */
function sortPostsByDate(posts) {
  return [...posts].sort((a, b) => {
    const dateA = new Date(a.frontmatter.date);
    const dateB = new Date(b.frontmatter.date);
    return dateB - dateA;
  });
}

/**
 * Filter posts by tag
 */
function filterPostsByTag(posts, tag) {
  return posts.filter(post => {
    const tags = Array.isArray(post.frontmatter.tags)
      ? post.frontmatter.tags
      : post.frontmatter.tags?.split(',').map(t => t.trim()) || [];
    return tags.includes(tag);
  });
}

function renderAuthorSection() {
  const profileSrc = resolveSitePath('/images/profile.jpg');
  return `
    <section class="author-card" aria-label="About the author">
      <img src="${profileSrc}" alt="Celine Oliveira Barros" class="author-avatar" onerror="this.style.display='none'; this.nextElementSibling.style.display='grid';" />
      <div class="author-avatar-fallback" style="display:none;">CB</div>
      <div class="author-content">
        <p class="author-eyebrow">Written by</p>
        <h3 class="author-name">Celine Oliveira Barros</h3>
        <p class="author-bio">Student, creator, and storyteller sharing reflections on psychology, design, and intentional living.</p>
        <div class="author-socials">
          <a href="mailto:celine.barros22@gmail.com" class="author-social-link">Email</a>
          <a href="https://instagram.com/celine.urfav" target="_blank" rel="noopener" class="author-social-link">Instagram</a>
          <a href="./resume.html" class="author-social-link">Resume</a>
        </div>
        <p class="author-signature">Celine</p>
      </div>
    </section>
  `;
}

/**
 * Create HTML for post listing card
 */
function createPostCard(post) {
  const { slug, frontmatter } = post;
  const dateDisplay = displayDate(frontmatter.date);
  const tags = Array.isArray(frontmatter.tags)
    ? frontmatter.tags
    : frontmatter.tags?.split(',').map(t => t.trim()) || [];

  const tagsHtml = tags
    .map(tag => `<a href="./blog.html?tag=${encodeURIComponent(tag)}" class="tag">${tag}</a>`)
    .join('');

  const coverSrc = frontmatter.cover ? resolveSitePath(frontmatter.cover) : '';

  return `
    <article class="post-card">
      ${coverSrc ? `<img src="${coverSrc}" alt="${frontmatter.title} cover" class="post-card-cover" />` : ''}
      <div class="post-card-inner">
        <a href="./post.html?slug=${encodeURIComponent(slug)}" class="post-title-link">
          <h2 class="post-card-title">${frontmatter.title}</h2>
        </a>
        <p class="post-date">${dateDisplay}</p>
        <p class="post-description">${frontmatter.description}</p>
        ${tagsHtml ? `<div class="post-tags">${tagsHtml}</div>` : ''}
      </div>
    </article>
  `;
}

/**
 * Update page title and generate blog listing
 */
async function renderBlogListing() {
  const listingContainer = document.getElementById('posts-listing');
  if (!listingContainer) return;

  const posts = await fetchPublishedPosts();
  const sortedPosts = sortPostsByDate(posts);

  // Check for tag filter in URL
  const tagParam = new URLSearchParams(window.location.search).get('tag');

  let displayPosts = sortedPosts;
  if (tagParam) {
    displayPosts = filterPostsByTag(sortedPosts, tagParam);
    document.title = `Posts tagged "${tagParam}" - Celine Oliveira Barros`;
  }

  if (displayPosts.length === 0) {
    listingContainer.innerHTML = '<p class="no-posts">No posts found.</p>';
    return;
  }

  listingContainer.innerHTML = displayPosts
    .map(post => createPostCard(post))
    .join('');
}

/**
 * Render individual blog post page
 */
async function renderBlogPost() {
  const postContainer = document.getElementById('post-content');
  if (!postContainer) return;

  const params = new URLSearchParams(window.location.search);
  let slug = params.get('slug');
  if (!slug) {
    const last =
      window.location.pathname.split('/').filter(Boolean).pop() || '';
    slug = last.replace(/\.html$/i, '');
  }
  const post = await fetchPostBySlug(slug);

  if (!post) {
    postContainer.innerHTML = '<p>Post not found.</p>';
    return;
  }

  const { frontmatter, content } = post;
  const dateDisplay = displayDate(frontmatter.date);
  const tags = Array.isArray(frontmatter.tags)
    ? frontmatter.tags
    : frontmatter.tags?.split(',').map(t => t.trim()) || [];

  const tagsHtml = tags
    .map(tag => `<a href="./blog.html?tag=${encodeURIComponent(tag)}" class="tag">${tag}</a>`)
    .join('');

  const htmlContent = markdownToHtml(content);
  const coverSrc = frontmatter.cover ? resolveSitePath(frontmatter.cover) : '';

  postContainer.innerHTML = `
    <article class="blog-post">
      <header class="post-header">
        ${coverSrc ? `<img src="${coverSrc}" alt="${frontmatter.title} cover" class="post-cover">` : ''}
        <h1>${frontmatter.title}</h1>
        <time class="post-date">${dateDisplay}</time>
        ${tagsHtml ? `<div class="post-tags">${tagsHtml}</div>` : ''}
      </header>
      <div class="post-body">
        ${htmlContent}
      </div>
      ${renderAuthorSection()}
    </article>
  `;

  document.title = `${frontmatter.title} - Celine Oliveira Barros`;
}
