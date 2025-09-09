import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Property from '@/models/Property';
import User from '@/models/User';
import { getSessionFromRequest } from '@/lib/sessionUtils';

export async function GET(request: NextRequest) {
  try {
    console.log('🔄 Fetching properties pending deletion...');
    
    await connectDB();
    
    // Get session for authorization
    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get user info and check if superadmin
    const user = await User.findById(session.userId).select('role');
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }
    
    const isSuperAdmin = user.role === 'superadmin' || user.role === 'super_admin';
    if (!isSuperAdmin) {
      return NextResponse.json({ success: false, error: 'Forbidden: Only superadmin can view pending deletions' }, { status: 403 });
    }
    
    // Get properties pending deletion
    const pendingDeletions = await Property.find({ 
      deletionStatus: 'pending_deletion' 
    })
    .populate('agentId', 'fullName email phone')
    .sort({ deletionRequestedAt: -1 })
    .lean();
    
    console.log('✅ Found properties pending deletion:', pendingDeletions.length);
    
    return NextResponse.json({
      success: true,
      data: pendingDeletions.map(property => ({
        _id: property._id,
        propertyId: property.propertyId,
        title: property.title,
        description: property.description,
        location: property.location,
        price: property.price,
        beds: property.beds,
        baths: property.baths,
        sqft: property.sqft,
        propertyType: property.propertyType,
        thumbnailImage: property.thumbnailImage,
        images: property.images,
        agent: property.agent,
        agentId: property.agentId,
        deletionRequestedAt: property.deletionRequestedAt,
        deletionRequestedBy: property.deletionRequestedBy,
        createdAt: property.createdAt
      }))
    });
    
  } catch (error) {
    console.error('💥 Error fetching pending deletions:', error);
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    );
  }
}
