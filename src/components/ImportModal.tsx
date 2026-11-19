import { AlertCircle, Upload, X } from 'lucide-react';
import { useState, type ChangeEvent, type FormEvent } from 'react';
import type { SurveyResponse } from '../types/survey';
import { parseSurveyInput } from '../utils/csvParser';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (responses: SurveyResponse[], label: string, warnings: string[]) => void;
}

export function ImportModal({ isOpen, onClose, onImport }: ImportModalProps) {
  const [rawText, setRawText] = useState('');
  const [datasetName, setDatasetName] = useState('Updated Form Responses');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setDatasetName(file.name.replace(/\.csv$/i, ''));
    const text = await file.text();
    setRawText(text);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const parsed = parseSurveyInput(rawText);
    if (parsed.error) {
      setError(parsed.error);
      return;
    }
    onImport(parsed.responses, datasetName.trim() || 'Imported CSV', parsed.warnings);
    setRawText('');
    setError(null);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#111111]/75 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="import-modal-title"
    >
      <div className="w-full max-w-2xl border-2 border-[#111111] bg-[#FAF8F3] p-6">
        <div className="flex items-start justify-between gap-4 border-b border-[#111111] pb-4">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-wider text-[#E13B22]">
              Dataset Replacement
            </p>
            <h2 id="import-modal-title" className="mt-1 font-display text-3xl font-extrabold uppercase text-[#111111]">
              Import Survey CSV
            </h2>
            <p className="mt-1 text-xs text-[#4A4740]">
              Upload a newer export from your Dhaka Multimodal Cashless Transit Google Form or paste CSV rows below.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close import modal"
            className="border border-[#111111] bg-[#F4F1EA] p-2 text-[#111111] transition-colors hover:bg-[#111111] hover:text-[#F4F1EA]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="dataset-name-input" className="block font-mono text-xs font-medium uppercase tracking-wider text-[#111111]">
                Dataset label
              </label>
              <input
                id="dataset-name-input"
                type="text"
                value={datasetName}
                onChange={(e) => setDatasetName(e.target.value)}
                className="mt-1.5 w-full border border-[#111111] bg-[#F4F1EA] px-3 py-2 text-sm text-[#111111] focus:bg-white focus:outline-2 focus:outline-[#E13B22]"
                placeholder="e.g. Dhaka Transit Wave 2"
              />
            </div>

            <div>
              <label htmlFor="survey-file-input" className="block font-mono text-xs font-medium uppercase tracking-wider text-[#111111]">
                Upload .csv export
              </label>
              <label
                htmlFor="survey-file-input"
                className="mt-1.5 flex cursor-pointer items-center justify-center gap-2 border border-dashed border-[#111111] bg-[#F4F1EA] px-3 py-2 font-mono text-xs font-medium uppercase tracking-wider text-[#111111] transition-colors hover:bg-[#F4CF15]"
              >
                <Upload className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Choose CSV file</span>
                <input
                  id="survey-file-input"
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleFileChange}
                  className="sr-only"
                />
              </label>
            </div>
          </div>

          <div>
            <label htmlFor="csv-paste-input" className="font-mono text-xs font-medium uppercase tracking-wider text-[#111111]">
              CSV response data
            </label>
            <textarea
              id="csv-paste-input"
              rows={8}
              value={rawText}
              onChange={(e) => {
                setRawText(e.target.value);
                if (error) setError(null);
              }}
              placeholder="Paste Google Forms CSV content including the header row..."
              className="mt-1.5 w-full border border-[#111111] bg-[#F4F1EA] p-3 font-mono text-xs text-[#111111] placeholder:text-[#6B675E] focus:bg-white focus:outline-2 focus:outline-[#E13B22]"
            />
          </div>

          {error && (
            <div
              role="alert"
              className="flex items-start gap-2 border border-[#E13B22] bg-[#E13B22]/10 px-3.5 py-2.5 text-xs font-medium text-[#111111]"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#E13B22]" aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 border-t border-[#111111] pt-4">
            <button
              type="button"
              onClick={onClose}
              className="border border-[#111111] bg-[#F4F1EA] px-4 py-2 font-mono text-xs font-medium uppercase tracking-wider text-[#111111] transition-colors hover:bg-[#E7E3DA]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="border border-[#111111] bg-[#111111] px-4 py-2 font-mono text-xs font-semibold uppercase tracking-wider text-[#F4F1EA] transition-colors hover:bg-[#E13B22] hover:border-[#E13B22]"
            >
              Visualize Responses
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
