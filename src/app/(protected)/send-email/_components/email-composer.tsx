'use client'

import { useEffect, useState } from 'react'

import { Edit3, RotateCcw, Send, Wand2 } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface EmailComposerProps {
  selectedQuote: {
    id: string
    projectTitle: string
    clientName?: string | null
    clientEmail?: string | null
    amount?: string | null
    currency: string
    status: string
    createdAt: Date
  } | null
  companyName?: string
  onSendEmail: (emailData: EmailData) => Promise<void>
  isSending: boolean
}

export interface EmailData {
  to: string
  subject: string
  body: string
  quoteId: string
}

const emailTemplates = {
  draft: {
    subject: 'Project Quote - {projectTitle}',
    body: `Dear {clientName},

I hope this email finds you well. I'm excited to share a quote for your {projectTitle} project.

Based on our discussion and requirements, I've prepared a detailed quote that includes:

• Project scope and deliverables
• Timeline and milestones
• Investment required: {amount}

I've attached the complete quote document for your review. Please take your time to go through it, and don't hesitate to reach out if you have any questions or would like to discuss any aspects of the proposal.

I'm available for a call to walk through the details or address any concerns you might have.

Looking forward to hearing from you.

Best regards,
{companyName}`,
  },
  sent: {
    subject: 'Follow-up: {projectTitle} Quote',
    body: `Hi {clientName},

I wanted to follow up on the quote I sent for your {projectTitle} project.

I understand you're likely reviewing the proposal and may have questions. I'm here to help clarify anything about:

• The project scope and deliverables
• Timeline and milestones
• Investment of {amount}
• Any modifications you'd like to discuss

Would you be available for a brief call this week to discuss the quote or address any questions you might have?

I'm flexible with timing and happy to work around your schedule.

Best regards,
{companyName}`,
  },
  revised: {
    subject: 'Updated Quote - {projectTitle}',
    body: `Dear {clientName},

Thank you for your feedback on the {projectTitle} quote. I've revised the proposal based on our discussion.

Key updates include:
• {revisionNotes}

The updated investment is {amount}.

I've attached the revised quote for your review. Please let me know if this better aligns with your needs and budget.

I'm available to discuss any further adjustments or answer any questions you may have.

Best regards,
{companyName}`,
  },
  accepted: {
    subject: 'Thank you! {projectTitle} Project Confirmed',
    body: `Dear {clientName},

Excellent! I'm thrilled that you've decided to move forward with the {projectTitle} project.

This email confirms our agreement for:
• Project: {projectTitle}
• Investment: {amount}
• Timeline: As outlined in the quote

Next steps:
1. I'll send over the contract and payment terms
2. We'll schedule our kickoff meeting
3. Project work will begin as agreed

I'm excited to work with you on this project and deliver exceptional results.

Thank you for choosing {companyName}!

Best regards,
{companyName}`,
  },
  rejected: {
    subject: 'Thank you for considering {projectTitle}',
    body: `Dear {clientName},

Thank you for considering {companyName} for your {projectTitle} project. I appreciate you taking the time to review our quote.

I understand that the proposal didn't align with your current needs or budget. I'd be happy to:

• Discuss alternative approaches that might better fit your requirements
• Provide a revised quote with different scope or pricing
• Keep you in mind for future projects

If your situation changes or you have other projects in the future, please don't hesitate to reach out. I'm always happy to help.

Thank you again for the opportunity.

Best regards,
{companyName}`,
  },
}

export function EmailComposer({
  selectedQuote,
  companyName = 'Your Company',
  onSendEmail,
  isSending,
}: EmailComposerProps) {
  const [emailData, setEmailData] = useState<EmailData>({
    to: '',
    subject: '',
    body: '',
    quoteId: '',
  })
  const [isGenerating, setIsGenerating] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  // Update email data when quote changes
  useEffect(() => {
    if (selectedQuote) {
      const template =
        emailTemplates[selectedQuote.status as keyof typeof emailTemplates] ||
        emailTemplates.draft

      const formatCurrency = (
        amount: string | null,
        currency?: string | null | undefined,
      ) => {
        if (!amount) return 'TBD'
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: currency || 'USD',
        }).format(parseFloat(amount))
      }

      const replacements = {
        '{projectTitle}': selectedQuote.projectTitle,
        '{clientName}': selectedQuote.clientName || 'there',
        '{amount}': formatCurrency(
          selectedQuote.amount ?? null,
          selectedQuote.currency,
        ),
        '{companyName}': companyName,
        '{revisionNotes}': 'Updated scope and pricing based on your feedback',
      }

      let subject = template.subject
      let body = template.body

      Object.entries(replacements).forEach(([key, value]) => {
        subject = subject.replace(key, value)
        body = body.replace(key, value)
      })

      setEmailData({
        to: selectedQuote.clientEmail || '',
        subject,
        body,
        quoteId: selectedQuote.id,
      })
    }
  }, [selectedQuote, companyName])

  const handleGenerateAI = async () => {
    if (!selectedQuote) return

    setIsGenerating(true)
    try {
      // TODO: Implement AI generation
      // const aiContent = await generateAIEmail(selectedQuote)
      // setEmailData(prev => ({ ...prev, ...aiContent }))

      // For now, just use the template
      setTimeout(() => {
        setIsGenerating(false)
      }, 1000)
    } catch (error) {
      console.error('Error generating AI content:', error)
      setIsGenerating(false)
    }
  }

  const handleSend = async () => {
    if (!emailData.to || !emailData.subject || !emailData.body) {
      return
    }

    await onSendEmail(emailData)
  }

  const handleReset = () => {
    if (selectedQuote) {
      // Reset to original template by triggering the useEffect again
      const template =
        emailTemplates[selectedQuote.status as keyof typeof emailTemplates] ||
        emailTemplates.draft

      const formatCurrency = (
        amount: string | null,
        currency?: string | null | undefined,
      ) => {
        if (!amount) return 'TBD'
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: currency || 'USD',
        }).format(parseFloat(amount))
      }

      const replacements = {
        '{projectTitle}': selectedQuote.projectTitle,
        '{clientName}': selectedQuote.clientName || 'there',
        '{amount}': formatCurrency(
          selectedQuote.amount ?? null,
          selectedQuote.currency,
        ),
        '{companyName}': companyName,
        '{revisionNotes}': 'Updated scope and pricing based on your feedback',
      }

      let subject = template.subject
      let body = template.body

      Object.entries(replacements).forEach(([key, value]) => {
        subject = subject.replace(key, value)
        body = body.replace(key, value)
      })

      setEmailData({
        to: selectedQuote.clientEmail || '',
        subject,
        body,
        quoteId: selectedQuote.id,
      })
    }
  }

  if (!selectedQuote) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground text-center">
            Select a quote to compose an email
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="px-3 sm:px-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>Compose Email</CardTitle>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Badge variant="outline">{selectedQuote.status}</Badge>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerateAI}
                disabled={isGenerating}
                className="flex-1 sm:flex-none"
              >
                <Wand2 className="mr-1 h-4 w-4" />
                {isGenerating ? 'Generating...' : 'AI Generate'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(!isEditing)}
                className="flex-1 sm:flex-none"
              >
                <Edit3 className="mr-1 h-4 w-4" />
                {isEditing ? 'Preview' : 'Edit'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                className="flex-1 sm:flex-none"
              >
                <RotateCcw className="mr-1 h-4 w-4" />
                Reset
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 px-3 sm:px-4">
        <div className="space-y-2">
          <Label htmlFor="to">To</Label>
          <Input
            id="to"
            type="email"
            value={emailData.to}
            onChange={(e) =>
              setEmailData((prev) => ({ ...prev, to: e.target.value }))
            }
            placeholder="client@example.com"
            disabled={!isEditing}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="subject">Subject</Label>
          <Input
            id="subject"
            value={emailData.subject}
            onChange={(e) =>
              setEmailData((prev) => ({ ...prev, subject: e.target.value }))
            }
            placeholder="Email subject"
            disabled={!isEditing}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="body">Message</Label>
          <Textarea
            id="body"
            value={emailData.body}
            onChange={(e) =>
              setEmailData((prev) => ({ ...prev, body: e.target.value }))
            }
            placeholder="Email body"
            className="min-h-[300px]"
            disabled={!isEditing}
          />
        </div>

        <div className="flex justify-end">
          <Button
            onClick={handleSend}
            disabled={
              isSending ||
              !emailData.to ||
              !emailData.subject ||
              !emailData.body
            }
            className="w-full sm:w-auto"
          >
            <Send className="mr-2 h-4 w-4" />
            {isSending ? 'Sending...' : 'Send Email'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
