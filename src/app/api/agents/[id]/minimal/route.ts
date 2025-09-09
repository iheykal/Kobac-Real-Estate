import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Property from '@/models/Property';
import { agentCache } from '@/lib/agentCache';

export const dynamic = 'force-dynamic';

/**
 * Super minimal agent API - absolute minimum data for maximum speed
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const startTime = Date.now();
  try {
    const agentId = params.id;
    console.log('⚡ Super minimal agent API for ID:', agentId);
    
    // Check cache first
    const cachedData = agentCache.get(agentId);
    if (cachedData) {
      const responseTime = Date.now() - startTime;
      console.log(`⚡ Cache hit in ${responseTime}ms`);
      return NextResponse.json({
        success: true,
        data: cachedData,
        cached: true,
        responseTime: responseTime
      });
    }
    
    await connectDB();
    
    // Ultra-minimal query - only 1 property, absolute minimum fields
    const properties = await Property.find({
      agentId: agentId,
      deletionStatus: { $ne: 'deleted' }
    })
    .select('_id propertyId title location price beds baths propertyType status thumbnailImage agent.name agent.phone agent.image')
    .sort({ createdAt: -1 })
    .lean()
    .limit(1); // Only 1 property for maximum speed
    
    if (properties.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No properties found' },
        { status: 404 }
      );
    }
    
    const agent = properties[0].agent;
    
    // Ultra-minimal response - only essential data
    const agentData = {
      id: agentId,
      name: agent?.name || 'Agent',
      phone: agent?.phone || 'N/A',
      image: agent?.image || '/icons/profile.gif',
      propertiesCount: 1, // Hardcoded for speed
      properties: [{
        id: (properties[0] as any)._id.toString(),
        _id: (properties[0] as any)._id.toString(),
        propertyId: (properties[0] as any).propertyId,
        title: properties[0].title,
        location: properties[0].location,
        price: properties[0].price,
        beds: properties[0].beds,
        baths: properties[0].baths,
        propertyType: properties[0].propertyType,
        status: properties[0].status,
        thumbnailImage: properties[0].thumbnailImage
      }]
    };
    
    // Cache for 15 minutes
    agentCache.set(agentId, agentData, 15 * 60 * 1000);
    
    const responseTime = Date.now() - startTime;
    console.log(`⚡ Super minimal response in ${responseTime}ms`);
    return NextResponse.json({
      success: true,
      data: agentData,
      cached: false,
      responseTime: responseTime
    });
    
  } catch (error) {
    console.error('Error in super minimal agent API:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch agent' },
      { status: 500 }
    );
  }
}
