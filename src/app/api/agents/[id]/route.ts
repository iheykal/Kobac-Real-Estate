import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Property from '@/models/Property';
import { agentCache } from '@/lib/agentCache';

export const dynamic = 'force-dynamic';

/**
 * Ultra-aggressive optimized agent API - minimal data, maximum speed
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const startTime = Date.now();
  try {
    const agentId = params.id;
    console.log('🚀 Ultra-fast agent API for ID:', agentId);
    
    // Check cache first (instant response)
    const cachedData = agentCache.get(agentId);
    if (cachedData) {
      const responseTime = Date.now() - startTime;
      console.log(`⚡ Cache hit - instant response in ${responseTime}ms`);
      return NextResponse.json({
        success: true,
        data: cachedData,
        cached: true,
        responseTime: responseTime
      });
    }
    
    // Connect to database (cached connection)
    await connectDB();
    
    // Ultra-minimal query - only essential fields
    const properties = await Property.find({
      agentId: agentId,
      deletionStatus: { $ne: 'deleted' }
    })
    .select('_id propertyId title location price beds baths propertyType status thumbnailImage agent.name agent.phone agent.image')
    .sort({ createdAt: -1 })
    .lean()
    .limit(8); // Reduced limit for speed
    
    if (properties.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No properties found' },
        { status: 404 }
      );
    }
    
    // Extract agent from first property
    const agent = properties[0].agent;
    
    // Minimal response data
    const agentData = {
      id: agentId,
      name: agent?.name || 'Agent',
      phone: agent?.phone || 'N/A',
      email: '',
      image: agent?.image || '/icons/profile.gif',
      propertiesCount: properties.length,
      properties: properties.map((prop: any) => ({
        id: prop._id.toString(),
        _id: prop._id.toString(),
        propertyId: prop.propertyId,
        title: prop.title,
        location: prop.location,
        price: prop.price,
        beds: prop.beds,
        baths: prop.baths,
        propertyType: prop.propertyType,
        status: prop.status,
        thumbnailImage: prop.thumbnailImage
      }))
    };
    
    // Cache for 10 minutes (longer cache for better performance)
    agentCache.set(agentId, agentData, 10 * 60 * 1000);
    
    const responseTime = Date.now() - startTime;
    console.log(`🚀 Ultra-fast response in ${responseTime}ms`);
    return NextResponse.json({
      success: true,
      data: agentData,
      cached: false,
      responseTime: responseTime
    });
    
  } catch (error) {
    console.error('Error in ultra-fast agent API:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch agent' },
      { status: 500 }
    );
  }
}