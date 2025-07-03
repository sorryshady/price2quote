'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

import {
  CreateQuoteData,
  createRevisedQuoteAction,
  getQuoteForEditingAction,
} from '@/app/server-actions/quote'
import { useAuth } from '@/hooks/use-auth'
import type { Quote } from '@/types'

export default function EditQuotePage() {
  const { user } = useAuth()
  const router = useRouter()
  const params = useParams()
  const quoteId = params?.quoteId as string

  const [loading, setLoading] = useState(true)
  const [quote, setQuote] = useState<Quote | null>(null)
  const [form, setForm] = useState({
    projectTitle: '',
    projectDescription: '',
    revisionNotes: '',
    clientFeedback: '',
  })
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    async function fetchQuote() {
      if (!user?.id || !quoteId) return
      setLoading(true)
      const result = await getQuoteForEditingAction(quoteId, user.id)
      if (result.success && result.quote) {
        setQuote(result.quote as Quote)
        setForm({
          projectTitle: result.quote.projectTitle || '',
          projectDescription: result.quote.projectDescription || '',
          revisionNotes: result.quote.revisionNotes || '',
          clientFeedback: result.quote.clientFeedback || '',
        })
      } else {
        setError(result.error || 'Failed to load quote.')
      }
      setLoading(false)
    }
    fetchQuote()
  }, [user?.id, quoteId])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.id || !quote) return
    setSubmitting(true)
    const result = await createRevisedQuoteAction({
      originalQuoteId: quote.id,
      userId: user.id,
      companyId: quote.companyId,
      projectTitle: form.projectTitle,
      projectDescription: form.projectDescription,
      clientName: quote.clientName || undefined,
      clientEmail: quote.clientEmail || undefined,
      clientLocation: '', // TODO: Add to form if needed
      deliveryTimeline: '', // TODO: Add to form if needed
      customTimeline: undefined,
      clientBudget: undefined,
      projectComplexity: '', // TODO: Add to form if needed
      currency: quote.currency,
      selectedServices:
        quote.quoteServices?.map((qs) => ({
          serviceId: qs.serviceId,
          quantity: Number(qs.quantity),
          unitPrice: qs.unitPrice ? Number(qs.unitPrice) : undefined,
          notes: qs.notes,
        })) || [],
      revisionNotes: form.revisionNotes,
      clientFeedback: form.clientFeedback,
      quoteData: quote.quoteData as CreateQuoteData['quoteData'],
    })
    setSubmitting(false)
    if (result.success) {
      router.push('/quotes')
    } else {
      setError(result.error || 'Failed to revise quote.')
    }
  }

  if (loading) return <div>Loading...</div>
  if (error) return <div className="text-red-600">{error}</div>
  if (!quote) return <div>Quote not found.</div>

  return (
    <div className="mx-auto max-w-2xl py-8">
      <h1 className="mb-4 text-2xl font-bold">Edit Quote</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block font-medium">Project Title</label>
          <Input
            name="projectTitle"
            value={form.projectTitle}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label className="mb-1 block font-medium">Project Description</label>
          <Textarea
            name="projectDescription"
            value={form.projectDescription}
            onChange={handleChange}
            rows={4}
          />
        </div>
        <div>
          <label className="mb-1 block font-medium">Revision Notes</label>
          <Textarea
            name="revisionNotes"
            value={form.revisionNotes}
            onChange={handleChange}
            rows={3}
            placeholder="Describe the changes or reason for revision."
          />
        </div>
        <div>
          <label className="mb-1 block font-medium">Client Feedback</label>
          <Textarea
            name="clientFeedback"
            value={form.clientFeedback}
            onChange={handleChange}
            rows={3}
            placeholder="Paste or summarize client feedback here."
          />
        </div>
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Saving...' : 'Save Revised Quote'}
        </Button>
      </form>
    </div>
  )
}
