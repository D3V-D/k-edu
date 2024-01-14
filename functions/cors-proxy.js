const https = require('https');

// Whitelist of allowed domains (not open proxy)
// Localhost only for testing
const allowedDomains = ["https://k-edu.netlify.app", "http://localhost:8888"];

exports.handler = async function (event, context) {
  const { queryStringParameters, headers } = event;
  const { file, url: targetUrl } = queryStringParameters;
  const referer = headers.referer || headers.Referer; // Check both cases

  // Check if the Referer header is present and matches the allowedDomains
  if (referer && allowedDomains.some(domain => referer.startsWith(domain))) {
    if (!targetUrl) {
      return {
        statusCode: 400,
        body: 'Missing "url" parameter',
      };
    }

    const pdfRegexPattern = "^https:\/\/[^\/]+\.[^\/]+\/.+\.pdf.*$";
    const pdfRegex = new RegExp(pdfRegexPattern, 'i');

    if (!pdfRegex.test(targetUrl)) {
      return {
        statusCode: 403,
        body: 'Access Forbidden. Only https PDF files are allowed.',
      };
    }

    const options = new URL(targetUrl);
    const proxy = options.protocol === 'https:' ? https : http;

    try {
      const proxyRes = await new Promise((resolve, reject) => {
        const proxyReq = proxy.request(options, (res) => {
          const chunks = [];

          res.on('data', (chunk) => {
            chunks.push(chunk);
          });

          res.on('end', () => {
            const data = Buffer.concat(chunks);

            // Convert the binary data to a base64-encoded string
            // serverless funcs require string response
            const base64String = data.toString('base64');

            resolve({
              statusCode: res.statusCode,
              headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/pdf',
              },
              body: base64String,
              isBase64Encoded: true,
            });
          });
        });

        proxyReq.on('error', (err) => {
          reject(err);
        });

        proxyReq.end();
      });

      return proxyRes;
    } catch (error) {
      console.error(error);
      return {
        statusCode: 500,
        body: 'Internal Server Error',
      };
    }
  } else {
    return {
      statusCode: 403,
      body: 'Access Forbidden. Referer domain not whitelisted.',
    };
  }
};
