class PDFService {
  /**
   * Generates a PDF buffer from an HTML string
   * @param {string} htmlContent - The HTML content to convert to PDF
   * @returns {Promise<Buffer>} - The generated PDF buffer
   */
  async generatePDF(htmlContent) {
    let browser;
    try {
      const puppeteer = require('puppeteer');
      browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
      
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
