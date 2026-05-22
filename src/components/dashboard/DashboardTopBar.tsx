import {
  ChevronDown,
  FileUp,
  Sparkles,
  Upload,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function DashboardTopBar({
  onOpenAI,
  onOpenWord,
  onOpenExcel,
}: {
  onOpenAI: () => void
  onOpenWord: () => void
  onOpenExcel: () => void
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Biblioteca de teses
        </h1>
        <p className="text-sm text-muted-foreground">
          Gestão e consulta do acervo jurídico-acadêmico
        </p>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button className="min-h-11 w-full bg-gradient-to-r from-fenix-purple-dark to-fenix-purple-light text-white shadow-sm sm:w-auto sm:min-h-10">
            Nova tese
            <ChevronDown className="ml-2 h-4 w-4 opacity-90" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Criar ou importar</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="min-h-10 cursor-pointer gap-2"
            onClick={onOpenAI}
          >
            <Sparkles className="h-4 w-4 text-accent" />
            Gerar com IA
          </DropdownMenuItem>
          <DropdownMenuItem
            className="min-h-10 cursor-pointer gap-2"
            onClick={onOpenWord}
          >
            <FileUp className="h-4 w-4" />
            Upload Word
          </DropdownMenuItem>
          <DropdownMenuItem
            className="min-h-10 cursor-pointer gap-2"
            onClick={onOpenExcel}
          >
            <Upload className="h-4 w-4" />
            Importar Excel
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
