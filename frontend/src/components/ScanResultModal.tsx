"use client";

import { useState, useEffect } from 'react';

interface ScanResultModalProps {
  isbn: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ScanResultModal({ isbn, onConfirm, onCancel }: ScanResultModalProps) {
  const [apiComparison, setApiComparison] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchComparison = async () => {
      try {
        const response = await fetch(`/api/test/compare-apis/${isbn}`);
        if (response.ok) {
          const data = await response.json();
          setApiComparison(data);
        }
      } catch (error) {
        console.error('Failed to fetch API comparison:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchComparison();
  }, [isbn]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div 
        className="w-full max-w-4xl bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden ring-1 ring-white/10 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900/50">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            📊 スキャン結果 - API比較
          </h2>
          <button onClick={onCancel} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          <p className="text-sm text-gray-500 mb-4">ISBN: <span className="font-mono font-bold">{isbn}</span></p>

          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
          ) : apiComparison ? (
            <div className="space-y-4">
              {/* API Comparison Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {['openbd', 'rakuten', 'google'].map((api) => (
                  <div key={api} className="bg-gray-100 dark:bg-gray-900 p-4 rounded-xl">
                    <h4 className="font-bold mb-3 text-lg flex items-center gap-2">
                      {api === 'openbd' && '📚 OpenBD'}
                      {api === 'rakuten' && '🛒 楽天ブックス'}
                      {api === 'google' && '🔍 Google Books'}
                    </h4>
                    {apiComparison[api] ? (
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="text-gray-500 text-xs">タイトル</span>
                          <p className="font-medium">{apiComparison[api].title || '-'}</p>
                        </div>
                        <div>
                          <span className="text-gray-500 text-xs">著者</span>
                          <p>{apiComparison[api].authors || '-'}</p>
                        </div>
                        <div>
                          <span className="text-gray-500 text-xs">出版社</span>
                          <p>{apiComparison[api].publisher || '-'}</p>
                        </div>
                        <div>
                          <span className="text-gray-500 text-xs">シリーズ</span>
                          <p>{apiComparison[api].series || '-'}</p>
                        </div>
                        <div>
                          <span className="text-gray-500 text-xs">表紙画像</span>
                          {apiComparison[api].cover_url ? (
                            <div className="mt-1">
                              <img 
                                src={apiComparison[api].cover_url} 
                                alt="Cover" 
                                className="h-24 object-contain rounded shadow"
                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                              />
                            </div>
                          ) : (
                            <p className="text-gray-400">なし</p>
                          )}
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-400 text-sm">データなし</p>
                    )}
                  </div>
                ))}
              </div>

              {/* Merged Result */}
              {apiComparison.merged && (
                <div className="bg-indigo-50 dark:bg-indigo-900/30 p-4 rounded-xl mt-4">
                  <h4 className="font-bold mb-3 text-lg text-indigo-700 dark:text-indigo-300 flex items-center gap-2">
                    ✨ 実際に登録されるデータ（マージ結果）
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500 text-xs">タイトル</span>
                      <p className="font-medium">{apiComparison.merged.title}</p>
                    </div>
                    <div>
                      <span className="text-gray-500 text-xs">著者</span>
                      <p>{apiComparison.merged.authors || '-'}</p>
                    </div>
                    <div>
                      <span className="text-gray-500 text-xs">シリーズ名</span>
                      <p className="font-medium text-indigo-600 dark:text-indigo-400">{apiComparison.merged.series_title || '-'}</p>
                    </div>
                    <div>
                      <span className="text-gray-500 text-xs">巻数</span>
                      <p className="font-bold text-xl">{apiComparison.merged.volume_number ?? '-'}</p>
                    </div>
                  </div>
                  {apiComparison.merged.cover_url && (
                    <div className="mt-4">
                      <span className="text-gray-500 text-xs">表紙画像</span>
                      <img 
                        src={apiComparison.merged.cover_url} 
                        alt="Cover" 
                        className="h-32 object-contain rounded shadow mt-1"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-400 text-center py-8">データを取得できませんでした</p>
          )}
        </div>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3 bg-gray-50 dark:bg-gray-900/50">
          <button
            onClick={onCancel}
            className="px-6 py-2.5 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 font-medium transition-all"
          >
            キャンセル
          </button>
          <button
            onClick={onConfirm}
            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow-lg transition-all"
          >
            この内容で登録する
          </button>
        </div>
      </div>
    </div>
  );
}
