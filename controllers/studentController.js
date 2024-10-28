import { firestore } from '../config/db.js'; // Import Firestore instance
import { collection, addDoc, getDocs, doc, getDoc, updateDoc, deleteDoc  } from 'firebase/firestore'; // Import necessary Firestore functions
import Student from '../models/student.js';

const addStudent = async (req, res) => {
    try {
        const data = req.body; // Correct property to access request body

        // Use the collection and addDoc functions to add a document
        const docRef = await addDoc(collection(firestore, 'students'), data);
        res.send(`Record saved with ID: ${docRef.id}`); // Send the ID of the newly created document
    } catch (error) {
        res.status(400).send(error.message);
    }
};

const getAllStudents = async (req, res) => {
    try {
        const studentsCollection = collection(firestore, 'students'); // Use the collection function
        const snapshot = await getDocs(studentsCollection); // Use getDocs to fetch documents
        const studentArray = [];

        if (snapshot.empty) {
            res.status(404).send('No students found');
        } else {
            snapshot.forEach(doc => {
                const student = new Student(
                    doc.id,
                    doc.data().firstName,
                    doc.data().lastName
                );
                studentArray.push(student);
            });
            res.send(studentArray);
        }
    } catch (error) {
        res.status(400).send(error.message);
    }
};

// Function to get student by ID
const getStudentById = async (req, res) => {
    const studentId = req.params.id; // Get the student ID from the request parameters

    try {
        const studentDoc = doc(firestore, 'students', studentId); // Reference the document
        const docSnapshot = await getDoc(studentDoc); // Fetch the document

        if (!docSnapshot.exists()) {
            res.status(404).send('Student not found'); // Handle case where document does not exist
        } else {
            const student = new Student(
                docSnapshot.id,
                docSnapshot.data().firstName,
                docSnapshot.data().lastName
            );
            res.send(student); // Return the student data
        }
    } catch (error) {
        res.status(400).send(error.message); // Handle errors
    }
};

// Function to update a student
const updateStudent = async (req, res) => {
    const studentId = req.params.id; // Get the student ID from the request parameters
    const updatedData = req.body; // Get the updated data from the request body

    try {
        const studentRef = doc(firestore, 'students', studentId); // Reference the student document
        await updateDoc(studentRef, updatedData); // Update the document with new data

        res.send('Student updated successfully'); // Send a success response
    } catch (error) {
        res.status(400).send(error.message); // Handle errors
    }
};

// Function to delete a student
const deleteStudent = async (req, res) => {
    const studentId = req.params.id; // Get the student ID from the request parameters

    try {
        const studentRef = doc(firestore, 'students', studentId); // Reference the student document
        await deleteDoc(studentRef); // Delete the document

        res.send('Student deleted successfully'); // Send a success response
    } catch (error) {
        res.status(400).send(error.message); // Handle errors
    }
};

export { addStudent, getAllStudents, getStudentById, updateStudent, deleteStudent }; // Export addStudent function
