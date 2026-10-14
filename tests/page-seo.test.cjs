const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function createSEO() {
  const tags = [];
  const document = {
    title: '',
    head: { appendChild(node) { node.parentNode = document.head; tags.push(node); } },
    querySelector(selector) {
      const match = selector.match(/^(meta|link)\[(property|name|rel)="([^"]+)"\]$/);
      return match ? tags.find((tag) => tag.tagName === match[1] && tag[match[2]] === match[3]) || null : null;
    },
    getElementById(id) { return tags.find((tag) => tag.id === id) || null; },
    createElement(tagName) {
      return { tagName, setAttribute(name, value) { this[name] = value; }, remove() { const i = tags.indexOf(this); if (i >= 0) tags.splice(i, 1); } };
    }
  };
  const context = {
    document,
    URL,
    window: { location: { origin: 'http://localhost:4173' } },
    blogPosts: [], blogSlug: (post) => post.slug,
    console
  };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../scripts/site-routes.js'), 'utf8'), context);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../scripts/page-seo.js'), 'utf8'), context);
  return { seo: context.PageSEO, document, tags };
}

test('SEO metadata uses production URLs and synchronizes social fields', () => {
  const { seo, document } = createSEO();
  seo.update('Başlık', 'Açıklama', 'blog/yazi');
  const meta = (name, key = 'property') => document.querySelector(`meta[${key}="${name}"]`).content;
  assert.equal(document.querySelector('link[rel="canonical"]').href, 'https://www.probiyom.com/blog/yazi/');
  assert.equal(meta('og:url'), 'https://www.probiyom.com/blog/yazi/');
  assert.equal(meta('twitter:title', 'name'), 'Başlık | Probiyom');
  assert.equal(meta('twitter:description', 'name'), 'Açıklama');
  assert.equal(meta('twitter:url', 'name'), meta('og:url'));
  assert.equal(meta('twitter:image', 'name'), meta('og:image'));
});

test('blog schema uses its image, article metadata, and only supplied valid dates', () => {
  const { seo, document, tags } = createSEO();
  seo.update('Yazı', 'Açıklama', 'blog/yazi');
  seo.update('Bulunamadı', 'Yok', 'missing');
  const robots = document.querySelector('meta[name="robots"]');
  robots.content = 'noindex, nofollow';
  seo.update('Ana sayfa', 'Açıklama', 'home');
  assert.match(robots.content, /^index, follow/);
  seo.blogPost({ title: 'Yazı', text: '<p>İçerik</p>', imageDir: 'images/blogs/yazi.webp', datePublished: '2025-05-12' }, 'yazi');
  assert.equal(document.querySelector('meta[rel="canonical"]'), null);
  const schema = JSON.parse(tags.find((tag) => tag.id === 'dynamic-schema').text);
  assert.equal(schema.image, 'https://www.probiyom.com/images/blogs/yazi.webp');
  assert.equal(schema.datePublished, '2025-05-12');
  assert.equal('dateModified' in schema, false);
  assert.equal(document.querySelector('meta[property="og:type"]').content, 'article');
  assert.equal(document.querySelector('meta[property="og:image"]').content, schema.image);
  assert.equal(document.querySelector('meta[name="twitter:image"]').content, schema.image);
  seo.update('Ana sayfa', 'Açıklama', 'home');
  assert.equal(document.querySelector('meta[property="og:type"]').content, 'website');
  assert.equal(document.querySelector('meta[property="og:image"]').content, 'https://www.probiyom.com/images/homepage_sliders/hp_1.webp');
});
