import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { API_ENDPOINTS, buildApiUrl } from '@/lib/endpoints';
import { api } from '@/lib/api';
import { z } from 'zod';

const COMPONENT_NAME = 'NotesAPI';

// Validation schema for the note
const noteSchema = z.object({
  note: z.string().min(1, 'Note cannot be empty').max(1000, 'Note is too long')
});

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await context.params;

  try {
    const body = await req.json();
    
    logger.info(COMPONENT_NAME, 'Validating note data', {
      sessionId,
      noteLength: body.note?.length
    });

    const validatedData = noteSchema.parse(body);

    const url = buildApiUrl(API_ENDPOINTS.CONSULTATIONS.NOTES.CREATE(sessionId));
    const response = await api.fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(validatedData)
    });

    if (!response.ok) {
      throw new Error(`Backend responded with status: ${response.status}`);
    }

    const result = await response.json();
    logger.info(COMPONENT_NAME, 'Note created successfully', {
      sessionId
    });

    return NextResponse.json(result, { status: 201 });

  } catch (error) {
    logger.error(COMPONENT_NAME, 'API error', {
      error: error instanceof Error ? error.message : String(error),
      sessionId,
      validationFailed: error instanceof z.ZodError
    });

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Validation failed',
        details: error.errors.map(e => ({
          path: e.path.join('.'),
          message: e.message
        })),
        metadata: {
          requestId: crypto.randomUUID(),
          timestamp: new Date().toISOString()
        }
      }, { status: 400 });
    }

    return NextResponse.json({
      error: 'Failed to create note',
      metadata: {
        requestId: crypto.randomUUID(),
        timestamp: new Date().toISOString()
      }
    }, { status: 500 });
  }
} 