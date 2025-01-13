import { NextRequest, NextResponse } from 'next/server';
import { chunkUploadService } from '@/infrastructure/audio/services/ChunkUploadService';
import { logger } from '@/infrastructure/logging/logger';

const COMPONENT_NAME = 'ChunkUploadAPI';

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await context.params;
  
  try {
    const formData = await req.formData();
    const chunk = formData.get('chunk') as Blob;
    const chunkNumber = formData.get('chunkNumber');
    const isLastChunk = formData.get('isLastChunk') === 'true';

    if (!chunk || !chunkNumber) {
      return NextResponse.json(
        { error: 'Missing chunk or chunkNumber' },
        { status: 400 }
      );
    }

    const result = await chunkUploadService.uploadChunk({
      sessionId,
      chunk,
      chunkNumber: Number(chunkNumber),
      isLastChunk,
    });

    return NextResponse.json(result, { status: 202 });
  } catch (error) {
    logger.error(COMPONENT_NAME, 'API error', {
      error: error instanceof Error ? error.message : String(error),
      sessionId,
    });

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}