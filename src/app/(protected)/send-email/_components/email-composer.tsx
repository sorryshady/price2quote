'use client'

import { useEffect, useState } from 'react'

import {
  Edit3,
  MessageSquare,
  Paperclip,
  RotateCcw,
  Send,
  Wand2,
  X,
} from 'lucide-react'
import toast from 'react-hot-toast'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CustomToast } from '@/components/ui/custom-toast'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

import { getExistingThreadForQuoteAction } from '@/app/server-actions/email-threads'
import { generateAIEmailAction } from '@/app/server-actions/gmail'
import type { Quote } from '@/types'

interface EmailComposerProps {
  selectedQuote: Quote | null
  companyName?: string
  companyDescription?: string
  companyBusinessType?: string
  companyCountry?: string
  companyAiSummary?: string
  companyPhone?: string
  onSendEmail: (emailData: EmailData) => Promise<void>
  isSending: boolean
  onReset?: () => void
}

export interface EmailData {
  to: string
  cc?: string
  bcc?: string
  subject: string
  body: string
  quoteId: string
  attachments: File[]
  includeQuotePdf: boolean
}

interface AttachmentFile {
  file: File
  id: string
  name: string
  size: string
  type: string
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'draft':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
    case 'sent':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
    case 'accepted':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    case 'rejected':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    case 'revised':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
  }
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

{contactMethod}

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

{contactMethod}

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

{contactMethod}

{versionInfo}

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

const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

export function EmailComposer({
  selectedQuote,
  companyName = 'Your Company',
  companyDescription,
  companyBusinessType = 'company',
  companyCountry = 'US',
  companyAiSummary,
  companyPhone,
  onSendEmail,
  isSending,
  onReset,
}: EmailComposerProps) {
  const [emailData, setEmailData] = useState<EmailData>({
    to: '',
    cc: '',
    bcc: '',
    subject: '',
    body: '',
    quoteId: '',
    attachments: [],
    includeQuotePdf: false,
  })
  const [isGenerating, setIsGenerating] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [attachments, setAttachments] = useState<AttachmentFile[]>([])
  const [threadContext, setThreadContext] = useState<{
    hasExistingThread: boolean
    threadCount: number
    lastSentAt: Date | null
  } | null>(null)

  // Check for existing email thread
  const checkThreadContext = async (quote: Quote, clientEmail: string) => {
    try {
      const threadResult = await getExistingThreadForQuoteAction(
        quote.id,
        clientEmail,
      )
      if (threadResult.success) {
        setThreadContext({
          hasExistingThread: threadResult.hasExistingThread || false,
          threadCount: threadResult.threadCount || 0,
          lastSentAt: threadResult.lastSentAt || null,
        })
      }
    } catch (error) {
      console.error('Error checking thread context:', error)
      setThreadContext(null)
    }
  }

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
        '{versionInfo}':
          selectedQuote.versionNumber && Number(selectedQuote.versionNumber) > 1
            ? `\n\nThis is revision ${selectedQuote.versionNumber} of the original quote.`
            : '',
        '{contactMethod}': companyPhone
          ? `I'm available for a call to walk through the details or address any concerns you might have. Feel free to reach out to me at ${companyPhone}.`
          : `Please feel free to reach out via email if you have any questions or would like to discuss any aspects of the proposal.`,
      }

      let subject = template.subject
      let body = template.body

      Object.entries(replacements).forEach(([key, value]) => {
        subject = subject.replace(key, value)
        body = body.replace(key, value)
      })

      setEmailData({
        to: selectedQuote.clientEmail || '',
        cc: '',
        bcc: '',
        subject,
        body,
        quoteId: selectedQuote.id,
        attachments: [],
        includeQuotePdf: false,
      })
      setAttachments([])

      // Check for existing email thread
      if (selectedQuote.clientEmail) {
        checkThreadContext(selectedQuote, selectedQuote.clientEmail)
      } else {
        setThreadContext(null)
      }
    }
  }, [selectedQuote, companyName, companyPhone])

  const handleGenerateAI = async () => {
    if (!selectedQuote) return

    setIsGenerating(true)
    try {
      const result = await generateAIEmailAction({
        quote: selectedQuote,
        companyName,
        companyDescription,
        companyBusinessType,
        companyCountry,
        companyAiSummary,
        companyPhone,
        emailType: selectedQuote.status as
          | 'draft'
          | 'sent'
          | 'revised'
          | 'accepted'
          | 'rejected',
      })

      if (result.success && result.email) {
        setEmailData((prev) => ({
          ...prev,
          subject: result.email.subject,
          body: result.email.body,
        }))
        toast.custom(
          <CustomToast
            message="AI email generated successfully!"
            type="success"
          />,
        )
      } else {
        toast.custom(
          <CustomToast
            message={result.error || 'Failed to generate AI email'}
            type="error"
          />,
        )
      }
    } catch (error) {
      console.error('Error generating AI content:', error)
      toast.custom(
        <CustomToast message="Failed to generate AI email" type="error" />,
      )
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSend = async () => {
    if (!emailData.to || !emailData.subject || !emailData.body) {
      return
    }

    // Combine attachments and quote PDF if selected
    const allAttachments = [...attachments.map((a) => a.file)]
    if (emailData.includeQuotePdf) {
      // The quote PDF will be generated on the server side
    }

    await onSendEmail({
      ...emailData,
      attachments: allAttachments,
    })

    // Reset form after successful send
    if (onReset) {
      onReset()
    }
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
        '{revisionNotes}':
          selectedQuote.revisionNotes ||
          'Updated scope and pricing based on your feedback',
        '{versionInfo}':
          selectedQuote.versionNumber && Number(selectedQuote.versionNumber) > 1
            ? `\n\nThis is revision ${selectedQuote.versionNumber} of the original quote.`
            : '',
        '{contactMethod}': companyPhone
          ? `I'm available for a call to walk through the details or address any concerns you might have. Feel free to reach out to me at ${companyPhone}.`
          : `Please feel free to reach out via email if you have any questions or would like to discuss any aspects of the proposal.`,
      }

      let subject = template.subject
      let body = template.body

      Object.entries(replacements).forEach(([key, value]) => {
        subject = subject.replace(key, value)
        body = body.replace(key, value)
      })

      setEmailData({
        to: selectedQuote.clientEmail || '',
        cc: '',
        bcc: '',
        subject,
        body,
        quoteId: selectedQuote.id,
        attachments: [],
        includeQuotePdf: false,
      })
      setAttachments([])
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])

    files.forEach((file) => {
      // Validate file type
      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        toast.custom(
          <CustomToast
            message={`${file.name} is not a supported file type. Please upload PDF, TXT, or Word documents.`}
            type="error"
          />,
        )
        return
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        toast.custom(
          <CustomToast
            message={`${file.name} is too large. Maximum file size is 5MB.`}
            type="error"
          />,
        )
        return
      }

      const attachment: AttachmentFile = {
        file,
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        size: formatFileSize(file.size),
        type: file.type,
      }

      setAttachments((prev) => [...prev, attachment])
    })

    // Reset input
    event.target.value = ''
  }

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id))
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
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
            <Badge className={getStatusColor(selectedQuote.status)}>
              {selectedQuote.status}
            </Badge>
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

      {/* Thread Context Display */}
      {threadContext?.hasExistingThread && (
        <div className="bg-muted/30 border-b px-3 py-2 sm:px-4">
          <div className="flex flex-col gap-2 text-sm sm:flex-row sm:items-center">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-blue-600">Follow-up Email</span>
            </div>
            <span className="text-muted-foreground">
              • Previous email sent{' '}
              {threadContext.lastSentAt
                ? new Date(threadContext.lastSentAt).toLocaleDateString()
                : 'recently'}
            </span>
          </div>
        </div>
      )}

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

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="cc">CC (optional)</Label>
            <Input
              id="cc"
              type="email"
              value={emailData.cc}
              onChange={(e) =>
                setEmailData((prev) => ({ ...prev, cc: e.target.value }))
              }
              placeholder="cc@example.com"
              disabled={!isEditing}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bcc">BCC (optional)</Label>
            <Input
              id="bcc"
              type="email"
              value={emailData.bcc}
              onChange={(e) =>
                setEmailData((prev) => ({ ...prev, bcc: e.target.value }))
              }
              placeholder="bcc@example.com"
              disabled={!isEditing}
            />
          </div>
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

        {/* Attachments Section */}
        <div className="space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Label>Attachments</Label>
            <div className="flex flex-col gap-2 sm:flex-row sm:gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setEmailData((prev) => ({
                    ...prev,
                    includeQuotePdf: !prev.includeQuotePdf,
                  }))
                }
                className="w-full sm:w-auto"
              >
                <Paperclip className="mr-1 h-4 w-4" />
                {emailData.includeQuotePdf ? 'Remove Quote' : 'Add Quote'}
              </Button>

              <div className="relative w-full sm:w-auto">
                <input
                  type="file"
                  multiple
                  accept=".pdf,.txt,.doc,.docx"
                  onChange={handleFileUpload}
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                  disabled={!isEditing}
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full cursor-pointer"
                  disabled={!isEditing}
                >
                  <Paperclip className="mr-1 h-4 w-4" />
                  Add Files
                </Button>
              </div>
            </div>
          </div>

          {/* Quote PDF Attachment */}
          {emailData.includeQuotePdf && (
            <div className="bg-muted flex items-center justify-between rounded-lg p-3">
              <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center">
                <Paperclip className="hidden h-4 w-4 sm:inline-block" />
                <span className="text-sm font-medium">
                  {selectedQuote.projectTitle} - Quote.pdf
                </span>
                <Badge variant="secondary" className="text-xs">
                  Quote PDF
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  setEmailData((prev) => ({ ...prev, includeQuotePdf: false }))
                }
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* File Attachments */}
          {attachments.map((attachment) => (
            <div
              key={attachment.id}
              className="bg-muted flex items-center justify-between rounded-lg p-3"
            >
              <div className="flex items-center gap-2">
                <Paperclip className="h-4 w-4" />
                <div>
                  <span className="text-sm font-medium">{attachment.name}</span>
                  <div className="text-muted-foreground text-xs">
                    {attachment.size} • {attachment.type}
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeAttachment(attachment.id)}
                disabled={!isEditing}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}

          {attachments.length === 0 && !emailData.includeQuotePdf && (
            <p className="text-muted-foreground py-4 text-center text-sm">
              No attachments. Add files or include the quote PDF.
            </p>
          )}
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
