import { NextRequest, NextResponse } from 'next/server';
import { audioChunkSchema } from '@/lib/audioSchemaValidator';
import { logger } from '@/lib/logger';
import { z } from 'zod';
import { API_ENDPOINTS, buildApiUrl } from '@/lib/endpoints';
import { api } from '@/lib/api';

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
      size: (formData.get('chunk') as Blob)?.size || 0,
      type: (formData.get('chunk') as Blob)?.type || '',
      timestamp: new Date().toISOString()
    };

    logger.info(COMPONENT_NAME, 'Validating chunk data', {
      sessionId,
      chunkNumber: rawData.chunkNumber,
      size: rawData.size,
      type: rawData.type,
      isLastChunk: rawData.isLastChunk
    });

    const validatedData = audioChunkSchema.parse(rawData);
    
    logger.info(COMPONENT_NAME, 'Chunk validation successful', {
      sessionId,
      chunkNumber: validatedData.chunkNumber
    });

    // Create a new FormData to forward to backend
    const backendFormData = new FormData();
    backendFormData.append('chunk', validatedData.chunk);
    backendFormData.append('chunkNumber', String(validatedData.chunkNumber));
    backendFormData.append('isLastChunk', String(validatedData.isLastChunk));
    backendFormData.append('size', String(validatedData.size));
    backendFormData.append('type', validatedData.type);
    backendFormData.append('timestamp', validatedData.timestamp);

    const url = buildApiUrl(API_ENDPOINTS.CONSULTATIONS.CHUNKS.UPLOAD(sessionId));
    const response = await api.fetch(url, {
      method: 'POST',
      body: backendFormData,
    });

    if (!response.ok) {
      throw new Error(`Backend responded with status: ${response.status}`);
    }

    const result = await response.json();
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