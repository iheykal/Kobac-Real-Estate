import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Property from "@/models/Property";
import User from "@/models/User";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Debugging property agent data...');
    
    // Connect to database
    await connectDB();
    
    // Get a few properties to check agent data
    const properties = await Property.find({})
      .populate('agentId', '_id fullName phone email avatar profile.avatar')
      .limit(5)
      .select('_id title agentId agent');
    
    console.log('📊 Found properties:', properties.length);
    
    const debugData = properties.map(property => {
      const propertyObj = property.toObject ? property.toObject() : property;
      
      // Check agentId field
      let agentIdData = null;
      if (propertyObj.agentId) {
        if (typeof propertyObj.agentId === 'object') {
          agentIdData = {
            type: 'object',
            _id: propertyObj.agentId._id,
            fullName: propertyObj.agentId.fullName,
            phone: propertyObj.agentId.phone,
            email: propertyObj.agentId.email,
            avatar: propertyObj.agentId.avatar || propertyObj.agentId.profile?.avatar
          };
        } else {
          agentIdData = {
            type: 'string',
            value: propertyObj.agentId
          };
        }
      }
      
      // Check agent field
      let agentData = null;
      if (propertyObj.agent) {
        agentData = {
          type: 'object',
          id: propertyObj.agent.id,
          name: propertyObj.agent.name,
          phone: propertyObj.agent.phone,
          email: propertyObj.agent.email,
          image: propertyObj.agent.image
        };
      }
      
      return {
        propertyId: propertyObj._id,
        title: propertyObj.title,
        agentId: agentIdData,
        agent: agentData,
        hasAgentId: !!propertyObj.agentId,
        hasAgent: !!propertyObj.agent,
        agentIdType: typeof propertyObj.agentId,
        agentType: typeof propertyObj.agent
      };
    });
    
    // Also check if there are any users with agent profiles
    const usersWithAgentProfiles = await User.find({
      agentProfile: { $exists: true, $ne: null }
    }).select('_id fullName phone role agentProfile');
    
    console.log('👤 Users with agent profiles:', usersWithAgentProfiles.length);
    
    return NextResponse.json({
      success: true,
      properties: debugData,
      usersWithAgentProfiles: usersWithAgentProfiles.map(user => ({
        id: user._id.toString(),
        fullName: user.fullName,
        phone: user.phone,
        role: user.role,
        hasAgentProfile: !!user.agentProfile,
        agentProfileKeys: user.agentProfile ? Object.keys(user.agentProfile) : []
      })),
      analysis: {
        totalProperties: properties.length,
        propertiesWithAgentId: properties.filter(p => p.agentId).length,
        propertiesWithAgent: properties.filter(p => p.agent).length,
        usersWithAgentProfiles: usersWithAgentProfiles.length
      }
    });
    
  } catch (error) {
    console.error('❌ Debug property agent data error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
