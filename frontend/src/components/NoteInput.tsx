'use client';

import { useState } from 'react';
import { logger } from '@/lib/logger';

const COMPONENT_NAME = 'NoteInput';

interface NoteInputProps {
  sessionId: string;
}

const NoteInput = ({ sessionId }: NoteInputProps) => {
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleAddNote = async () => {
    if (!sessionId || !note.trim()) return;
    setError(null);
    
    // Store the note value before clearing it
    const noteToSend = note.trim();
    // Clear the input immediately for better UX
    setNote('');

    try {
      const response = await fetch(`/api/sessions/${sessionId}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ note: noteToSend }),
      });

      if (!response.ok) {
        throw new Error(`Failed to add note: ${response.status}`);
      }

      logger.info(COMPONENT_NAME, 'Note added successfully', { sessionId });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add note';
      setError(errorMessage);
      logger.error(COMPONENT_NAME, 'Failed to add note', {
        sessionId,
        error: errorMessage,
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && note.trim()) {
      handleAddNote();
    }
  };

  return (
    <div className="flex flex-col gap-2 w-full max-w-md">
      <div className="flex gap-2">
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Add a note..."
          className="flex-1 px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 
            text-gray-900 placeholder-gray-500 bg-white"
        />
        <button
          onClick={handleAddNote}
          disabled={!note.trim()}
          className={`px-4 py-2 rounded-full text-white transition-colors ${
            note.trim()
              ? 'bg-blue-500 hover:bg-blue-600 cursor-pointer'
              : 'bg-gray-300 cursor-not-allowed'
          }`}
        >
          Add Note
        </button>
      </div>
      {error && (
        <div className="text-red-500 text-sm px-4">
          {error}
        </div>
      )}
    </div>
  );
};

export default NoteInput; 