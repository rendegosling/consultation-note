export interface AudioChunkData {
  chunkNumber: number;
  s3Key: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  metadata: {
    size: number;
    type: string;
    timestamp: string;
    error?: string;
  };
}

export interface ConsultationSessionData {
  id: string;
  startedAt: Date;
  endedAt: Date | null;
  status: 'active' | 'completed' | 'error';
  metadata: {
    audioChunks?: AudioChunkData[];
    totalChunks?: number;
    [key: string]: unknown;
  };
}

export interface ChunkMetadata {
  chunkNumber: number;
  s3Key: string;
  isLastChunk: boolean;
  metadata: {
    size: number;
    type: string;
    timestamp: string;
  };
}

export interface ProcessedChunk {
  chunkNumber: number;
  transcript: string;
  confidence: number;
  speakers?: Array<{
    speaker: string;
    text: string;
    timestamp: string;
  }>;
}

export class AudioChunk {
  private constructor(private data: {
    chunkNumber: number;
    s3Key: string;
    status: 'pending' | 'processing' | 'completed' | 'error';
    metadata: {
      size: number;
      type: string;
      timestamp: string;
      error?: string;
    };
  }) {}

  static create(data: AudioChunkData): AudioChunk {
    return new AudioChunk(data);
  }

  markAsProcessing(): void {
    this.data.status = 'processing';
  }

  markAsCompleted(): void {
    this.data.status = 'completed';
  }

  markAsError(error: string): void {
    this.data.status = 'error';
    this.data.metadata.error = error;
  }

  toJSON(): AudioChunkData {
    return { ...this.data };
  }
}

export class ConsultationSession {
  private constructor(private data: {
    id: string;
    startedAt: Date;
    endedAt: Date | null;
    status: 'active' | 'completed' | 'error';
    metadata: {
      audioChunks?: AudioChunkData[];
      transcripts?: Map<number, string>;
      totalChunks?: number;
      [key: string]: unknown;
    };
  }) {}

  static create(data: ConsultationSessionData): ConsultationSession {
    return new ConsultationSession(data);
  }

  static createNew(metadata?: Record<string, unknown>): ConsultationSession {
    return new ConsultationSession({
      id: crypto.randomUUID(),
      startedAt: new Date(),
      endedAt: null,
      status: 'active',
      metadata: metadata || {}
    });
  }

  addAudioChunk(chunk: {
    chunkNumber: number;
    s3Key: string;
    isLastChunk: boolean;
    metadata: {
      size: number;
      type: string;
      timestamp: string;
    };
  }): void {
    if (!this.data.metadata.audioChunks) {
      this.data.metadata.audioChunks = [];
    }

    const audioChunk = AudioChunk.create({
      chunkNumber: chunk.chunkNumber,
      s3Key: chunk.s3Key,
      status: 'pending',
      metadata: chunk.metadata
    });

    this.data.metadata.audioChunks.push(audioChunk.toJSON());

    if (chunk.isLastChunk) {
      this.data.metadata.totalChunks = chunk.chunkNumber;
    }
  }

  updateStatus(status: 'active' | 'completed' | 'error'): void {
    this.data.status = status;
  }

  addTranscript(chunkNumber: number, transcript: string): void {
    if (!this.data.metadata.transcripts) {
      this.data.metadata.transcripts = new Map();
    }

    this.data.metadata.transcripts.set(chunkNumber, transcript);
    
    // Check if all chunks have transcripts
    const audioChunks = this.data.metadata.audioChunks || [];
    const allTranscribed = audioChunks.every(chunk => 
      this.data.metadata.transcripts?.has(chunk.chunkNumber)
    );

    if (allTranscribed) {
      this.data.status = 'completed';
    }
  }

  toJSON(): ConsultationSessionData {
    return { ...this.data };
  }
} 