import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Property from '@/models/Property';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 GET /api/properties/similar - Starting request');
    await connectDB();
    console.log('✅ GET /api/properties/similar - Connected to database');

    const { searchParams } = request.nextUrl;
    const district = searchParams.get('district');
    const excludeId = searchParams.get('excludeId');
    const limit = parseInt(searchParams.get('limit') || '6');

    console.log('🔍 GET /api/properties/similar - Request params:', {
      district,
      excludeId,
      limit
    });

    if (!district) {
      console.log('❌ GET /api/properties/similar - No district provided');
      return NextResponse.json(
        { error: 'District parameter is required' },
        { status: 400 }
      );
    }

    // Build query to find similar properties
    let query: any = {
      district: district,
      deletionStatus: { $ne: 'deleted' }
    };

    // Exclude the current property if excludeId is provided
    if (excludeId) {
      // Try to parse as number first, if it fails, treat as string
      const excludeIdNum = parseInt(excludeId);
      if (!isNaN(excludeIdNum)) {
        query.$and = [
          { _id: { $ne: excludeId } },
          { propertyId: { $ne: excludeIdNum } }
        ];
      } else {
        query._id = { $ne: excludeId };
      }
    }

    console.log('🔍 GET /api/properties/similar - Query:', JSON.stringify(query, null, 2));

    // Find similar properties in the same district
    console.log('🔍 GET /api/properties/similar - Executing database query...');
    const similarProperties = await Property.find(query)
      .populate('agentId', 'name phone avatar rating')
      .sort({ 
        featured: -1, // Featured properties first
        viewCount: -1, // Then by view count
        createdAt: -1 // Then by newest
      })
      .limit(limit)
      .lean();
    
    console.log('✅ GET /api/properties/similar - Found properties:', similarProperties.length);

    // Process properties to ensure consistent agent data
    const processedProperties = similarProperties.map(property => {
      const propertyObj = property;
      
      // Store the original agentId as a string for navigation
      let originalAgentId = null;
      if (propertyObj.agentId) {
        if (typeof propertyObj.agentId === 'string') {
          originalAgentId = propertyObj.agentId;
        } else if (typeof propertyObj.agentId === 'object' && propertyObj.agentId && '_id' in propertyObj.agentId) {
          originalAgentId = (propertyObj.agentId as any)._id.toString();
        }
      }
      
      // Use populated agentId data for fresh agent information
      if (propertyObj.agentId && typeof propertyObj.agentId === 'object') {
        const agentData = propertyObj.agentId as any;
        const agentAvatar = agentData.avatar;
        const agentProfileAvatar = agentData.profile?.avatar;
        
        return {
          ...propertyObj,
          agentId: originalAgentId,
          agent: {
            name: agentData.name || 'Unknown Agent',
            phone: agentData.phone || 'N/A',
            image: agentAvatar || agentProfileAvatar || '/icons/profile.gif',
            rating: agentData.rating || 0
          }
        };
      }
      
      return {
        ...propertyObj,
        agentId: originalAgentId,
        agent: propertyObj.agent || {
          name: 'Unknown Agent',
          phone: 'N/A',
          image: '/icons/profile.gif',
          rating: 0
        }
      };
    });

    console.log('🔍 GET /api/properties/similar - Found similar properties:', {
      district,
      excludeId,
      limit,
      found: processedProperties.length,
      properties: processedProperties.map(p => ({
        id: p._id,
        title: (p as any).title,
        district: (p as any).district,
        price: (p as any).price
      }))
    });

    return NextResponse.json({
      success: true,
      properties: processedProperties,
      count: processedProperties.length
    });

  } catch (error) {
    console.error('❌ GET /api/properties/similar - Error:', error);
    console.error('❌ GET /api/properties/similar - Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json(
      { 
        error: 'Failed to fetch similar properties',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
