// 現在地の取得と、Googleマップのリンク／貼り付け文字列からの座標抽出。

/** 表示用に6桁へ丸める（保持する値はフル桁のまま） */
export function round6(n) {
  if (n === null || n === undefined || Number.isNaN(Number(n))) return '';
  return Number(n).toFixed(6);
}

export const isValidLat = (n) => Number.isFinite(n) && n >= -90 && n <= 90;
export const isValidLng = (n) => Number.isFinite(n) && n >= -180 && n <= 180;

/**
 * 現在地を取得する。
 * enableHighAccuracy: GPSを使う / timeout: 10秒 / maximumAge: 0（キャッシュを使わない）
 */
export function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('NO_GEOLOCATION'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy ?? null,
        }),
      (err) => reject(err),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  });
}

/** 位置情報エラーを日本語のメッセージにする */
export function geolocationErrorMessage(err) {
  if (err?.message === 'NO_GEOLOCATION') {
    return 'この端末／ブラウザでは位置情報を取得できません。';
  }
  switch (err?.code) {
    case 1: // PERMISSION_DENIED
      return '位置情報の利用が許可されていません。ブラウザの設定で許可してください。';
    case 2: // POSITION_UNAVAILABLE
      return '位置情報を取得できませんでした。空の見える場所で試してください。';
    case 3: // TIMEOUT
      return '位置情報の取得がタイムアウトしました。もう一度お試しください。';
    default:
      return '位置情報を取得できませんでした。';
  }
}

/**
 * 貼り付けられた文字列から緯度経度を取り出す。
 * 対応形式:
 *   https://maps.google.com/?q=35.0177,135.8546
 *   .../@35.0177,135.8546,18z
 *   ...!3d35.0177!4d135.8546
 *   35.0177, 135.8546（座標のみのベタ貼り）
 * 取り出せなければ null。
 */
export function parseLatLngFromText(text) {
  if (!text || typeof text !== 'string') return null;
  const s = text.trim();

  const patterns = [
    /!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/, // 共有リンクの中の実座標
    /@(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/, // 地図表示位置
    /[?&](?:q|query|ll|sll|daddr|destination)=(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/i,
    /(-?\d{1,3}(?:\.\d+)?)\s*[,、]\s*(-?\d{1,3}(?:\.\d+)?)/, // ベタ貼り
  ];

  for (const re of patterns) {
    const m = re.exec(s);
    if (!m) continue;
    const lat = Number(m[1]);
    const lng = Number(m[2]);
    if (isValidLat(lat) && isValidLng(lng)) return { lat, lng };
  }
  return null;
}

/** 座標の入力元を日本語ラベルにする */
export function coordSourceLabel(source) {
  return (
    { gps: '現在地', map: '地図で補正', manual: '手入力', link: 'リンクから読み取り' }[source] ?? ''
  );
}
