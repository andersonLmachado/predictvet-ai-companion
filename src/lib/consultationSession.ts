import type { Complaint } from '@/components/consultation/ComplaintSelector';
import type { FollowUpAnswer } from '@/lib/anamnesisApi';

// ─── State ───────────────────────────────────────────────────────────────────

export interface ConsultationSession {
  step: number;
  complaint: Complaint | null;
  followupAnswers: FollowUpAnswer[];
  transcription: string;
  submitStatus: 'idle' | 'sending' | 'success' | 'error';
  submitError: string | null;
}

export const initialSession: ConsultationSession = {
  step: 0,
  complaint: null,
  followupAnswers: [],
  transcription: '',
  submitStatus: 'idle',
  submitError: null,
};

// ─── Actions ─────────────────────────────────────────────────────────────────

export type SessionAction =
  | { type: 'SELECT_COMPLAINT'; payload: Complaint }
  | { type: 'ANSWER_FOLLOWUP'; payload: FollowUpAnswer }
  | { type: 'SET_TRANSCRIPTION'; payload: string }
  | { type: 'BACK' }
  | { type: 'SUBMIT_START' }
  | { type: 'SUBMIT_SUCCESS' }
  | { type: 'SUBMIT_ERROR'; payload: string }
  | { type: 'ADVANCE_TO_DYNAMIC' }
  | { type: 'RESET' };

// ─── Reducer ─────────────────────────────────────────────────────────────────

export function sessionReducer(
  state: ConsultationSession,
  action: SessionAction
): ConsultationSession {
  switch (action.type) {
    case 'SELECT_COMPLAINT':
      return { ...state, complaint: action.payload, followupAnswers: [], step: 1 };
    case 'ANSWER_FOLLOWUP':
      return {
        ...state,
        followupAnswers: [...state.followupAnswers, action.payload],
        step: 2,
      };
    case 'SET_TRANSCRIPTION':
      return { ...state, transcription: action.payload };
    case 'ADVANCE_TO_DYNAMIC':
      return { ...state, step: 3 };
    case 'BACK':
      return {
        ...state,
        step: Math.max(0, state.step - 1),
        submitStatus: 'idle',
        submitError: null,
      };
    case 'SUBMIT_START':
      return { ...state, submitStatus: 'sending', submitError: null };
    case 'SUBMIT_SUCCESS':
      return { ...state, submitStatus: 'success' };
    case 'SUBMIT_ERROR':
      return { ...state, submitStatus: 'error', submitError: action.payload };
    case 'RESET':
      return initialSession;
    default:
      return state;
  }
}
