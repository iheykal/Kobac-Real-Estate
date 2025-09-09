import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    console.log('👑 SuperAdmin fetching users...');
    await connectDB();

    // Check if user is SuperAdmin
    const authResponse = await fetch(`${request.nextUrl.origin}/api/auth/me`, {
      headers: {
        cookie: request.headers.get('cookie') || '',
      },
    });

    const authResult = await authResponse.json();
    console.log('👑 Admin API auth check:', authResult);
    
    if (!authResponse.ok || (!authResult.user && !authResult.data)) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const currentUser = authResult.user || authResult.data;
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
