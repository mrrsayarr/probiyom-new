const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const helpersSource = fs.readFileSync(path.join(__dirname, '../scripts/helpers.js'), 'utf8');
const blogSource = fs.readFileSync(path.join(__dirname, '../scripts/blog.js'), 'utf8');

function createListContext() {
  const cardListeners = {};
  const card = {
    addEventListener(type, listener) { cardListeners[type] = listener; },
    getAttribute(name) { return name === 'data-slug' ? 'a-hostile-slug' : '0'; }
  };
  const container = {
    innerHTML: '',
    querySelectorAll(selector) { return selector === '.blog-post' ? [card] : []; },
    querySelector() { return null; }
  };
  const navigations = [];
  const context = {
    window: { Router: { getRouteHref(route) { return '/' + route; }, navigate(route) { navigations.push(route); } } },
    document: {},
    console
  };
  vm.createContext(context);
  vm.runInContext(helpersSource, context);
  vm.runInContext(blogSource, context);
  return { context, container, cardListeners, navigations };
}

test('blog read-more controls are links and card navigation respects interaction intent', () => {
  const app = createListContext();
  const hostileSlug = 'bad" onclick="alert(1)';
  app.context.BlogList(app.container, [{
    title: 'Yazı "özel"',
    slug: hostileSlug,
    text: 'Açıklama'
  }]);

  assert.match(app.container.innerHTML, /<a href="\/blog\/bad&quot; onclick=&quot;alert\(1\)"/);
  assert.match(app.container.innerHTML, /data-slug="bad&quot; onclick=&quot;alert\(1\)"/);
  assert.match(app.container.innerHTML, /Devamını Oku/);

  app.cardListeners.click.call({ getAttribute: () => 'a-hostile-slug' }, {
    button: 0,
    target: { closest: () => ({}) },
    defaultPrevented: false
  });
  assert.deepEqual(app.navigations, []);

  app.cardListeners.click.call({ getAttribute: () => 'a-hostile-slug' }, {
    button: 0,
    target: { closest: () => null },
    defaultPrevented: false
  });
  assert.deepEqual(app.navigations, ['blog/a-hostile-slug']);
});

function createDetailContext() {
  const documentListeners = {};
  const overlays = [];
  const triggerListeners = {};
  const detailImage = {
    style: {},
    attributes: {},
    focused: 0,
    setAttribute(name, value) { this.attributes[name] = value; },
    addEventListener(type, listener) { triggerListeners[type] = listener; },
    focus() { this.focused += 1; },
    click() { triggerListeners.click.call(this, {}); }
  };
  const body = {
    style: { overflow: 'auto' },
    appendChild(node) { node.parentNode = body; overlays.push(node); },
    removeChild(node) { overlays.splice(overlays.indexOf(node), 1); node.parentNode = null; }
  };
  const document = {
    body,
    addEventListener(type, listener) { documentListeners[type] = listener; },
    removeEventListener(type, listener) { if (documentListeners[type] === listener) delete documentListeners[type]; },
    createElement(tag) {
      return {
        tagName: tag,
        style: {},
        attributes: {},
        children: [],
        listeners: {},
        classList: { add() {}, remove() {} },
        setAttribute(name, value) { this.attributes[name] = value; },
        addEventListener(type, listener) { this.listeners[type] = listener; },
        appendChild(child) { child.parentNode = this; this.children.push(child); },
        focus() { this.focused = true; }
      };
    }
  };
  const container = {
    innerHTML: '',
    querySelector(selector) { return selector === '.blog-detail-image img' ? detailImage : null; },
    querySelectorAll() { return []; }
  };
  const context = {
    window: { Router: null },
    document,
    requestAnimationFrame(callback) { callback(); },
    setTimeout(callback) { callback(); return 1; },
    clearTimeout() {},
    console
  };
  vm.createContext(context);
  vm.runInContext(helpersSource, context);
  vm.runInContext(blogSource, context);
  return { context, container, detailImage, triggerListeners, documentListeners, overlays, body };
}

test('blog lightbox is a dialog, closes on Escape, and restores focus', () => {
  const app = createDetailContext();
  app.context.BlogList(app.container, [{
    title: 'Yazı',
    slug: 'yazi',
    text: 'İçerik',
    imageDir: 'images/blog.webp'
  }], 'yazi');

  assert.equal(app.detailImage.attributes.role, 'button');
  let keyboardDefaultPrevented = false;
  app.triggerListeners.keydown({ key: 'Enter', preventDefault() { keyboardDefaultPrevented = true; } });
  assert.equal(keyboardDefaultPrevented, true);
  assert.equal(app.overlays.length, 1, 'Enter should open the image dialog');
  assert.equal(app.overlays[0].children[0].focused, true);
  assert.equal(app.overlays[0].children[0].attributes['aria-label'], 'Görseli kapat');
  let tabDefaultPrevented = false;
  app.documentListeners.keydown({ key: 'Tab', preventDefault() { tabDefaultPrevented = true; } });
  assert.equal(tabDefaultPrevented, true);
  assert.equal(app.overlays[0].children[0].focused, true, 'Tab remains on the dialog close control');
  assert.equal(app.container.innerHTML.length > 0, true);

  app.documentListeners.keydown({ key: 'Escape' });
  assert.equal(app.overlays.length, 0);
  assert.equal(app.detailImage.focused, 1);
  assert.equal(app.detailImage.parentNode, undefined);
  assert.equal(app.body.style.overflow, 'auto');
});

test('lightbox blocks duplicate openings and closes on Escape with focus restored', () => {
  const app = createDetailContext();
  app.context.BlogList(app.container, [{
    title: 'Yazı', slug: 'yazi', text: 'İçerik', imageDir: 'images/blog.webp'
  }], 'yazi');
  app.triggerListeners.click.call(app.detailImage, {});
  assert.equal(app.overlays.length, 1);
  const dialog = app.overlays[0];
  assert.equal(dialog.attributes.role, 'dialog');
  assert.equal(dialog.attributes['aria-modal'], 'true');
  assert.equal(dialog.children[0].tagName, 'button');
  assert.equal(dialog.children[0].attributes['aria-label'], 'Görseli kapat');

  app.triggerListeners.click.call(app.detailImage, {});
  assert.equal(app.overlays.length, 1, 'opening twice must not duplicate the overlay');
  assert.equal(app.body.style.overflow, 'hidden');
  app.documentListeners.keydown({ key: 'Escape' });
  assert.equal(app.overlays.length, 0);
  assert.equal(app.detailImage.focused, 1);
  assert.equal(app.body.style.overflow, 'auto');
});

test('blog lightbox is removed immediately when route changes', () => {
  const app = createDetailContext();
  app.context.BlogList(app.container, [{ title: 'Yazı', slug: 'yazi', text: '', imageDir: 'images/blog.webp' }], 'yazi');
  app.triggerListeners.click.call(app.detailImage, {});
  assert.equal(app.overlays.length, 1);
  app.documentListeners.routechange();
  assert.equal(app.overlays.length, 0);
  assert.equal(app.detailImage.focused, 0, 'focus should not return to a trigger removed by navigation');
  assert.equal(app.body.style.overflow, 'auto');
});
