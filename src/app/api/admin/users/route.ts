import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    console.log('👑 SuperAdmin fetching users...');
    await connectDB();

    // Check authentication using internal method
    const { getSessionFromRequest } = await import('@/lib/sessionUtils');
    const session = getSessionFromRequest(request);
    
    if (!session) {
      console.log('❌ No valid session found');
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get user from database
    const User = (await import('@/models/User')).default;
    const currentUser = await User.findById(session.userId).select('_id fullName phone role status permissions');
    
    if (!currentUser) {
      console.log('❌ User not found in database');
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 401 }
      );
    }

    console.log('👑 Admin API auth check:', { userId: currentUser._id, role: currentUser.role });
    // Allow superadmin, agency, and users with admin permissions
    const allowedRoles = ['superadmin', 'super_admin', 'agency'];
    const hasAdminPermissions = currentUser.permissions?.canManageUsers;
    
    if (!allowedRoles.includes(currentUser.role) && !hasAdminPermissions) {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const page = parseInt(searchParams.get('page') || '1');

    // Build query
    const query: any = {};
    
    if (role) {
      if (role.includes(',')) {
        query.role = { $in: role.split(',') };
      } else {
        query.role = role;
      }
    }
    
    if (status) {
      query.status = status;
    }

    // Fetch users
    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit)
      .lean();

    // Get total count for pagination
    const totalCount = await User.countDocuments(query);

    console.log(`✅ SuperAdmin fetched ${users.length} users`);

    return NextResponse.json({
      success: true,
      data: users,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    });

  } catch (error) {
    console.error('❌ Error fetching users:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}
