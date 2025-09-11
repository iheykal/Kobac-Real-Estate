import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Property from '@/models/Property';
import User, { UserRole } from '@/models/User';
import { SortOrder } from 'mongoose';
import { getNextPropertyId } from '@/lib/propertyIdGenerator';
import { getCompanyLogoUrl, DEFAULT_AVATAR_URL } from '@/lib/utils';
import { getSessionFromRequest } from '@/lib/sessionUtils';
import { isAllowed, createListFilter, enforceOwnership, sanitizeUpdateData } from '@/lib/authz/authorize';

export const dynamic = 'force-dynamic';

/**
 * Property API Routes
 * 
 * Features:
 * - Automatic company logo attachment: When agents post properties, 
 *   the company logo is automatically appended to the images array
 * - Company logo URL: /icons/kobac.webp (KOBAC company logo)
 */

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    // Get session for authorization (optional for public property viewing)
    const session = getSessionFromRequest(request);
    
    const { searchParams } = new URL(request.url);
    const featured = searchParams.get('featured');
    const limit = parseInt(searchParams.get('limit') || '10');
    const sort = searchParams.get('sort'); // e.g., 'latest'
    const agentId = searchParams.get('agentId');
    const listingType = searchParams.get('listingType');
    const district = searchParams.get('district');
    
    console.log('🔍 GET /api/properties - Query parameters:', {
      featured,
      limit,
      agentId,
      listingType,
      district,
      isAgentDashboard: !!request.headers.get('x-agent-dashboard'),
      sessionUserId: session?.userId || 'anonymous',
      sessionRole: session?.role || 'anonymous',
      hasSession: !!session
    });
    
    // Create base query with authorization filter
    // For unauthenticated users, show only public properties
    let query: any = { 
      deletionStatus: { $ne: 'deleted' }
    };
    
    // Apply authorization filter only if user is authenticated
    if (session) {
      const authFilter = createListFilter(session.role, 'read', 'property', session.userId);
      query = { ...query, ...authFilter };
    } else {
      // For anonymous users, show all public properties (no additional filter needed)
      // The base query already filters out deleted properties
      console.log('🔍 Anonymous user - showing all public properties');
    }
    
    if (featured === 'true') {
      query.featured = true;
    }
    
    if (agentId) {
      query.agentId = agentId;
      if (!request.headers.get('x-agent-dashboard')) {
        query.deletionStatus = { $ne: 'deleted' };
      }
    }
    
    if (listingType) {
      query.listingType = listingType;
    }
    
    if (district) {
      query.district = district;
    }
    
    // Optimize query for dashboard loading
    const isDashboardRequest = limit <= 10; // Dashboard requests are small
    const isMobileOptimized = request.headers.get('x-mobile-optimized') === 'true';
    
    // Determine sort order: default by engagement, or latest first if requested
    const sortOption: Record<string, SortOrder> = sort === 'latest' 
      ? { createdAt: -1 }
      : { uniqueViewCount: -1, createdAt: -1 };

    // Mobile-optimized field selection
    const selectFields = isMobileOptimized 
      ? 'propertyId title location district price beds baths sqft propertyType listingType status thumbnailImage agentId createdAt viewCount uniqueViewCount deletionStatus'
      : 'propertyId title location district price beds baths sqft yearBuilt lotSize propertyType listingType measurement status description features amenities thumbnailImage images agentId createdAt viewCount uniqueViewCount agent deletionStatus';

    let propertiesQuery = Property.find(query)
      .select(selectFields)
      .sort(sortOption);
    
    // Only populate agent data for non-dashboard requests to improve performance
    if (!isDashboardRequest) {
      propertiesQuery = propertiesQuery.populate('agentId', 'firstName lastName email phone avatar profile.avatar licenseNumber fullName');
    }
    
    if (!agentId) {
      propertiesQuery = propertiesQuery.limit(limit);
    }
    
    const properties = await propertiesQuery;
    
    console.log('🔍 Properties query results:', {
      query: query,
      propertiesFound: properties.length,
      sampleProperty: properties[0] ? {
        _id: properties[0]._id,
        title: properties[0].title,
        district: properties[0].district,
        deletionStatus: properties[0].deletionStatus,
        agentId: properties[0].agentId
      } : null
    });
    
    // Only do expensive count queries for non-dashboard requests
    if (!isDashboardRequest) {
      const totalPropertiesInDB = await Property.countDocuments({});
      const activePropertiesInDB = await Property.countDocuments({ deletionStatus: { $ne: 'deleted' } });
      const deletedPropertiesInDB = await Property.countDocuments({ deletionStatus: 'deleted' });
      
      console.log('🔍 GET /api/properties - Query results:', {
        totalPropertiesFound: properties.length,
        totalPropertiesInDB,
        activePropertiesInDB,
        deletedPropertiesInDB,
        query: query,
        firstProperty: properties[0] ? {
          id: properties[0]._id,
          title: properties[0].title,
          deletionStatus: properties[0].deletionStatus,
          createdAt: properties[0].createdAt
        } : null
      });
    } else {
      console.log('🔍 GET /api/properties - Dashboard request (optimized):', {
        totalPropertiesFound: properties.length,
        limit: limit
      });
    }
    
    // Process properties to ensure consistent agent data
    // Skip complex processing for dashboard requests to improve performance
    const processedProperties = isDashboardRequest 
      ? properties.map(property => property.toObject ? property.toObject() : property)
      : await Promise.all(properties.map(async (property) => {
          const propertyObj = property.toObject ? property.toObject() : property;
      
      // Store the original agentId as a string for navigation
      let originalAgentId = null;
      if (propertyObj.agentId) {
        if (typeof propertyObj.agentId === 'object' && propertyObj.agentId._id) {
          originalAgentId = propertyObj.agentId._id.toString();
        } else if (typeof propertyObj.agentId === 'string') {
          originalAgentId = propertyObj.agentId;
        }
      }
      
      // ALWAYS use populated agentId data for fresh agent information
      if (propertyObj.agentId && typeof propertyObj.agentId === 'object') {
        // Force refresh of agent data from current user profile
        // Check both top-level avatar and profile.avatar
        const agentAvatar = propertyObj.agentId.avatar || propertyObj.agentId.profile?.avatar;
        
        propertyObj.agent = {
          name: propertyObj.agentId.fullName || `${propertyObj.agentId.firstName || ''} ${propertyObj.agentId.lastName || ''}`.trim() || 'Agent',
          phone: propertyObj.agentId.phone || 'N/A',
          image: agentAvatar || DEFAULT_AVATAR_URL, // This will always be the current avatar
          rating: 5.0,
          verified: propertyObj.agentId.agentProfile?.verified || false
        };
        
        // Debug logging for agent data
        console.log('🔍 Property agent data (populated - current):', {
          propertyId: propertyObj.propertyId,
          agentName: propertyObj.agent.name,
          agentAvatar: propertyObj.agent.image,
          agentIdTopLevelAvatar: propertyObj.agentId.avatar,
          agentIdProfileAvatar: propertyObj.agentId.profile?.avatar,
          finalAvatar: agentAvatar,
          isCurrentAvatar: true
        });
      } else if (propertyObj.agentId && typeof propertyObj.agentId === 'string') {
        // If agentId is just a string, we need to fetch the user data
        try {
          const User = (await import('@/models/User')).default;
          const agentUser = await User.findById(propertyObj.agentId);
          if (agentUser) {
            // Check both top-level avatar and profile.avatar
            const agentAvatar = agentUser.avatar || agentUser.profile?.avatar;
            
            propertyObj.agent = {
              id: agentUser._id.toString(), // Add agent ID for navigation
              name: agentUser.fullName || `${agentUser.firstName || ''} ${agentUser.lastName || ''}`.trim() || 'Agent',
              phone: agentUser.phone || 'N/A',
              image: agentAvatar || DEFAULT_AVATAR_URL, // Current avatar from user profile
              rating: 5.0,
              verified: agentUser.agentProfile?.verified || false
            };
            
            console.log('🔍 Property agent data (fetched - current):', {
              propertyId: propertyObj.propertyId,
              agentName: propertyObj.agent.name,
              agentAvatar: propertyObj.agent.image,
              agentUserTopLevelAvatar: agentUser.avatar,
              agentUserProfileAvatar: agentUser.profile?.avatar,
              finalAvatar: agentAvatar,
              isCurrentAvatar: true
            });
          } else {
            // Fallback to embedded data if user not found
            propertyObj.agent = {
              id: propertyObj.agentId?.toString() || '', // Add agent ID for navigation
              name: propertyObj.agent?.name || 'Agent',
              phone: propertyObj.agent?.phone || 'N/A',
              image: propertyObj.agent?.image || DEFAULT_AVATAR_URL,
              rating: propertyObj.agent?.rating || 5.0,
              verified: propertyObj.agent?.verified || false
            };
            
            console.log('🔍 Property agent data (fallback):', {
              propertyId: propertyObj.propertyId,
              agentName: propertyObj.agent.name,
              agentAvatar: propertyObj.agent.image,
              isCurrentAvatar: false
            });
          }
        } catch (error) {
          console.error('Error fetching agent user data:', error);
          // Fallback to embedded data
          propertyObj.agent = {
            id: propertyObj.agentId?.toString() || '', // Add agent ID for navigation
            name: propertyObj.agent?.name || 'Agent',
            phone: propertyObj.agent?.phone || 'N/A',
            image: propertyObj.agent?.image || DEFAULT_AVATAR_URL,
            rating: propertyObj.agent?.rating || 5.0,
            verified: propertyObj.agent?.verified || false
          };
        }
      } else {
        // Fallback to embedded agent data if no agentId
        propertyObj.agent = {
          id: propertyObj.agentId?.toString() || '', // Add agent ID for navigation
          name: propertyObj.agent?.name || 'Agent',
          phone: propertyObj.agent?.phone || 'N/A',
          image: propertyObj.agent?.image || DEFAULT_AVATAR_URL,
          rating: propertyObj.agent?.rating || 5.0,
          verified: propertyObj.agent?.verified || false
        };
        
        console.log('🔍 Property agent data (fallback - no agentId):', {
          propertyId: propertyObj.propertyId,
          agentName: propertyObj.agent.name,
          agentAvatar: propertyObj.agent.image,
          isCurrentAvatar: false
        });
      }
      
      // Always set agentId if we have agent data, even if originalAgentId was null
      if (originalAgentId) {
        propertyObj.agentId = originalAgentId;
      } else if (propertyObj.agent?.id) {
        // If we have agent data but no originalAgentId, use the agent.id
        propertyObj.agentId = propertyObj.agent.id;
      }
      
      return propertyObj;
    }));
    
    return NextResponse.json({ 
      success: true, 
      data: processedProperties 
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch properties' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Starting property creation...');
    
    await connectDB();
    console.log('✅ Database connected');
    
    // Get session for authorization
    const session = getSessionFromRequest(request);
    if (!session) {
      console.log('❌ No valid session found');
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    
    console.log('📋 Session found:', { userId: session.userId, role: session.role });
    
    // Check authorization for creating properties
    // For create operations with "own" permissions, allow if user is creating for themselves
    const authResult = isAllowed({
      sessionUserId: session.userId,
      role: session.role,
      action: 'create',
      resource: 'property',
      ownerId: session.userId // Set ownerId to session user for create operations
    });
    
    if (!authResult.allowed) {
      console.log('❌ Authorization denied:', authResult.reason);
      return NextResponse.json({ 
        success: false, 
        error: 'Forbidden: insufficient permissions' 
      }, { status: 403 });
    }
    
    console.log('✅ User authorized to create properties');
    
    // Get user profile for agent data (include agentProfile for superadmin)
    let user = await User.findById(session.userId).select('role fullName phone email profile avatar agentProfile')
    if (!user) {
      console.log('❌ User not found with session ID, trying to find superadmin user...');
      // Fallback: if session user ID doesn't exist, find the superadmin user
      user = await User.findOne({ role: 'superadmin' }).select('role fullName phone email profile avatar agentProfile')
      if (!user) {
        console.log('❌ No superadmin user found either');
        return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
      }
      console.log('✅ Found superadmin user as fallback:', { id: user._id, role: user.role, fullName: user.fullName });
    }
    
    // Check if user has agent profile (superadmin should have enhanced agent profile)
    const hasAgentProfile = user.agentProfile && Object.keys(user.agentProfile).length > 0;
    if (!hasAgentProfile && (user.role === 'superadmin' || user.role === 'agent')) {
      console.log('⚠️ User is superadmin/agent but missing agent profile');
      // For now, we'll continue but log the issue
      console.log('📝 Note: Superadmin should have enhanced agent profile for full functionality');
    }
    
    console.log('✅ User profile loaded:', { id: user._id, role: user.role, fullName: user.fullName });
    
    // Parse request body
    const body = await request.json();
    console.log('📦 Request body:', body);
    
    // Validate required fields
    const requiredFields = ['title', 'description', 'price', 'location', 'district', 'bedrooms', 'bathrooms'];
    const missingFields = requiredFields.filter(field => !body[field]);
    
    if (missingFields.length > 0) {
      console.log('❌ Missing required fields:', missingFields);
      return NextResponse.json(
        { success: false, error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }
    
    // Generate next property ID
    const nextPropertyId = await getNextPropertyId();
    console.log('🆔 Generated property ID:', nextPropertyId);
    
    // Company logo is now applied as a watermark overlay, not added to images array
    const companyLogoUrl = getCompanyLogoUrl();
    console.log('🔧 Company logo configuration check:');
    console.log('  ENABLE_COMPANY_LOGO:', process.env.ENABLE_COMPANY_LOGO);
    console.log('  COMPANY_LOGO_URL:', process.env.COMPANY_LOGO_URL);
    console.log('  getCompanyLogoUrl() result:', companyLogoUrl);
    console.log('ℹ️ Company logo will be applied as watermark overlay on frontend');
    
    // Prepare images array (no logo added to array - it's a watermark overlay)
    let imagesArray = body.additionalImages && Array.isArray(body.additionalImages) ? body.additionalImages : [];
    console.log('📸 Images array:', imagesArray);
    
    // Prepare agent data for the property
    // Check both top-level avatar and profile.avatar
    const agentAvatar = user.avatar || user.profile?.avatar;
    
    console.log('🔍 User avatar debug:', {
      userId: user._id,
      topLevelAvatar: user.avatar,
      profileAvatar: user.profile?.avatar,
      finalAvatar: agentAvatar,
      hasAvatar: !!agentAvatar
    });
    
    const agentData = {
      name: user.fullName || user.firstName + ' ' + user.lastName || 'Agent',
      phone: user.phone || 'N/A',
      image: agentAvatar || DEFAULT_AVATAR_URL,
      rating: 5.0 // Default rating for new agents
    };
    
    console.log('👤 Agent data for property:', agentData);

    // Automatically append Somali language suffix based on listing type
    let enhancedTitle = body.title;
    const listingType = body.listingType || 'sale';
    
    if (listingType === 'rent') {
      enhancedTitle = `${body.title} Kiro ah`;
    } else if (listingType === 'sale') {
      enhancedTitle = `${body.title} iib ah`;
    }
    
    console.log('🏷️ Title enhancement:', {
      originalTitle: body.title,
      listingType: listingType,
      enhancedTitle: enhancedTitle
    });

    // Sanitize and prepare property data
    const allowedFields = [
      'title', 'location', 'district', 'price', 'bedrooms', 'beds', 'bathrooms', 'baths',
      'area', 'sqft', 'yearBuilt', 'lotSize', 'propertyType', 'listingType', 'measurement',
      'status', 'description', 'features', 'amenities', 'thumbnailImage', 'additionalImages'
    ];
    
    const sanitizedData = sanitizeUpdateData(body, allowedFields);
    
    // Create property data with enforced ownership
    const propertyData: any = enforceOwnership({
      propertyId: nextPropertyId,
      title: enhancedTitle,
      location: sanitizedData.location,
      district: sanitizedData.district,
      price: parseFloat(sanitizedData.price),
      beds: parseInt(sanitizedData.bedrooms || sanitizedData.beds || '0'),
      baths: parseInt(sanitizedData.bathrooms || sanitizedData.baths || '0'),
      sqft: sanitizedData.area ? parseInt(sanitizedData.area) : (sanitizedData.sqft ? parseInt(sanitizedData.sqft) : undefined),
      yearBuilt: parseInt(sanitizedData.yearBuilt) || 2020,
      lotSize: parseInt(sanitizedData.lotSize) || 1000,
      propertyType: sanitizedData.propertyType || 'villa',
      listingType: listingType,
      measurement: sanitizedData.measurement || undefined,
      status: sanitizedData.status || (listingType === 'rent' ? 'For Rent' : 'For Sale'),
      description: sanitizedData.description,
      features: Array.isArray(sanitizedData.features) ? sanitizedData.features : [],
      amenities: Array.isArray(sanitizedData.amenities) ? sanitizedData.amenities : [],
      thumbnailImage: sanitizedData.thumbnailImage || '',
      images: imagesArray,
      agent: agentData,
      deletionStatus: 'active'
    }, session.userId, 'agentId' as any);
    
    console.log('🏗️ Creating property with data:', propertyData);
    console.log('🔍 Status field debug:', {
      bodyStatus: body.status,
      bodyListingType: body.listingType,
      finalStatus: propertyData.status,
      statusType: typeof propertyData.status
    });
    
    // Additional validation before saving
    if (propertyData.yearBuilt < 1800) {
      return NextResponse.json(
        { success: false, error: 'Year built must be 1800 or later' },
        { status: 400 }
      );
    }
    
    if (propertyData.price < 0) {
      return NextResponse.json(
        { success: false, error: 'Price must be positive' },
        { status: 400 }
      );
    }
    
    if (propertyData.beds < 0 || propertyData.baths < 0 || (propertyData.sqft && propertyData.sqft < 0)) {
      return NextResponse.json(
        { success: false, error: 'Bedrooms and bathrooms must be positive' },
        { status: 400 }
      );
    }
    
    // Debug: Log the property data being saved
    console.log('🔍 Property data being saved:', {
      thumbnailImage: propertyData.thumbnailImage,
      thumbnailImageType: typeof propertyData.thumbnailImage,
      thumbnailImageLength: propertyData.thumbnailImage?.length,
      hasThumbnailImage: !!propertyData.thumbnailImage,
      thumbnailImageEmpty: propertyData.thumbnailImage === '',
      thumbnailImageNull: propertyData.thumbnailImage === null,
      thumbnailImageUndefined: propertyData.thumbnailImage === undefined
    });
    
    // Create and save property
    const property = new Property(propertyData);
    await property.save();
    
    console.log('✅ Property created successfully:', property._id);
    console.log('📋 Saved property details:', {
      id: property._id,
      propertyId: property.propertyId,
      title: property.title,
      deletionStatus: property.deletionStatus,
      agentId: property.agentId,
      createdAt: property.createdAt
    });
    
    // Verify the property was saved correctly by fetching it
    const savedProperty = await Property.findById(property._id);
    console.log('🔍 Verification - Property exists in database:', !!savedProperty);
    if (savedProperty) {
      console.log('🔍 Verification - Property deletionStatus:', savedProperty.deletionStatus);
      console.log('🔍 Verification - Property is queryable:', savedProperty.deletionStatus !== 'deleted');
    }
    
    return NextResponse.json({ 
      success: true, 
      data: property 
    }, { status: 201 });
    
  } catch (error) {
    console.error('💥 Error creating property:', error);
    return NextResponse.json(
      { success: false, error: `Server error: ${error}` },
      { status: 500 }
    );
  }
}
