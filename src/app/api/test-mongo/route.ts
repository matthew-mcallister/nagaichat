import { NextRequest, NextResponse } from 'next/server'
import { connectDb } from '@/lib/mongodb'
import { handleErrors, InvalidRequest } from '@/lib/error'

export const GET = handleErrors(async (request: NextRequest) => {
  const db = await connectDb()

  const collection = db.collection('users')
  const documents = await collection.find({}).limit(10).toArray()
  const stats = await db.stats()
  const totalDocuments = await collection.countDocuments()

  return NextResponse.json({
    success: true,
    message: 'MongoDB connection and query successful',
    database: db.databaseName,
    collection: 'users',
    documentsFound: documents.length,
    totalDocuments,
    documents: documents,
    dbStats: {
      collections: stats.collections,
      dataSize: stats.dataSize,
      indexSize: stats.indexSize
    }
  })
})

export const POST = handleErrors(async (request: NextRequest) => {
  const body = await request.json()

  const db = await connectDb()
  const collection = db.collection('users')

  const testDocument = {
    name: body.name || 'Test User',
    email: body.email || `test-${Date.now()}@example.com`,
    createdAt: new Date(),
    message: body.message || 'This is a test document created via API',
    metadata: {
      userAgent: request.headers.get('user-agent'),
      ip: request.headers.get('x-forwarded-for') || 'unknown'
    }
  }

  const result = await collection.insertOne(testDocument)

  return NextResponse.json({
    success: true,
    message: 'Document inserted successfully',
    insertedId: result.insertedId,
    document: testDocument
  })
})

export const DELETE = handleErrors(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const email = searchParams.get('email')

  if (!email) {
    throw new InvalidRequest('Email is required')
  }

  const db = await connectDb()
  const collection = db.collection('users')

  const result = await collection.deleteMany({ email })

  return NextResponse.json({
    success: true,
    message: `Deleted ${result.deletedCount} document(s)`,
    deletedCount: result.deletedCount
  })
})
