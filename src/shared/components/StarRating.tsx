import { Star } from 'lucide-react-native';
import { View } from 'react-native';

interface StarRatingProps {
  /** 0–5, fractional values fill proportionally at the icon level (rounded). */
  rating: number;
  size?: number;
  color?: string;
  mutedColor?: string;
}

export function StarRating({ rating, size = 14, color = '#f8bb00', mutedColor = '#c9c9c4' }: StarRatingProps) {
  const filled = Math.round(rating);

  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} size={size} color={i <= filled ? color : mutedColor} fill={i <= filled ? color : 'transparent'} />
      ))}
    </View>
  );
}
