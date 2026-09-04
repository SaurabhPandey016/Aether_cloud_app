'use client';

import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { trashAPI } from '@/lib/api';

export default function TrashPage() {
  const [items, setItems] = useState<any[]>([]);

  const loadTrash = () => trashAPI.getList().then((response: any) => setItems(response.trash || [])).catch(() => setItems([]));
  useEffect(() => { loadTrash(); }, []);

  const emptyTrash = async () => { await trashAPI.empty(); setItems([]); };

  return (
    <DashboardLayout
      title="Trash"
      description="Recover or permanently delete deleted files."
      action={
          <button onClick={emptyTrash} disabled={!items.length} className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-200 disabled:opacity-50">
          Empty trash
        </button>
      }
    >
      {items.length ? <div className="space-y-3">{items.map((item) => <div key={item.id} className="flex items-center justify-between rounded-2xl border border-red-500/20 bg-[#0b1220] p-4"><div><h3 className="font-semibold text-white">{item.file?.name || item.folder?.name || 'Deleted item'}</h3><p className="text-xs text-slate-400">Deleted {new Date(item.deletedAt).toLocaleDateString()}</p></div><div className="flex gap-2"><button onClick={async () => { await trashAPI.restore(item.id); loadTrash(); }} className="rounded-lg bg-cyan-500/10 px-3 py-2 text-sm text-cyan-200">Restore</button><button onClick={async () => { await trashAPI.permanentDelete(item.id); loadTrash(); }} className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-200">Delete forever</button></div></div>)}</div> : <div className="rounded-[28px] border border-dashed border-cyan-500/25 bg-[#0b1220]/60 p-12 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10 text-red-300">
          <Trash2 className="h-8 w-8" />
        </div>
        <h3 className="mt-5 text-2xl font-black text-white">Trash is empty</h3>
        <p className="mt-2 text-slate-400">Deleted files will appear here for a short retention period.</p>
      </div>}
    </DashboardLayout>
  );
}
