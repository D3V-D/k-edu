const https = require('https');

// whitelist of allowed domains (not open proxy)
// localhost only for testing
const allowedDomains = ["https://k-edu.netlify.app", "http://localhost:8888"];

exports.handler = async function (event, context) {
  const { queryStringParameters, headers } = event;
  const { file, url: targetUrl } = queryStringParameters;
  const referer = headers.referer || headers.Referer; // Check both cases

  console.log(context)

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
          body: 'Access Forbidden. Only PDF files are allowed.',
        };
    }


    const options = new URL(targetUrl);
    const proxy = options.protocol === 'https:' ? https : http;

    try {
      const proxyRes = await new Promise((resolve, reject) => {
        const proxyReq = proxy.request(options, (res) => {
          let data = '';

          res.on('data', (chunk) => {
            data += chunk;
          });

          res.on('end', () => {
            resolve({
              statusCode: res.statusCode,
              headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': res.headers['content-type'],
              },
              body: data,
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
