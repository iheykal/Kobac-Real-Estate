import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Property from '@/models/Property';
import { getSessionFromRequest } from '@/lib/sessionUtils';
import { canAccessResource, isAllowed, sanitizeUpdateData } from '@/lib/authz/authorize';

export const dynamic = 'force-dynamic';

/**
 * Individual Property API Routes
 * GET, PUT, DELETE operations for specific properties
 */

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    
    // Get session for authorization
    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    
    const propertyId = params.id;
    
    // Check authorization for accessing this specific property
    const authResult = await canAccessResource(
      {
        sessionUserId: session.userId,
        role: session.role,
        action: 'read',
        resource: 'property',
        resourceId: propertyId
      },
      async (id: string) => {
        return await Property.findById(id).populate('agentId', 'fullName phone avatar profile.avatar');
      }
    );
    
    if (!authResult.allowed) {
      // Return 404 to hide existence of the resource
      return NextResponse.json({ success: false, error: 'Property not found' }, { status: 404 });
    }
    
    return NextResponse.json({ 
      success: true, 
      data: authResult.resource 
    });
    
  } catch (error) {
    console.error('Error fetching property:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch property' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return handlePropertyUpdate(request, { params });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return handlePropertyUpdate(request, { params });
}

async function handlePropertyUpdate(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    
    // Get session for authorization
    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    
    const propertyId = params.id;
    
    // Check authorization for updating this specific property
    const authResult = await canAccessResource(
      {
        sessionUserId: session.userId,
        role: session.role,
        action: 'update',
        resource: 'property',
        resourceId: propertyId
      },
      async (id: string) => {
        return await Property.findById(id);
      }
    );
    
    if (!authResult.allowed) {
      // Return 404 to hide existence of the resource
      return NextResponse.json({ success: false, error: 'Property not found' }, { status: 404 });
    }
    
    const body = await request.json();
    
    // Sanitize update data - only allow specific fields to be updated
    const allowedFields = [
      'title', 'location', 'district', 'price', 'beds', 'baths', 'sqft', 
      'yearBuilt', 'lotSize', 'propertyType', 'listingType', 'measurement',
      'status', 'description', 'features', 'amenities', 'thumbnailImage', 
      'images', 'featured'
    ];
    
    const sanitizedData = sanitizeUpdateData(body, allowedFields);
    
    // Update the property
    const updatedProperty = await Property.findByIdAndUpdate(
      propertyId,
      sanitizedData,
      { new: true, runValidators: true }
    );
    
    if (!updatedProperty) {
      return NextResponse.json({ success: false, error: 'Property not found' }, { status: 404 });
    }
    
    return NextResponse.json({ 
      success: true, 
      data: updatedProperty 
    });
    
  } catch (error) {
    console.error('Error updating property:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update property' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    
    // Get session for authorization
    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    
    const propertyId = params.id;
    
    // Check authorization for deleting this specific property
    const authResult = await canAccessResource(
      {
        sessionUserId: session.userId,
        role: session.role,
        action: 'delete',
        resource: 'property',
        resourceId: propertyId
      },
      async (id: string) => {
        return await Property.findById(id);
      }
    );
    
    if (!authResult.allowed) {
      // Return 404 to hide existence of the resource
      return NextResponse.json({ success: false, error: 'Property not found' }, { status: 404 });
    }
    
    // Soft delete by setting deletionStatus
    const deletedProperty = await Property.findByIdAndUpdate(
      propertyId,
      { deletionStatus: 'deleted' },
      { new: true }
    );
    
    if (!deletedProperty) {
      return NextResponse.json({ success: false, error: 'Property not found' }, { status: 404 });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Property deleted successfully' 
    });
    
  } catch (error) {
    console.error('Error deleting property:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete property' },
      { status: 500 }
    );
  }
}