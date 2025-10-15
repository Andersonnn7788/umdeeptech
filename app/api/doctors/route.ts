import { NextRequest, NextResponse } from 'next/server'
import { getDoctors, getDoctorsByCategory } from '@/lib/supabase/database/doctors'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    
    let result
    if (category) {
      result = await getDoctorsByCategory(category)
    } else {
      result = await getDoctors()
    }
    
    if (result.error) {
      return NextResponse.json(
        { error: result.error }, 
        { status: 500 }
      )
    }
    
    return NextResponse.json(result.data)
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}