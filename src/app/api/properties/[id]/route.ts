import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/sessionUtils';
import { isAllowed } from '@/lib/authz/authorize';
import Property from '@/models/Property';
import connectToDatabase from '@/lib/mongodb';

export const runtime = 'nodejs';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('🔄 Property update request received for ID:', params.id);
    
    // Get session for authorization
    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check authorization for updating properties
    const authResult = isAllowed({
      sessionUserId: session.userId,
      role: session.role,
      action: 'update',
      resource: 'property',
      ownerId: session.userId
    });
    
    if (!authResult.allowed) {
      return NextResponse.json({ 
        success: false, 
        error: 'Forbidden: insufficient permissions' 
      }, { status: 403 });
    }
    
    const body = await request.json();
    console.log('🔄 Update payload:', body);
    console.log('🔄 Update payload details:', {
      thumbnailImage: body.thumbnailImage,
      thumbnailImageType: typeof body.thumbnailImage,
      thumbnailImageLength: body.thumbnailImage?.length,
      images: body.images,
      imagesType: typeof body.images,
      imagesLength: body.images?.length,
      hasThumbnailImage: !!body.thumbnailImage,
      hasImages: !!body.images
    });
    
    // Connect to database
    await connectToDatabase();
    
    // Find the property
    const property = await Property.findById(params.id);
    if (!property) {
      return NextResponse.json({ 
        success: false, 
        error: 'Property not found' 
      }, { status: 404 });
    }
    
    // Check if user owns this property or is admin
    if (property.agentId?.toString() !== session.userId && session.role !== 'superadmin') {
      return NextResponse.json({ 
        success: false, 
        error: 'Forbidden: you can only update your own properties' 
      }, { status: 403 });
    }
    
    // Update the property
    const updateData = {
      ...body,
      updatedAt: new Date()
    };
    
    console.log('🔄 MongoDB update data:', updateData);
    console.log('🔄 MongoDB update data details:', {
      thumbnailImage: updateData.thumbnailImage,
      images: updateData.images,
      updateDataKeys: Object.keys(updateData)
    });
    
    const updatedProperty = await Property.findByIdAndUpdate(
      params.id,
      { 
        $set: updateData
      },
      { new: true }
    );
    
    if (!updatedProperty) {
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to update property' 
      }, { status: 500 });
    }
    
    console.log('✅ Property updated successfully:', updatedProperty._id);
    console.log('✅ Updated property image fields:', {
      thumbnailImage: updatedProperty.thumbnailImage,
      images: updatedProperty.images,
      thumbnailImageType: typeof updatedProperty.thumbnailImage,
      imagesType: typeof updatedProperty.images,
      imagesLength: updatedProperty.images?.length
    });
    
    return NextResponse.json({
      success: true,
      data: updatedProperty,
      message: 'Property updated successfully'
    });
    
  } catch (error: any) {
    console.error('❌ Property update error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to update property' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('🔍 Property fetch request for ID:', params.id);
    
    // Connect to database
    await connectToDatabase();
    
    // Find the property
    const property = await Property.findById(params.id)
      .populate('agentId', 'fullName phone avatar')
      .lean();
    
    if (!property) {
      return NextResponse.json({ 
        success: false, 
        error: 'Property not found' 
      }, { status: 404 });
    }
    
    console.log('✅ Property found:', property._id);
    
    return NextResponse.json({
      success: true,
      data: property
    });
    
  } catch (error: any) {
    console.error('❌ Property fetch error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch property' },
      { status: 500 }
    );
  }
}