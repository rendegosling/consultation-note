export enum AudioChunkStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  ERROR = 'error'
}

export interface AudioChunkData {
  chunkNumber: number;
  s3Key: string;
  status: AudioChunkStatus;
  metadata: {
    size: number;
    type: string;
    timestamp: string;
    error?: string;
  };
  transcript?: string;
  isPending: () => boolean;
}

export enum ConsultationStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  ERROR = 'error'
}

export interface ConsultationSessionData {
  id: string;
  startedAt: Date;
  endedAt: Date | null;
  status: ConsultationStatus;
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

export class AudioChunk implements AudioChunkData {
  private constructor(private data: {
    chunkNumber: number;
    s3Key: string;
    status: AudioChunkStatus;
    metadata: {
      size: number;
      type: string;
      timestamp: string;
      error?: string;
    };
    transcript?: string;
  }) {}

  static create(data: {
    chunkNumber: number;
    s3Key: string;
    status: AudioChunkStatus;
    metadata: {
      size: number;
      type: string;
      timestamp: string;
      error?: string;
    };
  }): AudioChunk {
    return new AudioChunk(data);
  }

  get chunkNumber(): number { return this.data.chunkNumber; }
  get s3Key(): string { return this.data.s3Key; }
  get status(): AudioChunkStatus { return this.data.status; }
  get metadata() { return this.data.metadata; }
  get transcript(): string | undefined { return this.data.transcript; }

  isPending(): boolean {
    return this.status === AudioChunkStatus.PENDING;
  }

  toJSON(): AudioChunkData {
    return { 
      ...this.data,
      isPending: () => this.isPending()
    };
  }
}

export class ConsultationSession implements ConsultationSessionData {
  private constructor(private data: ConsultationSessionData) {}

  get id(): string { return this.data.id; }
  get startedAt(): Date { return this.data.startedAt; }
  get endedAt(): Date | null { return this.data.endedAt; }
  get status(): ConsultationStatus { return this.data.status; }
  get metadata() { return this.data.metadata; }

  static create(data: ConsultationSessionData): ConsultationSession {
    return new ConsultationSession(data);
  }

  static createNew(metadata?: Record<string, unknown>): ConsultationSession {
    return new ConsultationSession({
      id: crypto.randomUUID(),
      startedAt: new Date(),
      endedAt: null,
      status: ConsultationStatus.ACTIVE,
      metadata: metadata || {}
    });
  }

  addAudioChunk(chunk: ChunkMetadata): void {
    if (!this.data.metadata.audioChunks) {
      this.data.metadata.audioChunks = [];
    }

    const audioChunk = AudioChunk.create({
      chunkNumber: chunk.chunkNumber,
      s3Key: chunk.s3Key,
      status: AudioChunkStatus.PENDING,
      metadata: chunk.metadata
    });

    this.data.metadata.audioChunks.push(audioChunk.toJSON());

    if (chunk.isLastChunk) {
      this.data.metadata.totalChunks = chunk.chunkNumber;
    }
  }

  updateStatus(status: ConsultationStatus): void {
    this.data.status = status;
  }

  addTranscript(chunkNumber: number, transcript: string): void {
    const chunk = this.data.metadata.audioChunks?.find(c => c.chunkNumber === chunkNumber);
    if (chunk) {
      chunk.transcript = transcript;
      chunk.status = AudioChunkStatus.COMPLETED;
    }
  }

  getChunkByNumber(chunkNumber: number): Readonly<AudioChunkData> | undefined {
    return this.data.metadata.audioChunks?.find(c => c.chunkNumber === chunkNumber);
  }

  toJSON(): ConsultationSessionData {
    return { ...this.data };
  }
} 