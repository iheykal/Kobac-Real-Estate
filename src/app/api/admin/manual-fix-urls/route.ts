import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/sessionUtils';
import Property from '@/models/Property';
import connectToDatabase from '@/lib/mongodb';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Check authorization - only superadmin can access this
    const normalizedRole = session.role === 'super_admin' ? 'superadmin' : session.role;
    
    if (normalizedRole !== 'superadmin') {
      return NextResponse.json({ 
        success: false, 
        error: 'Forbidden: Only superadmin can access this endpoint' 
      }, { status: 403 });
    }

    // Connect to database
    await connectToDatabase();

    // Get ALL properties (no filtering)
    const allProperties = await Property.find({});

    console.log(`🔍 Manually checking ${allProperties.length} properties for URL fixes`);

    const results = {
      totalProperties: allProperties.length,
      fixed: 0,
      skipped: 0,
      errors: 0,
      details: [] as any[]
    };

    // Check and fix each property
    for (const property of allProperties) {
      try {
        let hasChanges = false;
        const changes: any = {};

        // Check if property has any image data
        const hasThumbnail = property.thumbnailImage && property.thumbnailImage.trim() !== '';
        const hasImages = property.images && Array.isArray(property.images) && property.images.length > 0;

        if (!hasThumbnail && !hasImages) {
          results.skipped++;
          results.details.push({
            propertyId: property._id,
            propertyTitle: property.title,
            fixType: 'no_images',
            reason: 'Property has no image data'
          });
          continue;
        }

        // Fix thumbnailImage
        if (hasThumbnail && property.thumbnailImage.includes('/uploads/listings/')) {
          const newThumbnailImage = property.thumbnailImage.replace('/uploads/listings/', '/listings/');
          changes.oldUrl = property.thumbnailImage;
          changes.newUrl = newThumbnailImage;
          property.thumbnailImage = newThumbnailImage;
          hasChanges = true;
          console.log(`🔄 Fixed thumbnail URL for property ${property._id}`);
        }

        // Fix images array
        if (hasImages) {
          const newImages = property.images.map((imageUrl: string) => {
            if (imageUrl && imageUrl.includes('/uploads/listings/')) {
              return imageUrl.replace('/uploads/listings/', '/listings/');
            }
            return imageUrl;
          });
          
          // Check if any images were changed
          const hasImageChanges = newImages.some((newUrl, index) => newUrl !== property.images[index]);
          
          if (hasImageChanges) {
            changes.oldImages = [...property.images];
            changes.newImages = newImages;
            property.images = newImages;
            hasChanges = true;
            console.log(`🔄 Fixed images array for property ${property._id}`);
          }
        }

        if (hasChanges) {
          await property.save();
          results.fixed++;
          results.details.push({
            propertyId: property._id,
            propertyTitle: property.title,
            fixType: 'path_fix',
            ...changes
          });
          
          console.log(`✅ Fixed path structure for property ${property._id}: ${property.title}`);
        } else {
          results.skipped++;
          results.details.push({
            propertyId: property._id,
            propertyTitle: property.title,
            fixType: 'no_changes_needed',
            reason: 'No /uploads/listings/ found in URLs'
          });
        }
        
      } catch (error) {
        results.errors++;
        results.details.push({
          propertyId: property._id,
          propertyTitle: property.title,
          error: error instanceof Error ? error.message : 'Unknown error',
          fixType: 'error'
        });
        
        console.error(`❌ Error fixing property ${property._id}:`, error);
      }
    }

    console.log(`🎯 Manual fix completed: ${results.fixed} fixed, ${results.skipped} skipped, ${results.errors} errors`);

    return NextResponse.json({
      success: true,
      message: `Manually fixed URLs for ${results.fixed} properties`,
      results
    });

  } catch (error) {
    console.error('Error manually fixing URLs:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to manually fix URLs' },
      { status: 500 }
    );
  }
}
