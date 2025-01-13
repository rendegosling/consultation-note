import { NextRequest, NextResponse } from 'next/server';
import { consultationRepository } from '@/modules/consultations/repositories/ConsultationRepository';
import { logger } from '@/infrastructure/logging/logger';

const COMPONENT_NAME = 'SessionAPI';

export async function POST(req: NextRequest) {
  try {
    const session = await consultationRepository.createSession();
    
    logger.info(COMPONENT_NAME, 'Session created', {
      sessionId: session.id
    });

    return NextResponse.json({ session }, { status: 201 });
  } catch (error) {
    logger.error(COMPONENT_NAME, 'Failed to create session', {
      error: error instanceof Error ? error.message : String(error)
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