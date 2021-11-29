"use strict";

function createNode(text) {
  const node = document.getElementById('for-copy');

  node.textContent = text;
  return node;
}

function copyNode(node) {
  if ('clipboard' in navigator) {
    return navigator.clipboard.writeText(node.textContent || '');
  }

  const selection = getSelection();

  if (selection === null) {
    return Promise.reject(new Error());
  }

  selection.removeAllRanges();

  const range = document.createRange();

  range.selectNodeContents(node);
  selection.addRange(range);

  document.execCommand('copy');
  selection.removeAllRanges();
  return Promise.resolve();
}

// eslint-disable-next-line no-unused-vars
function copyText(text) {
  if ('clipboard' in navigator) {
    return navigator.clipboard.writeText(text);
  }

  const { body } = document;

  if (!body) {
    return Promise.reject(new Error());
  }

  const node = createNode(text);

  body.appendChild(node);
  copyNode(node);
  body.removeChild(node);
  return Promise.resolve();
}
