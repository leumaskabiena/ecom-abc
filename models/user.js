import bcrypt from 'bcrypt';

class User {
    constructor(id, name, email, password, isAdmin = false) {
        this.id = id; // Firestore document ID
        this.name = name;
        this.email = email;
        this.password = password; // Raw password, should be hashed
        this.isAdmin = isAdmin; // Flag to determine if the user has admin privileges
    }

    async hashPassword() {
        const saltRounds = 10; // You can adjust this for more security
        this.password = await bcrypt.hash(this.password, saltRounds);
    }

    async comparePassword(password) {
        return await bcrypt.compare(password, this.password);
    }
}

export default User;
