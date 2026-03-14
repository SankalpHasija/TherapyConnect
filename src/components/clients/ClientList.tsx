'use client'

import type { ReactElement } from 'react'
import { useMemo, useState } from 'react'
import Link from 'next/link'
import InitialsAvatar from '@/components/ui/InitialsAvatar'
import PhqBadge from '@/components/ui/PhqBadge'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

type ClientItem = {
  id: string
  name: string
  diagnosis: string | null
  lastSeenLabel: string | null
  phqScore: number | null
}

type ClientListProps = {
  clients: ClientItem[]
}

export default function ClientList({ clients }: ClientListProps): ReactElement {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const lowered = query.toLowerCase()
    return clients.filter((client) => client.name.toLowerCase().includes(lowered))
  }, [clients, query])

  return (
    <div className="space-y-4">
      <div className="max-w-sm">
        <Input
          placeholder="Search clients"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.length === 0 ? (
          <p className="text-sm text-slate-500">No clients match your search.</p>
        ) : (
          filtered.map((client) => (
            <Card
              key={client.id}
              className="border border-slate-200 transition hover:border-teal-200 hover:shadow-sm"
            >
              <CardHeader className="flex flex-row items-center gap-3">
                <InitialsAvatar name={client.name} size="lg" />
                <div>
                  <p className="text-[14px] font-medium text-slate-900">{client.name}</p>
                  {client.diagnosis ? (
                    <Badge variant="outline" className="mt-1 max-w-[200px] truncate">
                      {client.diagnosis.length > 25
                        ? `${client.diagnosis.slice(0, 25)}...`
                        : client.diagnosis}
                    </Badge>
                  ) : (
                    <p className="text-xs text-slate-500">No diagnosis on file</p>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <p className="text-xs text-slate-500">Last seen</p>
                  <p className="text-sm text-slate-700">
                    {client.lastSeenLabel ?? 'No sessions yet'}
                  </p>
                </div>
                <div>
                  {typeof client.phqScore === 'number' ? (
                    <PhqBadge score={client.phqScore} type="PHQ9" />
                  ) : (
                    <Badge variant="outline" className="text-xs">
                      PHQ-9: —
                    </Badge>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  render={<Link href={`/clients/${client.id}`} />}
                  nativeButton={false}
                  className="w-full btn-teal"
                >
                  View Profile
                </Button>
              </CardFooter>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
