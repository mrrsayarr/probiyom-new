const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const helpersSource = fs.readFileSync(path.join(__dirname, '../scripts/helpers.js'), 'utf8');
const faqSource = fs.readFileSync(path.join(__dirname, '../scripts/faq.js'), 'utf8');

function createFaqContext() {
  const resizeListeners = new Set();
  const window = {
    addEventListener(type, listener) {
      if (type === 'resize') resizeListeners.add(listener);
    },
    removeEventListener(type, listener) {
      if (type === 'resize') resizeListeners.delete(listener);
    }
  };
  const context = { window, console };
  vm.createContext(context);
  vm.runInContext(helpersSource, context);
  vm.runInContext(faqSource, context);
  return { context, resizeListeners };
}

function createContainer() {
  return {
    innerHTML: '',
    refreshCount: 0,
    querySelectorAll(selector) {
      if (selector === '.faq-item.is-open .faq-answer') this.refreshCount += 1;
      return [];
    }
  };
}

test('FAQ destroy removes its resize listener before another mount', () => {
  const app = createFaqContext();
  const firstContainer = createContainer();
  const firstMount = app.context.FaqList(firstContainer, [{ question: 'Soru', answer: 'Yanıt' }]);

  assert.equal(app.resizeListeners.size, 1);
  firstMount.destroy();
  firstMount.destroy();
  assert.equal(app.resizeListeners.size, 0, 'destroy is safe to call more than once');

  const secondContainer = createContainer();
  const secondMount = app.context.FaqList(secondContainer, [{ question: 'Soru', answer: 'Yanıt' }]);
  assert.equal(app.resizeListeners.size, 1, 'remount keeps exactly one active listener');
  for (const listener of app.resizeListeners) listener();
  assert.equal(firstContainer.refreshCount, 0, 'the disposed FAQ is no longer retained by resize');
  assert.equal(secondContainer.refreshCount, 1);

  secondMount.destroy();
  assert.equal(app.resizeListeners.size, 0);
});

test('empty FAQ state returns a safe no-op disposer without adding listeners', () => {
  const app = createFaqContext();
  const container = createContainer();
  const mount = app.context.FaqList(container, []);

  assert.match(container.innerHTML, /Henüz soru eklenmedi/);
  assert.equal(app.resizeListeners.size, 0);
  assert.equal(typeof mount.destroy, 'function');
  mount.destroy();
  assert.equal(app.resizeListeners.size, 0);
});
