// 地図まわりの共通設定。
// Leaflet の既定マーカー画像はビルド時にパスが壊れやすいので、
// HTMLで描く divIcon を使う。
import L from 'leaflet';

export const GSI_TILE_URL = 'https://cyberjapandata.gsi.go.jp/xyz/std/{z}/{x}/{y}.png';
export const GSI_ATTRIBUTION =
  '<a href="https://maps.gsi.go.jp/development/ichiran.html" target="_blank" rel="noreferrer">国土地理院</a>';

/** 座標補正用のピン */
export function pinIcon() {
  return L.divIcon({
    className: 'pin-icon',
    html: '<span class="pin-dot"></span>',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

/** 樹木ピン（番号ラベル付き） */
export function treeIcon(label) {
  const safe = String(label ?? '').replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`);
  return L.divIcon({
    className: 'tree-icon',
    html: `<span class="tree-dot"></span><span class="tree-label">${safe}</span>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });
}
