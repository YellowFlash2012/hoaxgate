function NotFoundException(message) {
    this.status = 404;
    this.message = message;
}

export default NotFoundException;
