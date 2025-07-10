import { NextRequest, NextResponse } from 'next/server'

import { env } from '@/env/client'
import { getUser } from '@/lib/auth'
import { DODO_PRODUCTS } from '@/lib/constants'
import { dodoPayments } from '@/lib/dodo-payments'

export async function POST(request: NextRequest) {
  try {
    const user = await getUser()

    if (!user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { billingInfo, productId = DODO_PRODUCTS.PRO_SUBSCRIPTION } = body

    if (!billingInfo) {
      return NextResponse.json(
        { error: 'Billing information is required' },
        { status: 400 },
      )
    }

    // Create Dodo Payments checkout session
    const checkoutResponse = await dodoPayments.createCheckoutSession({
      billing: {
        city: billingInfo.city,
        country: billingInfo.country,
        state: billingInfo.state,
        street: billingInfo.street,
        zipcode: billingInfo.zipcode,
      },
      customer: {
        email: user.email,
        name: user.name || 'User',
        phone_number: billingInfo.phoneNumber,
      },
      payment_link: true,
      product_id: productId,
      quantity: 1,
      return_url: `${env.NEXT_PUBLIC_API_URL}/billing?success=true`,
    })

    return NextResponse.json({
      payment_link: checkoutResponse.payment_link,
      subscription_id: checkoutResponse.subscription_id,
    })
  } catch (error) {
    console.error('Checkout session creation failed:', error)
    return NextResponse.json(
      {
        error: 'Failed to create checkout session',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
