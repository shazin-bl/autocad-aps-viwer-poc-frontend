"use client";

import { useEffect, useState } from "react";

import { getModels } from "@/api/modelApi";

export default function ModelSelector({
  onSelect,
}: {
  onSelect: (urn: string) => void;
}) {
  const [models, setModels] = useState([]);

  useEffect(() => {
    getModels().then(setModels);
  }, []);

  return (
    <div className="min-w-0">
      <select
        className="w-full min-w-0 truncate rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
        onChange={(e) =>
          onSelect(e.target.value)
        }
      >
        {models.map((m: any) => (
          <option
            key={m.urn}
            value={m.urn}
          >
            {m.name}
          </option>
        ))}
      </select>
    </div>
  );
}