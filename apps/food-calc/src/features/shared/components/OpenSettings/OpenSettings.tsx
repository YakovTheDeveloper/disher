import { useNavigate } from 'react-router-dom';
import Button from '@/shared/ui/atoms/Button/Button';
import { RouterLinks } from '@/router';

const OpenSettings = () => {
  const navigate = useNavigate();
  return (
    <Button variant="ghost" onClick={() => navigate(RouterLinks.Settings)}>
      Настройки
    </Button>
  );
};

export default OpenSettings;
