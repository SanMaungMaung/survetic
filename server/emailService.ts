import { Resend } from 'resend';

// Initialize Resend with API key
const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendVerificationEmail(
  email: string,
  firstName: string,
  verificationToken: string
): Promise<boolean> {
  try {
    // Use dynamic domain for verification URL
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : process.env.NODE_ENV === 'production' 
        ? 'https://www.survetic.com' 
        : 'http://localhost:5000';
    
    const verificationUrl = `${baseUrl}/verify-email?token=${verificationToken}`;
    
    // For development, use console logging for test domains that Resend doesn't allow
    const testDomains = ['@test.com', '@example.com', '@localhost', '@demo.com'];
    const isTestEmail = testDomains.some(domain => email.includes(domain));
    
    if (isTestEmail) {
      // Log verification details for test emails only
      console.log('\n' + '='.repeat(80));
      console.log('📧 VERIFICATION EMAIL (Test Mode)');
      console.log('='.repeat(80));
      console.log(`To: ${email}`);
      console.log(`Subject: Welcome to Survetic - Verify Your Email`);
      console.log(`\nHi ${firstName},`);
      console.log(`\nVerification Link: ${verificationUrl}`);
      console.log('\nClick the link above to verify your account!');
      console.log('='.repeat(80) + '\n');
      return true;
    }

    // Send professional verification email using Resend for real emails
    const { data, error } = await resend.emails.send({
      from: 'Survetic <noreply@survetic.com>',
      to: [email],
      subject: 'Welcome to Survetic - Verify Your Email',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to Survetic</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; font-size: 32px; margin: 0; font-weight: bold;">
              Welcome to Survetic!
            </h1>
            <p style="color: #666; font-size: 16px; margin: 10px 0;">
              The Modern Survey Platform
            </p>
          </div>

          <div style="background: #f8fafc; padding: 30px; border-radius: 10px; margin: 20px 0;">
            <p style="font-size: 18px; margin: 0 0 20px 0;">
              Hi <strong>${firstName}</strong>,
            </p>
            
            <p style="margin: 0 0 20px 0;">
              Thank you for joining Survetic! To get started with creating amazing surveys, 
              please verify your email address by clicking the button below:
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" 
                 style="background: #2563eb !important; 
                        background-color: #2563eb !important;
                        color: white !important; 
                        padding: 15px 30px; 
                        text-decoration: none; 
                        border-radius: 8px; 
                        display: inline-block; 
                        font-weight: bold; 
                        font-size: 16px;
                        border: none;
                        box-shadow: 0 4px 15px rgba(37, 99, 235, 0.3);">
                ✨ Verify Email Address
              </a>
            </div>
            
            <p style="margin: 20px 0 0 0; font-size: 14px; color: #666;">
              If the button doesn't work, copy and paste this link into your browser:
            </p>
            <p style="margin: 5px 0; word-break: break-all; font-size: 14px; color: #2563eb;">
              ${verificationUrl}
            </p>
          </div>

          <div style="margin: 30px 0;">
            <h3 style="color: #2563eb; margin: 0 0 15px 0;">🚀 What you can do with Survetic:</h3>
            <ul style="list-style: none; padding: 0; margin: 0;">
              <li style="margin: 10px 0; padding-left: 25px; position: relative;">
                <span style="position: absolute; left: 0; color: #10b981;">✓</span>
                Create unlimited surveys with our drag & drop builder
              </li>
              <li style="margin: 10px 0; padding-left: 25px; position: relative;">
                <span style="position: absolute; left: 0; color: #10b981;">✓</span>
                Share surveys via social media, QR codes, and direct links
              </li>
              <li style="margin: 10px 0; padding-left: 25px; position: relative;">
                <span style="position: absolute; left: 0; color: #10b981;">✓</span>
                View detailed analytics and real-time responses
              </li>
              <li style="margin: 10px 0; padding-left: 25px; position: relative;">
                <span style="position: absolute; left: 0; color: #10b981;">✓</span>
                Export your data anytime in CSV format
              </li>
            </ul>
          </div>

          <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px; text-align: center;">
            <p style="margin: 0; color: #666; font-size: 14px;">
              Welcome aboard! 🎉<br>
              <strong>The Survetic Team</strong>
            </p>
            <p style="margin: 10px 0 0 0; color: #999; font-size: 12px;">
              If you didn't create this account, you can safely ignore this email.
            </p>
          </div>

        </body>
        </html>
      `,
    });

    if (error) {
      console.error('Resend email error:', error);
      return false;
    }

    console.log('📧 Verification email sent successfully via Resend:', data?.id);
    return true;

  } catch (error) {
    console.error('Email service error:', error);
    return false;
  }
}