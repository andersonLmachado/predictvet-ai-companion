import React, { useState, useRef, useEffect } from 'react';
import { usePatient, PatientInfo } from '@/contexts/PatientContext';
import { Search, ChevronDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const PatientCombobox: React.FC = () => {
  const { patients, selectedPatient, setSelectedPatient, patientsLoaded } = usePatient();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = patients.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.owner_name.toLowerCase().includes(search.toLowerCase())
  );

  const select = (p: PatientInfo) => {
    setSelectedPatient(p);
    setOpen(false);
    setSearch('');
  };

  return (
    <div ref={ref} className="relative w-full max-w-md">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          'flex items-center justify-between w-full h-11 rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors',
          'hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-ring'
        )}
      >
        <span className={cn('truncate', !selectedPatient && 'text-muted-foreground')}>
          {selectedPatient ? `${selectedPatient.name} — ${selectedPatient.owner_name}` : 'Selecionar paciente...'}
        </span>
        <div className="flex items-center gap-1 ml-2 shrink-0">
          {selectedPatient && (
            <span
              role="button"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedPatient(null);
              }}
              className="p-0.5 rounded hover:bg-muted"
            >
              <X className="h-3.5 w-3.5 text-muted-foreground" />
            </span>
          )}
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </div>
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border bg-popover shadow-lg animate-in fade-in-0 zoom-in-95">
          <div className="flex items-center gap-2 border-b px-3 py-2">
            <Search className="h-4 w-4 text-muted-foreground shrink-0" />
            <input
              autoFocus
              placeholder="Buscar por nome ou tutor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
          <ul className="max-h-60 overflow-y-auto p-1">
            {!patientsLoaded ? (
              <li className="px-3 py-4 text-center text-sm text-muted-foreground">Carregando...</li>
            ) : filtered.length === 0 ? (
              <li className="px-3 py-4 text-center text-sm text-muted-foreground">Nenhum paciente encontrado</li>
            ) : (
              filtered.map((p) => (
                <li
                  key={p.id}
                  onClick={() => select(p)}
                  className={cn(
                    'flex flex-col gap-0.5 rounded-md px-3 py-2 cursor-pointer text-sm transition-colors hover:bg-accent',
                    selectedPatient?.id === p.id && 'bg-accent'
                  )}
                >
                  <span className="font-medium">{p.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {p.species} {p.breed ? `• ${p.breed}` : ''} — Tutor: {p.owner_name}
                  </span>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default PatientCombobox;
