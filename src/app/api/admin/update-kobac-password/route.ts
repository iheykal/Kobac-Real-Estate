import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Updating Kobac password...');
    await connectDB();
    
    // Kobac's user ID
    const kobacId = "68bdbf0802eba5353c2eef66";
    
    // Find Kobac user
    const user = await User.findById(kobacId);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Kobac user not found' },
        { status: 404 }
      );
    }
    
    console.log('✅ Found Kobac user:', user.fullName);
    
    // Update password to plain text
    (user as any).password = "8080kobac";
    user.passwordChangedAt = new Date();
    
    // Remove passwordHash if it exists
    if (user.passwordHash) {
      delete user.passwordHash;
    }
    
    await user.save();
    
    console.log('✅ Kobac password updated successfully');
    
    return NextResponse.json({
      success: true,
      message: 'Kobac password updated successfully',
      data: {
        id: user._id,
        fullName: user.fullName,
        phone: user.phone,
        hasPassword: !!(user as any).password,
        hasPasswordHash: !!user.passwordHash,
        passwordChangedAt: user.passwordChangedAt
      }
    });
    
  } catch (error) {
    console.error('❌ Error updating Kobac password:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update Kobac password',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
