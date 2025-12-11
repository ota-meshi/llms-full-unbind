import { ProxyAgent } from "undici";

/**
 * Fetch the body as a ReadableStream of Uint8Array.
 */
export async function fetchBody(
  url: string | URL,
): Promise<ReadableStream<Uint8Array>> {
  const agent = autoProxyAgent();
  const res = await fetch(url, {
    method: "GET",
    ...(agent ? { dispatcher: agent } : {}),
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.statusText}`);
  }
  if (!res.body) {
    throw new Error(`No body in response from ${url}`);
  }

  return res.body;
}

/**
 * Create a proxy agent.
 */
function autoProxyAgent() {
  const PROXY_ENV = [
    "https_proxy",
    "HTTPS_PROXY",
    "http_proxy",
    "HTTP_PROXY",
    "npm_config_https_proxy",
    "npm_config_http_proxy",
  ];

  const proxyStr = PROXY_ENV.map(
    // eslint-disable-next-line no-process-env -- ok
    (k) => process.env[k],
  ).find(Boolean);
  if (!proxyStr) {
    return null;
  }
  const proxyUrl = new URL(proxyStr);

  const encoder = new TextEncoder();
  const encoded = encoder.encode(
    `${proxyUrl.username}:${decodeURIComponent(proxyUrl.password)}`,
  );
  let binary = "";
  for (let i = 0; i < encoded.length; i++) {
    binary += String.fromCharCode(encoded[i]);
  }
  return new ProxyAgent({
    uri: proxyUrl.protocol + proxyUrl.host,
    token:
      proxyUrl.username || proxyUrl.password
        ? `Basic ${btoa(binary)}`
        : undefined,
  });
}
