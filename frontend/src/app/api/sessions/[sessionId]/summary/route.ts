import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { API_ENDPOINTS, buildApiUrl } from '@/lib/endpoints';
import { api } from '@/lib/api';

const COMPONENT_NAME = 'SummaryAPI';

interface SummaryResponse {
  url: string;
  generatedAt: string;
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await context.params;
  
  logger.info(COMPONENT_NAME, 'Requesting summary', { sessionId });

  if (!sessionId) {
    return NextResponse.json({
      error: 'Session ID is required',
      metadata: {
        requestId: crypto.randomUUID(),
        timestamp: new Date().toISOString()
      }
    }, { status: 400 });
  }

  try {
    const url = buildApiUrl(API_ENDPOINTS.CONSULTATIONS.SESSIONS.SUMMARY(sessionId));
    logger.debug(COMPONENT_NAME, 'Calling backend', { url: url });

    const response = await api.fetch(url, {
      method: 'POST'
    });

    if (!response.ok) {
      logger.error(COMPONENT_NAME, 'Backend error', { 
        status: response.status,
        sessionId 
      });
      throw new Error(`Backend returned ${response.status}`);
    }

    const data = await response.json() as SummaryResponse;
    logger.info(COMPONENT_NAME, 'Summary retrieved successfully', { sessionId });
    return NextResponse.json(data, { status: 200 });
    
  } catch (error) {
    logger.error(COMPONENT_NAME, 'Failed to get summary', {
      error: error instanceof Error ? error.message : String(error),
      sessionId
    });

    return NextResponse.json({
      error: 'Failed to get consultation summary',
      metadata: {
        requestId: crypto.randomUUID(),
        timestamp: new Date().toISOString()
      }
    }, { status: 500 });
  }
}
