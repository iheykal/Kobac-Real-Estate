import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { verifyPassword, validatePhoneNumber, normalizePhoneNumber } from '@/lib/passwordUtils';
import { regenerateSession, setSessionCookie } from '@/lib/sessionUtils';

export async function POST(request: NextRequest) {
  try {
    console.log('🔑 Login request received');
    await connectDB();
    
    const body = await request.json();
    const { phone, password } = body;
    
    console.log('📱 Login attempt:', { phone, password: password ? '***' : 'missing' });
    
    // Validate required fields
    if (!phone || !password) {
      console.log('❌ Missing required fields');
      return NextResponse.json(
        { success: false, error: 'Missing required fields: phone, password' },
        { status: 400 }
      );
    }
    
    // Normalize phone number
    const normalizedPhone = normalizePhoneNumber(phone);
    
    // Validate phone number format
    if (!validatePhoneNumber(normalizedPhone)) {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid phone number (9 digits after +252)' },
        { status: 400 }
      );
    }
    
    // Find user by phone number
    const user = await User.findOne({ phone: normalizedPhone });
    if (!user) {
      console.log('❌ User not found:', normalizedPhone);
      return NextResponse.json(
        { success: false, error: 'Invalid phone number or password' },
        { status: 401 }
      );
    }
    
    console.log('✅ User found:', user.fullName);
    
    // Check if user has old plain-text password (migration needed)
    if (!user.passwordHash && (user as any).password) {
      console.log('⚠️ User has old plain-text password, checking for legacy numeric password');
      
      // Check if it's a legacy numeric password
      const oldPassword = (user as any).password;
      if (oldPassword === password) {
        console.log('✅ Legacy numeric password verified, but migration required');
        return NextResponse.json(
          { success: false, error: 'Password reset required. Please use the password reset feature to upgrade your account security.', code: 'PASSWORD_RESET_REQUIRED' },
          { status: 401 }
        );
      } else {
        console.log('❌ Legacy password mismatch');
        return NextResponse.json(
          { success: false, error: 'Invalid phone number or password' },
          { status: 401 }
        );
      }
    }
    
    // Verify password using constant-time comparison
    const isPasswordValid = await verifyPassword(user.passwordHash, password);
    if (!isPasswordValid) {
      console.log('❌ Password mismatch for user:', normalizedPhone);
      
      // Increment login attempts
      user.security.loginAttempts = (user.security.loginAttempts || 0) + 1;
      await user.save();
      
      return NextResponse.json(
        { success: false, error: 'Invalid phone number or password' },
        { status: 401 }
      );
    }
    
    console.log('✅ Password verified successfully');
    
    // Reset login attempts on successful login
    user.security.loginAttempts = 0;
    user.security.lastLogin = new Date();
    await user.save();
    
    // Create response with user data
    const res = NextResponse.json({ 
      success: true, 
      message: 'Login successful',
      data: {
        id: user._id,
        fullName: user.fullName,
        phone: user.phone,
        role: user.role,
        avatar: user.profile?.avatar,
        createdAt: user.createdAt
      }
    });

    // Regenerate session to prevent session fixation
    regenerateSession(res, String(user._id), user.role, process.env.NODE_ENV === 'production');
    
    console.log('🍪 Session regenerated for user:', user.fullName);

    return res;
    
  } catch (error) {
    console.error('Error during login:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to authenticate user' },
      { status: 500 }
    );
  }
}
