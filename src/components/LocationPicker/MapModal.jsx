// 地図で座標を補正するモーダル。
// 樹冠の下ではGPSが反射（マルチパス）でずれるので、手で直せる導線が要る。
import { useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { GSI_ATTRIBUTION, GSI_TILE_URL, pinIcon } from '../MapView/leafletSetup.js';
import { round6 } from '../../lib/geo.js';

const DEFAULT_CENTER = [35.0, 135.85]; // 座標が何も無いときの仮の中心

function PickLayer({ pos, setPos }) {
  useMapEvents({
    click(e) {
      setPos([e.latlng.lat, e.latlng.lng]);
    },
  });
  if (!pos) return null;
  return (
    <Marker
      position={pos}
      icon={pinIcon()}
      draggable
      eventHandlers={{
        dragend: (e) => {
          const p = e.target.getLatLng();
          setPos([p.lat, p.lng]);
        },
      }}
    />
  );
}

export default function MapModal({ lat, lng, hasPin, onCancel, onPick }) {
  const start = Number.isFinite(lat) && Number.isFinite(lng) ? [lat, lng] : null;
  const [pos, setPos] = useState(hasPin && start ? start : null);
  const center = start ?? DEFAULT_CENTER;

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal modal-map">
        <div className="modal-head">
          <strong>地図で確認</strong>
          <button type="button" className="btn btn-ghost" onClick={onCancel}>
            閉じる
          </button>
        </div>

        <div className="map-wrap">
          <MapContainer center={center} zoom={start ? 18 : 14} className="map">
            <TileLayer url={GSI_TILE_URL} attribution={GSI_ATTRIBUTION} maxZoom={18} />
            <PickLayer pos={pos} setPos={setPos} />
          </MapContainer>
        </div>

        <p className="hint">
          {pos
            ? `${round6(pos[0])}, ${round6(pos[1])} — ピンをドラッグ、または地図をタップで移動できます。`
            : '地図をタップするとピンを置けます。'}
        </p>

        <div className="modal-foot">
          <button type="button" className="btn btn-ghost" onClick={onCancel}>
            キャンセル
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={!pos}
            onClick={() => onPick({ lat: pos[0], lng: pos[1] })}
          >
            この位置にする
          </button>
        </div>
      </div>
    </div>
  );
}
