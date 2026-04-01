import styles from './DetailsNoteButton.module.scss';

type Props = {
  htmlFor: string;
  hasDetails: boolean;
};

const DetailsNoteButton = ({ htmlFor, hasDetails }: Props) => (
  <label htmlFor={htmlFor} className={styles.button} aria-label="Заметка к еде">
    <span className={styles.text}>
      <span className={styles.line0}>ДОБАВИТЬ</span>
      <span className={styles.line1}>ЗАМЕТКУ</span>
      <span className={styles.line2}>{hasDetails ? 'ИЗМЕНИТЬ' : 'К ЕДЕ'}</span>
    </span>
  </label>
);

export default DetailsNoteButton;
