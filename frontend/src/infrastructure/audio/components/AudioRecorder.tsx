'use client';

import { useCallback, useState, useEffect } from 'react';
import { logger } from '@/infrastructure/logging/logger';
import { env } from '@/config/env';

const COMPONENT_NAME = 'AudioRecorder';

const AudioRecorder = () => {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [startTime, setStartTime] = useState<number>(0);

  useEffect(() => {
    const createSession = async () => {
      try {
        const response = await fetch('/api/sessions', {
          method: 'POST'
        });
        const data = await response.json();
        setSessionId(data.session.id);
      } catch (error) {
        logger.error(COMPONENT_NAME, 'Failed to create session', {
          error: error instanceof Error ? error.message : String(error)
        });
      }
    };

    createSession();
  }, []);

  const uploadChunk = async (chunk: Blob, chunkNumber: number, isLastChunk: boolean) => {
    if (!sessionId) {
      logger.error(COMPONENT_NAME, 'No session ID available for upload');
      return;
    }

    try {
      logger.info(COMPONENT_NAME, 'Uploading chunk', {
        sessionId,
        chunkNumber,
        size: chunk.size,
        isLastChunk,
      });

      const formData = new FormData();
      formData.append('chunk', chunk);
      formData.append('chunkNumber', chunkNumber.toString());
      formData.append('isLastChunk', isLastChunk.toString());

      const response = await fetch(`/api/sessions/${sessionId}/chunks`, {
        method: 'POST',
        body: formData,
      });

      logger.info(COMPONENT_NAME, 'Chunk uploaded successfully', {
        sessionId,
        chunkNumber,
        size: chunk.size,
        isLastChunk,
      });
    } catch (error) {
      logger.error(COMPONENT_NAME, 'Failed to upload chunk', {
        sessionId,
        error: error instanceof Error ? error.message : String(error),
        chunkNumber,
        isLastChunk,
      });
    }
  };

  const startRecording = async () => {
    if (!sessionId) {
      logger.error(COMPONENT_NAME, 'Session ID is not available');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      setMediaRecorder(recorder);
      setIsRecording(true);
      setStartTime(Date.now());

      logger.info(COMPONENT_NAME, 'Recording started', {
        sessionId
      });

      let chunkNumber = 0;
      recorder.ondataavailable = async (event) => {
        if (event.data.size > 0) {
          chunkNumber++;
          const isLastChunk = recorder.state === 'inactive';
          await uploadChunk(event.data, chunkNumber, isLastChunk);
        }
      };

      recorder.start(env.audio.chunkSize);

      logger.info(COMPONENT_NAME, 'Recording started', {
        sessionId,
        timeSlice: env.audio.chunkSize,
        mimeType: recorder.mimeType,
        maxDuration: env.audio.maxDuration,
      });
    } catch (error) {
      logger.error(COMPONENT_NAME, 'Error accessing microphone', {
        sessionId,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  };

  const stopRecording = useCallback(() => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive' && sessionId) {
      const duration = Date.now() - startTime;
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
      logger.info(COMPONENT_NAME, 'Recording stopped', {
        sessionId,
        duration,
        finalState: mediaRecorder.state
      });
      setIsRecording(false);
    }
  }, [mediaRecorder, startTime, sessionId]);

  return (
    <div className="flex flex-col items-center gap-4">
      <button
        onClick={isRecording ? stopRecording : startRecording}
        className={`px-4 py-2 rounded-full ${
          isRecording 
            ? 'bg-red-500 hover:bg-red-600' 
            : 'bg-blue-500 hover:bg-blue-600'
        } text-white transition-colors`}
      >
        {isRecording ? 'Stop Recording' : 'Start Recording'}
      </button>
      {isRecording && (
        <div className="text-sm text-gray-600">
          Recording in progress...
        </div>
      )}
    </div>
  );
};

export default AudioRecorder; 