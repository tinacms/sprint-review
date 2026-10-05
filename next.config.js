/** @type {import('next').NextConfig} */

module.exports = {
  // Reviews lived at /sprint/<file> before the site took the starter's routes. Not permanent, so a
  // rollback is not stuck behind a cached redirect.
  async redirects() {
    return [{ source: "/sprint/:filename", destination: "/review/:filename", permanent: false }];
  },
  async rewrites() {
    return [
      {
        source: "/admin",
        destination: "/admin/index.html",
      },
    ];
  },
};
