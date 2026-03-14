'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { getSession, signIn } from 'next-auth/react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { LoginSchema } from '@/lib/validations'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { toast } from 'sonner'

type LoginValues = z.infer<typeof LoginSchema>
type UserRole = 'PRACTITIONER' | 'CLIENT' | 'ADMIN'

const isUserRole = (value: string | undefined): value is UserRole =>
  value === 'PRACTITIONER' || value === 'CLIENT' || value === 'ADMIN'
export default function LoginPage() {
  const router = useRouter()
  const form = useForm<LoginValues>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const onSubmit = async (values: LoginValues): Promise<void> => {
    const result = await signIn('credentials', {
      email: values.email,
      password: values.password,
      redirect: false,
    })

    if (result?.error) {
      toast.error('Invalid email or password')
      return
    }

    const session = await getSession()
    const role = session?.user?.role
    if (!isUserRole(role)) {
      router.push('/')
    } else if (role === 'PRACTITIONER') {
      router.push('/dashboard')
    } else if (role === 'CLIENT') {
      router.push('/portal')
    } else {
      router.push('/admin')
    }
    router.refresh()
  }

  return (
    <div className="flex justify-center py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Sign In</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="you@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full">
                Sign In
              </Button>
            </form>
          </Form>
          <p className="text-sm text-slate-600">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-slate-900 font-medium">
              Register
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
