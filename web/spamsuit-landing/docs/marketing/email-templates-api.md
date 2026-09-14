# SpamSuit Email Templates API

This document describes the email templates used by SpamSuit for various notification scenarios in the case lifecycle. These templates are designed to be used with any email service provider (Resend, SendGrid, etc.) and can be customized as needed.

## Overview

SpamSuit sends automated emails at key milestones in the spam reporting and legal process:

1. **Welcome Email** - Sent when victim first reports spam
2. **Validation Email** - Sent when a TCPA violation is confirmed
3. **Attorney Match Email** - Sent when matched with a TCPA attorney
4. **Settlement Email** - Sent when case reaches settlement

All emails include both HTML and plain text versions for maximum compatibility.

## Template Structure

Each email template follows a consistent structure:
- Professional header with SpamSuit branding
- Personalized greeting
- Clear case information
- Actionable next steps
- Professional footer with disclaimers
- Responsive design that works on mobile and desktop

## Available Templates

### 1. Welcome Email
**Sent when:** Victim first reports spam  
**Subject:** "Your spam report has been received"

**Purpose:** Confirm receipt of spam report and set expectations for next steps.

**Key Information Included:**
- Case number for tracking
- Explanation of validation process
- Instructions for forwarding additional spam
- Timeline for next steps (1-2 business days)

**Variables Available:**
- `{{toName}}` - Recipient's name
- `{{caseNumber}}` - Unique case identifier

### 2. Validation Email
**Sent when:** Spam report is validated as a TCPA violation  
**Subject:** "Your TCPA violation has been validated!"

**Purpose:** Notify victim that their case has merit and provide estimated value.

**Key Information Included:**
- Case number
- Estimated potential value ($500-$1,500 per message)
- Next steps in the process
- Reminder to forward additional spam

**Variables Available:**
- `{{toName}}` - Recipient's name
- `{{caseNumber}}` - Unique case identifier
- `{{potentialValue}}` - Estimated case value (formatted currency)
- `{{violationType}}` - Type of violation (typically "TCPA")

### 3. Attorney Match Email
**Sent when:** Victim is matched with a TCPA attorney  
**Subject:** "You've been matched with a TCPA attorney"

**Purpose:** Introduce the matched attorney and explain what to expect.

**Key Information Included:**
- Case number
- Attorney name and firm
- Contact information (if provided)
- What to expect from the attorney relationship
- No-cost guarantee explanation

**Variables Available:**
- `{{toName}}` - Recipient's name
- `{{caseNumber}}` - Unique case identifier
- `{{attorneyName}}` - Attorney's full name
- `{{attorneyFirm}}` - Attorney's law firm
- `{{attorneyPhone}}` - Attorney's phone number (optional)
- `{{attorneyEmail}}` - Attorney's email address (optional)

### 4. Settlement Email
**Sent when:** Case reaches settlement  
**Subject:** "Settlement reached in your case!"

**Purpose:** Notify victim of successful case resolution and provide payout details.

**Key Information Included:**
- Case number
- Settlement amount
- Payout timeline
- Instructions for receiving settlement
- Invitation to share success story

**Variables Available:**
- `{{toName}}` - Recipient's name
- `{{caseNumber}}` - Unique case identifier
- `{{settlementAmount}}` - Settlement amount (formatted currency)
- `{{payoutTimeline}}` - Expected timeline for payout

## Implementation Notes

### Email Service Integration
These templates are designed to work with the SpamSuit email service layer (`/src/app/api/emails/lib/email-service.ts`) which:
- Handles template interpolation
- Provides logging capabilities (for development)
- Will integrate with email providers (Resend/SendGrid) in production
- Includes validation for required fields

### Customization
To customize these templates:
1. Modify the HTML/CSS in the template strings
2. Update text versions as needed
3. Adjust variable names if needed (ensure consistency)
4. Test with your email service provider

### Responsive Design
All templates use:
- Mobile-first responsive design
- Table-based layout for email client compatibility
- Inline CSS for maximum compatibility
- Web-safe fonts with system fallbacks

### Accessibility
Templates include:
- Semantic HTML structure
- Sufficient color contrast
- Descriptive link text
- Logical reading order

## Usage Examples

### With Resend
```javascript
import { Resend } from 'resend'
import { welcomeEmailHTML, welcomeEmailText } from '@/lib/email-templates'

const resend = new Resend(process.env.RESEND_API_KEY)

await resend.emails.send({
  from: 'SpamSuit <notifications@spamsuit.com>',
  to: recipientEmail,
  subject: 'Your spam report has been received',
  html: welcomeEmailHTML({ toName: 'John', caseNumber: 'ABC123' }),
  text: welcomeEmailText({ toName: 'John', caseNumber: 'ABC123' }),
})
```

### With SendGrid
```javascript
import sgMail from '@sendgrid/mail'
import { welcomeEmailHTML, welcomeEmailText } from '@/lib/email-templates'

sgMail.setApiKey(process.env.SENDGRID_API_KEY)

const msg = {
  to: recipientEmail,
  from: 'notifications@spamsuit.com',
  subject: 'Your spam report has been received',
  html: welcomeEmailHTML({ toName: 'John', caseNumber: 'ABC123' }),
  text: welcomeEmailText({ toName: 'John', caseNumber: 'ABC123' }),
}

await sgMail.send(msg)
```

## Testing

To test email rendering:
1. Use email testing services like Litmus or Email on Acid
2. Send test emails to various clients (Gmail, Outlook, Apple Mail)
3. Verify mobile rendering
4. Check that all variables render correctly
5. Ensure no broken layouts or missing content

## Maintenance

When updating templates:
1. Keep variable names consistent between HTML and text versions
2. Test thoroughly before deploying to production
3. Consider A/B testing for subject lines and CTAs
4. Monitor email delivery and open rates
5. Update disclaimer text as needed for legal compliance

---
*Last updated: April 2026*
*Part of SpamSuit notification system*