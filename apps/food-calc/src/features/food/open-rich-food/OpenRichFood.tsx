import { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { RouterLinks } from '@/app/router';
import styles from './OpenRichFood.module.scss';

const SearchIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    width={14}
    height={14}
  >
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

interface Props {
  nutrientId: string;
  nutrientName: string;
}

const OpenRichFood: FC<Props> = ({ nutrientId, nutrientName }) => {
  const navigate = useNavigate();

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`${RouterLinks.Food}?richNutrient=${nutrientId}`);
  };

  return (
    <button className={styles.btn} onClick={handleClick} title={`Продукты богатые: ${nutrientName}`}>
      <SearchIcon />
      <span className={styles.label}>Богатые продукты</span>
    </button>
  );
};

export default OpenRichFood;
