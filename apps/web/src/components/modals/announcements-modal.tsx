import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@fsx/ui/components/dialog"

interface Props {
  year: number
  number: string
  content: string
  open: boolean
  onOpenChange: (open: boolean) => void
  trigger: React.ReactElement
}

export function AnnouncementsModal({
  number,
  content,
  onOpenChange,
  open,
  trigger,
}: Props) {
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogTrigger render={trigger} />
      <DialogContent className="max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            Comunicado FSX nº {number}
          </DialogTitle>
        </DialogHeader>
        <div className="prose prose-sm text-muted-foreground">{content}</div>
      </DialogContent>
    </Dialog>
  )
}
