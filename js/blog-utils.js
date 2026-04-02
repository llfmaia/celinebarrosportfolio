/**
 * Blog utilities for fetching and managing posts
 */

/**
 * Fetch all published posts
 */
async function fetchPublishedPosts() {
  try {
    const response = await fetch('/api/posts');
    if (!response.ok) throw new Error('Failed to fetch posts');
    return await response.json();
  } catch (error) {
    console.error('Error fetching posts:', error);
    return [];
  }
}

/**
 * Fetch a single post by slug
 */
async function fetchPostBySlug(slug) {
  try {
    const response = await fetch(`/api/post/${slug}`);
    if (!response.ok) throw new Error('Post not found');
    return await response.json();
  } catch (error) {
    console.error('Error fetching post:', error);
    return null;
  }
}

/**
 * Sort posts by date (newest first)
 */
function sortPostsByDate(posts) {
  return posts.sort((a, b) => {
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
  return `
    <section class="author-card" aria-label="About the author">
      <img src="/images/profile.jpg" alt="Celine Oliveira Barros" class="author-avatar" onerror="this.style.display='none'; this.nextElementSibling.style.display='grid';" />
      <div class="author-avatar-fallback" style="display:none;">CB</div>
      <div class="author-content">
        <p class="author-eyebrow">Written by</p>
        <h3 class="author-name">Celine Oliveira Barros</h3>
        <p class="author-bio">Student, creator, and storyteller sharing reflections on psychology, design, and intentional living.</p>
        <div class="author-socials">
          <a href="mailto:celine.barros22@gmail.com" class="author-social-link">Email</a>
          <a href="https://instagram.com/celine.urfav" target="_blank" rel="noopener" class="author-social-link">Instagram</a>
          <a href="/resume.html" class="author-social-link">Resume</a>
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
    .map(tag => `<a href="/blog.html?tag=${encodeURIComponent(tag)}" class="tag">${tag}</a>`)
    .join('');

  return `
    <article class="post-card">
      ${frontmatter.cover ? `<img src="${frontmatter.cover}" alt="${frontmatter.title} cover" class="post-card-cover" />` : ''}
      <a href="/blog/${slug}.html" class="post-title-link">
        <h2 class="post-card-title">${frontmatter.title}</h2>
      </a>
      <p class="post-date">${dateDisplay}</p>
      <p class="post-description">${frontmatter.description}</p>
      ${tagsHtml ? `<div class="post-tags">${tagsHtml}</div>` : ''}
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

  const slug = window.location.pathname.split('/').pop().replace('.html', '');
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
    .map(tag => `<a href="/blog.html?tag=${encodeURIComponent(tag)}" class="tag">${tag}</a>`)
    .join('');

  const htmlContent = markdownToHtml(content);

  postContainer.innerHTML = `
    <article class="blog-post">
      <header class="post-header">
        ${frontmatter.cover ? `<img src="${frontmatter.cover}" alt="${frontmatter.title} cover" class="post-cover">` : ''}
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
