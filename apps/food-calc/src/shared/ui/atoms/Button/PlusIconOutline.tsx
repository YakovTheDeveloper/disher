// Контурный (hollow) плюс — тот же гладкий скруглённый силуэт, что у залитого
// `PlusIcon`, но БЕЗ заливки: рисуется обводкой (stroke=currentColor, fill=none),
// поэтому читается как «пустой» + с мягким контуром. Используется кнопкой
// «Добавить событие».
export const PlusIconOutline = () => (
  <svg
    width="50"
    height="50"
    viewBox="0 0 50 50"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M25 0C29.4183 1.93129e-07 33 3.58172 33 8V17H42C46.4183 17 50 20.5817 50 25C50 29.4183 46.4183 33 42 33H33V42C33 46.4183 29.4183 50 25 50C20.5817 50 17 46.4183 17 42V33H8C3.58172 33 0 29.4183 0 25C0 20.5817 3.58172 17 8 17H17V8C17 3.58172 20.5817 -1.93129e-07 25 0Z"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinejoin="round"
    />
  </svg>
);

export default PlusIconOutline;
