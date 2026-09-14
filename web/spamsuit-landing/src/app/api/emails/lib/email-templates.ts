// Email templates for SpamSuit notifications
// These templates are designed to work with any email provider

interface TemplateData {
  [key: string]: string | number | undefined
}

function interpolate(template: string, data: TemplateData): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    const value = data[key]
    return value !== undefined ? String(value) : match
  })
}

// Base HTML wrapper for all emails
const baseTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{title}}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #f4f4f5;
      color: #18181b;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
    }
    .header {
      background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%);
      padding: 40px 30px;
      text-align: center;
    }
    .header h1 {
      color: #ffffff;
      margin: 0;
      font-size: 28px;
      font-weight: 700;
    }
    .header p {
      color: rgba(255,255,255,0.9);
      margin: 10px 0 0;
      font-size: 16px;
    }
    .content {
      padding: 40px 30px;
    }
    .case-number {
      background-color: #f4f4f5;
      border-left: 4px solid #7c3aed;
      padding: 15px 20px;
      margin: 20px 0;
      font-family: 'SF Mono', Monaco, monospace;
      font-size: 18px;
      font-weight: 600;
    }
    .highlight-box {
      background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
      border-radius: 12px;
      padding: 24px;
      margin: 24px 0;
      text-align: center;
    }
    .highlight-box h2 {
      margin: 0 0 8px;
      color: #92400e;
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .highlight-box .value {
      font-size: 32px;
      font-weight: 700;
      color: #92400e;
      margin: 0;
    }
    .attorney-card {
      background-color: #fafafa;
      border: 1px solid #e4e4e7;
      border-radius: 12px;
      padding: 24px;
      margin: 20px 0;
    }
    .attorney-card h3 {
      margin: 0 0 8px;
      color: #18181b;
      font-size: 20px;
    }
    .attorney-card .firm {
      color: #7c3aed;
      font-weight: 600;
      margin: 0 0 16px;
    }
    .attorney-card .contact {
      color: #52525b;
      font-size: 14px;
      margin: 4px 0;
    }
    .next-steps {
      background-color: #fafafa;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
    }
    .next-steps h3 {
      margin: 0 0 12px;
      font-size: 16px;
    }
    .next-steps ol {
      margin: 0;
      padding-left: 20px;
    }
    .next-steps li {
      margin: 8px 0;
      color: #52525b;
    }
    .button {
      display: inline-block;
      background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%);
      color: #ffffff !important;
      text-decoration: none;
      padding: 14px 28px;
      border-radius: 8px;
      font-weight: 600;
      margin: 20px 0;
    }
    .footer {
      background-color: #fafafa;
      padding: 30px;
      text-align: center;
      border-top: 1px solid #e4e4e7;
    }
    .footer p {
      margin: 8px 0;
      color: #71717a;
      font-size: 14px;
    }
    .social-links {
      margin: 16px 0;
    }
    .social-links a {
      color: #71717a;
      text-decoration: none;
      margin: 0 10px;
    }
    .disclaimer {
      font-size: 12px;
      color: #a1a1aa;
      margin-top: 20px;
    }
  </style>
</head>
<body>
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
    <tr>
      <td>
        <div class="container">
          {{header}}
          <div class="content">
            {{content}}
          </div>
          {{footer}}
        </div>
      </td>
    </tr>
  </table>
</body>
</html>
`

// Welcome email template
export const welcomeEmailSubject = 'Your spam report has been received'

export const welcomeEmailHTML = `
<div class="header">
  <h1>📬 Report Received</h1>
  <p>Thank you for helping stop illegal spam</p>
</div>

<div class="content">
  <p>Hi {{toName}},</p>
  
  <p>We've received your spam report and our team is already reviewing it. Here's what you need to know:</p>
  
  <div class="case-number">
    <strong>Case Number:</strong> {{caseNumber}}
  </div>
  
  <div class="next-steps">
    <h3>📋 What happens next:</h3>
    <ol>
      <li><strong>Validation:</strong> Our team reviews your report (1-2 business days)</li>
      <li><strong>Verification:</strong> If it's a TCPA violation, we'll validate your case</li>
      <li><strong>Match:</strong> We may connect you with a qualified attorney at no cost to you</li>
    </ol>
  </div>
  
  <p><strong>Forward more spam:</strong> If you receive additional spam messages, forward them to <strong>report@spamsuit.co</strong>. Include the case number {{caseNumber}} in the subject line.</p>
  
  <p style="margin-top: 30px;">Questions? Reply to this email or visit our <a href="https://spamsuit.com/faq">FAQ page</a>.</p>
</div>

<div class="footer">
  <p><strong>SpamSuit</strong></p>
  <p>Turning spam into justice since 2024</p>
  <p style="font-size: 12px; color: #a1a1aa; margin-top: 20px;">
    You received this email because you submitted a spam report on SpamSuit.com.
  </p>
</div>
`

// Validated email template
export const validatedEmailSubject = 'Your TCPA violation has been validated!'

export const validatedEmailHTML = `
<div class="header">
  <h1>✅ Case Validated</h1>
  <p>Your spam report is a valid TCPA violation</p>
</div>

<div class="content">
  <p>Hi {{toName}},</p>
  
  <p>Great news! Our legal team has reviewed your case and confirmed it violates the Telephone Consumer Protection Act (TCPA).</p>
  
  <div class="case-number">
    <strong>Case Number:</strong> {{caseNumber}}
  </div>
  
  <div class="highlight-box">
    <h2>Estimated Potential Value</h2>
    <p class="value">{{potentialValue}}</p>
    <p style="margin: 8px 0 0; font-size: 14px;">TCPA violations can be worth $500-$1,500 per message</p>
  </div>
  
  <div class="next-steps">
    <h3>🎯 Next Steps:</h3>
    <ol>
      <li><strong>Attorney Matching:</strong> We're reviewing your case for attorney matching (no cost to you)</li>
      <li><strong>Documentation:</strong> Keep all spam messages and screenshots as evidence</li>
      <li><strong>Forward More:</strong> Continue forwarding spam to report@spamsuit.co with case #{{caseNumber}}</li>
    </ol>
  </div>
  
  <p style="margin-top: 30px;">We'll be in touch soon with more information about your case.</p>
</div>

<div class="footer">
  <p><strong>SpamSuit</strong></p>
  <p>Turning spam into justice since 2024</p>
  <p style="font-size: 12px; color: #a1a1aa; margin-top: 20px;">
    This is not a guarantee of recovery. Actual settlement amounts vary based on case specifics.
  </p>
</div>
`

// Attorney match email template
export const attorneyMatchEmailSubject = "You've been matched with a TCPA attorney"

export const attorneyMatchEmailHTML = `
<div class="header">
  <h1>⚖️ Attorney Matched</h1>
  <p>A qualified TCPA attorney will handle your case</p>
</div>

<div class="content">
  <p>Hi {{toName}},</p>
  
  <p>Excellent news! We've matched you with an experienced TCPA attorney who will handle your case at <strong>no cost to you</strong>.</p>
  
  <div class="case-number">
    <strong>Case Number:</strong> {{caseNumber}}
  </div>
  
  <div class="attorney-card">
    <h3>{{attorneyName}}</h3>
    <p class="firm">{{attorneyFirm}}</p>
    {{#if attorneyPhone}}<p class="contact">📞 {{attorneyPhone}}</p>{{/if}}
    {{#if attorneyEmail}}<p class="contact">✉️ {{attorneyEmail}}</p>{{/if}}
  </div>
  
  <div class="next-steps">
    <h3>🤝 What to expect:</h3>
    <ol>
      <li><strong>Contact:</strong> Your attorney will reach out within 2-3 business days</li>
      <li><strong>Consultation:</strong> Free initial consultation to discuss your case</li>
      <li><strong>Representation:</strong> They handle all legal work on contingency (they only get paid if you win)</li>
      <li><strong>Settlement:</strong> They negotiate the best possible outcome for your case</li>
    </ol>
  </div>
  
  <div style="background-color: #ecfdf5; border-left: 4px solid #10b981; padding: 15px 20px; margin: 20px 0;">
    <p style="margin: 0; color: #065f46;"><strong>💡 No Cost Guarantee:</strong> You pay nothing upfront. The attorney only gets paid if they recover money for you.</p>
  </div>
  
  <p style="margin-top: 30px;">Questions? Reply to this email or contact your attorney directly.</p>
</div>

<div class="footer">
  <p><strong>SpamSuit</strong></p>
  <p>Turning spam into justice since 2024</p>
  <p class="disclaimer">
    This communication does not create an attorney-client relationship between you and SpamSuit. 
    Your attorney-client relationship is with the matched law firm.
  </p>
</div>
`

// Settlement email template
export const settlementEmailSubject = "Settlement reached in your case!"

export const settlementEmailHTML = `
<div class="header">
  <h1>🎉 Settlement Reached</h1>
  <p>Your case has been successfully resolved</p>
</div>

<div class="content">
  <p>Hi {{toName}},</p>
  
  <p>Congratulations! Your attorney has successfully negotiated a settlement for your TCPA case.</p>
  
  <div class="case-number">
    <strong>Case Number:</strong> {{caseNumber}}
  </div>
  
  <div class="highlight-box" style="background: linear-gradient(135deg, #d1fae5 0%, #6ee7b7 100%);">
    <h2 style="color: #065f46;">Settlement Amount</h2>
    <p class="value" style="color: #065f46;">{{settlementAmount}}</p>
  </div>
  
  <div class="next-steps">
    <h3>💰 Payout Timeline:</h3>
    <p>{{payoutTimeline}}</p>
    <p style="margin-top: 12px; font-size: 14px; color: #71717a;">
      Your attorney will provide specific details about when and how you'll receive your settlement check.
    </p>
  </div>
  
  <div style="background-color: #fafafa; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
    <p style="margin: 0 0 12px; color: #52525b;"><strong>Help others fight spam</strong></p>
    <p style="margin: 0 0 16px; font-size: 14px; color: #71717a;">Share your success story and help more victims get justice</p>
    <a href="https://spamsuit.com/share" class="button">Share Your Story</a>
  </div>
  
  <p style="margin-top: 30px;">Thank you for trusting SpamSuit. We're thrilled we could help turn your spam into justice!</p>
</div>

<div class="footer">
  <p><strong>SpamSuit</strong></p>
  <p>Turning spam into justice since 2024</p>
  <p class="disclaimer">
    Settlement amounts are confidential and disclosed to you by your attorney. 
    This email is for notification purposes only.
  </p>
</div>
`

// Simple text versions for fallback
export const welcomeEmailText = `Your spam report has been received

Hi {{toName}},

We've received your spam report and our team is already reviewing it.

Case Number: {{caseNumber}}

What happens next:
1. Validation: Our team reviews your report (1-2 business days)
2. Verification: If it's a TCPA violation, we'll validate your case
3. Match: We may connect you with a qualified attorney at no cost to you

Forward more spam: Send additional spam messages to report@spamsuit.co. Include case #{{caseNumber}} in the subject line.

Questions? Reply to this email or visit https://spamsuit.com/faq

---
SpamSuit - Turning spam into justice since 2024
`

export const validatedEmailText = `Your TCPA violation has been validated!

Hi {{toName}},

Great news! Our legal team has reviewed your case and confirmed it violates the Telephone Consumer Protection Act (TCPA).

Case Number: {{caseNumber}}

Estimated Potential Value: {{potentialValue}}
TCPA violations can be worth $500-$1,500 per message

Next Steps:
1. Attorney Matching: We're reviewing your case for attorney matching (no cost to you)
2. Documentation: Keep all spam messages and screenshots as evidence
3. Forward More: Continue forwarding spam to report@spamsuit.co with case #{{caseNumber}}

We'll be in touch soon with more information about your case.

---
SpamSuit - Turning spam into justice since 2024

This is not a guarantee of recovery. Actual settlement amounts vary based on case specifics.
`

export const attorneyMatchEmailText = `You've been matched with a TCPA attorney

Hi {{toName}},

Excellent news! We've matched you with an experienced TCPA attorney who will handle your case at no cost to you.

Case Number: {{caseNumber}}

Attorney: {{attorneyName}}
Firm: {{attorneyFirm}}
{{#if attorneyPhone}}Phone: {{attorneyPhone}}{{/if}}
{{#if attorneyEmail}}Email: {{attorneyEmail}}{{/if}}

What to expect:
1. Contact: Your attorney will reach out within 2-3 business days
2. Consultation: Free initial consultation to discuss your case
3. Representation: They handle all legal work on contingency
4. Settlement: They negotiate the best possible outcome

No Cost Guarantee: You pay nothing upfront. The attorney only gets paid if they recover money for you.

Questions? Reply to this email or contact your attorney directly.

---
SpamSuit - Turning spam into justice since 2024

This communication does not create an attorney-client relationship between you and SpamSuit.
`

export const settlementEmailText = `Settlement reached in your case!

Hi {{toName}},

Congratulations! Your attorney has successfully negotiated a settlement for your TCPA case.

Case Number: {{caseNumber}}

Settlement Amount: {{settlementAmount}}

Payout Timeline: {{payoutTimeline}}

Your attorney will provide specific details about when and how you'll receive your settlement check.

Help others fight spam: Share your success story at https://spamsuit.com/share

Thank you for trusting SpamSuit. We're thrilled we could help turn your spam into justice!

---
SpamSuit - Turning spam into justice since 2024
`

// Helper function to compile full HTML email
export function compileEmail(htmlContent: string, title: string): string {
  const header = htmlContent.match(/<div class="header">[\s\S]*?<\/div>\s*(?=<div class="content">)/)?.[0] || ''
  const content = htmlContent.match(/<div class="content">([\s\S]*?)<\/div>(?=\s*<div class="footer">)/)?.[1] || ''
  const footer = htmlContent.match(/<div class="footer">[\s\S]*?<\/div>/)?.[0] || ''
  
  return baseTemplate
    .replace('{{title}}', title)
    .replace('{{header}}', header)
    .replace('{{content}}', `<div class="content">${content}</div>`)
    .replace('{{footer}}', footer)
}

// Export all templates
export const emailTemplates = {
  welcome: {
    subject: welcomeEmailSubject,
    html: welcomeEmailHTML,
    text: welcomeEmailText,
  },
  validated: {
    subject: validatedEmailSubject,
    html: validatedEmailHTML,
    text: validatedEmailText,
  },
  attorneyMatch: {
    subject: attorneyMatchEmailSubject,
    html: attorneyMatchEmailHTML,
    text: attorneyMatchEmailText,
  },
  settlement: {
    subject: settlementEmailSubject,
    html: settlementEmailHTML,
    text: settlementEmailText,
  },
}
