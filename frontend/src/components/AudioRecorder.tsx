'use client';

import { useCallback, useState } from 'react';
import { logger } from '@/lib/logger';
import { env } from '@/config/env';

const COMPONENT_NAME = 'AudioRecorder';

const AudioRecorder = () => {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [startTime, setStartTime] = useState<number>(0);

  const uploadChunk = async (chunk: Blob, chunkNumber: number, isLastChunk: boolean, sessionId: string) => {
    if (!sessionId) {
      logger.error(COMPONENT_NAME, 'Session ID is required for upload', {
        chunkNumber,
        isLastChunk
      });
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

      if (!response.ok) {
        throw new Error(`Upload failed with status: ${response.status}`);
      }
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
    try {
      // Create session first
      const response = await fetch('/api/sessions', {
        method: 'POST'
      });
      const data = await response.json();
      
      // Log the response to see its structure
      logger.info(COMPONENT_NAME, 'Session response received', { 
        responseData: data 
      });

      // Get ID from the correct path in response
      const sessionId = data.id || data.session?.id;
      
      if (!sessionId) {
        throw new Error('No session ID received from server');
      }

      logger.info(COMPONENT_NAME, 'Session created', { sessionId });

      // Set session ID first
      setSessionId(sessionId);

      // Setup recorder with captured session ID
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);

      let chunkNumber = 0;
      recorder.ondataavailable = async (event) => {
        if (event.data.size > 0) {
          chunkNumber++;
          const isLastChunk = recorder.state === 'inactive';
          await uploadChunk(event.data, chunkNumber, isLastChunk, sessionId);
        }
      };

      // Update other states
      setMediaRecorder(recorder);
      setIsRecording(true);
      setStartTime(Date.now());

      recorder.start(env.audio.chunkSize);
      logger.info(COMPONENT_NAME, 'Recording started', {
        sessionId,
        timeSlice: env.audio.chunkSize,
        mimeType: recorder.mimeType,
        maxDuration: env.audio.maxDuration,
      });
    } catch (error) {
      logger.error(COMPONENT_NAME, 'Failed to start recording', {
        error: error instanceof Error ? error.message : String(error)
      });
      setIsRecording(false);
      setSessionId(null);
    }
  };

  const stopRecording = useCallback(() => {
    logger.info(COMPONENT_NAME, 'Stop recording triggered', {
      hasMediaRecorder: !!mediaRecorder,
      mediaRecorderState: mediaRecorder?.state,
      hasSessionId: !!sessionId,
      isRecording,
      currentSessionId: sessionId
    });

    if (mediaRecorder && mediaRecorder.state === 'recording') {
      try {
        logger.info(COMPONENT_NAME, 'Stopping recording', {
          sessionId,
          duration: Date.now() - startTime
        });

        // Stop recording - this will trigger one final ondataavailable event
        mediaRecorder.stop();
        
        // Stop all audio tracks
        mediaRecorder.stream.getTracks().forEach(track => track.stop());

        // Clear states
        setIsRecording(false);
        setMediaRecorder(null);
        setSessionId(null);
        setStartTime(0);

        logger.info(COMPONENT_NAME, 'Recording stopped successfully');

      } catch (error) {
        logger.error(COMPONENT_NAME, 'Error stopping recording', {
          sessionId,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    } else {
      logger.warn(COMPONENT_NAME, 'Stop recording conditions not met', {
        hasMediaRecorder: !!mediaRecorder,
        mediaRecorderState: mediaRecorder?.state,
        hasSessionId: !!sessionId,
        currentSessionId: sessionId
      });
    }
  }, [mediaRecorder, sessionId, startTime, isRecording]);

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