// app/api/upload/route.js - Supabase Storage
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const BUCKET_NAME = 'bbos_ith'

export async function POST(request) {
  try {
    const contentType = request.headers.get('content-type') || ''
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json(
        { message: 'Content type must be multipart/form-data' },
        { status: 400 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file')
    if (!file) {
      return NextResponse.json({ message: 'No file provided' }, { status: 400 })
    }

    const fileName = formData.get('filename') || file.name
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // ใช้ timestamp เพื่อป้องกันชื่อซ้ำ
    const timestamp = Date.now()
    const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_')
    const storagePath = `uploads/${timestamp}_${safeName}`

    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(storagePath, buffer, {
        contentType: file.type || 'application/octet-stream',
        upsert: false,
      })

    if (error) {
      console.error('Supabase Storage upload error:', error)
      return NextResponse.json(
        { message: 'Error uploading file to storage', error: error.message },
        { status: 500 }
      )
    }

    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(storagePath)

    return NextResponse.json(
      {
        message: 'File uploaded successfully',
        file: {
          id: data.path,
          name: fileName,
          webViewLink: urlData.publicUrl,
        },
        status: 'success',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Upload API Error:', error)
    return NextResponse.json(
      { message: 'Error uploading file', error: error.message },
      { status: 500 }
    )
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
