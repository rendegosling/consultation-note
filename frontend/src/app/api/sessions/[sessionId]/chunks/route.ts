import { NextRequest, NextResponse } from 'next/server';
import { audioChunkSchema } from '@/infrastructure/audio/validators/chunk-upload';
import { chunkUploadService } from '@/infrastructure/audio/services/ChunkUploadService';
import { APIResponse } from '@/infrastructure/api/types';
import { logger } from '@/infrastructure/logging/logger';
import { z } from 'zod';

const COMPONENT_NAME = 'ChunkUploadAPI';

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await context.params;
  
  try {
    const formData = await req.formData();
    const rawData = {
      chunk: formData.get('chunk'),
      chunkNumber: Number(formData.get('chunkNumber')),
      isLastChunk: formData.get('isLastChunk') === 'true',
      metadata: {
        size: (formData.get('chunk') as Blob)?.size || 0,
        type: (formData.get('chunk') as Blob)?.type || '',
        timestamp: new Date().toISOString()
      }
    };

    logger.info(COMPONENT_NAME, 'Validating chunk data', {
      sessionId,
      chunkNumber: rawData.chunkNumber,
      size: rawData.metadata.size,
      type: rawData.metadata.type,
      isLastChunk: rawData.isLastChunk
    });

    const validatedData = audioChunkSchema.parse(rawData);
    
    logger.info(COMPONENT_NAME, 'Chunk validation successful', {
      sessionId,
      chunkNumber: validatedData.chunkNumber
    });

    const result = await chunkUploadService.uploadChunk(validatedData);

    return NextResponse.json(result, { status: 202 });
  } catch (error) {
    logger.error(COMPONENT_NAME, 'API error', {
      error: error instanceof Error ? error.message : String(error),
      sessionId,
      validationFailed: error instanceof Error && error.name === 'ZodError'
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
      error: 'Failed to process chunk',
      metadata: {
        requestId: crypto.randomUUID(),
        timestamp: new Date().toISOString()
      }
    }, { status: 500 });
  }
}