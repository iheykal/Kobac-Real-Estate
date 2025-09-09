import { NextRequest, NextResponse } from 'next/server';
import { agentCache } from '@/lib/agentCache';

export const dynamic = 'force-dynamic';

/**
 * Instant agent API - only returns cached data, no database queries
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const startTime = Date.now();
  try {
    const agentId = params.id;
    console.log('⚡ Instant agent API for ID:', agentId);
    
    // Only check cache - no database queries
    const cachedData = agentCache.get(agentId);
    if (cachedData) {
      const responseTime = Date.now() - startTime;
      console.log(`⚡ Instant cache hit in ${responseTime}ms`);
      return NextResponse.json({
        success: true,
        data: cachedData,
        cached: true,
        responseTime: responseTime
      });
    }
    
    // No cache - return specific error code for frontend handling
    const responseTime = Date.now() - startTime;
    console.log(`⚡ No cache found in ${responseTime}ms`);
    return NextResponse.json(
      { 
        success: false, 
        error: 'No cached data available',
        code: 'NO_CACHE',
        responseTime: responseTime
      },
      { status: 404 }
    );
    
  } catch (error) {
    console.error('Error in instant agent API:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch agent' },
      { status: 500 }
    );
  }
}
