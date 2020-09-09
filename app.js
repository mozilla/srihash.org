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
  document.getElementById("sriSnippet").classList.remove('is-active');
}

function digestName(hashAlgorithm) {
  switch (hashAlgorithm) {
    case "sha256": return "SHA-256";
    case "sha384": return "SHA-384";
    case "sha512": return "SHA-512";
    default: throw new Error(`invalid hashing algorithm: ${hashAlgorithm}`);
  }
}

async function hashText(message, algorithm) {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const digest = await crypto.subtle.digest(digestName(algorithm), data);

  return digest;
}

async function formSubmit(event) {
  event.preventDefault();
  resetInterface();
  const inputEl = document.getElementById("url");
  const hashEl = document.getElementById("sriHash");
  const url = inputEl.value;
  const resultDiv = document.getElementById("sriSnippet");
  const errorDiv = document.getElementById("sriError");

  console.info("Trying", url);
  try {
    const response = await fetch(url);

    console.info("Response", response);
    if (response.status === 200) {
      const text = await response.text();
      const hashAlgorithm = hashEl.value;
      const hashBuffer = await hashText(text, hashAlgorithm); // Array Buffer
      const base64string = btoa(
        String.fromCharCode(...new Uint8Array(hashBuffer))
      );
      const integrityMetadata = `${hashAlgorithm}-${base64string}`;
      const scriptEl = `<span style="color: #ffa07a">&lt;script src=</span><span style="color:#abe338">&quot;${encodeURI(
        url
      )}&quot;</span> <span style="color: #ffa07a">integrity=</span><span style="color:#abe338">&quot;${integrityMetadata}&quot;</span> <span style="color: #ffa07a">crossorigin=</span><span style="color:#abe338">&quot;anonymous&quot;</span><span style="color: #ffa07a">&gt;&lt;/script&gt;</span>`;

      resultDiv.classList.add("is-active");
      resultDiv.innerHTML = scriptEl;
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
