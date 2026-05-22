import { Bell } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function Notificacoes() {
  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-6 w-6 text-primary" />
            Notificações
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-muted-foreground">
          <p>
            Nenhum alerta no momento. Aqui aparecerão novos depósitos e lembretes
            de prazos de defesa.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
