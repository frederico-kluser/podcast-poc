/**
 * @fileoverview Type definitions for the podcast application
 */

/**
 * @typedef {Object} PDFFile
 * @property {string} name - The name of the PDF file
 * @property {number} size - The size of the PDF file in bytes
 * @property {string} type - The MIME type of the file
 * @property {Date} lastModified - The last modified date of the file
 */

/**
 * @typedef {Object} ExtractedText
 * @property {string} content - The extracted text content
 * @property {number} pageCount - The number of pages in the PDF
 * @property {Date} extractedAt - The timestamp when text was extracted
 */

/**
 * @typedef {Object} ChatMessage
 * @property {string} id - Unique identifier for the message
 * @property {'user'|'assistant'|'system'} role - The role of the message sender
 * @property {string} content - The message content
 * @property {Date} timestamp - When the message was created
 */

/**
 * @typedef {Object} TranscriptionResult
 * @property {string} text - The transcribed text
 * @property {number} confidence - Confidence score (0-1)
 * @property {number} duration - Audio duration in seconds
 */

/**
 * @typedef {Object} AudioRecordingState
 * @property {boolean} isRecording - Whether audio is currently being recorded
 * @property {boolean} isProcessing - Whether audio is being processed
 * @property {MediaRecorder|null} mediaRecorder - The MediaRecorder instance
 * @property {Blob[]} audioChunks - Array of audio data chunks
 */

/**
 * @typedef {Object} AppState
 * @property {ExtractedText|null} extractedText - Currently extracted PDF text
 * @property {string} currentPrompt - Current user prompt
 * @property {ChatMessage[]} chatHistory - History of chat messages
 * @property {boolean} isLoading - Whether the app is in a loading state
 * @property {AudioRecordingState} audioState - Audio recording state
 */

export {};