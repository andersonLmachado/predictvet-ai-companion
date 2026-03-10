import React, { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import anamnesisData from '@/data/anamnesis.json';

export interface Complaint {
  id: string;
  label: string;
  topic: string;
  followup: string;
  options: string[];
}

interface ComplaintSelectorProps {
  onSelect: (complaint: Complaint) => void;
}

const ComplaintSelector: React.FC<ComplaintSelectorProps> = ({ onSelect }) => {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return anamnesisData.map((cat) => ({
      ...cat,
      complaints: cat.complaints.filter(
        (c) => c.label.toLowerCase().includes(q) || c.topic.toLowerCase().includes(q)
      ),
    })).filter((cat) => cat.complaints.length > 0);
  }, [search]);

  const handleSelect = (complaint: Complaint) => {
    setSelected(complaint.id);
    setTimeout(() => onSelect(complaint), 200);
  };

  return (
    <div className="space-y-5">
      {/* Search */}
      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
          style={{ color: 'hsl(222,30%,55%)' }}
        />
        <Input
          placeholder="Buscar queixa do tutor..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-11 rounded-xl text-sm"
          style={{
            borderColor: 'hsl(217,50%,85%)',
            fontFamily: 'Nunito Sans, sans-serif',
            background: 'white',
          }}
        />
      </div>

      {/* Categories */}
      {filtered.map((cat) => (
        <div key={cat.category} className="space-y-2">
          <p
            className="text-xs font-semibold uppercase tracking-wide"
            style={{ color: 'hsl(222,30%,45%)', fontFamily: 'Nunito Sans, sans-serif' }}
          >
            {cat.category}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {cat.complaints.map((complaint) => {
              const isSelected = selected === complaint.id;
              return (
                <button
                  key={complaint.id}
                  onClick={() => handleSelect(complaint as Complaint)}
                  className="text-left rounded-xl p-3 transition-all pl-card-hover"
                  style={{
                    background: 'white',
                    border: `1px solid ${isSelected ? 'hsl(221,73%,45%)' : 'hsl(217,50%,88%)'}`,
                    boxShadow: isSelected
                      ? '0 0 0 3px hsla(221,73%,45%,0.15)'
                      : '0 1px 4px -2px hsla(221,73%,30%,0.08)',
                  }}
                >
                  <div
                    className="h-0.5 -mx-3 -mt-3 mb-2 rounded-t-xl"
                    style={{
                      background: isSelected
                        ? 'linear-gradient(135deg, hsl(221,73%,45%), hsl(217,88%,57%))'
                        : 'hsl(217,50%,90%)',
                    }}
                  />
                  <p
                    className="text-sm font-semibold leading-snug"
                    style={{
                      fontFamily: 'Nunito Sans, sans-serif',
                      color: isSelected ? 'hsl(221,73%,40%)' : 'hsl(222,77%,15%)',
                    }}
                  >
                    {complaint.topic}
                  </p>
                  <p
                    className="text-xs mt-0.5 line-clamp-2"
                    style={{ color: 'hsl(222,30%,55%)', fontFamily: 'Nunito Sans, sans-serif' }}
                  >
                    {complaint.label}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {filtered.length === 0 && (
        <div className="py-12 flex flex-col items-center gap-2">
          <Search className="w-8 h-8" style={{ color: 'hsl(221,73%,75%)' }} />
          <p className="text-sm" style={{ color: 'hsl(222,30%,60%)', fontFamily: 'Nunito Sans, sans-serif' }}>
            Nenhuma queixa encontrada para "{search}"
          </p>
        </div>
      )}
    </div>
  );
};

export default ComplaintSelector;
