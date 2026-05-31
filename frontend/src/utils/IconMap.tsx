import { 
  Utensils, 
  Car, 
  ShoppingBag, 
  Film, 
  Zap, 
  HeartPulse, 
  Home,
  Book,
  Wifi,
  Briefcase,
  Coffee,
  Gift,
  HelpCircle 
} from 'lucide-react';

interface IconMapProps {
  name: string;
  size?: number;
  color?: string;
}

export const IconMap = ({ name, size = 20, color = 'currentColor' }: IconMapProps) => {
  switch (name) {
    case 'utensils': return <Utensils size={size} color={color} />;
    case 'car': return <Car size={size} color={color} />;
    case 'shopping-bag': return <ShoppingBag size={size} color={color} />;
    case 'film': return <Film size={size} color={color} />;
    case 'zap': return <Zap size={size} color={color} />;
    case 'heart-pulse': return <HeartPulse size={size} color={color} />;
    case 'home': return <Home size={size} color={color} />;
    case 'book': return <Book size={size} color={color} />;
    case 'wifi': return <Wifi size={size} color={color} />;
    case 'briefcase': return <Briefcase size={size} color={color} />;
    case 'coffee': return <Coffee size={size} color={color} />;
    case 'gift': return <Gift size={size} color={color} />;
    default: return <HelpCircle size={size} color={color} />;
  }
};
