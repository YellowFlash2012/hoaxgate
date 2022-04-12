function ForbiddenException() {
    this.status = 403;
    this.message = 'Your account is inactive!';
}

export default ForbiddenException;
