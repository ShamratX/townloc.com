/**
 * Townloc public CMS applicator (optional client assist).
 * Header/footer/menus/page copy are applied by the Worker — not here.
 * This file only applies branding (name, mark, logo, favicon).
 */
(function () {
  function setText(el, value) {
    if (!el || value == null || String(value).trim() === "") return;
    el.textContent = String(value);
  }

  function normalizeSiteAssetUrl(url) {
    var u = String(url || "").trim();
    if (!u) return "";
    if (/^(https?:)?\/\//i.test(u) || /^data:/i.test(u) || /^blob:/i.test(u)) {
      return u;
    }
    var qIndex = u.indexOf("?");
    var query = qIndex >= 0 ? u.slice(qIndex) : "";
    var path = qIndex >= 0 ? u.slice(0, qIndex) : u;
    path = path.replace(/\\/g, "/").replace(/^\.\//, "");
    while (path.indexOf("../") === 0) path = path.slice(3);
    if (path.charAt(0) !== "/") path = "/" + path;
    return path + query;
  }

  function setSrc(el, value) {
    if (!el || value == null || String(value).trim() === "") return;
    el.setAttribute("src", normalizeSiteAssetUrl(value));
  }

  function applyFavicon(url) {
    var href = normalizeSiteAssetUrl(url);
    if (!href) return;
    var links = document.querySelectorAll('link[rel="icon"], link[rel="shortcut icon"]');
    if (!links.length) {
      var link = document.createElement("link");
      link.rel = "icon";
      link.href = href;
      document.head.appendChild(link);
      return;
    }
    links.forEach(function (link) {
      link.href = href;
    });
  }

  function applyBranding(branding) {
    if (!branding) return;
    applyFavicon(branding.faviconUrl);

    var logo = branding.logoUrl && normalizeSiteAssetUrl(branding.logoUrl);
    if (logo) {
      document.querySelectorAll("img.site-logo").forEach(function (el) {
        setSrc(el, logo);
      });
    }

    document.querySelectorAll("[data-cms='brand.name']").forEach(function (el) {
      setText(el, branding.name);
    });
    document.querySelectorAll("[data-cms='brand.mark']").forEach(function (el) {
      if (logo) {
        el.textContent = "";
        el.style.backgroundImage =
          'url("' +
          String(logo).replace(/\\/g, "\\\\").replace(/"/g, '\\"') +
          '")';
        el.style.backgroundSize = "contain";
        el.style.backgroundRepeat = "no-repeat";
        el.style.backgroundPosition = "center";
      } else {
        setText(el, branding.mark);
        el.style.backgroundImage = "";
      }
    });

    if (branding.name) {
      document.querySelectorAll("#site-header nav > a > span:last-child").forEach(function (el) {
        if (!el.hasAttribute("data-cms")) setText(el, branding.name);
      });
    }
    if (branding.mark && !logo) {
      document.querySelectorAll("#site-header .header-mark").forEach(function (el) {
        if (!el.hasAttribute("data-cms")) setText(el, branding.mark);
      });
    }
  }

  function applyCms(cms) {
    if (!cms) return;
    applyBranding(cms.branding);
    // Page text/images: Worker serveAssetWithCms + autoPages only (no client overwrite)
  }

  function boot() {
    fetch("/api/cms", { credentials: "same-origin", cache: "no-store" })
      .then(function (res) {
        if (!res.ok) throw new Error("cms " + res.status);
        return res.json();
      })
      .then(function (data) {
        if (data && data.success && data.cms) applyCms(data.cms);
      })
      .catch(function () {
        /* keep static HTML defaults */
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
