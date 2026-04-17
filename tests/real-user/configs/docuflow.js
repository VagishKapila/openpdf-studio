module.exports = {
  productName: 'DocuFlow (OpenPDF Studio)',
  urls: {
    production: 'https://snaphw.com',       // GitHub Pages custom domain (openpdf-studio)
    dashboard: 'https://docpix-dashboard.vercel.app',
    staging: 'https://incandescent-druid-a238c2.netlify.app',
  },
  expectedPatterns: [
    { pattern: /PDF|document|sign/gi, name: 'core product terms', minCount: 3 },
  ],
  criticalPages: [
    '/',
  ],
};
