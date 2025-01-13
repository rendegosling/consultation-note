'use client';

import { useCallback, useState } from 'react';
import { logger } from '@/infrastructure/logging/logger';
import { env } from '@/config/env';

const COMPONENT_NAME = 'AudioRecorder';
const SESSION_ID = 'test-123'; // Our correlation ID

const AudioRecorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [startTime, setStartTime] = useState<number>(0);

  const uploadChunk = async (chunk: Blob, chunkNumber: number, isLastChunk: boolean) => {
    try {
      logger.info(COMPONENT_NAME, 'Uploading chunk', {
        sessionId: SESSION_ID,
        chunkNumber,
        size: chunk.size,
        isLastChunk,
      });

      const formData = new FormData();
      formData.append('chunk', chunk);
      formData.append('chunkNumber', chunkNumber.toString());
      formData.append('isLastChunk', isLastChunk.toString());

      const response = await fetch(`/api/sessions/${SESSION_ID}/chunks`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      logger.info(COMPONENT_NAME, 'Chunk uploaded successfully', {
        sessionId: SESSION_ID,
        chunkNumber,
        size: chunk.size,
        isLastChunk,
      });
    } catch (error) {
      logger.error(COMPONENT_NAME, 'Failed to upload chunk', {
        sessionId: SESSION_ID,
        error: error instanceof Error ? error.message : String(error),
        chunkNumber,
        isLastChunk,
      });
    }
  };

  const startRecording = useCallback(async () => {
    try {
      logger.info(COMPONENT_NAME, 'Requesting microphone access', {
        sessionId: SESSION_ID
      });
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      logger.info(COMPONENT_NAME, 'Microphone access granted', {
        sessionId: SESSION_ID
      });
      
      let chunkNumber = 0;
      const recorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      recorder.ondataavailable = async (event) => {
        if (event.data.size > 0) {
          chunkNumber++;
          const isLastChunk = recorder.state === 'inactive';
          await uploadChunk(event.data, chunkNumber, isLastChunk);
        }
      };

      recorder.start(env.audio.chunkSize);
      setStartTime(Date.now());
      
      logger.info(COMPONENT_NAME, 'Recording started', {
        sessionId: SESSION_ID,
        timeSlice: env.audio.chunkSize,
        mimeType: recorder.mimeType,
        maxDuration: env.audio.maxDuration,
      });
      
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (error) {
      logger.error(COMPONENT_NAME, 'Error accessing microphone', {
        sessionId: SESSION_ID,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      const duration = Date.now() - startTime;
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
      logger.info(COMPONENT_NAME, 'Recording stopped', {
        sessionId: SESSION_ID,
        duration,
        finalState: mediaRecorder.state
      });
      setIsRecording(false);
    }
  }, [mediaRecorder, startTime]);

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