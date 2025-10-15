import { NextRequest, NextResponse } from 'next/server'
import { getDoctorById } from '@/lib/supabase/database/doctors'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const result = await getDoctorById(params.id)
    
    if (result.error) {
      return NextResponse.json(
        { error: result.error }, 
        { status: 500 }
      )
    }
    
    if (!result.data) {
      return NextResponse.json(
        { error: 'Doctor not found' }, 
        { status: 404 }
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