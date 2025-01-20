'use client';

import { useCallback, useState } from 'react';
import { logger } from '@/lib/logger';
import { config } from '@/config/app.config';
import NoteInput from './NoteInput';

const COMPONENT_NAME = 'AudioRecorder';

const AudioRecorder = () => {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [startTime, setStartTime] = useState<number>(0);
  const [showModal, setShowModal] = useState(false);

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

      if (chunk.size > config.audio.maxChunkSize) {
        throw new Error(`Chunk size exceeds maximum allowed size of ${config.audio.maxChunkSize} bytes`);
      }

      const formData = new FormData();
      formData.append('chunk', chunk);
      formData.append('chunkNumber', chunkNumber.toString());
      formData.append('isLastChunk', isLastChunk.toString());

      const endpoint = config.api.endpoints.chunks.replace(':sessionId', sessionId);
      const response = await fetch(endpoint, {
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
      const response = await fetch(config.api.endpoints.sessions, {
        method: 'POST'
      });
      const data = await response.json();
      
      logger.info(COMPONENT_NAME, 'Session response received', { 
        responseData: data 
      });

      const sessionId = data.id || data.session?.id;
      
      if (!sessionId) {
        throw new Error('No session ID received from server');
      }

      logger.info(COMPONENT_NAME, 'Session created', { sessionId });

      setSessionId(sessionId);
      setIsGenerating(false);

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, {
        mimeType: config.audio.allowedMimeTypes[0] // Use first supported mime type
      });

      let chunkNumber = 0;
      recorder.ondataavailable = async (event) => {
        if (event.data.size > 0) {
          chunkNumber++;
          const isLastChunk = recorder.state === 'inactive';
          await uploadChunk(event.data, chunkNumber, isLastChunk, sessionId);
        }
      };

      setMediaRecorder(recorder);
      setIsRecording(true);
      setStartTime(Date.now());

      recorder.start(config.audio.chunkSize);
      logger.info(COMPONENT_NAME, 'Recording started', {
        sessionId,
        timeSlice: config.audio.chunkSize,
        mimeType: recorder.mimeType,
        maxDuration: config.audio.maxDuration,
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
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      try {
        mediaRecorder.stop();
        mediaRecorder.stream.getTracks().forEach(track => track.stop());

        setIsRecording(false);
        setIsGenerating(true);
        setMediaRecorder(null);
        setStartTime(0);

        // Show modal after 10 seconds
        setTimeout(() => {
          setIsGenerating(false);
          setShowModal(true);
        }, 10000);

        logger.info(COMPONENT_NAME, 'Recording stopped successfully');
      } catch (error) {
        logger.error(COMPONENT_NAME, 'Error stopping recording', {
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

  const handleDownload = async () => {
    try {
      const response = await fetch(`/api/sessions/${sessionId}/summary`);
      if (!response.ok) {
        throw new Error('Failed to fetch summary URL');
      }
      
      const { url } = await response.json() as { url: string };
      
      // Fetch the content from the signed URL
      const summaryResponse = await fetch(url);
      if (!summaryResponse.ok) {
        throw new Error('Failed to fetch summary content');
      }
      
      // Get the text content and create a blob
      const text = await summaryResponse.text();
      const blob = new Blob([text], { type: 'text/plain' });
      const downloadUrl = window.URL.createObjectURL(blob);
      
      // Create link and trigger download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `consultation-summary-${sessionId}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      setShowModal(false);
      
    } catch (error) {
      logger.error(COMPONENT_NAME, 'Failed to download summary', {
        error: error instanceof Error ? error.message : String(error),
        sessionId
      });
      // Optionally show error to user
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <button
        onClick={isRecording ? stopRecording : startRecording}
        disabled={isGenerating}
        className={`px-4 py-2 rounded-full ${
          isRecording 
            ? 'bg-red-500 hover:bg-red-600' 
            : 'bg-blue-500 hover:bg-blue-600'
        } text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {isRecording ? 'Stop Recording' : 'Start Recording'}
      </button>
      {isRecording && (
        <>
          <div className="text-sm text-gray-600">
            Recording in progress...
          </div>
          {sessionId && <NoteInput sessionId={sessionId} />}
        </>
      )}
      {isGenerating && (
        <div className="text-sm text-gray-600">
          Generating consultation summary...
          <br />
          May take 10 seconds
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full m-3">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">Your Summary is Ready!</h2>
            <p className="mb-4 text-gray-700">Would you like to download your consultation summary?</p>
            <div className="flex justify-end gap-2">
              <button 
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border rounded hover:bg-gray-100 text-gray-700"
              >
                Cancel
              </button>
              <button 
                onClick={handleDownload}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Download Summary
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AudioRecorder; 