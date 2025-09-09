import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Property from '@/models/Property';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    console.log('🔍 Debug properties API called');
    
    // Get all properties
    const allProperties = await Property.find({}).sort({ createdAt: -1 }).limit(20);
    
    // Get properties with different deletion statuses
    const activeProperties = await Property.find({ deletionStatus: 'active' }).sort({ createdAt: -1 }).limit(10);
    const pendingDeletionProperties = await Property.find({ deletionStatus: 'pending_deletion' }).sort({ createdAt: -1 }).limit(10);
    const deletedProperties = await Property.find({ deletionStatus: 'deleted' }).sort({ createdAt: -1 }).limit(10);
    const propertiesWithoutStatus = await Property.find({ deletionStatus: { $exists: false } }).sort({ createdAt: -1 }).limit(10);
    
    // Get properties that should be visible on main page
    const mainPageQuery = { deletionStatus: { $ne: 'deleted' } };
    const mainPageProperties = await Property.find(mainPageQuery).sort({ createdAt: -1 }).limit(10);
    
    // Get the most recent properties
    const recentProperties = await Property.find({}).sort({ createdAt: -1 }).limit(5);
    
    console.log('📊 Property Statistics:', {
      total: allProperties.length,
      active: activeProperties.length,
      pending_deletion: pendingDeletionProperties.length,
      deleted: deletedProperties.length,
      noStatus: propertiesWithoutStatus.length,
      mainPageQuery: mainPageProperties.length
    });
    
    // Check if there are any properties without deletionStatus
    if (propertiesWithoutStatus.length > 0) {
      console.log('⚠️ Properties without deletionStatus found:', propertiesWithoutStatus.map(p => ({
        id: p._id,
        title: p.title,
        createdAt: p.createdAt
      })));
    }
    
    // Check the most recent properties
    if (recentProperties.length > 0) {
      console.log('🆕 Most recent properties:', recentProperties.map(p => ({
        id: p._id,
        title: p.title,
        deletionStatus: p.deletionStatus,
        createdAt: p.createdAt,
        agentId: p.agentId
      })));
    }
    
    return NextResponse.json({
      success: true,
      stats: {
        total: allProperties.length,
        active: activeProperties.length,
        pending_deletion: pendingDeletionProperties.length,
        deleted: deletedProperties.length,
        noStatus: propertiesWithoutStatus.length,
        mainPageQuery: mainPageProperties.length
      },
      properties: allProperties.map(p => ({
        id: p._id,
        propertyId: p.propertyId,
        title: p.title,
        location: p.location,
        district: p.district,
        deletionStatus: p.deletionStatus,
        createdAt: p.createdAt,
        agentId: p.agentId
      })),
      mainPageProperties: mainPageProperties.map(p => ({
        id: p._id,
        propertyId: p.propertyId,
        title: p.title,
        deletionStatus: p.deletionStatus,
        createdAt: p.createdAt
      })),
      propertiesWithoutStatus: propertiesWithoutStatus.map(p => ({
        id: p._id,
        title: p.title,
        createdAt: p.createdAt
      }))
    });
    
  } catch (error) {
    console.error('Error in debug properties:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
