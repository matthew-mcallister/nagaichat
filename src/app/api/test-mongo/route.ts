import { NextRequest, NextResponse } from 'next/server';
import { connectDb } from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  try {
    const db = await connectDb();

    const collection = db.collection('users');
    const documents = await collection.find({}).limit(10).toArray();
    const stats = await db.stats();
    const totalDocuments = await collection.countDocuments();

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
    });

  } catch (error) {
    console.error('MongoDB operation error:', error);

    return NextResponse.json({
      success: false,
      message: 'Failed to perform MongoDB operations',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const db = await connectDb();
    const collection = db.collection('users');

    const testDocument = {
      name: body.name || 'Test User',
      email: body.email || `test-${Date.now()}@example.com`,
      createdAt: new Date(),
      message: body.message || 'This is a test document created via API',
      metadata: {
        userAgent: request.headers.get('user-agent'),
        ip: request.headers.get('x-forwarded-for') || 'unknown'
      }
    };

    const result = await collection.insertOne(testDocument);

    return NextResponse.json({
      success: true,
      message: 'Document inserted successfully',
      insertedId: result.insertedId,
      document: testDocument
    });

  } catch (error) {
    console.error('MongoDB insertion error:', error);

    return NextResponse.json({
      success: false,
      message: 'Failed to insert document',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({
        success: false,
        message: 'Email parameter is required'
      }, { status: 400 });
    }

    const db = await connectDb();
    const collection = db.collection('users');

    const result = await collection.deleteMany({ email });

    return NextResponse.json({
      success: true,
      message: `Deleted ${result.deletedCount} document(s)`,
      deletedCount: result.deletedCount
    });

  } catch (error) {
    console.error('MongoDB deletion error:', error);

    return NextResponse.json({
      success: false,
      message: 'Failed to delete documents',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
