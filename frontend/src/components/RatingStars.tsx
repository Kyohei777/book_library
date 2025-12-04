"use client";

interface RatingStarsProps {
  rating?: string;
  onChange?: (rating: string) => void;
  readonly?: boolean;
}

export function RatingStars({ rating, onChange, readonly = false }: RatingStarsProps) {
  const currentRating = rating ? parseInt(rating) : 0;

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => !readonly && onChange?.(star.toString())}
          disabled={readonly}
          className={`text-2xl transition-all ${
            readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'
          } ${
            star <= currentRating ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'
          }`}
        >
          ★
        </button>
      ))}
      {currentRating > 0 && (
        <span className="ml-2 text-sm text-gray-500">({currentRating}/5)</span>
      )}
    </div>
  );
}
