export const optimizeBookCover = (url?: string): string | null => {
  if (!url) return null;

  // 1. Mixed Content対策: http を https に強制変換
  let newUrl = url.replace(/^http:\/\//, 'https://');

  // 2. Amazon (OpenBD) の超高画質化
  // パターン: ._SL75_, ._SY160_, ._SX100_ などを削除して原寸大にする
  if (
    newUrl.includes('amazon.com') || 
    newUrl.includes('amazon.co.jp') || 
    newUrl.includes('ssl-images-amazon.com')
  ) {
     // 変更点: "._" から始まって "_" で終わるパラメータ部分を、拡張子の直前で全て削除する
     // クエリパラメータがついている場合にも対応できるように正規表現を調整
     return newUrl.replace(/\._.+_(\.(?:jpg|jpeg|png|gif))/i, '$1');
  }

  // 3. Google Books の整形 (画質は変えず、エフェクトのみ削除)
  if (newUrl.includes('books.google.com')) {
    return newUrl.replace('&edge=curl', '');
  }

  // 4. 版元ドットコム等はそのまま返す
  return newUrl;
};
