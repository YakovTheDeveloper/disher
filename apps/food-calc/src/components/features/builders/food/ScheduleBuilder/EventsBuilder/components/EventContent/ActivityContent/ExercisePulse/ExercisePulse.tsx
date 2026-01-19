import { observer } from 'mobx-react-lite';
import styles from './ExercisePulse.module.scss';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { emitter } from '@/infrastructure/emitter/emitter';

type Stage = 'setup' | 'countdown' | 'active' | 'finished';

const motivationalMessages = [
  '🔥 Отлично! Ты справился!',
  '💪 Мощно! Продолжай в том же духе!',
  '⚡ Взрыв энергии! Просто супер!',
  '🎯 Точно! Ты в хорошей форме!',
  '✨ Блеск! Невероятно!',
  '🚀 Ракета! Так держать!',
  '🏆 Чемпион! Отличный результат!',
  '💥 Взрывной финиш!',
];

type Props = {
  onFinish: (result: string) => void;
};

const ExercisePulse = ({ onFinish }: Props) => {
  const [stage, setStage] = useState<Stage>('setup');
  const [reps, setReps] = useState<string>('20');
  const [rate, setRate] = useState<string>('2');
  const [countdown, setCountdown] = useState(3);
  const [currentCount, setCurrentCount] = useState(0);
  const [motivationMessage, setMotivationMessage] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [tickProgress, setTickProgress] = useState(0);

  // Countdown effect (3 seconds before start)
  useEffect(() => {
    if (stage === 'countdown' && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (stage === 'countdown' && countdown === 0) {
      setCountdown(3);
      setStage('active');
      setIsRunning(true);
      setCurrentCount(0);
    }
  }, [stage, countdown]);

  // Main animation loop
  useEffect(() => {
    if (stage !== 'active' || !isRunning) return;

    const repsNum = parseInt(reps) || 1;
    const rateNum = parseFloat(rate) || 1;
    const tickInterval = 1000 / rateNum; // milliseconds per tick

    const startTime = Date.now();

    const animationLoop = () => {
      if (!isRunning) return;

      const elapsed = Date.now() - startTime;
      const newCount = Math.floor((elapsed / 1000) * rateNum);
      const tickProgress = ((elapsed % tickInterval) / tickInterval) * 100;

      if (newCount >= repsNum) {
        setCurrentCount(repsNum);
        setTickProgress(100);
        setStage('finished');
        setIsRunning(false);
        const randomMessage =
          motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)];
        setMotivationMessage(randomMessage);
      } else {
        setCurrentCount(newCount);
        setTickProgress(tickProgress);
        requestAnimationFrame(animationLoop);
      }
    };

    const frameId = requestAnimationFrame(animationLoop);
    return () => cancelAnimationFrame(frameId);
  }, [stage, isRunning, reps, rate]);

  const handleSave = () => {
    onFinish(currentCount.toString());
  };

  const handleStart = () => {
    const repsNum = parseInt(reps);
    const rateNum = parseFloat(rate);

    if (isNaN(repsNum) || repsNum <= 0 || isNaN(rateNum) || rateNum <= 0) {
      alert('Введите корректные значения!');
      return;
    }

    setCountdown(3);
    setStage('countdown');
    setMotivationMessage('');
  };

  const handleStop = () => {
    setIsRunning(false);
    setStage('setup');
    setCurrentCount(0);
  };

  const handleReset = () => {
    setStage('setup');
    setCurrentCount(0);
    setMotivationMessage('');
    setIsRunning(false);
  };

  const totalDuration = (parseInt(reps) || 1) / (parseFloat(rate) || 1);

  return (
    <div className={styles.container}>
      <AnimatePresence mode="wait">
        {stage === 'setup' && (
          <motion.div
            key="setup"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={styles.setupPanel}
          >
            <h2 className={styles.title}>Упражнение с пульсацией</h2>

            <div className={styles.inputGroup}>
              <label htmlFor="reps">Количество повторений:</label>
              <input
                id="reps"
                type="number"
                value={reps}
                onChange={(e) => setReps(e.target.value)}
                min="1"
                className={styles.input}
                placeholder="20"
              />
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="rate">Количество в секунду (rate):</label>
              <input
                id="rate"
                type="number"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                min="0.5"
                step="0.5"
                className={styles.input}
                placeholder="2"
              />
            </div>

            <motion.button
              onClick={handleStart}
              className={styles.startButton}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              OK - Начать
            </motion.button>
          </motion.div>
        )}

        {stage === 'countdown' && (
          <motion.div
            key="countdown"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className={styles.countdownPanel}
          >
            <p className={styles.countdownText}>Приготовься!</p>
            <motion.div
              className={styles.countdownNumber}
              key={countdown}
              initial={{ scale: 2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {countdown}
            </motion.div>
          </motion.div>
        )}

        {stage === 'active' && (
          <motion.div
            key="active"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={styles.activePanel}
          >
            {/* WoW-style Cast Bar */}
            <div className={styles.wowCastBarWrapper}>
              <motion.div
                className={styles.wowCastBar}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <motion.div className={styles.wowCastBarFill} />
                <motion.div
                  className={styles.wowCastBarProgress}
                  animate={{
                    width: `${(currentCount / parseInt(reps)) * 100}%`,
                  }}
                  transition={{ duration: 0.1, ease: 'linear' }}
                />
                <div className={styles.wowCastBarLabel}>
                  <span>{currentCount}</span>
                  <span className={styles.wowCastBarSeparator}>/</span>
                  <span>{reps}</span>
                </div>
              </motion.div>
              <div className={styles.wowCastBarTime}>
                {(totalDuration - currentCount / parseFloat(rate)).toFixed(1)}s
              </div>
            </div>

            {/* Tick Cast Bar - Fireball style */}
            <div className={styles.tickCastBarWrapper}>
              <div className={styles.tickCastBarLabel}>Тик кулдауна</div>
              <motion.div
                className={styles.tickCastBar}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <motion.div className={styles.tickCastBarFill} />
                <motion.div
                  className={styles.tickCastBarProgress}
                  animate={{
                    width: `${tickProgress}%`,
                  }}
                  transition={{ duration: 0.01, ease: 'linear' }}
                />
              </motion.div>
            </div>

            {/* Pulse Circle */}
            <div className={styles.counterContainer}>
              <motion.div
                className={styles.pulseCircle}
                animate={{
                  scale: [1, 1.15, 1],
                  boxShadow: [
                    '0 0 0 0px rgba(59, 130, 246, 0.7)',
                    '0 0 0 30px rgba(59, 130, 246, 0)',
                  ],
                }}
                transition={{
                  duration: 0.6,
                  repeat: Infinity,
                  repeatType: 'loop',
                }}
              >
                <motion.span
                  className={styles.counterNumber}
                  key={currentCount}
                  initial={{ scale: 1.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  {currentCount}
                </motion.span>
              </motion.div>
            </div>

            <p className={styles.statsText}>
              {currentCount} из {reps} | Темп: {rate}/сек
            </p>

            <motion.button
              onClick={handleStop}
              className={styles.stopButton}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Остановить
            </motion.button>
          </motion.div>
        )}

        {stage === 'finished' && (
          <motion.div
            key="finished"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className={styles.finishedPanel}
          >
            <motion.div
              className={styles.celebration}
              animate={{ y: [0, -20, 0] }}
              transition={{ duration: 0.6, repeat: 3 }}
            >
              <h1 className={styles.finalCount}>{currentCount}</h1>
            </motion.div>

            <motion.p
              className={styles.motivationMessage}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              {motivationMessage}
            </motion.p>

            <div className={styles.statsContainer}>
              <div className={styles.stat}>
                <span className={styles.statLabel}>Повторений:</span>
                <span className={styles.statValue}>{currentCount}</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statLabel}>Темп:</span>
                <span className={styles.statValue}>{rate}/сек</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statLabel}>Время:</span>
                <span className={styles.statValue}>
                  {(currentCount / parseFloat(rate)).toFixed(1)}с
                </span>
              </div>
            </div>

            <motion.button
              onClick={handleReset}
              className={styles.resetButton}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Ещё раз
            </motion.button>
            <motion.button
              onClick={handleSave}
              className={styles.resetButton}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Сохранить результат
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default observer(ExercisePulse);
