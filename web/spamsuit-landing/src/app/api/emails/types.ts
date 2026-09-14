// Email types for SpamSuit notification system

export interface EmailRequest {
  to: string
  toName?: string
}

export interface WelcomeEmailRequest extends EmailRequest {
  caseNumber: string
}

export interface ValidatedEmailRequest extends EmailRequest {
  caseNumber: string
  potentialValue: string
  violationType: string
}

export interface AttorneyMatchEmailRequest extends EmailRequest {
  caseNumber: string
  attorneyName: string
  attorneyFirm: string
  attorneyPhone?: string
  attorneyEmail?: string
}

export interface SettlementEmailRequest extends EmailRequest {
  caseNumber: string
  settlementAmount: string
  payoutTimeline: string
}

export interface EmailResult {
  success: boolean
  messageId?: string
  error?: string
}
