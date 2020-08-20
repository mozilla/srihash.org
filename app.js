"use strict";

function getErrorText(url) {
  const printableURL = encodeURI(url);

  if (url.startsWith("http")) {
    return `
    Could not fetch from URL <em><a href="${printableURL}">${printableURL}</a></em>.<br>
    Your issue could be one of the following:
    <ul>
        <li>The URL does not exist.
        <li>The URL does not support <a href="https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS">Cross-Origin Resource Sharing (CORS)</a>,
            when it should send a response header like <code>Access-Control-Allow-Origin: *</code>
    </ul>
    Please see your <a href="https://developer.mozilla.org/en-US/docs/Tools">Browser Developer Tools</a> for additional details.
    `;
  }
  return `Could not fetch from <em>${printableURL}</em>, which doesn't look like a valid URL.`;
}

function resetInterface() {
  console.log(
    "Please ignore SRI warnings above this line, as they are part of the SRI support check (badge at the bottom of the page)."
  );
  document.getElementById("sriSnippet").innerText = "";
  document.getElementById("sriError").innerText = "";
  if (document.getElementById("sriCopy")) {
    document.getElementById("sriCopy").remove();
  }
}

async function hashText(message) {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hash384 = await crypto.subtle.digest("SHA-384", data);

  return hash384;
}

function createNode(text) {
  const node = document.createElement('pre');

  node.style.width = '1px';
  node.style.height = '1px';
  node.style.position = 'fixed';
  node.style.top = '5px';
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

async function formSubmit(event) {
  event.preventDefault();
  resetInterface();
  const inputEl = document.getElementById("url");
  const url = inputEl.value;
  const resultDiv = document.getElementById("sriSnippet");
  const errorDiv = document.getElementById("sriError");

  console.info("Trying", url);
  try {
    const response = await fetch(url);

    console.info("Response", response);
    if (response.status === 200) {
      const text = await response.text();
      const hashBuffer = await hashText(text); // Array Buffer
      const base64string = btoa(
        String.fromCharCode(...new Uint8Array(hashBuffer))
      );
      const integrityMetadata = `sha384-${base64string}`;
      const scriptEl = `<script src="${encodeURI(
        url
      )}" integrity="${integrityMetadata}" crossorigin="anonymous"></script>`;

      resultDiv.innerText = scriptEl;
      const copyButton = `<button id="sriCopy" data-clipboard-text='${scriptEl}'>Copy</button>`;

      resultDiv.insertAdjacentHTML('afterend', copyButton);
      const sriCopy = document.getElementById("sriCopy");

      sriCopy.addEventListener("click", () => {
        copyText(scriptEl);
      });
    } else {
      console.error("Non-OK HTTP response status. Error.");
      errorDiv.innerHTML = getErrorText(url);
    }
  } catch (e) {
    console.error("Fetch Error: ", e);
    errorDiv.innerHTML = getErrorText(url);
  }
}

addEventListener("DOMContentLoaded", () => {
  document.getElementById("sriForm").addEventListener("submit", formSubmit);
});
