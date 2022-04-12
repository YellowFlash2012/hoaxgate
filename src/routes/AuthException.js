function AuthException() {
    this.status = 401;
    this.message = 'Invalid credentials';
}

export default AuthException;
