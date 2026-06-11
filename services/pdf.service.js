const pdfMake = require('pdfmake');
const path = require('path');

class PDFService {
  /**
   * Generates a PDF buffer from a pdfmake document definition
   * @param {object} docDefinition - The pdfmake document definition
   * @returns {Promise<Buffer>} - The generated PDF buffer
   */
  async generatePDF(docDefinition) {
    try {
      // Use embedded Roboto fonts to prevent blurriness
      const fonts = {
        Roboto: {
          normal: path.join(__dirname, '../node_modules/pdfmake/fonts/Roboto/Roboto-Regular.ttf'),
          bold: path.join(__dirname, '../node_modules/pdfmake/fonts/Roboto/Roboto-Medium.ttf'),
          italics: path.join(__dirname, '../node_modules/pdfmake/fonts/Roboto/Roboto-Italic.ttf'),
          bolditalics: path.join(__dirname, '../node_modules/pdfmake/fonts/Roboto/Roboto-MediumItalic.ttf')
        }
      };

      pdfMake.setFonts(fonts);
      
      // Ensure default font is applied
      docDefinition.defaultStyle = docDefinition.defaultStyle || {};
      docDefinition.defaultStyle.font = 'Roboto';

      // Create PDF and return buffer
      const pdfDoc = pdfMake.createPdf(docDefinition);
      const pdfBuffer = await pdfDoc.getBuffer();
      
      return pdfBuffer;
    } catch (error) {
      console.error('Error generating PDF with PDFMake:', error);
      throw error;
    }
  }
}

module.exports = new PDFService();
