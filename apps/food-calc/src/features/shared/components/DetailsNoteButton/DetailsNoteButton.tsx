import styles from './DetailsNoteButton.module.scss';

type Props = {
  htmlFor: string;
  hasDetails: boolean;
};

const NoteIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M4 3H12L16 7V17H4V3Z"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
    <path
      d="M12 3V7H16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
    <path d="M7 10H13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    <path d="M7 13H11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

const DetailsNoteButton = ({ htmlFor, hasDetails }: Props) => (
  <label htmlFor={htmlFor} className={styles.button} aria-label="Заметка к еде">
    <span className={styles.icon}>
      <NoteIcon />
    </span>
    {hasDetails ? 'Изменить заметку' : 'Уточнение к еде'}
  </label>
);

export default DetailsNoteButton;
