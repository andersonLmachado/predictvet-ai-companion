import React from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import ChatInterface from '@/components/chat/ChatInterface';

interface ChatLocationState {
  selectedPatientId?: string;
  patientId?: string;
}

const ChatPage = () => {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const state = location.state as ChatLocationState | null;

  const selectedPatientId =
    state?.selectedPatientId || state?.patientId || searchParams.get('patient_id') || null;

  return (
    <div className="h-full">
      <ChatInterface selectedPatientId={selectedPatientId} />
    </div>
  );
}

export default ChatPage;
