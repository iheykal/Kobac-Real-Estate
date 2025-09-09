import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Property from '@/models/Property'
import User from '@/models/User'
import { getSessionFromRequest } from '@/lib/sessionUtils'

export async function GET(request: NextRequest) {
  try {
    await connectDB()

    // Get session for authorization
    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const user = await User.findById(session.userId)
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    }

    // Check if user is superadmin (support both role formats)
    const isSuperAdmin = user.role === 'superadmin' || user.role === 'super_admin' || user.role === 'SUPERADMIN' || user.role === 'SUPER_ADMIN'
    
    if (!isSuperAdmin) {
      console.log('Access denied. User role:', user.role, 'User:', user.fullName)
      return NextResponse.json({ 
        success: false, 
        error: 'Forbidden: Only superadmin can access this endpoint',
        debug: { userRole: user.role, userName: user.fullName }
      }, { status: 403 })
    }

    // Aggregate properties by district
    const districtStats = await Property.aggregate([
      {
        $match: {
          deletionStatus: { $ne: 'deleted' }, // Only count active properties
          district: { $exists: true, $nin: [null, '', undefined] } // Filter out null/empty districts
        }
      },
      {
        $group: {
          _id: '$district',
          count: { $sum: 1 },
          totalValue: { $sum: '$price' },
          avgPrice: { $avg: '$price' }
        }
      },
      {
        $sort: { count: -1 } // Sort by count descending
      }
    ])

    // Format the data for the pie chart
    const chartData = districtStats.map(stat => ({
      name: stat._id,
      value: stat.count,
      totalValue: stat.totalValue,
      avgPrice: Math.round(stat.avgPrice)
    }))

    // Calculate totals
    const totalProperties = chartData.reduce((sum, item) => sum + item.value, 0)
    const totalValue = chartData.reduce((sum, item) => sum + item.totalValue, 0)

    return NextResponse.json({
      success: true,
      data: {
        chartData,
        summary: {
          totalProperties,
          totalValue,
          totalDistricts: chartData.length
        }
      }
    })

  } catch (error) {
    console.error('Error fetching district stats:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
