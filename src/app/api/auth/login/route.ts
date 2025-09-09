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
    
    // Find user by phone number - try multiple formats
    let user = await User.findOne({ phone: normalizedPhone });
    
    // If not found, try alternative formats
    if (!user) {
      console.log('🔍 User not found with normalized phone, trying alternatives...');
      
      // Try without country code
      const phoneWithoutCountry = phone.replace(/^\+252/, '');
      if (phoneWithoutCountry !== phone) {
        user = await User.findOne({ phone: '+252' + phoneWithoutCountry });
        console.log('🔍 Tried without country code:', '+252' + phoneWithoutCountry, 'Found:', !!user);
      }
      
      // Try with just the digits
      if (!user) {
        const phoneDigits = phone.replace(/\D/g, '');
        if (phoneDigits.length === 9) {
          user = await User.findOne({ phone: '+252' + phoneDigits });
          console.log('🔍 Tried with 9 digits:', '+252' + phoneDigits, 'Found:', !!user);
        }
      }
      
      // Try exact match
      if (!user) {
        user = await User.findOne({ phone: phone });
        console.log('🔍 Tried exact match:', phone, 'Found:', !!user);
      }
    }
    
    if (!user) {
      console.log('❌ User not found with any phone format:', {
        original: phone,
        normalized: normalizedPhone,
        withoutCountry: phone.replace(/^\+252/, ''),
        digits: phone.replace(/\D/g, '')
      });
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
    
    // Debug password hash info
    console.log('🔍 Password hash debug:', {
      hasPasswordHash: !!user.passwordHash,
      hashLength: user.passwordHash?.length,
      hashStart: user.passwordHash?.substring(0, 10),
      hasLegacyPassword: !!(user as any).password,
      passwordLength: password?.length
    });
    
    // Verify password using constant-time comparison
    const isPasswordValid = await verifyPassword(user.passwordHash, password);
    if (!isPasswordValid) {
      console.log('❌ Password mismatch for user:', normalizedPhone);
      console.log('🔍 Hash details:', {
        hash: user.passwordHash?.substring(0, 20) + '...',
        password: password?.substring(0, 3) + '...'
      });
      
      // Increment login attempts
      user.security.loginAttempts = (user.security.loginAttempts || 0) + 1;
      await user.save();
      
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid phone number or password',
          debug: {
            hashLength: user.passwordHash?.length,
            hasLegacyPassword: !!(user as any).password,
            loginAttempts: user.security.loginAttempts
          }
        },
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
