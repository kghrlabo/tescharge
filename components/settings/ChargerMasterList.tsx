"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import type { Charger } from "@/lib/db/models";
import type { ChargerInput } from "@/lib/db/repositories/ChargerRepository";

const inputClass =
  "min-h-11 w-full rounded-chip border border-hairline bg-surface-raised px-2 py-1.5 text-sm text-ink";

function ChargerRow({
  charger,
  onRename,
  onDelete,
}: {
  charger: Charger;
  onRename: (name: string) => Promise<void>;
  onDelete: () => Promise<void>;
}) {
  const [name, setName] = useState(charger.name);

  const commit = () => {
    const trimmed = name.trim();
    if (trimmed && trimmed !== charger.name) {
      onRename(trimmed);
    } else {
      setName(charger.name);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        onBlur={commit}
        className={inputClass}
      />
      <button
        type="button"
        onClick={onDelete}
        className="shrink-0 text-xs text-danger hover:underline"
      >
        削除
      </button>
    </div>
  );
}

export function ChargerMasterList({
  chargers,
  onCreate,
  onRename,
  onDelete,
}: {
  chargers: Charger[];
  onCreate: (input: ChargerInput) => Promise<void>;
  onRename: (id: string, name: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [newName, setNewName] = useState("");

  const handleAdd = async () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    await onCreate({ name: trimmed });
    setNewName("");
  };

  return (
    <div className="flex flex-col gap-2">
      {chargers.map((c) => (
        <ChargerRow
          key={c.id}
          charger={c}
          onRename={(name) => onRename(c.id, name)}
          onDelete={() => onDelete(c.id)}
        />
      ))}
      <div className="mt-1 flex items-center gap-2">
        <input
          placeholder="名称を追加"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          className={inputClass}
        />
        <Button type="button" variant="secondary" onClick={handleAdd} className="shrink-0 px-3 py-1.5 text-xs">
          追加
        </Button>
      </div>
    </div>
  );
}
