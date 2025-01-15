import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { API_ENDPOINTS, buildApiUrl } from '@/lib/endpoints';
import type { CreateSessionResponse } from '@/lib/types';

const COMPONENT_NAME = 'SessionAPI';

export async function POST() {
  const url = buildApiUrl(API_ENDPOINTS.CONSULTATIONS.SESSIONS.CREATE);
  
  logger.info(COMPONENT_NAME, 'Attempting to create session', {
    url,
    method: 'POST'
  });

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    logger.info(COMPONENT_NAME, 'Received response from backend', {
      status: response.status,
      ok: response.ok,
      statusText: response.statusText
    });

    if (!response.ok) {
      throw new Error(`Backend responded with status: ${response.status} (${response.statusText})`);
    }

    const data = await response.json() as CreateSessionResponse;
    
    logger.info(COMPONENT_NAME, 'Session created via backend', {
      sessionId: data.session.id,
      status: data.session.status
    });

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    logger.error(COMPONENT_NAME, 'Failed to create session', {
      error: error instanceof Error ? error.message : String(error),
      url,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      error: 'Failed to create session',
      metadata: {
        requestId: crypto.randomUUID(),
        timestamp: new Date().toISOString()
      }
    }, { status: 500 });
  }
} 