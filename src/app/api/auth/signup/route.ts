import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { generateUniqueAvatar } from '@/lib/utils';
import { validatePassword, hashPassword, validatePhoneNumber, normalizePhoneNumber } from '@/lib/passwordUtils';
import { setSessionCookie, createSessionPayload } from '@/lib/sessionUtils';

export async function POST(request: NextRequest) {
  try {
    console.log('🔐 Signup request received');
    await connectDB();
    
    const body = await request.json();
    const { fullName, phone, password } = body;
    
    console.log('📝 Signup data:', { fullName, phone, password: password ? '***' : 'missing' });
    
    // Validate required fields
    if (!fullName || !phone || !password) {
      console.log('❌ Missing required fields');
      return NextResponse.json(
        { success: false, error: 'Missing required fields: fullName, phone, password' },
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
    
    // Validate password strength
    const passwordError = validatePassword(password, normalizedPhone);
    if (passwordError) {
      return NextResponse.json(
        { success: false, error: passwordError },
        { status: 400 }
      );
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({ phone: normalizedPhone });
    if (existingUser) {
      console.log('❌ User already exists:', normalizedPhone);
      return NextResponse.json(
        { success: false, error: 'User with this phone number already exists' },
        { status: 409 }
      );
    }
    
    console.log('✅ Creating new user...');
    
    // Hash the password
    const passwordHash = await hashPassword(password);
    
    // Create new user (defaults to USER role)
    const user = new User({
      fullName,
      phone: normalizedPhone,
      passwordHash,
      passwordChangedAt: new Date(),
      role: 'user', // Default role for regular signups
      status: 'active', // Normal users are active by default
      profile: {
        avatar: generateUniqueAvatar(fullName, normalizedPhone), // Generate unique avatar
        location: 'Somalia'
      },
      preferences: {
        favoriteProperties: [],
        searchHistory: [],
        notifications: {
          email: true,
          sms: true,
          push: true,
          propertyUpdates: true,
          marketNews: false,
          promotionalOffers: false
        },
        language: 'en',
        currency: 'USD',
        timezone: 'Africa/Mogadishu'
      },
      security: {
        loginAttempts: 0,
        twoFactorEnabled: false,
        mustChangePassword: false
      }
    });
    
    await user.save();
    console.log('✅ User created successfully:', user._id);
    
    // Create session and set cookie
    const sessionPayload = createSessionPayload(String(user._id), user.role);
    const response = NextResponse.json({ 
      success: true, 
      message: 'User registered successfully',
      data: {
        id: user._id,
        fullName: user.fullName,
        phone: user.phone,
        role: user.role,
        avatar: user.profile?.avatar,
        createdAt: user.createdAt
      }
    }, { status: 201 });
    
    setSessionCookie(response, sessionPayload, process.env.NODE_ENV === 'production');
    
    return response;
    
  } catch (error) {
    console.error('Error during signup:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create user account' },
      { status: 500 }
    );
  }
}
