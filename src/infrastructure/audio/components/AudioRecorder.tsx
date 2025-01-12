'use client';

import { useCallback, useState } from 'react';
import { logger } from '@/infrastructure/logging/logger';
import { env } from '@/config/env';

const COMPONENT_NAME = 'AudioRecorder';

const AudioRecorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [startTime, setStartTime] = useState<number>(0);

  const startRecording = useCallback(async () => {
    try {
      logger.info(COMPONENT_NAME, 'Requesting microphone access');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      logger.info(COMPONENT_NAME, 'Microphone access granted');
      
      const recorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          logger.info(COMPONENT_NAME, 'Chunk recorded', {
            size: event.data.size,
            type: event.data.type,
            timestamp: new Date().toISOString(),
            chunkDuration: env.audio.chunkSize
          });
        }
      };

      recorder.start(env.audio.chunkSize);
      const startTime = Date.now();
      
      logger.info(COMPONENT_NAME, 'Recording started', {
        timeSlice: env.audio.chunkSize,
        mimeType: recorder.mimeType,
        maxDuration: env.audio.maxDuration,
        startTime
      });
      
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (error) {
      logger.error(COMPONENT_NAME, 'Error accessing microphone', {
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
        duration,
        finalState: mediaRecorder.state
      });
      setIsRecording(false);
    }
  }, [mediaRecorder]);

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