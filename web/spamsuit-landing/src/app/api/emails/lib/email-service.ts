// Email service for logging emails (will integrate with Resend/SendGrid later)

import { emailTemplates, compileEmail } from './email-templates'
import {
  WelcomeEmailRequest,
  ValidatedEmailRequest,
  AttorneyMatchEmailRequest,
  SettlementEmailRequest,
  EmailResult,
} from '../types'

interface LoggedEmail {
  id: string
  timestamp: string
  to: string
  toName: string
  subject: string
  htmlBody: string
  textBody: string
  metadata: Record<string, unknown>
}

// Simple interpolation for text templates
function interpolate(template: string, data: Record<string, string | undefined>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return data[key] !== undefined ? String(data[key]) : match
  })
}

// Simple interpolation for HTML templates (basic version without Handlebars conditionals)
function interpolateHtml(template: string, data: Record<string, string | undefined>): string {
  let result = template
  
  // Handle {{#if}} blocks - remove them if value is undefined/null, keep content otherwise
  result = result.replace(/\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (match, key, content) => {
    return data[key] !== undefined && data[key] !== '' ? content : ''
  })
  
  // Handle simple variable interpolation
  result = result.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return data[key] !== undefined ? String(data[key]) : ''
  })
  
  return result
}

// Generate unique email ID
function generateEmailId(): string {
  return `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// Log email to console (will be replaced with actual email sending)
function logEmail(email: LoggedEmail): void {
  console.log('\n' + '='.repeat(80))
  console.log('📧 EMAIL SENT')
  console.log('='.repeat(80))
  console.log(`ID: ${email.id}`)
  console.log(`To: ${email.toName} <${email.to}>`)
  console.log(`Subject: ${email.subject}`)
  console.log(`Timestamp: ${email.timestamp}`)
  console.log('\n--- HTML BODY ---\n')
  console.log(email.htmlBody)
  console.log('\n--- TEXT BODY ---\n')
  console.log(email.textBody)
  console.log('\n--- METADATA ---\n')
  console.log(JSON.stringify(email.metadata, null, 2))
  console.log('='.repeat(80) + '\n')
}

// Send welcome email
export async function sendWelcomeEmail(request: WelcomeEmailRequest): Promise<EmailResult> {
  try {
    const { to, toName = 'there', caseNumber } = request
    
    const data = {
      toName,
      caseNumber,
    }
    
    const subject = emailTemplates.welcome.subject
    const htmlBody = interpolateHtml(emailTemplates.welcome.html, data)
    const textBody = interpolate(emailTemplates.welcome.text, data)
    
    const email: LoggedEmail = {
      id: generateEmailId(),
      timestamp: new Date().toISOString(),
      to,
      toName,
      subject,
      htmlBody: compileEmail(htmlBody, subject),
      textBody,
      metadata: { type: 'welcome', caseNumber },
    }
    
    logEmail(email)
    
    return { success: true, messageId: email.id }
  } catch (error) {
    console.error('Failed to send welcome email:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

// Send validated email
export async function sendValidatedEmail(request: ValidatedEmailRequest): Promise<EmailResult> {
  try {
    const { to, toName = 'there', caseNumber, potentialValue, violationType = 'TCPA' } = request
    
    const data = {
      toName,
      caseNumber,
      potentialValue,
      violationType,
    }
    
    const subject = emailTemplates.validated.subject
    const htmlBody = interpolateHtml(emailTemplates.validated.html, data)
    const textBody = interpolate(emailTemplates.validated.text, data)
    
    const email: LoggedEmail = {
      id: generateEmailId(),
      timestamp: new Date().toISOString(),
      to,
      toName,
      subject,
      htmlBody: compileEmail(htmlBody, subject),
      textBody,
      metadata: { type: 'validated', caseNumber, potentialValue, violationType },
    }
    
    logEmail(email)
    
    return { success: true, messageId: email.id }
  } catch (error) {
    console.error('Failed to send validated email:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

// Send attorney match email
export async function sendAttorneyMatchEmail(request: AttorneyMatchEmailRequest): Promise<EmailResult> {
  try {
    const { 
      to, 
      toName = 'there', 
      caseNumber, 
      attorneyName, 
      attorneyFirm, 
      attorneyPhone, 
      attorneyEmail 
    } = request
    
    const data: Record<string, string | undefined> = {
      toName,
      caseNumber,
      attorneyName,
      attorneyFirm,
      attorneyPhone,
      attorneyEmail,
    }
    
    const subject = emailTemplates.attorneyMatch.subject
    const htmlBody = interpolateHtml(emailTemplates.attorneyMatch.html, data)
    const textBody = interpolate(emailTemplates.attorneyMatch.text, data)
    
    const email: LoggedEmail = {
      id: generateEmailId(),
      timestamp: new Date().toISOString(),
      to,
      toName,
      subject,
      htmlBody: compileEmail(htmlBody, subject),
      textBody,
      metadata: { 
        type: 'attorney-match', 
        caseNumber, 
        attorneyName, 
        attorneyFirm 
      },
    }
    
    logEmail(email)
    
    return { success: true, messageId: email.id }
  } catch (error) {
    console.error('Failed to send attorney match email:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

// Send settlement email
export async function sendSettlementEmail(request: SettlementEmailRequest): Promise<EmailResult> {
  try {
    const { to, toName = 'there', caseNumber, settlementAmount, payoutTimeline } = request
    
    const data = {
      toName,
      caseNumber,
      settlementAmount,
      payoutTimeline,
    }
    
    const subject = emailTemplates.settlement.subject
    const htmlBody = interpolateHtml(emailTemplates.settlement.html, data)
    const textBody = interpolate(emailTemplates.settlement.text, data)
    
    const email: LoggedEmail = {
      id: generateEmailId(),
      timestamp: new Date().toISOString(),
      to,
      toName,
      subject,
      htmlBody: compileEmail(htmlBody, subject),
      textBody,
      metadata: { type: 'settlement', caseNumber, settlementAmount },
    }
    
    logEmail(email)
    
    return { success: true, messageId: email.id }
  } catch (error) {
    console.error('Failed to send settlement email:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}
