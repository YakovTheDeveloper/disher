import type { FunctionComponent, SVGProps } from 'react'
import { useEffect, useState } from 'react'
import LogoSrc from '@/shared/assets/icons/logo.svg'
import styles from './SplashScreen.module.scss'

const Logo = LogoSrc as unknown as FunctionComponent<SVGProps<SVGSVGElement>>

export interface SplashScreenProps {
  /** Время показа заставки в миллисекундах (по умолчанию 2000ms) */
  duration?: number
  /** Функция, вызываемая при завершении анимации */
  onComplete?: () => void
}

export function SplashScreen({ duration = 2000, onComplete }: SplashScreenProps) {
  const [isVisible, setIsVisible] = useState(true)
  const [isUnmounting, setIsUnmounting] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsUnmounting(true)
      // Allow CSS animation to complete before unmounting
      const unmountTimer = setTimeout(() => {
        setIsVisible(false)
        onComplete?.()
      }, 500)
      return () => clearTimeout(unmountTimer)
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onComplete])

  if (!isVisible) return null

  return (
    <div className={`${styles.splashScreen} ${isUnmounting ? styles.unmounting : ''}`}>
      <div className={styles.background} />
      <div className={styles.content}>
        <div className={styles.logoWrapper}>
          <Logo className={styles.logo} />
        </div>
        <div className={styles.pulseRing} />
      </div>
    </div>
  )
}
