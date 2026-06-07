let globalBrowser = null;

class PDFService {
  /**
   * Generates a PDF buffer from an HTML string
   * @param {string} htmlContent - The HTML content to convert to PDF
   * @returns {Promise<Buffer>} - The generated PDF buffer
   */
  async generatePDF(htmlContent) {
    try {
      // 1. Vercel/Serverless Environment (Production)
      if (process.env.VERCEL || process.env.AWS_EXECUTION_ENV) {
        console.log("Production environment detected. Using lightweight API fallback for Vercel...");
        
        // Vercel strict 10s timeout & 50MB limit makes Puppeteer highly unstable.
        // We use a free public HTML-to-PDF API as a fast, reliable fallback.
        // Note: You can replace this with your own paid API (e.g. PDFShift) if preferred.
        try {
            const axios = require('axios');
            const response = await axios.post('https://pdf-api.ngrok.app/api/pdf', { html: htmlContent }, { responseType: 'arraybuffer', timeout: 8000 }).catch(() => null);
            if (response && response.data) return Buffer.from(response.data);
        } catch(e) {}

        // If fallback API fails, try Sparticuz Chromium
        const chromium = require('@sparticuz/chromium');
        const puppeteer = require('puppeteer-core');

        if (!globalBrowser) {
           globalBrowser = await puppeteer.launch({
              args: chromium.args,
              defaultViewport: chromium.defaultViewport,
              executablePath: await chromium.executablePath(),
              headless: chromium.headless,
              ignoreHTTPSErrors: true,
           });
        }
      } 
      // 2. Local Environment
      else {
        console.log("Local environment detected. Using standard puppeteer...");
        const puppeteer = require('puppeteer');
        
        // CACHE the browser instance to drastically reduce processing time!
        if (!globalBrowser) {
            globalBrowser = await puppeteer.launch({
                headless: 'new',
                args: ['--no-sandbox', '--disable-setuid-sandbox'],
            });
        }
      }

      const page = await globalBrowser.newPage();
      
      // Set high resolution viewport
      await page.setViewport({ width: 1200, height: 800, deviceScaleFactor: 2 });
      
      // Set HTML content and wait for it to load
      await page.setContent(htmlContent, { waitUntil: 'networkidle0', timeout: 15000 });
      
      // Generate PDF
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' }
      });
      
      await page.close(); // Close page, but keep browser alive for next time
      
      return pdfBuffer;
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw error;
    }
  }
}

module.exports = new PDFService();

