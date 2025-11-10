import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const bookingCustomizationSchema = z.object({
  layout: z.enum(['default', 'centered', 'split']).optional(),
  customCSS: z.string().max(10000, 'Custom CSS is too long').optional(),
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = bookingCustomizationSchema.parse(body)

    await prisma.user.update({
      where: { id: user.id },
      data: {
        bookingLayout: validatedData.layout,
        customCSS: validatedData.customCSS,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating booking customization:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.issues[0].message },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { success: false, error: 'Failed to update booking customization' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        bookingLayout: true,
        customCSS: true,
        brandColor: true,
        logoUrl: true,
      },
    })

    return NextResponse.json(userData)
  } catch (error) {
    console.error('Error fetching booking customization:', error)
    return NextResponse.json(
      { error: 'Failed to fetch booking customization' },
      { status: 500 }
    )
  }
}
