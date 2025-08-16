import PDFDocument from 'pdfkit'
import { Readable } from 'stream'

export interface InvoiceData {
  invoiceNumber: string
  auctionTitle: string
  finalPrice: number
  buyerName: string
  buyerEmail: string
  sellerName: string
  sellerEmail: string
  date: Date
}

export function generateInvoicePDF(data: InvoiceData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 })
      const chunks: Buffer[] = []

      doc.on('data', (chunk) => chunks.push(chunk))
      doc.on('end', () => resolve(Buffer.concat(chunks)))
      doc.on('error', reject)

      // Header
      doc.fontSize(20)
         .text('AUCTION INVOICE', 50, 50)
      
      doc.fontSize(10)
         .text(`Invoice #: ${data.invoiceNumber}`, 50, 80)
         .text(`Date: ${data.date.toLocaleDateString()}`, 50, 95)

      // Item Details
      doc.fontSize(14)
         .text('Item Details', 50, 130)
      
      doc.fontSize(10)
         .text(`Item: ${data.auctionTitle}`, 50, 150)
         .text(`Final Price: ${data.finalPrice}`, 50, 165)

      // Buyer Information
      doc.fontSize(14)
         .text('Buyer Information', 50, 200)
      
      doc.fontSize(10)
         .text(`Name: ${data.buyerName}`, 50, 220)
         .text(`Email: ${data.buyerEmail}`, 50, 235)

      // Seller Information
      doc.fontSize(14)
         .text('Seller Information', 300, 200)
      
      doc.fontSize(10)
         .text(`Name: ${data.sellerName}`, 300, 220)
         .text(`Email: ${data.sellerEmail}`, 300, 235)

      // Summary
      doc.fontSize(14)
         .text('Summary', 50, 280)
      
      doc.fontSize(12)
         .text(`Total Amount: ${data.finalPrice}`, 50, 300)

      // Footer
      doc.fontSize(8)
         .text('This invoice was generated automatically by the auction system.', 50, 400)

      doc.end()
    } catch (error) {
      reject(error)
    }
  })
}
