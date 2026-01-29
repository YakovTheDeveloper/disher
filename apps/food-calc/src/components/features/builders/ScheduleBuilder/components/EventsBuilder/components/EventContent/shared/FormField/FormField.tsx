import { observer } from "mobx-react-lite";
                    import styles from './FormField.module.scss'
type Props = {
  children: React.ReactNode;
}

const FormField = ({ children }: Props) => {
  return (
    <div className={styles.container}>FormField</div>
  )
}

export default observer(FormField);
