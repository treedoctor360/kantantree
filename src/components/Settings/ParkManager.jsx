// 公園の追加・編集・削除（設定タブ）
import { useEffect, useState } from 'react';
import {
  addPark,
  countParkContents,
  deleteParkCascade,
  isParkCodeTaken,
  suggestParkCode,
  updatePark,
} from '../../db/db.js';
import { isValidParkCode } from '../../lib/treeNo.js';
import { getCurrentPosition, geolocationErrorMessage, formatLatLng } from '../../lib/geo.js';

const blank = { code: '', name: '', lat: null, lng: null, note: '' };

export default function ParkManager({ parks, onToast, onParkDeleted, autoOpen = false }) {
  const [editing, setEditing] = useState(autoOpen ? {} : null); // null=閉 / {id?} =開
  const [form, setForm] = useState(blank);
  const [error, setError] = useState('');
  const [geoBusy, setGeoBusy] = useState(false);

  // 新規登録を開いたら公園コードの初期値を入れておく（考えさせない）
  useEffect(() => {
    if (editing && !editing.id && !form.code) {
      suggestParkCode().then((code) => setForm((f) => ({ ...f, code })));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing]);

  const openNew = () => {
    setForm(blank);
    setError('');
    setEditing({});
  };

  const openEdit = (park) => {
    setForm({
      code: park.code,
      name: park.name,
      lat: park.lat ?? null,
      lng: park.lng ?? null,
      note: park.note ?? '',
    });
    setError('');
    setEditing(park);
  };

  const pickHere = async () => {
    setGeoBusy(true);
    try {
      const pos = await getCurrentPosition();
      setForm((f) => ({ ...f, lat: pos.lat, lng: pos.lng }));
      setError('');
    } catch (err) {
      setError(geolocationErrorMessage(err));
    } finally {
      setGeoBusy(false);
    }
  };

  const handleSave = async () => {
    const code = form.code.trim();
    const name = form.name.trim();
    if (!name) return setError('公園名を入れてください。');
    if (!isValidParkCode(code)) return setError('公園コードは半角英数とハイフンだけが使えます。');
    if (await isParkCodeTaken(code, editing.id ?? null)) {
      return setError(`公園コード ${code} はすでに使われています。`);
    }

    if (!editing.id) {
      await addPark({ code, name, lat: form.lat, lng: form.lng, note: form.note });
      onToast(`${name} を登録しました`);
    } else {
      let renumber = false;
      if (editing.code !== code) {
        const { treeCount } = await countParkContents(editing.id);
        if (treeCount > 0) {
          renumber = window.confirm(
            `公園コードを ${editing.code} → ${code} に変えます。\n` +
              `この公園の樹木 ${treeCount}件 の樹木番号も書き換えますか？\n\n` +
              `OK: 書き換える（例 ${editing.code}-001 → ${code}-001）\n` +
              `キャンセル: 樹木番号はこのままにする`,
          );
        }
      }
      await updatePark(
        editing.id,
        { code, name, lat: form.lat, lng: form.lng, note: form.note },
        { renumber },
      );
      onToast(`${name} を更新しました`);
    }
    setEditing(null);
    setForm(blank);
  };

  const handleDelete = async (park) => {
    const { treeCount, photoCount } = await countParkContents(park.id);
    const ok = window.confirm(
      `「${park.name}」をまるごと削除します。\n\n` +
        `　樹木 ${treeCount}件 / 写真 ${photoCount}枚 も一緒に消えます。\n` +
        `この操作は取り消せません。よろしいですか？`,
    );
    if (!ok) return;
    await deleteParkCascade(park.id);
    onParkDeleted?.(park.id);
    onToast(`${park.name} を削除しました`);
  };

  const sorted = [...parks].sort((a, b) =>
    String(b.lastUsedAt ?? '').localeCompare(String(a.lastUsedAt ?? '')),
  );

  return (
    <section className="block">
      <h3 className="block-title">公園</h3>

      {sorted.length === 0 && <p className="muted">まだ公園がありません。</p>}

      <ul className="rows">
        {sorted.map((p) => (
          <li key={p.id} className="row">
            <span className="row-main">
              <strong>{p.name}</strong>
              <span className="muted">
                {p.code}
                {Number.isFinite(p.lat) ? ` / ${formatLatLng(p.lat, p.lng)}` : ' / 代表座標なし'}
              </span>
            </span>
            <span className="row-actions">
              <button type="button" className="btn btn-ghost" onClick={() => openEdit(p)}>
                編集
              </button>
              <button type="button" className="btn btn-danger" onClick={() => handleDelete(p)}>
                削除
              </button>
            </span>
          </li>
        ))}
      </ul>

      {!editing && (
        <button type="button" className="btn btn-primary" onClick={openNew}>
          ＋ 公園を追加
        </button>
      )}

      {editing && (
        <div className="subform">
          <label className="field">
            <span className="field-label">公園名</span>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="例 皇子が丘公園"
            />
          </label>
          <label className="field">
            <span className="field-label">公園コード（樹木番号の頭に付く。半角英数とハイフン）</span>
            <input
              type="text"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              placeholder="P001"
            />
          </label>
          <div className="btn-row">
            <button type="button" className="btn" onClick={pickHere} disabled={geoBusy}>
              📍 現在地を入れる
            </button>
            {Number.isFinite(form.lat) && (
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setForm({ ...form, lat: null, lng: null })}
              >
                クリア
              </button>
            )}
          </div>
          <p className="hint">
            代表座標{Number.isFinite(form.lat) ? `: ${formatLatLng(form.lat, form.lng)}` : 'は地図タブの初期表示に使います（任意）'}
          </p>
          <label className="field">
            <span className="field-label">メモ（任意）</span>
            <input
              type="text"
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
            />
          </label>

          {error && <p className="status status-error">{error}</p>}

          <div className="btn-row">
            <button type="button" className="btn btn-ghost" onClick={() => setEditing(null)}>
              キャンセル
            </button>
            <button type="button" className="btn btn-primary" onClick={handleSave}>
              {editing.id ? '更新' : '登録'}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
