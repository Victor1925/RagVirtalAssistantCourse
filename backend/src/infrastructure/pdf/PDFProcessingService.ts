import pdfParse from 'pdf-parse';

export class PDFProcessingService {
  async extractText(buffer: Buffer): Promise<string> {
    const data = await pdfParse(buffer);
    return data.text;
  }
}
