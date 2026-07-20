import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { encrypt } from '@/lib/crypto'

export async function GET() {
  try {
    const { data: distributors, error } = await supabaseAdmin
      .from('distributors')
      .select('id, name, username, warehouse_code')
      .order('name')

    if (error) throw error

    return NextResponse.json({ distributors })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { code, name, warehouse, password } = body

    if (!code || !name || !warehouse || !password) {
      return NextResponse.json({ error: 'Semua field wajib diisi' }, { status: 400 })
    }

    const password_encrypted = encrypt(password)

    const { data, error } = await supabaseAdmin
      .from('distributors')
      .upsert({
        username: code,
        name: name,
        warehouse_code: warehouse,
        password_encrypted: password_encrypted
      }, { onConflict: 'username' })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('distributors')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { id, code, name, warehouse, password } = body

    if (!id || !code || !name || !warehouse) {
      return NextResponse.json({ error: 'ID, code, name, dan warehouse wajib diisi' }, { status: 400 })
    }

    const payload: any = {
      username: code,
      name: name,
      warehouse_code: warehouse,
    }

    if (password) {
      payload.password_encrypted = encrypt(password)
    }

    const { data, error } = await supabaseAdmin
      .from('distributors')
      .update(payload)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
