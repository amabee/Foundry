import {
  categories,
  languageNames,
  readState,
  writeState,
  filterEntries,
  safeUrl,
} from "./model.js";
const $ = (s) => document.querySelector(s),
  $$ = (s) => [...document.querySelectorAll(s)];
const copyIcon =
  '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="8" width="12" height="12" rx="1"/><path d="M16 8V4H4v12h4"/></svg>';
let state = readState(location.search),
  data = null,
  toastTimer;
function esc(s) {
  return String(s ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
}
function notify(message) {
  clearTimeout(toastTimer);
  $("#toast").textContent = message;
  $("#toast").hidden = false;
  toastTimer = setTimeout(() => ($("#toast").hidden = true), 6500);
}
async function copy(value, button, input) {
  try {
    if (!navigator.clipboard?.writeText) throw Error("Clipboard unavailable");
    button.disabled = true;
    await navigator.clipboard.writeText(value);
    notify("Copied. Paste the link into Vestra’s Extensions page.");
  } catch {
    if (input) {
      input.focus();
      input.select();
    }
    notify("Clipboard unavailable. Select and copy the URL manually.");
  } finally {
    button.disabled = false;
  }
}
function syncControls() {
  $("#search").value = state.q;
  $("#language").value = state.lang;
  $("#sort").value = state.sort;
  $("#adult").checked = state.adult;
  $("#experimental").checked = state.experimental;
  $$("[data-tab]").forEach((a) => {
    if (a.dataset.tab === state.tab) a.setAttribute("aria-current", "page");
    else a.removeAttribute("aria-current");
  });
}
function change(patch, replace = false) {
  state = { ...state, ...patch };
  history[replace ? "replaceState" : "pushState"]({}, "", writeState(state));
  render();
}
function logo(e) {
  return (
    '<span class="source-logo">' +
    (e.icon
      ? '<img src="' +
        esc(e.icon) +
        '" alt="" loading="lazy" width="48" height="48">'
      : "<span>" + esc(e.name.slice(0, 2)) + "</span>") +
    "</span>"
  );
}
function preview(s) {
  return s.length > 86 ? s.slice(0, 83).replace(/\s+\S*$/, "") + "…" : s;
}
function card(e) {
  const kind = categories[e.category] || "Plugin";
  return (
    '<article class="extension-card"><div class="card-heading">' +
    logo(e) +
    '<div><h3><button class="title-button" data-details="' +
    esc(e.id) +
    '">' +
    esc(e.name.replace(/ · /g, " / ")) +
    '</button></h3><p class="author">' +
    esc(e.author || "Foundry contributors") +
    '</p></div><span class="version">v' +
    esc(e.version) +
    '</span></div><p class="description">' +
    esc(preview(e.description)) +
    '</p><div class="tags"><span>' +
    esc(kind) +
    "</span><span>" +
    esc(languageNames[e.lang] || e.lang || "Multilingual") +
    "</span>" +
    (e.status === "experimental"
      ? '<span class="experimental">Experimental</span>'
      : "") +
    '</div><div class="card-actions"><button data-copy="' +
    esc(e.id) +
    '" aria-label="Copy install link for ' +
    esc(e.name) +
    '">' +
    copyIcon +
    '<span>Copy install link</span></button><button data-details="' +
    esc(e.id) +
    '" aria-label="Details for ' +
    esc(e.name) +
    '">Details</button></div></article>'
  );
}
function render() {
  if (!data) return;
  syncControls();
  const entries = data.entries;
  $("#extension-count").textContent = entries.filter(
    (e) => e.group === "extensions",
  ).length;
  $("#plugin-count").textContent = entries.filter(
    (e) => e.group === "plugins",
  ).length;
  $("#categories").innerHTML = Object.entries(categories)
    .map(
      ([key, label]) =>
        '<button type="button" class="category" data-category="' +
        key +
        '" aria-pressed="' +
        (state.category === key) +
        '"><span>' +
        esc(label) +
        "</span><span>" +
        filterEntries(entries, { ...state, q: "", category: key }).length +
        "</span></button>",
    )
    .join("");
  $(".filters").hidden = state.tab === "plugins";
  const rows = filterEntries(entries, state);
  const total = entries.filter((e) => e.group === state.tab).length;
  $("#results-title").textContent =
    state.tab === "plugins"
      ? "Plugins"
      : state.q
        ? "Search results"
        : categories[state.category];
  $("#results-count").textContent =
    rows.length + " of " + total + " " + state.tab;
  $("#list").setAttribute("aria-busy", "false");
  $("#list").classList.toggle("is-empty", !rows.length);
  $("#list").innerHTML = rows.length
    ? rows.map(card).join("")
    : state.tab === "plugins"
      ? '<section class="empty"><svg class="empty-icon" viewBox="0 0 48 48" aria-hidden="true"><path d="M8 14h10v-3a6 6 0 0 1 12 0v3h10v10h-3a6 6 0 0 0 0 12h3v7H8V32h3a6 6 0 0 0 0-12H8z"/></svg><h3>More room to make it yours.</h3><p>No plugins are published in Foundry yet. This is where they’ll live when they’re ready.</p><a class="primary" href="https://github.com/amabee/Foundry/issues" target="_blank" rel="noopener noreferrer">Suggest a plugin</a></section>'
      : '<section class="empty"><h3>No matches this time.</h3><p>Try a different search, language, or category.</p><button class="primary" data-reset>Clear filters</button></section>';
  $$("#list img").forEach((img) =>
    img.addEventListener(
      "error",
      () => {
        img.replaceWith(
          Object.assign(document.createElement("span"), {
            textContent: img
              .closest("article")
              .querySelector("h3")
              .textContent.slice(0, 2),
          }),
        );
      },
      { once: true },
    ),
  );
  if (state.item) {
    const e = entries.find((e) => e.id === state.item);
    if (e && (!e.adult || state.adult)) showDetail(e);
    else {
      if (e?.adult) notify("Enable adult sources to view this extension.");
      closeDetail();
    }
  } else if ($("#detail").open) $("#detail").close();
}
function showDetail(e) {
  const manifest = safeUrl(e.manifestURI),
    source = safeUrl(e.website);
  $("#detail-content").innerHTML =
    '<div class="dialog-body"><div class="detail-name">' +
    logo(e) +
    '<div><h2 id="detail-title">' +
    esc(e.name) +
    "</h2><p>" +
    esc(languageNames[e.lang] || e.lang) +
    " / v" +
    esc(e.version) +
    "</p></div></div><p>" +
    esc(e.description) +
    "</p>" +
    (e.status === "experimental"
      ? '<div class="source-warning"><strong>Experimental source</strong><p>' +
        esc(
          e.reason ||
            "Upstream availability has limitations. Check the source before relying on it.",
        ) +
        "</p></div>"
      : "") +
    '<dl class="detail-facts"><div><dt>Author</dt><dd>' +
    esc(e.author) +
    "</dd></div><div><dt>Category</dt><dd>" +
    esc(categories[e.category] || "Plugin") +
    "</dd></div><div><dt>SDK</dt><dd>" +
    esc(e.sdkVersion || "See manifest") +
    '</dd></div></dl><details class="permissions"><summary>Permissions & host access</summary><p>Vestra asks you to review these before installation.</p><ul>' +
    [...e.permissions, ...e.hosts]
      .map((p) => "<li>" + esc(p) + "</li>")
      .join("") +
    '</ul></details><label for="manifest-url">Install link</label><input class="manifest-input" id="manifest-url" readonly value="' +
    esc(manifest || "Unavailable") +
    '"><button class="primary" id="detail-copy" ' +
    (!manifest ? "disabled" : "") +
    ">Copy install link " +
    copyIcon +
    '</button><p class="dialog-note">In Vestra, open Extensions → Add extension. Paste this link, then review and install.</p>' +
    (source
      ? '<a class="source-link" href="' +
        esc(source) +
        '" target="_blank" rel="noopener noreferrer">View source on GitHub</a>'
      : "") +
    "</div>";
  $("#detail-copy").addEventListener("click", (ev) =>
    copy(manifest, ev.currentTarget, $("#manifest-url")),
  );
  if (!$("#detail").open) $("#detail").showModal();
}
function closeDetail() {
  if (state.item) {
    state.item = "";
    history.replaceState({}, "", writeState(state));
  }
  if ($("#detail").open) $("#detail").close();
}
async function load() {
  $("#catalogue-error").hidden = true;
  $("#list").hidden = false;
  $("#list").setAttribute("aria-busy", "true");
  try {
    const response = await fetch("./catalogue.json");
    if (!response.ok) throw Error("Catalogue unavailable");
    const next = await response.json();
    if (!Array.isArray(next.entries) || !safeUrl(next.registryUrl))
      throw Error("Invalid catalogue");
    data = next;
    $("#language").innerHTML =
      '<option value="all">All languages</option>' +
      [...new Set(data.entries.map((e) => e.lang).filter(Boolean))]
        .sort()
        .map(
          (l) =>
            '<option value="' +
            esc(l) +
            '">' +
            esc(languageNames[l] || l) +
            "</option>",
        )
        .join("");
    render();
  } catch {
    data = null;
    $("#list").hidden = true;
    $("#catalogue-error").hidden = false;
  }
}
$("#search-form").addEventListener("submit", (ev) => ev.preventDefault());
$("#search").addEventListener("input", (ev) =>
  change({ q: ev.target.value, item: "" }, true),
);
$("#sort").addEventListener("change", (ev) =>
  change({ sort: ev.target.value }),
);
$("#language").addEventListener("change", (ev) =>
  change({ lang: ev.target.value }),
);
$("#adult").addEventListener("change", (ev) =>
  change({ adult: ev.target.checked, item: "" }),
);
$("#experimental").addEventListener("change", (ev) =>
  change({ experimental: ev.target.checked }),
);
function reset() {
  change({
    q: "",
    category: "all",
    lang: "all",
    experimental: true,
    adult: false,
    item: "",
  });
}
$("#reset").addEventListener("click", reset);
document.addEventListener("click", (ev) => {
  const b = ev.target.closest("button,a");
  if (!b) return;
  if (b.dataset.tab) {
    ev.preventDefault();
    change({ tab: b.dataset.tab, category: "all", q: "", item: "" });
  } else if (b.dataset.category) change({ category: b.dataset.category });
  else if (b.dataset.details) change({ item: b.dataset.details });
  else if (b.dataset.copy) {
    const e = data.entries.find((e) => e.id === b.dataset.copy);
    change({ item: e.id });
    void copy(safeUrl(e.manifestURI), b, $("#manifest-url"));
  } else if (b.hasAttribute("data-reset")) reset();
  else if (b.classList.contains("close")) {
    b.closest("dialog").close();
  }
});
$("#detail").addEventListener("close", closeDetail);
$("#detail").addEventListener("cancel", () => {
  state.item = "";
  history.replaceState({}, "", writeState(state));
});
for (const d of $$("dialog"))
  d.addEventListener("click", (ev) => {
    const r = d.getBoundingClientRect();
    if (
      ev.target === d &&
      (ev.clientX < r.left ||
        ev.clientX > r.right ||
        ev.clientY < r.top ||
        ev.clientY > r.bottom)
    )
      d.close();
  });
for (const id of ["connect", "copy-registry", "help-copy"])
  $("#" + id).addEventListener("click", (ev) => {
    const input = $("#registry-url");
    void copy(input.value, ev.currentTarget, input);
  });
$("#help").addEventListener("click", () => $("#install-help").showModal());
$("#retry").addEventListener("click", load);
document.addEventListener("keydown", (ev) => {
  if (
    ev.key === "/" &&
    !ev.ctrlKey &&
    !ev.metaKey &&
    !ev.altKey &&
    !["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement.tagName) &&
    !$("dialog[open]")
  ) {
    ev.preventDefault();
    $("#search").focus();
  }
});
window.addEventListener("popstate", () => {
  state = readState(location.search);
  render();
});
load();
