import { createFileRoute } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { ModeToggle } from '@/components/mode-toggle'

export const Route = createFileRoute('/')({
  component: Home,
})

function Home() {
  return (
    <div className="p-2">
      <h3>Welcome Home!</h3>
      <Button>Oi</Button>
      <ModeToggle/>
    </div>
  )
}
