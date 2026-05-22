/** Cabeçalho de páginas internas — identidade Fênix / shadcn. */
export function PageHeader({
  title,
  description,
}: {
  title: string
  description?: string
}) {
  return (
    <div className="mb-8 border-b border-border pb-6">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        Fênix I.A
      </p>
      <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground md:text-3xl">
        {title}
      </h1>
      {description && (
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          {description}
        </p>
      )}
    </div>
  )
}
