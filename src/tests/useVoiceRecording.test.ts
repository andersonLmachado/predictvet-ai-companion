import { describe, it, expect } from 'vitest';
import { recordingReducer, MAX_RECORDING_MS } from '../hooks/useVoiceRecording';

describe('useVoiceRecording', () => {
  describe('recordingReducer — transições de estado idle→recording→stopped', () => {
    it('idle + START → recording', () => {
      expect(recordingReducer('idle', 'START')).toBe('recording');
    });

    it('recording + PAUSE → paused', () => {
      expect(recordingReducer('recording', 'PAUSE')).toBe('paused');
    });

    it('recording + STOP → stopped', () => {
      expect(recordingReducer('recording', 'STOP')).toBe('stopped');
    });

    it('fluxo completo idle → recording → paused → stopped', () => {
      let state = recordingReducer('idle', 'START');   // 'recording'
      state = recordingReducer(state, 'PAUSE');         // 'paused'
      state = recordingReducer(state, 'STOP');          // 'stopped'
      expect(state).toBe('stopped');
    });

    it('paused + RESUME → recording', () => {
      expect(recordingReducer('paused', 'RESUME')).toBe('recording');
    });

    it('qualquer estado + RESET → idle', () => {
      expect(recordingReducer('recording', 'RESET')).toBe('idle');
      expect(recordingReducer('stopped', 'RESET')).toBe('idle');
      expect(recordingReducer('error', 'RESET')).toBe('idle');
    });
  });

  describe('duração máxima respeitada', () => {
    it('MAX_RECORDING_MS é exatamente 30 minutos em milissegundos', () => {
      expect(MAX_RECORDING_MS).toBe(30 * 60 * 1000); // 1.800.000 ms
    });
  });
});
