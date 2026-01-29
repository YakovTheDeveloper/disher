export { default as Time } from "./Time";

// <AnimatePresence>
//   {animHour && circlePos && (
//     <>
//       <motion.div
//         key={hours}
//         initial={{
//           left: circlePos.x,
//           top: circlePos.y,
//           scale: 0,
//           opacity: 0.8,
//         }}
//         animate={{
//           left: '100%',
//           top: 0,
//           scale: 10,
//           opacity: 0,
//         }}
//         exit={{ opacity: 0 }}
//         transition={{ duration: 1.2, ease: 'easeOut' }}
//         style={{
//           position: 'fixed',
//           width: 200,
//           height: 200,
//           borderRadius: '50%',
//           backgroundColor: 'limegreen',
//           zIndex: 10,
//           transform: 'translate(-50%, -50%)',
//           pointerEvents: 'none',
//         }}
//       />

//       {/* Huge Hour Number */}
//       <motion.div
//         initial={{ scale: 0.5, opacity: 0 }}
//         animate={{ scale: 3, opacity: 1 }}
//         exit={{ opacity: 0 }}
//         transition={{ duration: 1.2, ease: 'easeOut' }}
//         style={{
//           position: 'fixed',
//           top: '50%',
//           left: '50%',
//           transform: 'translate(-50%, -50%)',
//           color: 'white',
//           fontSize: '10rem',
//           fontWeight: 'bold',
//           zIndex: 20,
//           pointerEvents: 'none',
//         }}
//       >
//         {animHour}
//       </motion.div>
//     </>
//   )}
// </AnimatePresence>;
