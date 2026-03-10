/**
 * Reads articles from local markdown files in src/articles/posts/
 */

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const { marked } = require('marked');

module.exports = function() {
  const articlesDir = path.join(__dirname, '../articles/posts');
  
  // Return empty array if directory doesn't exist yet
  if (!fs.existsSync(articlesDir)) {
    console.log('[articles.js] No posts directory found - returning empty array');
    return [];
  }
  
  const files = fs.readdirSync(articlesDir).filter(f => f.endsWith('.md'));
  const now = new Date();
  
  const articles = files.map(filename => {
    const filePath = path.join(articlesDir, filename);
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const { data, content } = matter(fileContent);
    
    const slug = filename.replace('.md', '');
    
    return {
      title: data.title,
      slug: slug,
      excerpt: data.excerpt || data.meta_description || '',
      content: marked(content),
      publishedAt: data.date || new Date().toISOString(),
      image: data.image || null,
      author: data.author || 'Sites On Call',
      tags: data.tags || [],
      url: `/articles/${slug}/`
    };
  })
  // Filter out future-dated posts
  .filter(article => new Date(article.publishedAt) <= now);
  
  // Sort by date, newest first
  articles.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
  
  console.log(`[articles.js] Loaded ${articles.length} articles from local files`);
  return articles;
};
