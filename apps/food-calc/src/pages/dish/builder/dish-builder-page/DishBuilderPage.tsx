import { DishBuilder } from '@/components/features/builders/DishBuilder';
import { ModalDishProvider } from '@/components/features/builders/DishBuilder/modalContext';
import type { Dish } from '@/entities/dish';
import { RouterLinks } from '@/router';
import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';

type Props = {};

const Page = ({}: Props) => {
  const navigate = useNavigate();

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
