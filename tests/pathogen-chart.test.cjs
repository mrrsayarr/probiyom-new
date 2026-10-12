const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const chartSource = fs.readFileSync(path.join(__dirname, '../scripts/pathogen-chart.js'), 'utf8');

class FakeNode {
  constructor(tagName) {
    this.tagName = tagName;
    this.attributes = {};
    this.children = [];
    this.listeners = {};
    this.style = {};
    this.textContent = '';
    this.className = '';
    this.parentNode = null;
    const classes = new Set();
    this.classList = {
      toggle(name, force) {
        if (force === undefined ? !classes.has(name) : force) classes.add(name);
        else classes.delete(name);
      },
      contains(name) { return classes.has(name); }
    };
  }
  set innerHTML(value) {
    this._innerHTML = value;
    if (this.tagName === 'button') {
      const swatch = new FakeNode('span');
      swatch.className = 'pathogen-chart__swatch';
      this.appendChild(swatch);
    }
  }
  get innerHTML() { return this._innerHTML || ''; }
  setAttribute(name, value) { this.attributes[name] = String(value); }
  getAttribute(name) { return this.attributes[name] || null; }
  appendChild(node) { node.parentNode = this; this.children.push(node); return node; }
  removeChild(node) { this.children.splice(this.children.indexOf(node), 1); node.parentNode = null; }
  addEventListener(type, listener) { (this.listeners[type] || (this.listeners[type] = [])).push(listener); }
  removeEventListener(type, listener) { this.listeners[type] = (this.listeners[type] || []).filter((fn) => fn !== listener); }
  emit(type, event = {}) { (this.listeners[type] || []).forEach((listener) => listener.call(this, event)); }
  querySelector(selector) { return this.children.find((node) => node.className === selector.slice(1)) || null; }
  matches(selector) { return selector === '[data-pathogen-chart]' && this.attributes['data-pathogen-chart'] !== undefined; }
  descendants() { return this.children.flatMap((node) => [node, ...node.descendants()]); }
}

function createChart() {
  const host = new FakeNode('div');
  host.setAttribute('data-pathogen-chart', '');
  const root = { querySelector() { return host; }, matches() { return false; } };
  const context = {
    document: {
      createElement(tag) { return new FakeNode(tag); },
      createElementNS(_namespace, tag) { return new FakeNode(tag); }
    }
  };
  vm.createContext(context);
  vm.runInContext(chartSource, context);
  return { host, root, context };
}

test('chart exposes keyboard focus points and updates the live explanation', () => {
  const app = createChart();
  const chart = app.context.initPathogenChart(app.root);
  const chartNode = app.host.children[0];
  const nodes = chartNode.descendants();
  const points = nodes.filter((node) => node.tagName === 'circle');
  const buttons = nodes.filter((node) => node.tagName === 'button');
  const detail = nodes.find((node) => node.className === 'pathogen-chart__detail');

  assert.equal(points.length, 12);
  assert.equal(points[0].attributes.tabindex, '0');
  assert.equal(points[0].attributes.role, 'button');
  buttons[1].emit('click');
  assert.equal(buttons[1].attributes['aria-pressed'], 'false');
  assert.equal(chartNode.descendants().find((node) => node.attributes['data-series'] === 'chemical').style.display, 'none');
  buttons[0].emit('click');
  assert.equal(buttons[1].attributes['aria-pressed'], 'true');
  points[3].emit('focus');
  assert.equal(points[3].attributes['aria-pressed'], 'true');
  assert.match(detail.textContent, /24\. Saat/);
  assert.match(detail.textContent, /Kritik seviye aşıldı/);
  points[4].emit('keydown', { key: 'Enter', preventDefault() {} });
  assert.equal(points[4].attributes['aria-pressed'], 'true');
  assert.match(detail.textContent, /48\. Saat/);
});

test('touch selection updates details and destroy removes the chart', () => {
  const app = createChart();
  const chart = app.context.initPathogenChart(app.root);
  const chartNode = app.host.children[0];
  const nodes = chartNode.descendants();
  const points = nodes.filter((node) => node.tagName === 'circle');
  const detail = nodes.find((node) => node.className === 'pathogen-chart__detail');
  points[11].emit('pointerup', { pointerType: 'touch' });
  assert.match(detail.textContent, /72\. Saat/);
  assert.match(detail.textContent, /kimyasal kalıntı/);
  chart.destroy();
  assert.equal(app.host.children.length, 0);
  assert.equal(points[11].listeners.click.length, 0);
});
