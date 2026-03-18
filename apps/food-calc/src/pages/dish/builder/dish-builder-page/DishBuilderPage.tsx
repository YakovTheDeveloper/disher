import { DishBuilder } from '@/components/features/builders/DishBuilder';
import type { Dish } from '@/entities/dish';
import { useParams } from 'react-router';

type Props = {};

const Page = ({}: Props) => {
  const { id } = useParams<{ id: string }>();

  if (!id) {
    console.error('Dish ID is required but not found in URL');
    return null;
  }

  // TODO: replace with Triplit useEntity query
  const current = null as Dish | null; // TODO: get dish from Triplit

  return current ? <DishBuilder init={current} /> : null;
};

export default Page;
