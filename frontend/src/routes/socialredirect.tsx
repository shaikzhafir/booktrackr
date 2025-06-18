import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/socialredirect')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/socialredirect"!</div>
}
