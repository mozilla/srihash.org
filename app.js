/* global copyText */

"use strict";

function getErrorText(url) {
  const printableURL = encodeURI(url);

  if (url.startsWith("http://") || url.startsWith("https://")) {
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
  document.getElementById("sri-snippet").innerText = "";
  document.getElementById("sri-error").innerText = "";
  if (document.getElementById("sri-copy")) {
    document.getElementById("sri-copy").remove();
  }
  document.getElementById("sri-snippet").classList.remove('is-active');
}

function digestName(hashAlgorithm) {
  switch (hashAlgorithm) {
    case "sha256": return "SHA-256";
    case "sha384": return "SHA-384";
    case "sha512": return "SHA-512";
    default: return "SHA-384";
  }
}

async function hashText(message, algorithm) {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const digest = await crypto.subtle.digest(digestName(algorithm), data);

  return digest;
}

function parseContentType(type) {
  if (!type) {
    return "script";
  }
  const fileType = type.split(";");

  const REGEX = /^text\/css$/;
  const isStylesheet = REGEX.test(fileType[0]);

  if (isStylesheet) {
    return 'style';
  }
  return 'script';
}

async function integrityMetadata(text, algorithm) {
  const hashBuffer = await hashText(text, algorithm); // Array Buffer
  const base64string = btoa(
    String.fromCharCode(...new Uint8Array(hashBuffer))
  );

  return `${algorithm}-${base64string}`;
}

function displayResult(resultDiv, url, contentType, integrity) {
  resultDiv.classList.add("is-active");
  if (contentType === "script") {
    const scriptEl = `<span style="color: #ffa07a">&lt;script src=</span><span style="color:#abe338">&quot;${encodeURI(
      url
    )}&quot;</span> <span style="color: #ffa07a">integrity=</span><span style="color:#abe338">&quot;${integrity}&quot;</span> <span style="color: #ffa07a">crossorigin=</span><span style="color:#abe338">&quot;anonymous&quot;</span><span style="color: #ffa07a">&gt;&lt;/script&gt;</span>`;

    resultDiv.innerHTML = scriptEl;
  } else {
    const linkEl = `<span style="color: #ffa07a">&lt;link rel=<span style="color:#abe338">"stylesheet"</span> href=</span><span style="color:#abe338">&quot;${encodeURI(
      url
    )}&quot;</span> <span style="color: #ffa07a">integrity=</span><span style="color:#abe338">&quot;${integrity}&quot;</span> <span style="color: #ffa07a">crossorigin=</span><span style="color:#abe338">&quot;anonymous&quot;</span><span style="color: #ffa07a">&gt;</span>`;

    resultDiv.innerHTML = linkEl;
  }
  const copyButton = `<button id="sri-copy">Copy</button>`;

  console.log("It's working");
  resultDiv.insertAdjacentHTML('afterend', copyButton);
  const sriCopy = document.getElementById("sri-copy");

  sriCopy.addEventListener("click", () => {
    copyText(resultDiv.innerText);
  });
}

async function formSubmit(event) {
  event.preventDefault();
  resetInterface();
  const inputEl = document.getElementById("url");
  const hashEl = document.getElementById("sriHash");
  const url = inputEl.value;
  const resultDiv = document.getElementById("sri-snippet");
  const errorDiv = document.getElementById("sri-error");

  console.info("Trying", url);
  try {
    const response = await fetch(url);

    console.info("Response", response);
    if (response.status === 200) {
      const type = response.headers.get("content-type");
      const contentType = parseContentType(type);
      const text = await response.text();
      const hashAlgorithm = hashEl.value;
      const integrity = await integrityMetadata(text, hashAlgorithm);

      displayResult(resultDiv, url, contentType, integrity);
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
  document.getElementById("sri-form").addEventListener("submit", formSubmit);
});
