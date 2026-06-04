class PDFService {
  /**
   * Generates a PDF buffer from an HTML string
   * @param {string} htmlContent - The HTML content to convert to PDF
   * @returns {Promise<Buffer>} - The generated PDF buffer
   */
  async generatePDF(htmlContent) {
    let browser;
    try {
      let puppeteer;
      let options = {};

      // If running on Vercel / AWS lambda, load sparticuz-chromium and puppeteer-core
      if (process.env.VERCEL || process.env.AWS_EXECUTION_ENV) {
        console.log("Serverless/production environment detected. Instantiating @sparticuz/chromium...");
        const chromium = require('@sparticuz/chromium');
        puppeteer = require('puppeteer-core');

        options = {
          args: chromium.args,
          defaultViewport: chromium.defaultViewport,
          executablePath: await chromium.executablePath(),
          headless: chromium.headless,
          ignoreHTTPSErrors: true,
        };
      } else {
        // Local environment uses standard puppeteer with standard launch args
        console.log("Local development environment detected. Instantiating standard puppeteer...");
        puppeteer = require('puppeteer');
        options = {
          headless: 'new',
          args: ['--no-sandbox', '--disable-setuid-sandbox'],
        };
      }

      browser = await puppeteer.launch(options);
      
      const page = await browser.newPage();
      
      // Set high resolution viewport to prevent blurry PDF rendering
      await page.setViewport({ width: 1200, height: 800, deviceScaleFactor: 2 });
      
      // Set the HTML content
      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
      
      // Generate PDF
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20px',
          right: '20px',
          bottom: '20px',
          left: '20px'
        }
      });
      
      return pdfBuffer;
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw error;
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }
}

module.exports = new PDFService();
