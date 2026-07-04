import { forwardRef } from 'react';
import { IconButton } from './IconButton';
import type { ComponentProps } from 'react';
import { InfoIcon } from '@/shared/ui/atoms/icons/InfoIcon';

type IconButtonProps = ComponentProps<typeof IconButton>;

// aria-label становится опциональным (дефолт «Информация»); `icon` фиксирован
// глифом ⓘ. Остальное — как у IconButton (tone/size/onClick/htmlFor/className).
interface InfoButtonProps extends Omit<IconButtonProps, 'icon' | 'aria-label'> {
  'aria-label'?: string;
  /** Сторона глифа ⓘ (px). По умолчанию 24 — канон-размер (см. InfoIcon). */
  glyphSize?: number;
}

// Тонкая обёртка над IconButton: инъектит ⓘ-глиф + дефолтную a11y-метку. Один дом
// для «кнопки информации» — выделен из FoodActionCard, чтобы её могли переиспользовать
// page-level слоты (topContentRight листа Анализов) с тоном `ghost` (без подложки).
// FoodActionCard остаётся при своей утопленной плашке через className.
export const InfoButton = forwardRef<HTMLButtonElement, InfoButtonProps>(function InfoButton(
  { glyphSize = 24, 'aria-label': ariaLabel = 'Информация', ...rest },
  ref
) {
  return <IconButton ref={ref} icon={<InfoIcon size={glyphSize} />} aria-label={ariaLabel} {...rest} />;
});

export default InfoButton;
