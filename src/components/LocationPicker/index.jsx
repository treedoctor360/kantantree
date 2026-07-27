// 座標入力ブロック（CLAUDE.md 3章の仕様どおり）
// 【推定】v27 の LocationPicker.jsx を参照できなかったため、CLAUDE.md 3-1/3-2 の
// 記述から画面要素・文言・挙動を組み立てている。v27 の実ソースが読める段階で
// 文言と関数名を突き合わせること。
import { useState } from 'react';
import {
  getCurrentPosition,
  geolocationErrorMessage,
  parseLatLngFromText,
  round6,
  isValidLat,
  isValidLng,
} from '../../lib/geo.js';
import MapModal from './MapModal.jsx';

/**
 * value: { lat, lng, accuracy, coordSource }
 * onChange: 上の形のオブジェクトを返す
 */
export default function LocationPicker({ value, onChange, fallbackCenter }) {
  const { lat, lng, accuracy, coordSource } = value;
  const [linkText, setLinkText] = useState('');
  const [status, setStatus] = useState('');
  const [statusType, setStatusType] = useState('info'); // info | error
  const [busy, setBusy] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);

  const say = (text, type = 'info') => {
    setStatus(text);
    setStatusType(type);
  };

  const handleHere = async () => {
    setBusy(true);
    say('現在地を取得しています…');
    try {
      const pos = await getCurrentPosition();
      onChange({ lat: pos.lat, lng: pos.lng, accuracy: pos.accuracy, coordSource: 'gps' });
      say(
        pos.accuracy
          ? `現在地を取得しました（誤差 約${Math.round(pos.accuracy)}m）。`
          : '現在地を取得しました。',
      );
    } catch (err) {
      say(geolocationErrorMessage(err), 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleClear = () => {
    onChange({ lat: null, lng: null, accuracy: null, coordSource: null });
    setLinkText('');
    say('');
  };

  const handleReadLink = () => {
    const found = parseLatLngFromText(linkText);
    if (!found) {
      say('座標を読み取れませんでした。', 'error');
      return;
    }
    onChange({ lat: found.lat, lng: found.lng, accuracy: null, coordSource: 'link' });
    say('貼り付けた文字列から座標を読み取りました。');
  };

  // 緯度・経度欄の手入力（フル桁を保持するため文字列のまま扱う）
  const handleManual = (key, text) => {
    const n = text.trim() === '' ? null : Number(text);
    const ok = n === null || (key === 'lat' ? isValidLat(n) : isValidLng(n));
    onChange({ ...value, [key]: ok ? n : Number.NaN, accuracy: null, coordSource: 'manual' });
  };

  const handleMapPick = (picked) => {
    onChange({ lat: picked.lat, lng: picked.lng, accuracy: null, coordSource: 'map' });
    say('地図で座標を補正しました。');
    setMapOpen(false);
  };

  const hasCoord = isValidLat(lat) && isValidLng(lng);

  return (
    <section className="block">
      <h3 className="block-title">座標</h3>

      <div className="field-row">
        <label className="field">
          <span className="field-label">緯度 Latitude</span>
          <input
            type="text"
            inputMode="decimal"
            value={lat === null || lat === undefined || Number.isNaN(lat) ? '' : String(lat)}
            onChange={(e) => handleManual('lat', e.target.value)}
            placeholder="35.01776443639602"
          />
        </label>
        <label className="field">
          <span className="field-label">経度 Longitude</span>
          <input
            type="text"
            inputMode="decimal"
            value={lng === null || lng === undefined || Number.isNaN(lng) ? '' : String(lng)}
            onChange={(e) => handleManual('lng', e.target.value)}
            placeholder="135.85462927807734"
          />
        </label>
      </div>

      <div className="btn-row">
        <button type="button" className="btn" onClick={handleHere} disabled={busy}>
          📍 現在地を入れる
        </button>
        <button type="button" className="btn btn-ghost" onClick={handleClear}>
          クリア
        </button>
        <button type="button" className="linklike" onClick={() => setMapOpen(true)}>
          地図で確認
        </button>
      </div>

      {hasCoord && (
        <p className="coord-echo">
          {round6(lat)}, {round6(lng)}
          {coordSource === 'gps' && '（現在地）'}
          {coordSource === 'map' && '（地図で補正）'}
          {coordSource === 'manual' && '（手入力）'}
          {coordSource === 'link' && '（リンクから）'}
        </p>
      )}

      <div className="link-row">
        <input
          type="text"
          value={linkText}
          onChange={(e) => setLinkText(e.target.value)}
          placeholder="Googleマップのリンク / 35.0…"
        />
        <button type="button" className="btn btn-ghost" onClick={handleReadLink}>
          読み取り
        </button>
      </div>

      {status && <p className={statusType === 'error' ? 'status status-error' : 'status'}>{status}</p>}

      <p className="hint">
        後日の登録でも、現地のGoogleマップのリンクや緯度経度を貼り付ければ座標を残せます。
      </p>

      {mapOpen && (
        <MapModal
          lat={hasCoord ? lat : (fallbackCenter?.lat ?? null)}
          lng={hasCoord ? lng : (fallbackCenter?.lng ?? null)}
          hasPin={hasCoord}
          onCancel={() => setMapOpen(false)}
          onPick={handleMapPick}
        />
      )}
    </section>
  );
}
