import sgMail, { MailDataRequired } from '@sendgrid/mail'
import { env } from '../config/env'

sgMail.setApiKey(env.SENDGRID_API_KEY)

export interface EmailOptions {
  to: string
  subject: string
  html: string
  attachments?: Array<{
    content: string // should be base64
    filename: string
    type: string
  }>
}

export async function sendEmail(options: EmailOptions) {
  if (!env.SENDGRID_API_KEY) {
    console.warn('⚠️ SendGrid API key not configured, skipping email')
    return
  }

  if (!env.MAIL_FROM) {
    console.error('❌ MAIL_FROM is not set in environment')
    return
  }

  const msg: MailDataRequired = {
    to: options.to,
    from: env.MAIL_FROM, // must be a verified sender in SendGrid
    subject: options.subject,
    html: options.html,
    attachments: options.attachments?.map(att => ({
      content: att.content,
      filename: att.filename,
      type: att.type,
      disposition: 'attachment',
    })),
  }

  try {
    await sgMail.send(msg)
    console.log(`✅ Email sent to ${options.to}`)
  } catch (error: any) {
    console.error('❌ Email sending failed:', error?.response?.body || error)
  }
}

export function createAcceptanceEmailTemplate(
  auctionTitle: string,
  finalPrice: number,
  buyerName: string,
  sellerName: string,
  isBuyer: boolean
) {
  const role = isBuyer ? 'buyer' : 'seller'
  const otherRole = isBuyer ? 'seller' : 'buyer'
  const otherName = isBuyer ? sellerName : buyerName

  return `
    <html>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
          <h2 style="color: #28a745;">🎉 Auction Completed Successfully!</h2>
          
          <p>Dear ${isBuyer ? buyerName : sellerName},</p>
          
          <p>Congratulations! The auction for <strong>${auctionTitle}</strong> has been completed.</p>
          
          <div style="background: white; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3>Transaction Details:</h3>
            <ul>
              <li><strong>Item:</strong> ${auctionTitle}</li>
              <li><strong>Final Price:</strong> ₹${finalPrice.toLocaleString()}</li>
              <li><strong>Buyer:</strong> ${buyerName}</li>
              <li><strong>Seller:</strong> ${sellerName}</li>
            </ul>
          </div>
          
          <p>As the <strong>${role}</strong>, please coordinate with the <strong>${otherRole}</strong> (${otherName}) for payment and delivery arrangements.</p>
          
          <p>Thank you for using our auction platform!</p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #6c757d; font-size: 12px;">This is an automated email. Please do not reply.</p>
        </div>
      </body>
    </html>
  `
}
