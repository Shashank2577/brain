export async function runAuditAgentWeb(args) {
    const url = parseUrlArg(args);
    if (!url) {
        console.error("Usage: agent-native audit-agent-web --url <url>");
        process.exitCode = 1;
        return;
    }
    const baseUrl = normalizeBaseUrl(url);
    const checks = [];
    const root = await fetchText(baseUrl, "/");
    checks.push(check("SSR HTML", root.status >= 200 && root.status < 300 && visibleText(root.text) > 200, `GET / returned ${root.status}`));
    checks.push(check("Canonical URL", /<link[^>]+rel=["']canonical["'][^>]+href=/i.test(root.text), "root HTML includes rel=canonical"));
    checks.push(check("JSON-LD", /<script[^>]+type=["']application\/ld\+json["']/i.test(root.text), "root HTML includes application/ld+json"));
    const robots = await fetchText(baseUrl, "/robots.txt");
    checks.push(check("robots.txt", robots.status >= 200 && robots.status < 300, `GET /robots.txt returned ${robots.status}`));
    checks.push(check("Robots sitemap", /Sitemap:\s*https?:\/\//i.test(robots.text), "robots.txt links to an absolute sitemap URL"));
    checks.push(check("Robots public fallback", !hasBlanketRobotsDisallow(robots.text), "User-agent: * does not block the whole site"));
    const sitemap = await fetchText(baseUrl, "/sitemap.xml");
    const sitemapUrls = parseSitemapUrls(sitemap.text);
    checks.push(check("sitemap.xml", sitemap.status >= 200 && sitemap.status < 300 && sitemapUrls.length > 0, `found ${sitemapUrls.length} sitemap URLs`));
    checks.push(check("Sitemap absolute URLs", sitemapUrls.every((entry) => /^https?:\/\//.test(entry)), "every <loc> is absolute"));
    const llms = await fetchText(baseUrl, "/llms.txt");
    checks.push(check("llms.txt", llms.status >= 200 && llms.status < 300 && llms.text.trim().length > 20, `GET /llms.txt returned ${llms.status}`));
    const llmsFull = await fetchText(baseUrl, "/llms-full.txt");
    checks.push(check("llms-full.txt", llmsFull.status >= 200 &&
        llmsFull.status < 300 &&
        llmsFull.text.length > llms.text.length, `GET /llms-full.txt returned ${llmsFull.status}`));
    const markdownTarget = localizeUrlForAudit(baseUrl, firstMarkdownUrl(llms.text)) ??
        localizeUrlForAudit(baseUrl, firstMarkdownUrl(llmsFull.text)) ??
        markdownUrlForSitemapEntry(baseUrl, sitemapUrls[0]);
    if (markdownTarget) {
        const markdown = await fetchAbsolute(markdownTarget);
        checks.push(check("Markdown mirror", markdown.status >= 200 &&
            markdown.status < 300 &&
            markdown.text.trim().startsWith("#"), `${markdown.url} returned ${markdown.status}`));
        checks.push({
            name: "Markdown token header",
            status: markdown.headers.has("x-markdown-tokens") ? "pass" : "warn",
            details: "x-markdown-tokens is present when the server route handled it",
        });
    }
    else {
        checks.push({
            name: "Markdown mirror",
            status: "fail",
            details: "no Markdown URL found in llms files or sitemap",
        });
    }
    const acceptTarget = markdownAcceptProbePath(baseUrl, sitemapUrls);
    if (acceptTarget) {
        const markdown = await fetchAbsolute(acceptTarget, {
            headers: { accept: "text/markdown" },
        });
        checks.push(check("Accept: text/markdown", markdown.status >= 200 &&
            markdown.status < 300 &&
            markdown.text.trim().startsWith("#"), `${acceptTarget} returned ${markdown.status}`));
    }
    for (const userAgent of ["ChatGPT-User", "OAI-SearchBot", "Claude-Code"]) {
        const response = await fetchText(baseUrl, "/", {
            headers: { "user-agent": userAgent },
        });
        checks.push(check(`Agent UA ${userAgent}`, response.status !== 401 && response.status !== 403, `GET / as ${userAgent} returned ${response.status}`));
    }
    printChecks(checks, baseUrl);
    if (checks.some((entry) => entry.status === "fail")) {
        process.exitCode = 1;
    }
}
function parseUrlArg(args) {
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (arg === "--url")
            return args[i + 1];
        if (arg.startsWith("--url="))
            return arg.slice("--url=".length);
        if (!arg.startsWith("-"))
            return arg;
    }
    return undefined;
}
function normalizeBaseUrl(value) {
    const withProtocol = /^https?:\/\//i.test(value) ? value : `https://${value}`;
    return withProtocol.replace(/\/+$/, "");
}
async function fetchText(baseUrl, pathname, init) {
    return fetchAbsolute(`${baseUrl}${pathname}`, init);
}
async function fetchAbsolute(url, init) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15_000);
    try {
        const response = await fetch(url, {
            redirect: "follow",
            ...init,
            signal: controller.signal,
        });
        return {
            url: response.url,
            status: response.status,
            headers: response.headers,
            text: await response.text(),
        };
    }
    catch (error) {
        return {
            url,
            status: 0,
            headers: new Headers(),
            text: error instanceof Error ? error.message : String(error),
        };
    }
    finally {
        clearTimeout(timeout);
    }
}
function check(name, ok, details) {
    return { name, status: ok ? "pass" : "fail", details };
}
function visibleText(html) {
    return html
        .replace(/<script[\s\S]*?<\/script>/gi, "")
        .replace(/<style[\s\S]*?<\/style>/gi, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim().length;
}
function hasBlanketRobotsDisallow(robots) {
    const groups = robots.split(/\n\s*\n/g);
    for (const group of groups) {
        if (!/^\s*User-agent:\s*\*\s*$/im.test(group))
            continue;
        if (/^\s*Disallow:\s*\/\s*$/im.test(group))
            return true;
    }
    return false;
}
function parseSitemapUrls(xml) {
    return Array.from(xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/gi), (match) => decodeXml(match[1].trim()));
}
function firstMarkdownUrl(text) {
    return Array.from(text.matchAll(/https?:\/\/[^\s)\]]+\.md(?:#[^\s)\]]*)?/g), (match) => match[0])[0];
}
function markdownUrlForSitemapEntry(baseUrl, sitemapEntry) {
    if (!sitemapEntry)
        return undefined;
    try {
        const url = new URL(sitemapEntry);
        if (url.pathname === "/")
            return `${baseUrl}/index.md`;
        return `${baseUrl}${url.pathname.replace(/\/$/, "")}.md`;
    }
    catch {
        return undefined;
    }
}
function localizeUrlForAudit(baseUrl, target) {
    if (!target)
        return undefined;
    try {
        const url = new URL(target);
        return `${baseUrl}${url.pathname}${url.search}${url.hash}`;
    }
    catch {
        return undefined;
    }
}
function markdownAcceptProbePath(baseUrl, sitemapUrls) {
    const entry = sitemapUrls
        .map((entry) => {
        try {
            return new URL(entry);
        }
        catch {
            return undefined;
        }
    })
        .find((entry) => entry?.pathname);
    if (!entry)
        return undefined;
    return `${baseUrl}${entry.pathname}`;
}
function decodeXml(value) {
    return value
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'");
}
function printChecks(checks, baseUrl) {
    console.log(`Agent Web audit for ${baseUrl}\n`);
    for (const entry of checks) {
        const marker = entry.status === "pass"
            ? "PASS"
            : entry.status === "warn"
                ? "WARN"
                : "FAIL";
        console.log(`${marker.padEnd(4)} ${entry.name} - ${entry.details}`);
    }
}
//# sourceMappingURL=audit-agent-web.js.map