/**
 * Auto-capture structured footer fields from site HTML class conventions.
 * Used when a new site reuses this master CMS — empty footer CMS values
 * are filled from index.html (or LAYOUT_SOURCE) on first Admin CMS load.
 */

function stripFooterText(html) {
  return String(html || "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function firstMatchInner(html, re) {
  const m = String(html || "").match(re);
  return m ? stripFooterText(m[1]) : "";
}

function allMatchInners(html, re) {
  const out = [];
  const src = String(html || "");
  let m;
  const r = new RegExp(re.source, re.flags.includes("g") ? re.flags : re.flags + "g");
  while ((m = r.exec(src))) out.push(stripFooterText(m[1]));
  return out;
}

/**
 * Capture logo + footer copy/contact from HTML using shared class names:
 * .footer-tagline, .footer-col-title, .footer-contact, .footer-guarantee-*,
 * .footer-bottom, .footer-cta, .site-logo / .site-logo-footer
 */
export function extractFooterFromHtml(html) {
  const raw = String(html || "");
  const footer = {};

  const tagline = firstMatchInner(
    raw,
    /<p\b[^>]*\bfooter-tagline\b[^>]*>([\s\S]*?)<\/p>/i
  );
  if (tagline) footer.tagline = tagline;

  const titles = allMatchInners(
    raw,
    /<p\b[^>]*\bfooter-col-title\b[^>]*>([\s\S]*?)<\/p>/i
  );
  if (titles[0]) footer.servicesTitle = titles[0];
  if (titles[1]) footer.contactTitle = titles[1];
  if (titles[2]) footer.companyTitle = titles[2];

  const contactBlock = raw.match(
    /<ul\b[^>]*\bfooter-contact\b[^>]*>([\s\S]*?)<\/ul>/i
  );
  if (contactBlock) {
    const labels = [];
    const liRe = /<li\b[^>]*>([\s\S]*?)<\/li>/gi;
    let li;
    while ((li = liRe.exec(contactBlock[1]))) {
      const span = li[1].match(/<span\b[^>]*>([\s\S]*?)<\/span>/i);
      const text = span ? stripFooterText(span[1]) : stripFooterText(li[1]);
      if (text) labels.push(text);
    }
    if (labels[0]) footer.contactEmail1 = labels[0];
    if (labels[1]) footer.contactEmail2 = labels[1];
    if (labels[2]) footer.contactPhone = labels[2];
    if (labels[3]) footer.contactWhatsapp = labels[3];
  }

  const gLabel = firstMatchInner(
    raw,
    /<p\b[^>]*\bfooter-guarantee-label\b[^>]*>([\s\S]*?)<\/p>/i
  );
  if (gLabel) footer.guaranteeLabel = gLabel;

  const gTextRaw = raw.match(
    /<p\b[^>]*\bfooter-guarantee-text\b[^>]*>([\s\S]*?)<\/p>/i
  );
  if (gTextRaw) {
    const gText = stripFooterText(
      String(gTextRaw[1]).replace(/<span\b[^>]*>\s*\|\s*<\/span>/gi, " | ")
    );
    if (gText) footer.guaranteeText = gText;
  }

  const bottom = raw.match(
    /<div\b[^>]*\bfooter-bottom\b[^>]*>([\s\S]*?)<\/div>/i
  );
  if (bottom) {
    const copyP = bottom[1].match(/<p\b[^>]*>([\s\S]*?)<\/p>/i);
    if (copyP) {
      let copy = stripFooterText(copyP[1]);
      copy = copy
        .replace(/^©\s*/u, "")
        .replace(/^\d{4}\s*/, "")
        .replace(/^year\s*/i, "")
        .trim();
      if (copy) footer.copyrightText = copy;
    }
    const cta = bottom[1].match(
      /<a\b[^>]*\bfooter-cta\b[^>]*>([\s\S]*?)<\/a>/i
    );
    if (cta) {
      const t = stripFooterText(cta[1]);
      if (t) footer.ctaText = t;
    }
  } else {
    const cta = firstMatchInner(
      raw,
      /<a\b[^>]*\bfooter-cta\b[^>]*>([\s\S]*?)<\/a>/i
    );
    if (cta) footer.ctaText = cta;
  }

  return footer;
}

export function extractLogoFromHtml(html) {
  const raw = String(html || "");
  const m =
    raw.match(
      /<img\b[^>]*\bsite-logo(?:-footer|-header)?\b[^>]*\bsrc=["']([^"']+)["']/i
    ) ||
    raw.match(
      /<img\b[^>]*\bsrc=["']([^"']+)["'][^>]*\bsite-logo(?:-footer|-header)?\b/i
    );
  return m ? normalizeSiteAssetUrl(m[1]) : "";
}

/**
 * Site-relative asset paths must be root-absolute so nested pages
 * (/services/..., /blog/...) do not resolve to /services/assets/...
 */
export function normalizeSiteAssetUrl(url) {
  let u = String(url || "").trim();
  if (!u) return "";
  if (/^(https?:)?\/\//i.test(u) || /^data:/i.test(u) || /^blob:/i.test(u)) {
    return u;
  }
  const qIndex = u.indexOf("?");
  const query = qIndex >= 0 ? u.slice(qIndex) : "";
  let path = qIndex >= 0 ? u.slice(0, qIndex) : u;
  path = path.replace(/\\/g, "/").replace(/^\.\//, "");
  while (path.startsWith("../")) path = path.slice(3);
  if (!path.startsWith("/")) path = `/${path}`;
  return path + query;
}

/** Fill only empty footer/branding keys from captured HTML values. */
export function mergeCapturedSiteChrome(doc, capturedFooter, capturedLogo) {
  const out = doc && typeof doc === "object" ? { ...doc } : {};
  let changed = false;

  const footer =
    out.footer && typeof out.footer === "object" ? { ...out.footer } : {};
  Object.keys(capturedFooter || {}).forEach((key) => {
    const next = String(capturedFooter[key] || "").trim();
    const cur = String(footer[key] || "").trim();
    if (next && !cur) {
      footer[key] = next;
      changed = true;
    }
  });
  out.footer = footer;

  const branding =
    out.branding && typeof out.branding === "object" ? { ...out.branding } : {};
  const logo = normalizeSiteAssetUrl(capturedLogo || "");
  if (logo && !String(branding.logoUrl || "").trim()) {
    branding.logoUrl = logo;
    changed = true;
  }
  // Repair previously captured relative logo/favicon paths.
  if (branding.logoUrl) {
    const fixed = normalizeSiteAssetUrl(branding.logoUrl);
    if (fixed && fixed !== branding.logoUrl) {
      branding.logoUrl = fixed;
      changed = true;
    }
  }
  if (branding.faviconUrl) {
    const fixedFav = normalizeSiteAssetUrl(branding.faviconUrl);
    if (fixedFav && fixedFav !== branding.faviconUrl) {
      branding.faviconUrl = fixedFav;
      changed = true;
    }
  }
  out.branding = branding;

  return { doc: out, changed };
}
