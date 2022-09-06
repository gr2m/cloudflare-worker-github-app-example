export async function verifyWebhookSignature(payload, signature, secret) {
  if (!signature) {
    throw new Error("Signature is missing");
  } else if (!signature.startsWith("sha256=")) {
    throw new Error("Invalid signature format");
  }

  const algorithm = { name: "HMAC", hash: "SHA-256" };
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    algorithm,
    false,
    ["sign", "verify"]
  );

  const signed = await crypto.subtle.sign(
    algorithm.name,
    key,
    enc.encode(payload)
  );
  const expectedSignature = "sha256=" + array2hex(signed);
  if (!safeCompare(expectedSignature, signature)) {
    throw new Error("Signature does not match event payload and secret");
  }

  // All good!
}

function array2hex(arr) {
  return [...new Uint8Array(arr)]
    .map((x) => x.toString(16).padStart(2, "0"))
    .join("");
}

/** Constant-time string comparison */
function safeCompare(expected, actual) {
  const lenExpected = expected.length;
  let result = 0;

  if (lenExpected !== actual.length) {
    actual = expected;
    result = 1;
  }

  for (let i = 0; i < lenExpected; i++) {
    result |= expected.charCodeAt(i) ^ actual.charCodeAt(i);
  }

  return result === 0;
}
