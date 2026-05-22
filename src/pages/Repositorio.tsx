import { FileText } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function Repositorio() {
  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            Repositório digital
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-muted-foreground">
          <p>
            Em breve: gestão centralizada de PDFs, anexos e mídias vinculadas às
            teses.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
