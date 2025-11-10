import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const whiteLabelSchema = z.object({
  hidePlatformBranding: z.boolean().optional(),
  customFooter: z.string().max(2000, 'Custom footer is too long').optional(),
  customHeader: z.string().max(2000, 'Custom header is too long').optional(),
  emailBrandingEnabled: z.boolean().optional(),
  metaTitle: z.string().max(60, 'Meta title is too long').optional(),
  metaDescription: z.string().max(160, 'Meta description is too long').optional(),
  metaImage: z.string().url('Invalid image URL').optional().or(z.literal('')),
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

    // Check if user is premium
    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      select: { isPremium: true },
    })

    if (!userData?.isPremium) {
      return NextResponse.json(
        { success: false, error: 'Premium subscription required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = whiteLabelSchema.parse(body)

    await prisma.user.update({
      where: { id: user.id },
      data: {
        hidePlatformBranding: validatedData.hidePlatformBranding,
        customFooter: validatedData.customFooter,
        customHeader: validatedData.customHeader,
        emailBrandingEnabled: validatedData.emailBrandingEnabled,
        metaTitle: validatedData.metaTitle,
        metaDescription: validatedData.metaDescription,
        metaImage: validatedData.metaImage || null,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating white-label settings:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.issues[0].message },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { success: false, error: 'Failed to update white-label settings' },
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
        isPremium: true,
        hidePlatformBranding: true,
        customFooter: true,
        customHeader: true,
        emailBrandingEnabled: true,
        metaTitle: true,
        metaDescription: true,
        metaImage: true,
      },
    })

    return NextResponse.json(userData)
  } catch (error) {
    console.error('Error fetching white-label settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch white-label settings' },
      { status: 500 }
    )
  }
}
