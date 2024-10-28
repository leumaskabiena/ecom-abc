// routes/student-routes.js
import express from 'express';
import { addStudent , getAllStudents, getStudentById, updateStudent, deleteStudent} from '../controllers/studentController.js'; // Ensure this path is correct

const router = express.Router();

router.post('/student', addStudent);
router.get('/students',getAllStudents);
router.get('/student/:id', getStudentById);
router.put('/student/:id', updateStudent);
router.delete('/student/:id', deleteStudent);
export { router }; // Exporting as a named export
