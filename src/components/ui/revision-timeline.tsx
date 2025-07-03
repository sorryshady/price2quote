import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { QuoteVersionIndicator } from '@/components/ui/quote-version-indicator'
import { Separator } from '@/components/ui/separator'

interface RevisionInfo {
  id: string
  versionNumber: string
  revisionNotes?: string
  sentAt: Date
  subject: string
  isRevision: boolean
}

interface RevisionTimelineProps {
  revisions: RevisionInfo[]
  className?: string
}

export function RevisionTimeline({
  revisions,
  className = '',
}: RevisionTimelineProps) {
  if (revisions.length <= 1) {
    return null // Don't show timeline if there's only one version
  }

  const sortedRevisions = [...revisions].sort(
    (a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime(),
  )

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <span>Quote Evolution</span>
          <Badge variant="outline">{revisions.length} versions</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sortedRevisions.map((revision, index) => (
            <div key={revision.id} className="relative">
              {/* Timeline connector */}
              {index < sortedRevisions.length - 1 && (
                <div className="bg-muted absolute top-8 left-4 h-8 w-0.5" />
              )}

              <div className="flex gap-4">
                {/* Version indicator */}
                <div className="flex flex-col items-center">
                  <div className="bg-primary text-primary-foreground flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium">
                    {revision.versionNumber}
                  </div>
                </div>

                {/* Revision content */}
                <div className="flex-1 space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{revision.subject}</h4>
                        <QuoteVersionIndicator
                          versionNumber={revision.versionNumber}
                          isLatest={index === sortedRevisions.length - 1}
                          revisionNotes={revision.revisionNotes}
                        />
                      </div>
                      <p className="text-muted-foreground text-sm">
                        {new Date(revision.sentAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>

                  {revision.revisionNotes && (
                    <div className="bg-muted/50 rounded-md p-3">
                      <p className="text-sm">
                        <span className="font-medium">Revision Notes:</span>{' '}
                        {revision.revisionNotes}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {index < sortedRevisions.length - 1 && (
                <Separator className="mt-4" />
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
