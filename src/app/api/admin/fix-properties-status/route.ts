import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Property from '@/models/Property'
import User from '@/models/User'

export async function POST(request: NextRequest) {
  try {
    await connectDB()

    // Check authentication
    const cookie = request.cookies.get('kobac_session')?.value
    if (!cookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let session: { userId: string; role: string } | null = null
    try {
      session = JSON.parse(decodeURIComponent(cookie))
    } catch (_) {}
    
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is superadmin
    const user = await User.findById(session.userId)
    if (!user || user.role !== 'superadmin') {
      return NextResponse.json({ error: 'Forbidden: Only superadmin can access this' }, { status: 403 })
    }

    console.log('🔧 Starting property status fix...')

    // Find all properties that need fixing
    const propertiesToFix = await Property.find({
      $or: [
        { deletionStatus: { $exists: false } },
        { deletionStatus: null },
        { deletionStatus: undefined },
        { deletionStatus: '' }
      ]
    })

    console.log(`🔧 Found ${propertiesToFix.length} properties that need fixing`)

    const fixedProperties = []
    let alreadyCorrect = 0

    // Fix each property
    for (const property of propertiesToFix) {
      try {
        property.deletionStatus = 'active'
        await property.save()
        
        fixedProperties.push({
          _id: property._id,
          propertyId: property.propertyId,
          title: property.title
        })
        
        console.log(`✅ Fixed property: ${property.title} (ID: ${property.propertyId || property._id})`)
      } catch (error) {
        console.error(`❌ Failed to fix property ${property._id}:`, error)
      }
    }

    // Count properties that are already correct
    const correctProperties = await Property.find({ deletionStatus: 'active' })
    alreadyCorrect = correctProperties.length

    console.log(`✅ Property status fix completed:`)
    console.log(`   - Total processed: ${propertiesToFix.length}`)
    console.log(`   - Fixed: ${fixedProperties.length}`)
    console.log(`   - Already correct: ${alreadyCorrect}`)

    return NextResponse.json({
      success: true,
      totalProcessed: propertiesToFix.length,
      fixedCount: fixedProperties.length,
      alreadyCorrect: alreadyCorrect,
      fixedProperties: fixedProperties
    })

  } catch (error) {
    console.error('Error fixing properties status:', error)
    return NextResponse.json(
      { error: 'Failed to fix properties status' },
      { status: 500 }
    )
  }
}
