// Googleマップリンク等からの座標抽出のテスト
import test from 'node:test';
import assert from 'node:assert/strict';
import { parseLatLngFromText, round6 } from '../src/lib/geo.js';

test('?q= 形式', () => {
  assert.deepEqual(parseLatLngFromText('https://maps.google.com/?q=35.0177,135.8546'), {
    lat: 35.0177,
    lng: 135.8546,
  });
});

test('@ 形式', () => {
  assert.deepEqual(
    parseLatLngFromText('https://www.google.com/maps/@35.0177,135.8546,18z'),
    { lat: 35.0177, lng: 135.8546 },
  );
});

test('!3d!4d 形式は @ より優先される（共有リンクの実座標）', () => {
  const url =
    'https://www.google.com/maps/place/X/@35.9999,135.9999,17z/data=!3m1!4b1!4m5!3m4!1s0x0:0x0!8m2!3d35.0177!4d135.8546';
  assert.deepEqual(parseLatLngFromText(url), { lat: 35.0177, lng: 135.8546 });
});

test('座標のみのベタ貼り（全角読点も可）', () => {
  assert.deepEqual(parseLatLngFromText('35.017764, 135.854629'), {
    lat: 35.017764,
    lng: 135.854629,
  });
  assert.deepEqual(parseLatLngFromText('35.017764、135.854629'), {
    lat: 35.017764,
    lng: 135.854629,
  });
});

test('範囲外・読み取れない文字列は null', () => {
  assert.equal(parseLatLngFromText('999.9, 135.8'), null);
  assert.equal(parseLatLngFromText('皇子が丘公園'), null);
  assert.equal(parseLatLngFromText(''), null);
  assert.equal(parseLatLngFromText(null), null);
});

test('表示用の丸めは6桁', () => {
  assert.equal(round6(35.01776443639602), '35.017764');
  assert.equal(round6(null), '');
});
