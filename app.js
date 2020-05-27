"use strict";

function getErrorText(url) {
  return `
  Could not fetch from URL <a href="${encodeURI(url)}">${url}</a>.
  This issue could be one of the following:
  <ul>
    <li>The URL does not exist.
    <li>The URL does not support <a href="https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS">Cross-Origin Resource Sharing (CORS)</a>,
        when it should send a response header like <code>Access-Control-Allow-Origin: *</code>
  </ul>
  Please see your Browser Developer Tools for additional details.
`;
}

function resetInterface() {
  console.log(
    "Please ignore SRI warnings above this line, as they are part of the SRI support check (badge at the bottom of the page)."
  );
  document.getElementById("sriSnippet").innerText = "";
  document.getElementById("sriError").innerText = "";
}

async function hashText(message) {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hash384 = await crypto.subtle.digest("SHA-384", data);

  return hash384;
}

async function formSubmit(event) {
  event.preventDefault();
  resetInterface();
  const inputEl = document.getElementById("url");
  const url = inputEl.value;
  const resultDiv = document.getElementById("sriSnippet");
  const errorDiv = document.getElementById("sriError");

  console.log("Trying", url);
  try {
    const response = await fetch(url);

    console.log("Response", response);
    if (response.status === 200) {
      const text = await response.text();
      const hashBuffer = await hashText(text); // Array Buffer
      const base64string = btoa(
        String.fromCharCode(...new Uint8Array(hashBuffer))
      );
      const integrityMetadata = `sha384-${base64string}`;
      const scriptEl = `<script src="${encodeURI(
        url
      )}" integrity="${integrityMetadata}" crossorigin="anonymous></script>`;
      resultDiv.innerText = scriptEl;
    } else {
      console.log("Non-OK HTTP response status. Error:", e);
      errorDiv.innerHTML = getErrorText(url);
    }
  } catch (e) {
    console.log("Fetch Error: ", e);
    errorDiv.innerHTML = getErrorText(url);
  }
}

addEventListener("DOMContentLoaded", () => {
  document.getElementById("sriForm").addEventListener("submit", formSubmit);
});
