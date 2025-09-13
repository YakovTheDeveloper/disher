import { observer } from 'mobx-react-lite';
import styles from './Questionnaire.module.scss';
import { QuestionnaireViewModel } from '@/components/blocks/builders/food/ScheduleBuilder/model/QuestionnaireViewModel';
import { getTimeHHMM } from '@/lib/time/getTime';

type TimeValue = { value: number; time: string };
type Props = {
  vm: QuestionnaireViewModel;
};
// type Props = {
//   vm: {
//     content: {
//       mood: TimeValue[];
//       energy: TimeValue[];
//       digestion: {
//         bloating: TimeValue[];
//         stomach_pain: TimeValue[];
//         heartburn: TimeValue[];
//         constipation: TimeValue[];
//         diarrhea: TimeValue[];
//       };
//       cravings: string[];
//       activity: { type: string; duration_min: number; time: string }[];
//       sleep: { quality?: number; hours?: number };
//       notes: string;
//     };
//     addMood: (value: number, time: string) => void;
//     addEnergy: (value: number, time: string) => void;
//     addDigestion: (
//       symptom: keyof Props['vm']['content']['digestion'],
//       value: number,
//       time: string
//     ) => void;
//     addActivity: (type: string, duration_min: number, time: string) => void;
//     setNotes: (notes: string) => void;
//     setSleep: (hours: number, quality: number) => void;
//     addCraving: (craving: string) => void;
//     removeCraving: (craving: string) => void;
//   };
// };

const Questionnaire = ({ vm }: Props) => {
  const {
    onFinish,
    addMood,
    addEnergy,
    addDigestion,
    addActivity,
    setNotes,
    setSleep,
    addCraving,
    removeCraving,
  } = vm;

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Daily Questionnaire</h2>

      {/* Mood */}
      <section className={styles.block}>
        <h3>Mood</h3>
        <button onClick={() => addMood(5, getTimeHHMM())}>Add Mood (5)</button>
        <ul>
          {vm.content.mood.map((m, i) => (
            <li key={i}>
              {m.time} — {m.value}
            </li>
          ))}
        </ul>
      </section>

      {/* Energy */}
      <section className={styles.block}>
        <h3>Energy</h3>
        <button onClick={() => addEnergy(6, getTimeHHMM())}>Add Energy (6)</button>
        <ul>
          {vm.content.energy.map((e, i) => (
            <li key={i}>
              {e.time} — {e.value}
            </li>
          ))}
        </ul>
      </section>

      {/* Digestion */}
      <section className={styles.block}>
        <h3>Digestion</h3>
        {Object.entries(vm.content.digestion).map(([symptom, entries]) => (
          <div key={symptom}>
            <button
              onClick={() =>
                addDigestion(symptom as keyof typeof vm.content.digestion, 2, getTimeHHMM())
              }
            >
              Add {symptom}
            </button>
            <ul>
              {entries.map((d, i) => (
                <li key={i}>
                  {d.time} — {d.value}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      {/* Cravings */}
      <section className={styles.block}>
        <h3>Cravings</h3>
        <div className={styles.cravings}>
          <button onClick={() => addCraving('sweet')}>+ Sweet</button>
          <button onClick={() => addCraving('caffeine')}>+ Caffeine</button>
          <button onClick={() => addCraving('salty')}>+ Salty</button>
        </div>
        <ul>
          {vm.content.cravings.map((c, i) => (
            <li key={i}>
              {c}{' '}
              <button className={styles.removeBtn} onClick={() => removeCraving(c)}>
                ✕
              </button>
            </li>
          ))}
        </ul>
      </section>

      {/* Activity */}
      <section className={styles.block}>
        <h3>Activity</h3>
        <button onClick={() => addActivity('Walk', 20, getTimeHHMM())}>Add Walk</button>
        <ul>
          {vm.content.activity.map((a, i) => (
            <li key={i}>
              {a.time} — {a.type} ({a.duration_min}m)
            </li>
          ))}
        </ul>
      </section>

      {/* Sleep */}
      <section className={styles.block}>
        <h3>Sleep</h3>
        <button onClick={() => setSleep(7, 8)}>Set Sleep (7h / 8q)</button>
        <p>
          {vm.content.sleep.hours}h, quality {vm.content.sleep.quality}
        </p>
      </section>

      {/* Notes */}
      <section className={styles.block}>
        <h3>Notes</h3>
        <textarea
          className={styles.textarea}
          value={vm.content.notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Write your notes..."
        />
      </section>

      <button onClick={onFinish}>Обновить</button>
    </div>
  );
};

export default observer(Questionnaire);
