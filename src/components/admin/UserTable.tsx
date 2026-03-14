'use client'

import type { ReactElement } from 'react'
import { useState } from 'react'
import { toast } from 'sonner'
import InitialsAvatar from '@/components/ui/InitialsAvatar'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export type UserRow = {
  id: string
  name: string
  email: string
  role: 'PRACTITIONER' | 'CLIENT' | 'ADMIN'
  createdAt: string
  createdAtLabel: string
}

type UserTableProps = {
  users: UserRow[]
}

export default function UserTable({ users }: UserTableProps): ReactElement {
  const [rows, setRows] = useState<UserRow[]>(users)

  const roleBadge = (role: UserRow['role']): string => {
    if (role === 'PRACTITIONER') return 'bg-[#ccfbf1] text-[#0f766e]'
    if (role === 'CLIENT') return 'bg-[#eff6ff] text-[#1d4ed8]'
    return 'bg-[#fef3c7] text-[#d97706]'
  }

  const updateRole = async (id: string, role: UserRow['role']): Promise<void> => {
    const response = await fetch(`/api/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    })

    if (!response.ok) {
      toast.error('Unable to update role')
      return
    }

    setRows((prev) => prev.map((row) => (row.id === id ? { ...row, role } : row)))
    toast.success('Role updated')
  }

  return (
    <Table>
      <TableHeader className="bg-slate-50">
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Created At</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.length === 0 ? (
          <TableRow>
            <TableCell colSpan={5} className="text-sm text-slate-500">
              No users found.
            </TableCell>
          </TableRow>
        ) : (
          rows.map((user, index) => (
            <TableRow
              key={user.id}
              className={`${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'} hover:bg-slate-100`}
            >
              <TableCell className="font-medium text-slate-900">
                <div className="flex items-center gap-2">
                  <InitialsAvatar name={user.name} size="sm" />
                  <span>{user.name}</span>
                </div>
              </TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={roleBadge(user.role)}>
                    {user.role}
                  </Badge>
                  <Select
                    onValueChange={(value) => updateRole(user.id, value as UserRow['role'])}
                    value={user.role}
                  >
                    <SelectTrigger className="w-36">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PRACTITIONER">PRACTITIONER</SelectItem>
                      <SelectItem value="CLIENT">CLIENT</SelectItem>
                      <SelectItem value="ADMIN">ADMIN</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </TableCell>
              <TableCell>{user.createdAtLabel}</TableCell>
              <TableCell className="text-xs text-slate-500">Updated on change</TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  )
}
