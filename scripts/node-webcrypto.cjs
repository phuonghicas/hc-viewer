const nodeCrypto = require("node:crypto");

if (typeof nodeCrypto.getRandomValues !== "function" && nodeCrypto.webcrypto?.getRandomValues) {
  nodeCrypto.getRandomValues = nodeCrypto.webcrypto.getRandomValues.bind(nodeCrypto.webcrypto);
}

if (typeof nodeCrypto.hash !== "function") {
  nodeCrypto.hash = (algorithm, data, outputEncoding = "hex") =>
    nodeCrypto.createHash(algorithm).update(data).digest(outputEncoding);
}

if (!globalThis.crypto || typeof globalThis.crypto.getRandomValues !== "function") {
  globalThis.crypto = nodeCrypto.webcrypto;
}
