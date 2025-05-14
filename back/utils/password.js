import bcrypt from 'bcryptjs';

class PasswordUtils {
	static comparePasswords = async (password, hashedPassword) => {
		const valid = await bcrypt.compare(password, hashedPassword);

		if (valid) return

		const err = new Error('Invalid username or password');
		err.status = 401;
		throw err;
	}

	static hashPassword = async (password) => {
		return await bcrypt.hash(password, 10);
	}
}

export default PasswordUtils;