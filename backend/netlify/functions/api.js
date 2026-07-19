// Netlify Function: membungkus aplikasi Express (server.js) sebagai serverless handler.
const serverless = require("serverless-http");
const app = require("../../server.js");
const handler = serverless(app);

// Normalisasi path: apa pun bentuk path dari Netlify, jadikan seperti /api/faskes
function strip(p) {
  return (p || "/").replace(/^\/\.netlify\/functions\/api/, "") || "/";
}

exports.handler = async (event, context) => {
  if (event.path) event.path = strip(event.path);
  if (event.rawPath) event.rawPath = strip(event.rawPath);
  return handler(event, context);
};
