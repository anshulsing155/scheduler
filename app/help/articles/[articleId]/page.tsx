import { notFound } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, BookOpen } from 'lucide-react'
import Link from 'next/link'
import { helpArticlesContent } from '@/components/help/help-articles'

export default function HelpArticlePage({ params }: { params: { articleId: string } }) {
  const article = helpArticlesContent[params.articleId as keyof typeof helpArticlesContent]

  if (!article) {
    notFound()
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Link href="/help">
        <Button variant="ghost" className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Help Center
        </Button>
      </Link>

      <Card className="p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center">
            <BookOpen className="h-6 w-6 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold">{article.title}</h1>
        </div>

        <div className="prose prose-blue max-w-none">
          {article.content.split('\n').map((line, index) => {
            if (line.startsWith('# ')) {
              return <h1 key={index} className="text-3xl font-bold mt-8 mb-4">{line.substring(2)}</h1>
            } else if (line.startsWith('## ')) {
              return <h2 key={index} className="text-2xl font-semibold mt-6 mb-3">{line.substring(3)}</h2>
            } else if (line.startsWith('### ')) {
              return <h3 key={index} className="text-xl font-semibold mt-4 mb-2">{line.substring(4)}</h3>
            } else if (line.startsWith('- ')) {
              return <li key={index} className="ml-6 mb-1">{line.substring(2)}</li>
            } else if (line.match(/^\d+\. /)) {
              return <li key={index} className="ml-6 mb-1 list-decimal">{line.replace(/^\d+\. /, '')}</li>
            } else if (line.trim() === '') {
              return <br key={index} />
            } else {
              return <p key={index} className="mb-3">{line}</p>
            }
          })}
        </div>
      </Card>

      <Card className="mt-6 p-6 bg-blue-50 border-blue-200">
        <h3 className="font-semibold mb-2">Was this article helpful?</h3>
        <p className="text-sm text-gray-600 mb-4">
          Let us know if you need more information or have suggestions for improvement.
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">Yes, helpful</Button>
          <Button variant="outline" size="sm">No, needs improvement</Button>
        </div>
      </Card>
    </div>
  )
}
